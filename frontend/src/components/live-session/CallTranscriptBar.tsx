import { Box, Typography } from "@mui/material";

type CallTranscriptBarProps = {
  text: string;
  statusLabel: string;
};

const CallTranscriptBar = ({ text, statusLabel }: CallTranscriptBarProps) => {
  return (
    <Box
      sx={{
        position: "fixed",
        left: "50%",
        bottom: 92,
        transform: "translateX(-50%)",
        maxWidth: 720,
        width: "calc(100% - 32px)",
        px: 3,
        py: 2,
        borderRadius: 999,
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        zIndex: 9
      }}
    >
      <Typography variant="caption" color="rgba(248,250,252,0.6)">
        AI transcript • {statusLabel}
      </Typography>
      <Typography variant="body2" color="rgba(248,250,252,0.9)">
        {text || "AI is listening..."}
      </Typography>
    </Box>
  );
};

export default CallTranscriptBar;
