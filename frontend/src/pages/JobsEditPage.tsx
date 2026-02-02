import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
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
import { DEFAULT_LANGUAGE, QUESTION_PRESETS } from "../constants/questionPresets";
import type { Job } from "../types";
import Loader from "../components/ui/Loader";

const steps = ["Interview language", "Interview questions", "Job description", "Review & save"];

const JobsEditPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
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
      setLanguage(data.job.language || "");
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
    const loadLanguages = async () => {
      setLanguagesLoading(true);
      setLanguagesError(null);
      try {
        const data = await apiRequest<{ languages: string[]; defaultLanguage: string }>("/api/v1/meta/languages", {
          auth: true
        });
        setLanguages(data.languages || []);
        setLanguage((prev) => prev || data.defaultLanguage || "");
      } catch (err) {
        setLanguagesError(err instanceof Error ? err.message : "Could not load languages.");
      } finally {
        setLanguagesLoading(false);
      }
    };
    loadLanguages();
  }, []);

  const resolvedLanguageKey =
    language in QUESTION_PRESETS ? (language as keyof typeof QUESTION_PRESETS) : DEFAULT_LANGUAGE;
  const questionSuggestions = QUESTION_PRESETS[resolvedLanguageKey];

  const appendQuestions = (items: readonly string[]) => {
    if (!items.length) return;
    setQuestionsMarkdown((prev) => {
      const base = prev.trimEnd();
      const prefix = base ? `${base}\n` : "";
      const next = items.map((item) => `- ${item}`).join("\n");
      return `${prefix}${next}`.trimEnd();
    });
  };

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
          language,
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
            <Typography variant="body2" color="text.secondary">
              Choose the language the AI should use for the entire interview.
            </Typography>
            {languagesError ? <Alert severity="error">{languagesError}</Alert> : null}
            {languagesLoading ? (
              <Typography color="text.secondary">Loading languages...</Typography>
            ) : (
              <FormControl>
                <FormLabel>Language</FormLabel>
                <RadioGroup value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {languages.map((lang) => (
                    <FormControlLabel key={lang} value={lang} control={<Radio />} label={lang} />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate(`/app/jobs/${jobId}`)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (!language) {
                    setError("Select an interview language to continue.");
                    return;
                  }
                  setError(null);
                  setActiveStep(1);
                }}
                disabled={languagesLoading || !language}
              >
                Continue
              </Button>
            </Box>
          </Stack>
        ) : null}

        {activeStep === 1 ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Add one question per line (Markdown list).
            </Typography>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Suggested questions</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {questionSuggestions.chips.map((question) => (
                  <Chip
                    key={question}
                    label={question}
                    onClick={() => appendQuestions([question])}
                    size="medium"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            </Stack>
            <Box data-color-mode="light">
              <MDEditor
                className="job-markdown-editor"
                value={questionsMarkdown}
                onChange={(value) => setQuestionsMarkdown(value ?? "")}
                preview="live"
                height={260}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} disabled={!questionsMarkdown.trim()}>
                Continue to description
              </Button>
            </Box>
          </Stack>
        ) : null}

        {activeStep === 2 ? (
          <Stack spacing={2}>
            <TextField
              label="Job title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              sx={{ "& .MuiInputBase-root": { backgroundColor: "background.paper" } }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Typography variant="subtitle2">Job description (Markdown)</Typography>
              <Button variant="outlined" size="small" onClick={openRawDialog}>
                Generate from plain text
              </Button>
            </Stack>
            <Box data-color-mode="light">
              <MDEditor
                className="job-markdown-editor"
                value={descriptionMarkdown}
                onChange={(value) => setDescriptionMarkdown(value ?? "")}
                preview="live"
                height={360}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(3)} disabled={!descriptionMarkdown.trim()}>
                Continue to review
              </Button>
            </Box>
          </Stack>
        ) : null}

        {activeStep === 3 ? (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Job title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                sx={{ flex: 1, minWidth: 260, "& .MuiInputBase-root": { backgroundColor: "background.paper" } }}
              />
              <FormControl sx={{ minWidth: 220 }} fullWidth>
                <InputLabel id="job-language-select-label">Interview language</InputLabel>
                <Select
                  labelId="job-language-select-label"
                  id="job-language-select"
                  value={language}
                  label="Interview language"
                  onChange={(event) => setLanguage(event.target.value)}
                  sx={{ backgroundColor: "background.paper" }}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Typography variant="subtitle2">Description (edit)</Typography>
            <Box data-color-mode="light">
              <MDEditor
                className="job-markdown-editor"
                value={descriptionMarkdown}
                onChange={(value) => setDescriptionMarkdown(value ?? "")}
                preview="live"
                height={260}
              />
            </Box>
            <Typography variant="subtitle2">Questions (edit)</Typography>
            <Box data-color-mode="light">
              <MDEditor
                className="job-markdown-editor"
                value={questionsMarkdown}
                onChange={(value) => setQuestionsMarkdown(value ?? "")}
                preview="live"
                height={200}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(2)}>
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
              rows={10}
              sx={{ "& .MuiInputBase-root": { backgroundColor: "background.paper" } }}
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
