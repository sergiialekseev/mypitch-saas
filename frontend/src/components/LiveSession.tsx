import { Paper, Stack } from "@mui/material";
import type { Topic } from "../types";
import LiveSessionControls from "./live-session/LiveSessionControls";
import LiveSessionHeader from "./live-session/LiveSessionHeader";
import LiveSessionBlockingOverlay from "./live-session/LiveSessionBlockingOverlay";
import LiveSessionVisualizer from "./live-session/LiveSessionVisualizer";
import { useLiveSession } from "./live-session/useLiveSession";

interface LiveSessionProps {
  topic: Topic;
  userName: string;
  sessionId: string;
  onReportReady: () => void;
}

const LiveSession = ({ topic, userName, sessionId, onReportReady }: LiveSessionProps) => {
  const {
    status,
    statusLabel,
    errorMessage,
    isAiSpeaking,
    isUserSpeaking,
    isMicMuted,
    toggleMic,
    endSession
  } = useLiveSession({ topic, userName, sessionId, onReportReady });

  return (
    <Paper sx={{ p: 4, position: "relative", overflow: "hidden" }}>
      <LiveSessionBlockingOverlay active={status === "analyzing"} />
      <Stack spacing={3}>
        <LiveSessionHeader
          title={topic.title}
          description={topic.description}
          status={status}
          statusLabel={statusLabel}
        />
        <LiveSessionVisualizer
          status={status}
          errorMessage={errorMessage}
          isAiSpeaking={isAiSpeaking}
          isUserSpeaking={isUserSpeaking}
          isMicMuted={isMicMuted}
        />
        <LiveSessionControls status={status} isMicMuted={isMicMuted} onToggleMic={toggleMic} onEndSession={endSession} />
      </Stack>
    </Paper>
  );
};

export default LiveSession;
