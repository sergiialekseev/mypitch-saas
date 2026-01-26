import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { apiRequest } from "../api/client";
import type { Job } from "../types";

const JobsCreatePage = () => {
  const [title, setTitle] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [questionsMarkdown, setQuestionsMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setError(null);
    if (!rawDraft.trim()) {
      setError("Paste the job description before generating markdown.");
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
      setError(err instanceof Error ? err.message : "Could not generate markdown.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Add a job title to continue.");
      return;
    }
    if (!descriptionMarkdown.trim()) {
      setError("Generate markdown before saving.");
      return;
    }

    setSaving(true);
    try {
      const resolvedRaw = rawDescription.trim() ? rawDescription : descriptionMarkdown;
      const data = await apiRequest<{ job: Job }>("/api/v1/jobs", {
        method: "POST",
        auth: true,
        body: {
          title,
          rawDescription: resolvedRaw,
          descriptionMarkdown,
          questionsMarkdown
        }
      });
      navigate(`/app/jobs/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container sx={{ py: 6 }} maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Create a new job
          </Typography>
          <Typography color="text.secondary">Drop the raw description, generate markdown, and fine-tune.</Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField label="Job title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Button variant="outlined" onClick={() => setRawDialogOpen(true)}>
                Convert from plain text
              </Button>
              <Typography variant="body2" color="text.secondary">
                Paste raw text to generate clean markdown with Gemini.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Markdown editor</Typography>
            <Box data-color-mode="light">
              <MDEditor
                value={descriptionMarkdown}
                onChange={(value) => setDescriptionMarkdown(value ?? "")}
                preview="edit"
                height={360}
              />
            </Box>
            <Divider />
            <Typography variant="h6">Interview questions (Markdown list)</Typography>
            <Box data-color-mode="light">
              <MDEditor
                value={questionsMarkdown}
                onChange={(value) => setQuestionsMarkdown(value ?? "")}
                preview="edit"
                height={220}
              />
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save job"}
          </Button>
          <Button variant="outlined" onClick={() => navigate("/app/jobs")}>
            Cancel
          </Button>
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
    </Container>
  );
};

export default JobsCreatePage;
