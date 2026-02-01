import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import Loader from "../components/ui/Loader";
import TableCard from "../components/ui/TableCard";

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <Stack spacing={4}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Jobs
          </Typography>
          <Typography color="text.secondary">Create structured interviews and manage candidate results.</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate("/app/jobs/new")}>
          Create job
        </Button>
      </Box>

      <TableCard title="Active roles">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Loader variant="section" label="Loading jobs..." />
        ) : jobs.length === 0 ? (
          <Typography color="text.secondary">No jobs yet. Create your first role.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{job.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={job.status} variant="outlined" size="small" />
                  </TableCell>
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
      </TableCard>
    </Stack>
  );
};

export default JobsPage;
