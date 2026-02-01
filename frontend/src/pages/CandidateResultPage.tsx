import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  const [status, setStatus] = useState<"loading" | "pending" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 40;
  const POLL_INTERVAL_MS = 3000;

  const loadReport = useCallback(async () => {
    if (!jobId || !candidateId) return;
    setError(null);
    try {
      const data = await apiRequest<CandidateResultPayload>(
        `/api/v1/jobs/${jobId}/candidates/${candidateId}/report`,
        { auth: true }
      );
      setPayload(data);
      setStatus("ready");
    } catch (err) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Report not available.");
      } else {
        setStatus("pending");
      }
    }
  }, [jobId, candidateId]);

  useEffect(() => {
    attemptsRef.current = 0;
    setPayload(null);
    setStatus("loading");
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    if (status !== "pending") return;
    const intervalId = window.setInterval(() => {
      loadReport();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadReport, status]);

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

  if (status === "loading" || status === "pending") {
    return (
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography color="text.secondary">Generating report...</Typography>
      </Stack>
    );
  }

  if (status === "error" || !payload) {
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
          <Typography variant="h6">Summary</Typography>
          <Typography>{report.summary || "—"}</Typography>
          <Typography variant="h6">Overall score</Typography>
          <Typography variant="h3">{report.score ?? "—"}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Question &amp; Answer breakdown</Typography>
          {report.qa?.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Answer</TableCell>
                    <TableCell align="right">Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.qa.map((item, index) => (
                    <TableRow key={`${item.question}-${index}`}>
                      <TableCell sx={{ width: "35%" }}>{item.question}</TableCell>
                      <TableCell>{item.answer || "—"}</TableCell>
                      <TableCell align="right">{item.score ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No question/answer data available.</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default CandidateResultPage;
