import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import LiveSession from "../../components/LiveSession";
import type { Topic } from "../../types";

type SessionContext = {
  session: { id: string; status: string; systemPrompt: string };
  job: { id: string; title: string; description: string; descriptionMarkdown?: string; questions?: string[] };
  candidate: { id: string; name: string; email: string };
};

const CandidateLivePage = () => {
  const { inviteId, sessionId } = useParams();
  const navigate = useNavigate();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContext = async () => {
      if (!sessionId) return;
      setLoading(true);
      setError(null);
      try {
        const payload = await apiRequest<SessionContext>(`/api/v1/sessions/${sessionId}`);
        setContext(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Session not found.");
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [sessionId]);

  const topic = useMemo<Topic | null>(() => {
    if (!context) return null;
    return {
      title: context.job.title,
      description: context.job.description || "",
      systemPrompt: context.session.systemPrompt || ""
    };
  }, [context]);

  if (loading) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography color="text.secondary">Loading session...</Typography>
      </Container>
    );
  }

  if (!sessionId || !context || !topic) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error || "Session not available."}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 8 }} maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4">Interview session</Typography>
        <LiveSession
          topic={topic}
          userName={context.candidate.name}
          sessionId={sessionId}
          onReportReady={() => {
            if (inviteId) {
              navigate(`/c/${inviteId}/report/${sessionId}`);
            }
          }}
        />
      </Stack>
    </Container>
  );
};

export default CandidateLivePage;
