import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { apiRequest } from "../api/client";
import type { Job } from "../types";
import Loader from "../components/ui/Loader";

const steps = ["Job details", "Interview questions", "Review & save"];

const JobsEditPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [title, setTitle] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [questionsMarkdown, setQuestionsMarkdown] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ job: Job }>(`/api/v1/jobs/${jobId}`, { auth: true });
      setJob(data.job);
      setTitle(data.job.title || "");
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

  const openRawDialog = () => {
    setRawDraft(rawDescription || "");
    setRawDialogOpen(true);
  };

  const handleGenerate = async () => {
    setError(null);
    if (!rawDraft.trim()) {
      setError("Paste the job description before generating markdown.");
      return;
    }

    setGenerating(true);
    try {
      const data = await apiRequest<{ markdown: string; title?: string }>("/api/v1/jobs/format", {
        method: "POST",
        auth: true,
        body: { rawText: rawDraft }
      });
      setDescriptionMarkdown(data.markdown || "");
      setRawDescription(rawDraft);
      if (data.title) {
        setTitle(data.title);
      }
      setRawDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate markdown.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!jobId) return;
    setError(null);
    if (!title.trim()) {
      setError("Add a job title to continue.");
      return;
    }
    if (!descriptionMarkdown.trim()) {
      setError("Job description cannot be empty.");
      return;
    }
    if (!questionsMarkdown.trim()) {
      setError("Add at least one interview question.");
      return;
    }

    setSaving(true);
    try {
      const resolvedRaw = rawDescription.trim() ? rawDescription : descriptionMarkdown;
      const data = await apiRequest<{ job: Job }>(`/api/v1/jobs/${jobId}`, {
        method: "PUT",
        auth: true,
        body: {
          title,
          rawDescription: resolvedRaw,
          descriptionMarkdown,
          questionsMarkdown
        }
      });
      setJob(data.job);
      navigate(`/app/jobs/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save job.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader variant="page" label="Loading job..." />;
  }

  if (!job) {
    return (
      <Stack spacing={2} sx={{ py: 6 }}>
        <Alert severity="error">Job not found.</Alert>
        <Button variant="outlined" onClick={() => navigate("/app/jobs")}>Go back</Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        <Breadcrumbs>
          <Button component={RouterLink} to={`/app/jobs/${jobId}`} variant="outlined" size="small">
            Back
          </Button>
          <Typography color="text.primary">Edit job</Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4">Edit job</Typography>
            <Typography color="text.secondary">
              Update the role, refine questions, and save when ready.
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {activeStep === 0 ? (
          <Stack spacing={2}>
            <Typography variant="h6">Role details</Typography>
            <TextField label="Job title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Typography variant="subtitle2">Job description (Markdown)</Typography>
              <Button variant="outlined" size="small" onClick={openRawDialog}>
                Generate from plain text
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
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={() => setActiveStep(1)}>
                Continue to questions
              </Button>
              <Button variant="outlined" onClick={() => navigate(`/app/jobs/${jobId}`)}>
                Cancel
              </Button>
            </Box>
          </Stack>
        ) : null}

        {activeStep === 1 ? (
          <Stack spacing={2}>
            <Typography variant="h6">Interview questions</Typography>
            <Typography variant="body2" color="text.secondary">
              Add one question per line (Markdown list).
            </Typography>
            <Box data-color-mode="light">
              <MDEditor
                value={questionsMarkdown}
                onChange={(value) => setQuestionsMarkdown(value ?? "")}
                preview="edit"
                height={260}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} disabled={!questionsMarkdown.trim()}>
                Continue to review
              </Button>
            </Box>
          </Stack>
        ) : null}

        {activeStep === 2 ? (
          <Stack spacing={2}>
            <Typography variant="h6">Review & save</Typography>
            <TextField label="Job title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Typography variant="subtitle2">Description (preview)</Typography>
            <Box data-color-mode="light">
              <MDEditor value={descriptionMarkdown} preview="preview" height={260} />
            </Box>
            <Typography variant="subtitle2">Questions (preview)</Typography>
            <Box data-color-mode="light">
              <MDEditor value={questionsMarkdown} preview="preview" height={200} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </Box>
          </Stack>
        ) : null}
      </Stack>

      <Dialog open={rawDialogOpen} onClose={() => setRawDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Generate Markdown</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Paste the raw job description. AI will generate a structured markdown draft and title.
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
    </>
  );
};

export default JobsEditPage;
