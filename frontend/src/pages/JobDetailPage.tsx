import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Candidate, Invite, Job } from "../types";

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ job: Job; candidates: Candidate[]; invites: Invite[] }>(
        `/api/v1/jobs/${jobId}`,
        { auth: true }
      );
      setJob(data.job);
      setCandidates(data.candidates || []);
      setInvites(data.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const inviteByCandidate = useMemo(() => {
    return new Map(invites.map((invite) => [invite.candidateId, invite]));
  }, [invites]);

  const handleCreateCandidate = async () => {
    if (!jobId) return;
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Add a candidate name and email.");
      return;
    }

    try {
      const data = await apiRequest<{ candidate: Candidate; invite: Invite }>(
        `/api/v1/jobs/${jobId}/candidates`,
        {
          method: "POST",
          auth: true,
          body: {
            name,
            email
          }
        }
      );
      setCandidates((prev) => [data.candidate, ...prev]);
      setInvites((prev) => [data.invite, ...prev]);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add candidate.");
    }
  };

  const handleCopy = async (invite: Invite) => {
    await navigator.clipboard.writeText(invite.link);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  if (loading) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography color="text.secondary">Loading job...</Typography>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Job not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/app")}>Go back</Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h3" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary">{job.description || "No description yet."}</Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Invite a candidate</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Candidate name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
              <TextField label="Candidate email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
              <Button variant="contained" onClick={handleCreateCandidate} sx={{ minWidth: 140 }}>
                Create link
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Candidates
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {candidates.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">No candidates yet.</Typography>
              </Paper>
            ) : (
              candidates.map((candidate) => {
                const invite = inviteByCandidate.get(candidate.id);
                return (
                  <Paper key={candidate.id} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle1">{candidate.name}</Typography>
                        <Typography color="text.secondary">{candidate.email}</Typography>
                      </Box>
                      <Chip label={candidate.status} variant="outlined" />
                    </Box>
                    {invite ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                        <Typography variant="body2" color="text.secondary">
                          Invite link: {invite.link}
                        </Typography>
                        <Button size="small" onClick={() => handleCopy(invite)} variant="outlined">
                          {copiedInviteId === invite.id ? "Copied" : "Copy"}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : "n/a"}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Invite pending.
                      </Typography>
                    )}
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default JobDetailPage;
