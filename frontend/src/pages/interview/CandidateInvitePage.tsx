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
import MarkdownPreview from "@uiw/react-markdown-preview";
import { apiRequest } from "../../api/client";

type InvitePayload = {
  invite: { id: string; status: string; expiresAt?: string | null };
  job: {
    id: string;
    title: string;
    description: string;
    descriptionMarkdown?: string;
    questionsMarkdown?: string;
  };
  candidate: { id: string; name: string; email: string };
};

const CandidateInvitePage = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<InvitePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

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

  const handleContinue = () => {
    if (!inviteId) return;
    navigate(`/c/${inviteId}/setup`);
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
    <Container sx={{ py: 8 }} maxWidth="md">
      <Stack spacing={3}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Interview invite</Typography>
            <Typography color="text.secondary">Role: {data.job.title}</Typography>
            <Typography color="text.secondary">Candidate: {data.candidate.name}</Typography>
            {data.job.description ? (
              <Typography color="text.secondary">{data.job.description}</Typography>
            ) : null}

            <Box sx={{ background: "rgba(15, 118, 110, 0.08)", p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Agreement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                By continuing, you agree that this interview session may be recorded and analyzed for feedback.
              </Typography>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />}
                label="I agree to the interview terms"
              />
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Button variant="contained" disabled={!agreed} onClick={handleContinue}>
              Continue to setup
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h5">Role details</Typography>
            <Box data-color-mode="light">
              <MarkdownPreview source={data.job.descriptionMarkdown || data.job.description || ""} />
            </Box>
            {data.job.questionsMarkdown ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Interview questions
                </Typography>
                <Box data-color-mode="light">
                  <MarkdownPreview source={data.job.questionsMarkdown} />
                </Box>
              </Box>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default CandidateInvitePage;
