import { useEffect, useState } from "react";
import { Alert, Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { apiRequest } from "../api/client";

type JobPreview = {
  id: string;
  title: string;
  descriptionMarkdown: string;
  questionsMarkdown: string;
};

const JobPreviewPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState<JobPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    const loadJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ job: JobPreview }>(`/api/v1/jobs/${jobId}/preview`);
        if (active) {
          setJob(data.job);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load job preview.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadJob();
    return () => {
      active = false;
    };
  }, [jobId]);

  if (loading) {
    return (
      <Container sx={{ py: 6 }} maxWidth="md">
        <Typography color="text.secondary">Loading job preview...</Typography>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container sx={{ py: 6 }} maxWidth="md">
        <Alert severity="error">{error || "Job not found."}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 6 }} maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary">
            Public preview
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Job description
          </Typography>
          <Box data-color-mode="light">
            <MarkdownPreview source={job.descriptionMarkdown || ""} />
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Interview questions
          </Typography>
          <Box data-color-mode="light">
            <MarkdownPreview source={job.questionsMarkdown || ""} />
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
};

export default JobPreviewPage;
