import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Job } from "../types";

const RecruiterDashboardPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ jobs: Job[] }>("/api/v1/jobs", { auth: true });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const response = await fetch(`${baseUrl}/api/health`);
        setStatus(response.ok ? "online" : "degraded");
      } catch (err) {
        setStatus("offline");
      }
    };

    loadStatus();
  }, []);

  const handleCreate = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Add a job title to continue.");
      return;
    }

    try {
      const data = await apiRequest<{ job: Job }>("/api/v1/jobs", {
        method: "POST",
        auth: true,
        body: {
          title,
          description
        }
      });
      setJobs((prev) => [data.job, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job.");
    }
  };

  const statusChip = useMemo(() => {
    if (status === "online") {
      return <Chip label="API Online" color="success" size="small" />;
    }
    if (status === "degraded") {
      return <Chip label="API Degraded" color="warning" size="small" />;
    }
    return <Chip label="API Offline" color="default" size="small" />;
  }, [status]);

  return (
    <Container sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h3" gutterBottom>
              Jobs
            </Typography>
            <Typography color="text.secondary">Create interview jobs and send candidate links.</Typography>
          </Box>
          {statusChip}
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Create a job</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack spacing={2}>
              <TextField label="Job title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <TextField
                label="Job description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={3}
              />
              <Box>
                <Button variant="contained" onClick={handleCreate}>
                  Create job
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Active jobs
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Loading jobs...</Typography>
          ) : jobs.length === 0 ? (
            <Typography color="text.secondary">No jobs yet. Create your first role above.</Typography>
          ) : (
            <Stack spacing={2}>
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent>
                    <Typography variant="h6">{job.title}</Typography>
                    <Typography color="text.secondary">{job.description || "No description yet."}</Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end" }}>
                    <Button onClick={() => navigate(`/app/jobs/${job.id}`)} variant="outlined">
                      Manage candidates
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
};

export default RecruiterDashboardPage;
