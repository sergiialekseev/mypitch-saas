import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";

type InvitePayload = {
  invite: { id: string; status: string; expiresAt?: string | null };
  job: { id: string; title: string; description: string };
  candidate: { id: string; name: string; email: string };
};

type AcceptPayload = {
  session: { id: string };
};

const CandidateInvitePage = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<InvitePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteId) return;
      setLoading(true);
      setError(null);
      try {
        const payload = await apiRequest<InvitePayload>(`/api/v1/invites/${inviteId}`);
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite not available.");
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteId]);

  const handleAccept = async () => {
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

  if (loading) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography color="text.secondary">Loading invite...</Typography>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error || "Invite not available."}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 8 }} maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Interview invite</Typography>
          <Typography color="text.secondary">Role: {data.job.title}</Typography>
          <Typography color="text.secondary">Candidate: {data.candidate.name}</Typography>
          {data.job.description ? <Typography>{data.job.description}</Typography> : null}

          <Box sx={{ background: "rgba(15, 118, 110, 0.08)", p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              By continuing, you agree that this interview session may be recorded and analyzed for feedback.
            </Typography>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />}
            label="I agree to the interview terms"
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Button variant="contained" disabled={!agreed || submitting} onClick={handleAccept}>
            Start interview
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default CandidateInvitePage;
