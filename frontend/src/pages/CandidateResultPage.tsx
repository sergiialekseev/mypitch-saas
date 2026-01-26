import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Report } from "../types";

type CandidateResultPayload = {
  job: { id: string; title: string };
  candidate: { id: string; name: string; email: string };
  session: { id: string; status: string; startedAt?: string | null; endedAt?: string | null };
  report: Report;
};

const CandidateResultPage = () => {
  const { jobId, candidateId } = useParams();
  const [payload, setPayload] = useState<CandidateResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!jobId || !candidateId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<CandidateResultPayload>(
          `/api/v1/jobs/${jobId}/candidates/${candidateId}/report`,
          { auth: true }
        );
        setPayload(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Report not available.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [jobId, candidateId]);

  const breadcrumbs = useMemo(() => {
    return (
      <Breadcrumbs>
        <Button component={RouterLink} to="/app/jobs">
          Jobs
        </Button>
        {jobId ? (
          <Button component={RouterLink} to={`/app/jobs/${jobId}`}>
            {payload?.job.title || "Job"}
          </Button>
        ) : null}
        <Typography color="text.primary">Candidate results</Typography>
      </Breadcrumbs>
    );
  }, [jobId, payload?.job.title]);

  if (loading) {
    return <Typography color="text.secondary">Loading report...</Typography>;
  }

  if (!payload) {
    return <Alert severity="error">{error || "Report not found."}</Alert>;
  }

  const report = payload.report || {};

  return (
    <Stack spacing={3}>
      {breadcrumbs}
      <Box>
        <Typography variant="h4">{payload.candidate.name}</Typography>
        <Typography color="text.secondary">{payload.candidate.email}</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Session summary</Typography>
          <Typography color="text.secondary">Role: {payload.job.title}</Typography>
          <Typography color="text.secondary">Status: {payload.session.status}</Typography>
          <Divider />
          <Typography variant="h6">Score</Typography>
          <Typography variant="h3">{report.score ?? "—"}</Typography>
          {report.summary ? <Typography>{report.summary}</Typography> : null}
          {report.psychological_analysis ? (
            <Typography color="text.secondary">{report.psychological_analysis}</Typography>
          ) : null}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Feedback highlights</Typography>
          {report.feedback_items?.length ? (
            report.feedback_items.map((item, index) => (
              <Box key={`${item.original_phrase}-${index}`}>
                <Typography variant="subtitle2">{item.original_phrase}</Typography>
                <Typography color="text.secondary">{item.better_version}</Typography>
                {item.explanation ? <Typography variant="body2">{item.explanation}</Typography> : null}
                <Divider sx={{ my: 1 }} />
              </Box>
            ))
          ) : (
            <Typography color="text.secondary">No feedback available.</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default CandidateResultPage;
