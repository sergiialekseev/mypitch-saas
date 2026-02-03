import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const CandidateThanksPage = () => {
  const { sessionId } = useParams();
  const [closeFailed, setCloseFailed] = useState(false);
  const glowSeed = useMemo(() => {
    const seed = sessionId ? sessionId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) : 420;
    return seed % 360;
  }, [sessionId]);
  const handleClose = () => {
    setCloseFailed(false);
    try {
      window.open("", "_self");
      window.close();
    } catch (error) {
      setCloseFailed(true);
      return;
    }
    window.setTimeout(() => {
      setCloseFailed(true);
    }, 300);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 20% 20%, hsla(${glowSeed}, 70%, 70%, 0.25), transparent 45%),
          radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.18), transparent 40%),
          linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92))`,
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 55%)",
          animation: "pulseGlow 6s ease-in-out infinite"
        }}
      />
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.25)",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.45)"
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.7))",
                boxShadow: "0 12px 30px rgba(16, 185, 129, 0.45)"
              }}
            >
              <Typography variant="h4">✓</Typography>
            </Box>
            <Stack spacing={1}>
              <Typography variant="h4">You’re done. Great work!</Typography>
              <Typography color="rgba(248,250,252,0.75)">
                Your interview is complete and your responses were sent to the hiring team.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="success"
              onClick={handleClose}
              sx={{ px: 4, py: 1.2, borderRadius: 99 }}
            >
              Close tab
            </Button>
            {closeFailed ? (
              <Typography variant="caption" color="rgba(248,250,252,0.6)">
                Your browser blocked auto-close. Please close this tab manually.
              </Typography>
            ) : (
              <Typography variant="caption" color="rgba(248,250,252,0.6)">
                You can safely close this window.
              </Typography>
            )}
          </Stack>
        </Box>
      </Container>
      <style>
        {`@keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }`}
      </style>
    </Box>
  );
};

export default CandidateThanksPage;
