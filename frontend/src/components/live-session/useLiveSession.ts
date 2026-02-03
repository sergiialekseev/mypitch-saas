import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, type LiveServerMessage, Modality } from "@google/genai";
import { apiRequest } from "../../api/client";
import { createAudioData, base64ToArrayBuffer, pcmToAudioBuffer } from "../../utils/audio-utils";
import type { Topic } from "../../types";

const LIVE_MODEL_ID = "gemini-2.5-flash-native-audio-preview-12-2025";
const INTERVIEW_DURATION_SECONDS = 15 * 60;
const LOG_PREFIX = "[LiveSession]";

type UseLiveSessionParams = {
  topic: Topic;
  userName: string;
  sessionId: string;
  onReportReady: () => void;
};

export const useLiveSession = ({ topic, userName, sessionId, onReportReady }: UseLiveSessionParams) => {
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected" | "reconnecting" | "analyzing">(
    "connecting"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [aiTranscript, setAiTranscript] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(INTERVIEW_DURATION_SECONDS);
  const [hasAiGreeted, setHasAiGreeted] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const isMicMutedRef = useRef(false);
  const statusRef = useRef(status);
  const timerActiveRef = useRef(false);
  const hasAiGreetedRef = useRef(false);
  const warnedFiveRef = useRef(false);
  const warnedTwoRef = useRef(false);
  const autoEndedRef = useRef(false);
  const warningTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const reconnectingRef = useRef(false);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentSessionRef = useRef<Promise<any> | null>(null);
  const liveSessionRef = useRef<any | null>(null);
  const isSessionOpenRef = useRef(false);
  const isEndingRef = useRef(false);
  const sessionSeqRef = useRef(0);
  const retryCountRef = useRef(0);
  const currentUserTextRef = useRef<string>("");
  const currentAiTextRef = useRef<string>("");
  const aiTurnActiveRef = useRef(false);
  const hasSentGreetingRef = useRef(false);
  const MAX_RETRIES = 3;

  useEffect(() => {
    statusRef.current = status;
    console.info(LOG_PREFIX, "status:", status);
  }, [status]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const stopAudio = useCallback(() => {
    console.info(LOG_PREFIX, "stopAudio");
    if (liveSessionRef.current) {
      try {
        liveSessionRef.current.close();
      } catch (e) {
        // ignore
      }
      liveSessionRef.current = null;
      isSessionOpenRef.current = false;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      try {
        inputAudioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      inputAudioContextRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      sourceRef.current = null;
    }
    if (outputAudioContextRef.current) {
      scheduledSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch (e) {
          // ignore
        }
      });
      scheduledSourcesRef.current.clear();
      try {
        outputAudioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      outputAudioContextRef.current = null;
    }
    liveSessionRef.current = null;
    isSessionOpenRef.current = false;
    nextStartTimeRef.current = 0;
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted((prev) => !prev);
    }
  };

  const sendTranscript = async (role: "user" | "ai", text: string) => {
    if (!text.trim()) return;
    try {
      await apiRequest(`/api/v1/sessions/${sessionId}/transcripts`, {
        method: "POST",
        body: { role, text }
      });
    } catch (err) {
      // ignore transcript errors for now
    }
  };

  const fetchGeminiToken = async () => {
    return apiRequest<{ token: string; model?: string }>(`/api/v1/sessions/${sessionId}/gemini-token`);
  };

  const generateReport = async () => {
    try {
      const pendingTranscripts: Promise<void>[] = [];

      if (currentUserTextRef.current.trim()) {
        const text = currentUserTextRef.current.trim();
        currentUserTextRef.current = "";
        pendingTranscripts.push(sendTranscript("user", text));
      }
      if (currentAiTextRef.current.trim()) {
        const text = currentAiTextRef.current.trim();
        currentAiTextRef.current = "";
        pendingTranscripts.push(sendTranscript("ai", text));
      }

      if (pendingTranscripts.length) {
        await Promise.all(pendingTranscripts);
      }

      await apiRequest(`/api/v1/sessions/${sessionId}/report/generate`, {
        method: "POST"
      });

      onReportReady();
    } catch (e) {
      setStatus("error");
      setErrorMessage("Report generation failed.");
    }
  };

  useEffect(() => {
    const shouldBlock =
      status === "connecting" ||
      status === "connected" ||
      status === "reconnecting" ||
      status === "analyzing";
    if (!shouldBlock) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      const sessionSeq = sessionSeqRef.current + 1;
      sessionSeqRef.current = sessionSeq;
      const preserveState = reconnectingRef.current;
      reconnectingRef.current = false;
      try {
        console.info(LOG_PREFIX, "starting session", { sessionId, sessionSeq });
        setStatus("connecting");
        if (liveSessionRef.current) {
          try {
            liveSessionRef.current.close();
          } catch (e) {
            // ignore
          }
          liveSessionRef.current = null;
          isSessionOpenRef.current = false;
        }

        const { token, model } = await fetchGeminiToken();
        console.info(LOG_PREFIX, "token fetched", { hasModel: Boolean(model) });

        if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close();
          inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
          outputAudioContextRef.current.close();
          outputAudioContextRef.current = null;
        }

        if (!preserveState) {
          currentUserTextRef.current = "";
          currentAiTextRef.current = "";
          setAiTranscript("");
          setRemainingSeconds(INTERVIEW_DURATION_SECONDS);
          setHasAiGreeted(false);
          setWarningMessage(null);
          hasAiGreetedRef.current = false;
          warnedFiveRef.current = false;
          warnedTwoRef.current = false;
          autoEndedRef.current = false;
          if (warningTimeoutRef.current) {
            window.clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
          }
          console.info(LOG_PREFIX, "session state reset");
        } else {
          console.info(LOG_PREFIX, "reconnecting: preserving timer and transcript state");
        }
        aiTurnActiveRef.current = false;
        if (!preserveState) {
          hasSentGreetingRef.current = false;
        }

        const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        if (!streamRef.current) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const stream = streamRef.current;
        const systemInstruction = topic.systemPrompt;
  const openingPrompt = topic.openingPrompt?.trim() || "";

        const sessionPromise = ai.live.connect({
          model: model || LIVE_MODEL_ID,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: topic.voice || "Kore" } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => {
              console.info(LOG_PREFIX, "socket open");
              if (mounted && sessionSeqRef.current === sessionSeq) {
                if (!isEndingRef.current) {
                  setStatus("connected");
                  retryCountRef.current = 0;
                }
              }

              if (inputAudioContextRef.current) {
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                sourceRef.current = source;
                processorRef.current = processor;

                processor.onaudioprocess = (event) => {
                  if (!mounted) return;
                  if (!isSessionOpenRef.current || !liveSessionRef.current) return;
                  if (isMicMutedRef.current) {
                    setIsUserSpeaking(false);
                    return;
                  }
                  const inputData = event.inputBuffer.getChannelData(0);
                  const rms = Math.sqrt(inputData.reduce((sum, x) => sum + x * x, 0) / inputData.length);
                  setIsUserSpeaking(rms > 0.02);

                  const audioData = createAudioData(inputData);
                  try {
                    liveSessionRef.current.sendRealtimeInput({ media: audioData });
                  } catch (err) {
                    // ignore
                  }
                };

                source.connect(processor);
                processor.connect(inputAudioContextRef.current.destination);
              }

            },
            onmessage: async (message: LiveServerMessage) => {
              if (!mounted || sessionSeqRef.current !== sessionSeq) return;
              const serverContent = message.serverContent;
              if (serverContent) {
                if (serverContent.inputTranscription) {
                  currentUserTextRef.current += serverContent.inputTranscription.text;
                }
                if (serverContent.outputTranscription) {
                  const nextText = serverContent.outputTranscription.text;
                  if (!aiTurnActiveRef.current) {
                    aiTurnActiveRef.current = true;
                    setAiTranscript("");
                  }
                  currentAiTextRef.current += nextText;
                }

                if (serverContent.turnComplete) {
                  if (currentUserTextRef.current.trim()) {
                    const text = currentUserTextRef.current.trim();
                    currentUserTextRef.current = "";
                    await sendTranscript("user", text);
                  }
                  if (currentAiTextRef.current.trim()) {
                    const text = currentAiTextRef.current.trim();
                    if (!hasAiGreetedRef.current) {
                      hasAiGreetedRef.current = true;
                      setHasAiGreeted(true);
                      console.info(LOG_PREFIX, "AI greeted, timer can start");
                    }
                    currentAiTextRef.current = "";
                    setAiTranscript(text.slice(-600));
                    await sendTranscript("ai", text);
                  }
                  aiTurnActiveRef.current = false;
                }
              }

              if (message.serverContent?.interrupted) {
                if (outputAudioContextRef.current) {
                  scheduledSourcesRef.current.forEach((source) => {
                    try {
                      source.stop();
                    } catch (e) {
                      // ignore
                    }
                  });
                  scheduledSourcesRef.current.clear();
                }
                nextStartTimeRef.current = 0;
                setIsAiSpeaking(false);
                return;
              }

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                setIsAiSpeaking(true);
                try {
                  const pcmData = base64ToArrayBuffer(base64Audio);
                  const audioBuffer = await pcmToAudioBuffer(pcmData, outputAudioContextRef.current);

                  const ctx = outputAudioContextRef.current;
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);

                  const currentTime = ctx.currentTime;
                  if (nextStartTimeRef.current < currentTime) {
                    nextStartTimeRef.current = currentTime;
                  }

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;

                  scheduledSourcesRef.current.add(source);

                  source.onended = () => {
                    scheduledSourcesRef.current.delete(source);
                    if (scheduledSourcesRef.current.size === 0) {
                      setIsAiSpeaking(false);
                    }
                  };
                } catch (err) {
                  // ignore
                }
              }
            },
            onclose: (event?: { code?: number; reason?: string }) => {
              console.warn(LOG_PREFIX, "socket closed", event);
              if (sessionSeqRef.current !== sessionSeq) return;
              isSessionOpenRef.current = false;
              liveSessionRef.current = null;
              if (mounted && !isEndingRef.current && statusRef.current !== "analyzing") {
                if (retryCountRef.current < MAX_RETRIES) {
                  retryCountRef.current += 1;
                  setStatus("reconnecting");
                  reconnectingRef.current = true;
                  console.warn(LOG_PREFIX, "reconnecting after close", { attempt: retryCountRef.current });
                  setTimeout(() => {
                    if (mounted) startSession();
                  }, 1000 * retryCountRef.current);
                } else {
                  setStatus("error");
                  setErrorMessage("Service unavailable.");
                }
              }
            },
            onerror: (err?: unknown) => {
              console.error(LOG_PREFIX, "socket error", err);
              if (isEndingRef.current) return;
              if (mounted && sessionSeqRef.current === sessionSeq) {
                isSessionOpenRef.current = false;
                liveSessionRef.current = null;
                if (retryCountRef.current < MAX_RETRIES) {
                  retryCountRef.current += 1;
                  setStatus("reconnecting");
                  reconnectingRef.current = true;
                  console.warn(LOG_PREFIX, "reconnecting after error", { attempt: retryCountRef.current });
                  setTimeout(() => {
                    if (mounted) startSession();
                  }, 1000 * retryCountRef.current);
                } else {
                  setStatus("error");
                  setErrorMessage("Service unavailable.");
                }
              }
            }
          }
        });

        currentSessionRef.current = sessionPromise;
        sessionPromise
          .then((session) => {
            if (sessionSeqRef.current !== sessionSeq) {
              try {
                session.close();
              } catch (e) {
                // ignore
              }
              return;
            }
            if (mounted) {
              if (!isEndingRef.current) {
                setStatus("connected");
                retryCountRef.current = 0;
              }
            }
            liveSessionRef.current = session;
            isSessionOpenRef.current = true;
            if (!hasSentGreetingRef.current && openingPrompt) {
              hasSentGreetingRef.current = true;
              setTimeout(() => {
                if (sessionSeqRef.current !== sessionSeq) return;
                if (!isSessionOpenRef.current || liveSessionRef.current !== session) return;
                try {
                  session.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: openingPrompt }] }],
                    turnComplete: true
                  });
                } catch (e) {
                  // ignore
                }
              }, 60);
            }
          })
          .catch(() => {
            if (sessionSeqRef.current === sessionSeq) {
              isSessionOpenRef.current = false;
              liveSessionRef.current = null;
            }
          });
      } catch (error: any) {
        if (mounted) {
          setStatus("error");
          setErrorMessage(error?.message || "Failed to start session.");
        }
      }
    };

    startSession();
    return () => {
      mounted = false;
      stopAudio();
    };
  }, [sessionId, stopAudio, topic, userName]);

  const endSession = () => {
    if (statusRef.current === "analyzing") return;
    console.info(LOG_PREFIX, "endSession triggered");
    isEndingRef.current = true;
    setStatus("analyzing");
    stopAudio();
    generateReport().finally(() => {
      isEndingRef.current = false;
    });
  };

  useEffect(() => {
    if (!hasAiGreeted || status !== "connected") {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        if (timerActiveRef.current) {
          console.info(LOG_PREFIX, "timer paused", { status, remainingSeconds });
          timerActiveRef.current = false;
        }
      }
      return;
    }
    if (timerIntervalRef.current) return;
    console.info(LOG_PREFIX, "timer started", { remainingSeconds });
    timerActiveRef.current = true;
    timerIntervalRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (timerActiveRef.current) {
        console.info(LOG_PREFIX, "timer stopped", { status, remainingSeconds });
        timerActiveRef.current = false;
      }
    };
  }, [hasAiGreeted, status]);

  useEffect(() => {
    if (!hasAiGreeted) return;

    const showWarning = (message: string) => {
      setWarningMessage(message);
      if (warningTimeoutRef.current) {
        window.clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = window.setTimeout(() => {
        setWarningMessage(null);
      }, 5000);
    };

    if (remainingSeconds === 300 && !warnedFiveRef.current) {
      warnedFiveRef.current = true;
      console.warn(LOG_PREFIX, "timer warning 5 minutes");
      showWarning("5 minutes remaining.");
    }
    if (remainingSeconds === 120 && !warnedTwoRef.current) {
      warnedTwoRef.current = true;
      console.warn(LOG_PREFIX, "timer warning 2 minutes");
      showWarning("2 minutes remaining.");
    }
    if (remainingSeconds === 0 && !autoEndedRef.current) {
      autoEndedRef.current = true;
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (timerActiveRef.current) {
        console.info(LOG_PREFIX, "timer finished");
        timerActiveRef.current = false;
      }
      console.warn(LOG_PREFIX, "timer ended, auto ending session");
      endSession();
    }
  }, [hasAiGreeted, remainingSeconds]);

  const statusLabel = (() => {
    switch (status) {
      case "connected":
        return "Live";
      case "analyzing":
        return "Analyzing";
      case "reconnecting":
        return "Reconnecting";
      case "error":
        return "Error";
      default:
        return "Connecting";
    }
  })();

  return {
    status,
    statusLabel,
    errorMessage,
    isAiSpeaking,
    isUserSpeaking,
    isMicMuted,
    aiTranscript,
    remainingSeconds,
    hasAiGreeted,
    warningMessage,
    toggleMic,
    endSession
  };
};
