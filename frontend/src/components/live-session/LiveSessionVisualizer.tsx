import { Box, Stack, Typography } from "@mui/material";

type LiveSessionVisualizerProps = {
  status: "connecting" | "connected" | "error" | "disconnected" | "reconnecting" | "analyzing";
  errorMessage: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isMicMuted: boolean;
};

const LiveSessionVisualizer = ({
  status,
  errorMessage,
  isAiSpeaking,
  isUserSpeaking,
  isMicMuted
}: LiveSessionVisualizerProps) => {
  if (status === "error") {
    return <Typography color="error">{errorMessage}</Typography>;
  }

  return (
    <Box
      sx={{
        height: 220,
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), transparent 60%), #0f172a"
      }}
    >
      <Stack spacing={1} alignItems="center">
        <Typography color="white">{isAiSpeaking ? "Coach speaking" : isUserSpeaking ? "Listening" : "Ready"}</Typography>
        <Typography color="rgba(255,255,255,0.6)">Microphone {isMicMuted ? "muted" : "on"}</Typography>
      </Stack>
    </Box>
  );
};

export default LiveSessionVisualizer;
