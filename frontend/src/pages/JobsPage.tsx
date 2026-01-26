import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Job } from "../types";

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
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
    <Stack spacing={4}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Jobs
          </Typography>
          <Typography color="text.secondary">Create structured interviews and manage candidate results.</Typography>
        </Box>
        {statusChip}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Active roles</Typography>
            <Button variant="contained" onClick={() => navigate("/app/jobs/new")}>
              Create job
            </Button>
          </Box>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary">Loading jobs...</Typography>
          ) : jobs.length === 0 ? (
            <Typography color="text.secondary">No jobs yet. Create your first role.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{job.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.status}
                      </Typography>
                    </TableCell>
                    <TableCell>{job.description || "No summary yet."}</TableCell>
                    <TableCell>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => navigate(`/app/jobs/${job.id}`)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default JobsPage;
