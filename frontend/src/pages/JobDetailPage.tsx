import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Tabs,
  Tab,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { apiRequest } from "../api/client";
import type { Candidate, Invite, Job } from "../types";
import InviteCandidatesPanel from "../components/candidates/InviteCandidatesPanel";

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
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [questionsMarkdown, setQuestionsMarkdown] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [jobTab, setJobTab] = useState<"description" | "questions">("description");
  const candidateNameRef = useRef<HTMLInputElement | null>(null);
  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

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
    if (inviteDrawerOpen) {
      candidateNameRef.current?.focus();
    }
  }, [inviteDrawerOpen]);

  const inviteByCandidate = useMemo(() => {
    return new Map(invites.map((invite) => [invite.candidateId, invite]));
  }, [invites]);

  const resultByCandidate = useMemo(() => {
    return new Map(candidateResults.map((result) => [result.candidateId, result]));
  }, [candidateResults]);

  const handleCreateCandidate = async (payload: { name: string; email: string }) => {
    if (!jobId) return;
    const data = await apiRequest<{ candidate: Candidate; invite: Invite }>(`/api/v1/jobs/${jobId}/candidates`, {
      method: "POST",
      auth: true,
      body: payload
    });
    setCandidates((prev) => [data.candidate, ...prev]);
    setInvites((prev) => [data.invite, ...prev]);
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
    const inviteUrl = new URL(`/c/${invite.id}`, publicAppUrl).toString();
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handlePreview = () => {
    if (!job) return;
    window.open(`/preview/jobs/${job.id}`, "_blank", "noopener,noreferrer");
  };

  const openDrawer = () => setDrawerOpen(true);
  const openInviteDrawer = () => setInviteDrawerOpen(true);

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
            <Button variant="contained" onClick={openDrawer}>
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
            <Button variant="contained" onClick={openInviteDrawer}>
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
              onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setRawDraft(event.target.value)
              }
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
        PaperProps={{ sx: { width: { xs: "100%", md: "60vw" }, p: 0 } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h5" gutterBottom>
              Job details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update the role title, description, and interview questions. Save changes when ready.
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Role setup</Typography>
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
              <TextField
                label="Job title"
                value={job.title}
                onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setJob({ ...job, title: event.target.value })
                }
              />
              <Tabs
                value={jobTab}
                onChange={(_, value) => setJobTab(value)}
                aria-label="Job content tabs"
              >
                <Tab label="Description" value="description" />
                <Tab label="Questions" value="questions" />
              </Tabs>
              {jobTab === "description" ? (
                <Stack spacing={2}>
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
                      height={360}
                    />
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Interview questions (Markdown list)</Typography>
                  <Box data-color-mode="light">
                    <MDEditor
                      value={questionsMarkdown}
                      onChange={(value) => setQuestionsMarkdown(value ?? "")}
                      preview="edit"
                      height={360}
                    />
                  </Box>
                </Stack>
              )}
              {!job.questions?.length ? (
                <Chip label="Add at least one question before inviting candidates" color="warning" />
              ) : null}
            </Stack>
          </Box>

          <Box
            sx={{
              p: 3,
              borderTop: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper"
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Button variant="contained" onClick={handleSaveJob} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Changes apply immediately to future candidate invites.
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: "45vw" }, p: { xs: 3, md: 4 } } }}
      >
        <Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <InviteCandidatesPanel
            jobId={jobId}
            canInvite={Boolean(job?.questions?.length)}
            onCreateCandidate={handleCreateCandidate}
            onError={setError}
            candidateNameRef={candidateNameRef}
          />
        </Stack>
      </Drawer>
    </Container>
  );
};

export default JobDetailPage;
