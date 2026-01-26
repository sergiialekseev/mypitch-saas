import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type LiveSessionBlockingOverlayProps = {
  active: boolean;
};

const LiveSessionBlockingOverlay = ({ active }: LiveSessionBlockingOverlayProps) => {
  if (!active) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 320, textAlign: "center" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" color="white">
          Generating your interview report
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          Please keep this tab open. We are finalizing your results now.
        </Typography>
      </Stack>
    </Box>
  );
};

export default LiveSessionBlockingOverlay;
