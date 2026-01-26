import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { apiRequest } from "../api/client";
import type { Candidate, Invite, Job } from "../types";

type CandidateResult = {
  candidateId: string;
  sessionId: string;
  sessionStatus: string;
  reportId?: string | null;
  score?: number | null;
  reportCreatedAt?: string | null;
};

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [questionsMarkdown, setQuestionsMarkdown] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"job" | "candidate">("job");
  const candidateNameRef = useRef<HTMLInputElement | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{
        job: Job;
        candidates: Candidate[];
        invites: Invite[];
        candidateResults?: CandidateResult[];
      }>(
        `/api/v1/jobs/${jobId}`,
        { auth: true }
      );
      setJob(data.job);
      setCandidates(data.candidates || []);
      setInvites(data.invites || []);
      setCandidateResults(data.candidateResults || []);
      setDescriptionMarkdown(data.job.descriptionMarkdown || "");
      setQuestionsMarkdown(data.job.questionsMarkdown || "");
      setRawDescription(data.job.rawDescription || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (drawerOpen && drawerMode === "candidate") {
      candidateNameRef.current?.focus();
    }
  }, [drawerOpen, drawerMode]);

  const inviteByCandidate = useMemo(() => {
    return new Map(invites.map((invite) => [invite.candidateId, invite]));
  }, [invites]);

  const resultByCandidate = useMemo(() => {
    return new Map(candidateResults.map((result) => [result.candidateId, result]));
  }, [candidateResults]);

  const handleCreateCandidate = async () => {
    if (!jobId) return;
    setError(null);
    if (!job?.questions?.length) {
      setError("Add interview questions before inviting candidates.");
      return;
    }
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

  const handleSaveJob = async () => {
    if (!jobId || !job) return;
    setSaveError(null);
    setSaving(true);
    try {
      const data = await apiRequest<{ job: Job }>(`/api/v1/jobs/${jobId}`, {
        method: "PUT",
        auth: true,
        body: {
          title: job.title,
          rawDescription: rawDescription || descriptionMarkdown,
          descriptionMarkdown,
          questionsMarkdown
        }
      });
      setJob(data.job);
      setDescriptionMarkdown(data.job.descriptionMarkdown || "");
      setQuestionsMarkdown(data.job.questionsMarkdown || "");
      setRawDescription(data.job.rawDescription || "");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save job.");
    } finally {
      setSaving(false);
    }
  };

  const openRawDialog = () => {
    setRawDraft(rawDescription || "");
    setRawDialogOpen(true);
  };

  const handleGenerate = async () => {
    setSaveError(null);
    if (!rawDraft.trim()) {
      setSaveError("Paste the job description before generating markdown.");
      return;
    }

    setGenerating(true);
    try {
      const data = await apiRequest<{ markdown: string }>("/api/v1/jobs/format", {
        method: "POST",
        auth: true,
        body: { rawText: rawDraft }
      });
      setDescriptionMarkdown(data.markdown || "");
      setRawDescription(rawDraft);
      setRawDialogOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not generate markdown.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (invite: Invite) => {
    await navigator.clipboard.writeText(invite.link);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handlePreview = () => {
    if (!job) return;
    window.open(`/preview/jobs/${job.id}`, "_blank", "noopener,noreferrer");
  };

  const openDrawer = (mode: "job" | "candidate") => {
    setDrawerMode(mode);
    setDrawerOpen(true);
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
    <Container sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Breadcrumbs>
          <Button component={RouterLink} to="/app/jobs">
            Jobs
          </Button>
          <Typography color="text.primary">{job.title}</Typography>
        </Breadcrumbs>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h3" gutterBottom>
              {job.title}
            </Typography>
            <Typography color="text.secondary">{job.description || "No summary yet."}</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handlePreview}>
              Preview job
            </Button>
            <Button variant="contained" onClick={() => openDrawer("job")}>
              Edit job
            </Button>
            <Button variant="outlined" onClick={() => navigate("/app/jobs")}>
              Back to jobs
            </Button>
          </Stack>
        </Box>

        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Candidates</Typography>
            <Button variant="contained" onClick={() => openDrawer("candidate")}>
              Add candidate
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {candidates.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary">No candidates yet.</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Report</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate) => {
                    const invite = inviteByCandidate.get(candidate.id);
                    const result = resultByCandidate.get(candidate.id);
                    const scoreValue = result?.score ?? null;
                    return (
                      <TableRow key={candidate.id} hover>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>
                          <Chip label={candidate.status} variant="outlined" size="small" />
                        </TableCell>
                        <TableCell>{scoreValue === null ? "-" : scoreValue}</TableCell>
                        <TableCell>
                          <Chip
                            label={result?.reportId ? "Ready" : "Pending"}
                            color={result?.reportId ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {invite ? (
                              <Button size="small" variant="outlined" onClick={() => handleCopy(invite)}>
                                {copiedInviteId === invite.id ? "Copied" : "Copy invite"}
                              </Button>
                            ) : null}
                            <Button
                              size="small"
                              variant="contained"
                              disabled={!result?.reportId}
                              onClick={() => navigate(`/app/jobs/${job.id}/candidates/${candidate.id}`)}
                            >
                              View report
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Stack>

      <Dialog open={rawDialogOpen} onClose={() => setRawDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Convert plain text to Markdown</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Paste the raw job description. Gemini will structure it into markdown.
            </Typography>
            <TextField
              label="Plain text"
              value={rawDraft}
              onChange={(event) => setRawDraft(event.target.value)}
              multiline
              minRows={10}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRawDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate} variant="contained" disabled={generating}>
            {generating ? "Generating..." : "Generate markdown"}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 3 } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Job workspace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the job content and candidate invites in one place.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Typography variant="h6">Role details</Typography>
            {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            <TextField
              label="Job title"
              value={job.title}
              onChange={(event) => setJob({ ...job, title: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Typography variant="subtitle2">Job description (Markdown)</Typography>
              <Button variant="outlined" size="small" onClick={openRawDialog}>
                Convert from plain text
              </Button>
            </Stack>
            <Box data-color-mode="light">
              <MDEditor
                value={descriptionMarkdown}
                onChange={(value) => setDescriptionMarkdown(value ?? "")}
                preview="edit"
                height={260}
              />
            </Box>
            <Divider />
            <Typography variant="subtitle2">Interview questions (Markdown list)</Typography>
            <Box data-color-mode="light">
              <MDEditor
                value={questionsMarkdown}
                onChange={(value) => setQuestionsMarkdown(value ?? "")}
                preview="edit"
                height={200}
              />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Raw job input</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  value={rawDescription || ""}
                  multiline
                  minRows={4}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </AccordionDetails>
            </Accordion>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button variant="contained" onClick={handleSaveJob} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              {!job.questions?.length ? (
                <Chip label="Add at least one question to invite candidates" color="warning" />
              ) : null}
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Invite a candidate</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Candidate name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              inputRef={candidateNameRef}
              fullWidth
            />
            <TextField
              label="Candidate email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleCreateCandidate}>
              Create link
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </Container>
  );
};

export default JobDetailPage;
