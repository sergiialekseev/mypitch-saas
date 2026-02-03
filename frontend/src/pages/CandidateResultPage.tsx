import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
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
        <Button component={RouterLink} to="/app/jobs" variant="outlined" size="small">
          Back
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
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
        <Typography color="text.secondary">Generating report...</Typography>
      </Stack>
    );
  }

  if (status === "error" || !payload) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error">{error || "Report not found."}</Alert>
      </Box>
    );
  }

  const report = payload.report || {};
  const decisionTone = (decision?: string | null) => {
    if (decision === "Go") return "success";
    if (decision === "Doubt") return "warning";
    if (decision === "No-Go") return "default";
    return "default";
  };
  const decisionRowStyle = (decision?: string | null) => {
    switch (decision) {
      case "Go":
        return "rgba(34, 197, 94, 0.08)";
      case "Doubt":
        return "rgba(245, 158, 11, 0.08)";
      case "No-Go":
        return "rgba(148, 163, 184, 0.08)";
      default:
        return "transparent";
    }
  };

  return (
    <Stack spacing={3}>
      {breadcrumbs}
      <Box>
        <Typography variant="h4">{payload.candidate.name}</Typography>
        <Typography color="text.secondary">{payload.candidate.email}</Typography>
      </Box>

      <Paper
        sx={{
          p: 3,
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
          border: "1px solid rgba(148, 163, 184, 0.25)",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          color: "rgba(248,250,252,0.9)"
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 4fr) minmax(200px, 1fr)",
              gap: 2,
              alignItems: "start"
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: "inherit" }}>
                Summary
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mt: 1, whiteSpace: "normal", color: "inherit" }}
                title={report.summary || "—"}
              >
                {report.summary || "—"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: "inherit" }}>
                Recommendation
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "white",
                  backgroundColor:
                    report.overallDecision === "Go"
                      ? "#16a34a"
                      : report.overallDecision === "No-Go"
                      ? "#dc2626"
                      : report.overallDecision === "Doubt"
                      ? "#f59e0b"
                      : "rgba(148, 163, 184, 0.3)"
                }}
              >
                {report.overallDecision || "—"}
              </Box>
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, overflow: "hidden" }}>
        <Stack spacing={2}>
          <Typography variant="h6">Question &amp; Answer breakdown</Typography>
          {report.qa?.length ? (
            <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
              <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "22%" }}>Question</TableCell>
                    <TableCell sx={{ width: "33%" }}>Answer</TableCell>
                    <TableCell sx={{ width: "12%" }}>Decision</TableCell>
                    <TableCell sx={{ width: "33%" }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.qa.map((item, index) => (
                    <TableRow
                      key={`${item.question}-${index}`}
                      sx={{
                        backgroundColor: decisionRowStyle(item.decision),
                        "& td": { borderBottomColor: "rgba(148, 163, 184, 0.2)" }
                      }}
                    >
                      <TableCell>{item.question}</TableCell>
                      <TableCell>{item.answer || "—"}</TableCell>
                      <TableCell>
                        {item.decision ? (
                          <Chip
                            size="small"
                            label={item.decision}
                            color={decisionTone(item.decision)}
                            variant={item.decision === "No-Go" ? "outlined" : "filled"}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{item.note || "—"}</TableCell>
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
