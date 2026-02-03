import { Box, Button } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CallEndIcon from "@mui/icons-material/CallEnd";

type CallControlsProps = {
  isMicMuted: boolean;
  statusLabel: string;
  onToggleMic: () => void;
  onEndSession: () => void;
  disabled?: boolean;
};

const CallControls = ({ isMicMuted, statusLabel, onToggleMic, onEndSession, disabled }: CallControlsProps) => {
    const handleEnd = () => {
      if (window.confirm("End this interview now? This will stop the call and finalize the report.")) {
        onEndSession();
      }
    };
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 3,
        px: 0,
        py: 0,
        width: "fit-content",
        margin: "0 auto"
      }}
    >
      <Button
        variant="outlined"
        color="inherit"
        startIcon={isMicMuted ? <MicOffIcon /> : <MicIcon />}
        onClick={onToggleMic}
        disabled={disabled}
        sx={{ color: "rgba(248,250,252,0.9)", borderColor: "rgba(248,250,252,0.3)" }}
      >
        {isMicMuted ? "Unmute" : "Mute"}
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={<CallEndIcon />}
        onClick={handleEnd}
        disabled={disabled}
      >
        End
      </Button>
    </Box>
  );
};

export default CallControls;
