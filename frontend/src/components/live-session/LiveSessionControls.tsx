import { Button, Stack } from "@mui/material";

type LiveSessionControlsProps = {
  status: "connecting" | "connected" | "error" | "disconnected" | "reconnecting" | "analyzing";
  isMicMuted: boolean;
  onToggleMic: () => void;
  onEndSession: () => void;
};

const LiveSessionControls = ({ status, isMicMuted, onToggleMic, onEndSession }: LiveSessionControlsProps) => {
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end">
      <Button variant="outlined" onClick={onToggleMic} disabled={status !== "connected"}>
        {isMicMuted ? "Unmute" : "Mute"}
      </Button>
      <Button variant="contained" color="secondary" onClick={onEndSession} disabled={status === "analyzing"}>
        End session
      </Button>
    </Stack>
  );
};

export default LiveSessionControls;
