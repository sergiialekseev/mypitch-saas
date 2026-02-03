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
        top: 20,
        transform: "translateX(-50%)",
        maxWidth: 760,
        width: "calc(100% - 48px)",
        px: 3.5,
        py: 2,
        borderRadius: 1,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        zIndex: 10
      }}
    >
      <Typography variant="caption" color="rgba(248,250,252,0.6)">
        MyPitch AI:
      </Typography>
      <Typography variant="body2" color="rgba(248,250,252,0.9)">
        {text || "AI is listening..."}
      </Typography>
    </Box>
  );
};

export default CallTranscriptBar;
