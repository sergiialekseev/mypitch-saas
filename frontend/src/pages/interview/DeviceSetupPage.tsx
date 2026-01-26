import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";

type InvitePayload = {
  invite: { id: string; status: string; expiresAt?: string | null };
  job: { id: string; title: string };
  candidate: { id: string; name: string; email: string };
};

type AcceptPayload = {
  session: { id: string };
};

const DeviceSetupPage = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [data, setData] = useState<InvitePayload | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteId) return;
      setError(null);
      try {
        const payload = await apiRequest<InvitePayload>(`/api/v1/invites/${inviteId}`);
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite not available.");
      }
    };

    loadInvite();
  }, [inviteId]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const checkDevices = async () => {
    setStatus("checking");
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error");
      setError("Your browser does not support camera access. Please try a modern browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError("Camera and microphone access is required to start. Please allow permissions.");
    }
  };

  const handleStart = async () => {
    if (!inviteId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = await apiRequest<AcceptPayload>(`/api/v1/invites/${inviteId}/accept`, { method: "POST" });
      navigate(`/c/${inviteId}/live/${payload.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container sx={{ py: 8 }} maxWidth="md">
      <Stack spacing={3}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Set up your devices</Typography>
            {data ? (
              <Typography color="text.secondary">
                {data.candidate.name}, you are interviewing for {data.job.title}.
              </Typography>
            ) : null}
            <Typography color="text.secondary">
              Camera access is required to join the interview. Please enable both camera and microphone.
            </Typography>

            <Box sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "grey.100" }}>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="outlined" onClick={checkDevices} disabled={status === "checking"}>
                {status === "checking" ? "Checking..." : "Enable camera & mic"}
              </Button>
              <Button
                variant="contained"
                onClick={handleStart}
                disabled={status !== "ready" || submitting}
              >
                {submitting ? "Starting..." : "Start interview"}
              </Button>
            </Stack>

            {status === "ready" ? (
              <Alert severity="success">Devices ready. You can start the interview.</Alert>
            ) : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default DeviceSetupPage;
