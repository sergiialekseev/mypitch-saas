import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
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
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import type { Report } from "../../types";

const CandidateReportPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<"loading" | "pending" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 40;
  const POLL_INTERVAL_MS = 3000;

  const loadReport = useCallback(async () => {
    if (!sessionId) return;
    try {
      const payload = await apiRequest<{ report: Report }>(`/api/v1/sessions/${sessionId}/report`);
      setReport(payload.report);
      setStatus("ready");
    } catch (err) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setStatus("error");
        setErrorMessage("Report generation is taking longer than expected. Please try again later.");
      } else {
        setStatus("pending");
      }
    }
  }, [sessionId]);

  useEffect(() => {
    attemptsRef.current = 0;
    setReport(null);
    setStatus("loading");
    setErrorMessage(null);
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    if (status !== "pending") return;
    const intervalId = window.setInterval(() => {
      loadReport();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadReport, status]);

  if (!sessionId) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Session not found.</Alert>
      </Container>
    );
  }

  if (status === "loading" || status === "pending") {
    return (
      <Container sx={{ py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Generating your report...</Typography>
        </Stack>
      </Container>
    );
  }

  if (status === "error") {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{errorMessage || "Report not available."}</Alert>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Report not available.</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 8 }} maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Interview report
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Summary</Typography>
            <Typography>{report.summary || "—"}</Typography>
            <Typography variant="h6">Overall decision</Typography>
            {report.overallDecision ? (
              <Chip
                label={report.overallDecision}
                color={report.overallDecision === "Go" ? "success" : report.overallDecision === "Doubt" ? "warning" : "default"}
                variant={report.overallDecision === "No-Go" ? "outlined" : "filled"}
                sx={{ fontSize: 18, px: 1.5, py: 2 }}
              />
            ) : (
              <Typography variant="h4">—</Typography>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Question &amp; Answer breakdown</Typography>
            {report.qa?.length ? (
              <TableContainer>
                <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Answer</TableCell>
                    <TableCell>Decision</TableCell>
                    <TableCell>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.qa.map((item, index) => (
                    <TableRow key={`${item.question}-${index}`}>
                      <TableCell sx={{ width: "30%" }}>{item.question}</TableCell>
                      <TableCell sx={{ width: "35%" }}>{item.answer || "—"}</TableCell>
                      <TableCell sx={{ width: "15%" }}>
                        {item.decision ? (
                          <Chip
                            size="small"
                            label={item.decision}
                            color={item.decision === "Go" ? "success" : item.decision === "Doubt" ? "warning" : "default"}
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
    </Container>
  );
};

export default CandidateReportPage;
