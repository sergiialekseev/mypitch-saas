import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import LiveSessionBlockingOverlay from "../../components/live-session/LiveSessionBlockingOverlay";
import { useLiveSession } from "../../components/live-session/useLiveSession";
import LocalVideoPane from "../../components/live-session/LocalVideoPane";
import AiPictureInPicture from "../../components/live-session/AiPictureInPicture";
import CallTranscriptBar from "../../components/live-session/CallTranscriptBar";
import CallControls from "../../components/live-session/CallControls";
import CallTimer from "../../components/live-session/CallTimer";
import type { Topic } from "../../types";

type SessionContext = {
  session: { id: string; status: string; systemPrompt: string; openingPrompt?: string };
  job: { id: string; title: string; description: string; descriptionMarkdown?: string; questions?: string[] };
  candidate: { id: string; name: string; email: string };
};

type CandidateLiveCallProps = {
  inviteId?: string;
  sessionId: string;
  context: SessionContext;
  topic: Topic;
};

const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/mypitch---saas.firebasestorage.app/o/website_assets%2FBlack%20logo.png?alt=media&token=756320ea-2fac-425f-a85b-d6de723254fd";

const CandidateLiveCall = ({ inviteId, sessionId, context, topic }: CandidateLiveCallProps) => {
  const navigate = useNavigate();
  const {
    status,
    statusLabel,
    errorMessage,
    isAiSpeaking,
    isMicMuted,
    aiTranscript,
    remainingSeconds,
    hasAiGreeted,
    warningMessage,
    toggleMic,
    endSession
  } = useLiveSession({
    topic,
    userName: context.candidate.name,
    sessionId,
    onReportReady: () => {
      if (inviteId) {
        navigate(`/c/${inviteId}/report/${sessionId}`);
      }
    }
  });

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#0B1220",
        color: "#F8FAFC",
        position: "relative",
        p: 0,
        overflow: "hidden"
      }}
    >
      <LiveSessionBlockingOverlay active={status === "analyzing"} />
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
          <LocalVideoPane name={context.candidate.name} fill />
          <AiPictureInPicture isSpeaking={isAiSpeaking} />
          <Box
            component="img"
            src={LOGO_URL}
            alt="MyPitch"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              height: 26,
              width: "auto",
              filter: "brightness(0) invert(1)",
              opacity: 0.9
            }}
          />
        </Box>

        {status === "error" ? (
          <Alert severity="error">{errorMessage || "Session error."}</Alert>
        ) : null}
      </Stack>
      <CallTranscriptBar text={aiTranscript} statusLabel={statusLabel} />
      {warningMessage ? (
        <Box
          sx={{
            position: "fixed",
            left: "50%",
            top: 144,
            transform: "translateX(-50%)",
            width: "calc(100% - 64px)",
            maxWidth: 520,
            zIndex: 10
          }}
        >
          <Alert severity="warning" variant="filled" sx={{ borderRadius: 12, fontWeight: 600 }}>
            {warningMessage}
          </Alert>
        </Box>
      ) : null}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          px: { xs: 2, md: 4 },
          py: 2,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          borderTop: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(8px)",
          zIndex: 9
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 2
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "rgba(248,250,252,0.9)",
              minWidth: 110,
              flexWrap: "wrap"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    statusLabel === "Live"
                      ? "#22c55e"
                      : statusLabel === "Reconnecting"
                      ? "#f59e0b"
                      : statusLabel === "Error"
                      ? "#ef4444"
                      : "rgba(148, 163, 184, 0.8)"
                }}
              />
              <Box sx={{ fontSize: 12, fontWeight: 600 }}>{statusLabel}</Box>
            </Box>
            {hasAiGreeted ? <CallTimer remainingSeconds={remainingSeconds} /> : null}
          </Box>
          <CallControls
            isMicMuted={isMicMuted}
            statusLabel={statusLabel}
            onToggleMic={toggleMic}
            onEndSession={endSession}
            disabled={status !== "connected"}
          />
          <Box />
        </Box>
      </Box>
    </Box>
  );
};

const CandidateLivePage = () => {
  const { inviteId, sessionId } = useParams();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContext = async () => {
      if (!sessionId) return;
      setLoading(true);
      setError(null);
      try {
        const payload = await apiRequest<SessionContext>(`/api/v1/sessions/${sessionId}`);
        setContext(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Session not found.");
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [sessionId]);

  const topic = useMemo<Topic | null>(() => {
    if (!context) return null;
    return {
      title: context.job.title,
      description: context.job.description || "",
      systemPrompt: context.session.systemPrompt || "",
      openingPrompt: context.session.openingPrompt || ""
    };
  }, [context]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary">Loading session...</Typography>
      </Box>
    );
  }

  if (!sessionId || !context || !topic) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Alert severity="error">{error || "Session not available."}</Alert>
      </Box>
    );
  }

  return <CandidateLiveCall inviteId={inviteId} sessionId={sessionId} context={context} topic={topic} />;
};

export default CandidateLivePage;
