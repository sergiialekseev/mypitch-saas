import { Box, Button, Stack, Typography } from "@mui/material";
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
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 3,
        px: 3,
        py: 1.5,
        borderRadius: 999,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        zIndex: 10,
        width: "fit-content"
      }}
    >
      <Stack spacing={0.5} alignItems="center">
        <Typography variant="caption" color="rgba(248,250,252,0.7)">
          {statusLabel}
        </Typography>
      </Stack>
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
