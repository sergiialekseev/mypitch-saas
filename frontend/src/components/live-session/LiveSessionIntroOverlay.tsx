import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type LiveSessionIntroOverlayProps = {
  active: boolean;
};

const LiveSessionIntroOverlay = ({ active }: LiveSessionIntroOverlayProps) => {
  if (!active) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        backgroundColor: "rgb(15, 23, 42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: "center", px: 3 }}>
        <CircularProgress color="inherit" />
        <Typography variant="h5" color="white">
          Connecting you to the interviewer…
        </Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.8)">
          Please wait a moment while the session starts.
        </Typography>
      </Stack>
    </Box>
  );
};

export default LiveSessionIntroOverlay;
