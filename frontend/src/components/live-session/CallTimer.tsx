import { Box, Typography } from "@mui/material";

type CallTimerProps = {
  remainingSeconds: number;
};

const CallTimer = ({ remainingSeconds }: CallTimerProps) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontSize: 11, color: "rgba(248,250,252,0.65)" }}>
        Time left:
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {label}
      </Typography>
    </Box>
  );
};

export default CallTimer;
