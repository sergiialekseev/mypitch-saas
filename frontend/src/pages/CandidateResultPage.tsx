import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Snackbar,
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
import { getSessionTranscripts, type SessionTranscript } from "../api/transcripts";
import type { Report } from "../types";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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
  const [conversationOpen, setConversationOpen] = useState(false);
  const [transcripts, setTranscripts] = useState<SessionTranscript[]>([]);
  const [transcriptsStatus, setTranscriptsStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [transcriptsError, setTranscriptsError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
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

  const loadTranscripts = useCallback(async () => {
    if (!payload?.session.id) return;
    setTranscriptsStatus("loading");
    setTranscriptsError(null);
    try {
      const data = await getSessionTranscripts(payload.session.id);
      setTranscripts(data.transcripts || []);
      setTranscriptsStatus("ready");
    } catch (err) {
      setTranscriptsStatus("error");
      setTranscriptsError(err instanceof Error ? err.message : "Transcript not available.");
    }
  }, [payload?.session.id]);

  useEffect(() => {
    if (!conversationOpen) return;
    if (transcriptsStatus === "idle") {
      loadTranscripts();
    }
  }, [conversationOpen, loadTranscripts, transcriptsStatus]);

  const handleCopyConversation = useCallback(async () => {
    if (!transcripts.length) return;
    const text = transcripts
      .map((entry) => `${entry.role === "user" ? "Candidate" : "Interview AI"}: ${entry.text}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyNotice("Conversation copied.");
    } catch (err) {
      setCopyNotice("Copy failed.");
    }
  }, [transcripts]);

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
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4">{payload.candidate.name}</Typography>
          <Typography color="text.secondary">{payload.candidate.email}</Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setConversationOpen(true)}
          sx={{ alignSelf: "center" }}
        >
          View conversation
        </Button>
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
                Report summary
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

      <Dialog open={conversationOpen} onClose={() => setConversationOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Full interview conversation</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          {transcriptsStatus === "loading" ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Loading conversation...</Typography>
            </Stack>
          ) : transcriptsStatus === "error" ? (
            <Alert severity="error">{transcriptsError || "Transcript not available."}</Alert>
          ) : transcripts.length ? (
            <Stack spacing={1.5}>
              {transcripts.map((entry) => {
                const isUser = entry.role === "user";
                return (
                  <Box
                    key={entry.id}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start"
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "78%",
                        px: 2,
                        py: 1.25,
                        borderRadius: 2,
                        backgroundColor: isUser ? "rgba(59, 130, 246, 0.12)" : "rgba(15, 23, 42, 0.06)",
                        border: "1px solid",
                        borderColor: isUser ? "rgba(59, 130, 246, 0.25)" : "rgba(148, 163, 184, 0.25)"
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          fontWeight: 700,
                          color: "text.secondary",
                          fontSize: "0.65rem"
                        }}
                      >
                        {isUser ? "Candidate" : "Interview AI"}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: "0.85rem", lineHeight: 1.4 }}>{entry.text}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary">No conversation data available.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConversationOpen(false)} variant="outlined">
            Close
          </Button>
          <Button
            onClick={handleCopyConversation}
            variant="contained"
            startIcon={<ContentCopyIcon />}
            disabled={!transcripts.length}
          >
            Copy conversation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(copyNotice)}
        autoHideDuration={2500}
        onClose={() => setCopyNotice(null)}
        message={copyNotice || ""}
      />
    </Stack>
  );
};

export default CandidateResultPage;
