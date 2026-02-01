import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";

type LiveSessionBlockingOverlayProps = {
  active: boolean;
};

const LiveSessionBlockingOverlay = ({ active }: LiveSessionBlockingOverlayProps) => {
  if (!active) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        backgroundColor: "rgb(15, 23, 42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 420, textAlign: "center", px: 3 }}>
        <CircularProgress color="inherit" />
        <Typography variant="h5" color="white">
          Generating your interview report
        </Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.8)">
          Please keep this tab open. Closing or refreshing may interrupt report generation.
        </Typography>
        <Alert severity="warning" sx={{ width: "100%", textAlign: "left" }}>
          Do not close this tab. We are finalizing your results now.
        </Alert>
      </Stack>
    </Box>
  );
};

export default LiveSessionBlockingOverlay;
