import { useEffect, useState } from "react";
import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import type { Report } from "../../types";

const CandidateReportPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!sessionId) return;
      try {
        const payload = await apiRequest<{ report: Report }>(`/api/v1/sessions/${sessionId}/report`);
        setReport(payload.report);
      } catch (err) {
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Session not found.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography color="text.secondary">Loading report...</Typography>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Report pending
          </Typography>
          <Typography color="text.secondary">
            Your interview feedback is being prepared. You can refresh this page later.
          </Typography>
        </Paper>
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
          {report.score !== undefined ? (
            <Typography color="text.secondary">Score: {report.score}/100</Typography>
          ) : null}
        </Box>

        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            {report.summary ? <Typography>{report.summary}</Typography> : null}
            {report.psychological_analysis ? (
              <Typography color="text.secondary">{report.psychological_analysis}</Typography>
            ) : null}
            {report.feedback_items && report.feedback_items.length > 0 ? (
              <Stack spacing={2}>
                {report.feedback_items.map((item, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2">{item.type}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.original_phrase}
                    </Typography>
                    <Typography>{item.better_version}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.explanation}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : null}
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default CandidateReportPage;
