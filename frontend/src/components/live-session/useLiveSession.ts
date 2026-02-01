import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, type LiveServerMessage, Modality } from "@google/genai";
import { apiRequest } from "../../api/client";
import { createAudioData, base64ToArrayBuffer, pcmToAudioBuffer } from "../../utils/audio-utils";
import type { Topic } from "../../types";

const LIVE_MODEL_ID = "gemini-2.5-flash-native-audio-preview-12-2025";

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
  const statusRef = useRef(status);

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
  const MAX_RETRIES = 3;

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const stopAudio = useCallback(() => {
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
    if (status !== "analyzing") return;
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
      try {
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

        if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close();
          inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
          outputAudioContextRef.current.close();
          outputAudioContextRef.current = null;
        }

        currentUserTextRef.current = "";
        currentAiTextRef.current = "";

        const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        if (!streamRef.current) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const stream = streamRef.current;
        const userContext = userName ? `The user's name is ${userName}.` : "The user has not provided a name.";
        const systemInstruction = `
${topic.systemPrompt}

Context for you (The AI):
${userContext}

META INSTRUCTIONS:
1. Detect the user's language automatically and respond in the same language.
2. If the user switches language, switch with them instantly.
3. Keep responses concise (spoken style).
        `;

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
                  currentAiTextRef.current += serverContent.outputTranscription.text;
                }

                if (serverContent.turnComplete) {
                  if (currentUserTextRef.current.trim()) {
                    const text = currentUserTextRef.current.trim();
                    currentUserTextRef.current = "";
                    await sendTranscript("user", text);
                  }
                  if (currentAiTextRef.current.trim()) {
                    const text = currentAiTextRef.current.trim();
                    currentAiTextRef.current = "";
                    await sendTranscript("ai", text);
                  }
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
            onclose: () => {
              if (sessionSeqRef.current !== sessionSeq) return;
              isSessionOpenRef.current = false;
              liveSessionRef.current = null;
              if (mounted && !isEndingRef.current && statusRef.current !== "analyzing") {
                setStatus("disconnected");
              }
            },
            onerror: () => {
              if (isEndingRef.current) return;
              if (mounted && sessionSeqRef.current === sessionSeq) {
                isSessionOpenRef.current = false;
                liveSessionRef.current = null;
                if (retryCountRef.current < MAX_RETRIES) {
                  retryCountRef.current += 1;
                  setStatus("reconnecting");
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
    isEndingRef.current = true;
    setStatus("analyzing");
    stopAudio();
    generateReport().finally(() => {
      isEndingRef.current = false;
    });
  };

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
    toggleMic,
    endSession
  };
};
