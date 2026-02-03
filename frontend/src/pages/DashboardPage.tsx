import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  GridLegacy as Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Candidate, Invite, Job } from "../types";
import Loader from "../components/ui/Loader";

type CandidateResult = {
  candidateId: string;
  sessionId: string;
  sessionStatus: string;
  reportId?: string | null;
  decision?: "Go" | "Doubt" | "No-Go" | null;
  reportCreatedAt?: string | null;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ jobs: Job[] }>("/api/v1/jobs", { auth: true });
      const jobsList = data.jobs || [];
      setJobs(jobsList);

      const details = await Promise.all(
        jobsList.map((job) =>
          apiRequest<{
            job: Job;
            candidates: Candidate[];
            invites: Invite[];
            candidateResults?: CandidateResult[];
          }>(`/api/v1/jobs/${job.id}`, { auth: true })
        )
      );

      const allCandidates = details.flatMap((item) => item.candidates || []);
      const allInvites = details.flatMap((item) => item.invites || []);
      const allResults = details.flatMap((item) => item.candidateResults || []);

      setCandidates(allCandidates);
      setInvites(allInvites);
      setResults(allResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const jobsByStatus = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const candidatesByStatus = useMemo(() => {
    return candidates.reduce<Record<string, number>>((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {});
  }, [candidates]);

  const reportsReady = results.filter((result) => result.reportId).length;
  const decisionCounts = results.reduce<Record<string, number>>((acc, result) => {
    if (result.decision) {
      acc[result.decision] = (acc[result.decision] || 0) + 1;
    }
    return acc;
  }, {});
  const goDecisions = decisionCounts.Go || 0;

  const jobById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const candidateById = useMemo(() => new Map(candidates.map((candidate) => [candidate.id, candidate])), [candidates]);

  const recentInvites = useMemo(() => {
    return [...candidates]
      .filter((candidate) => candidate.createdAt)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4);
  }, [candidates]);

  const recentReports = useMemo(() => {
    return [...results]
      .filter((result) => result.reportCreatedAt)
      .sort(
        (a, b) =>
          new Date(b.reportCreatedAt || 0).getTime() - new Date(a.reportCreatedAt || 0).getTime()
      )
      .slice(0, 4);
  }, [results]);

  if (loading) {
    return <Loader variant="page" label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={loadDashboard}>
          Retry
        </Button>
      </Stack>
    );
  }

  const pipelineCounts = {
    invited: candidatesByStatus.invited || 0,
    started: candidatesByStatus.started || 0,
    completed: candidatesByStatus.completed || 0
  };
  const funnelSteps = [
    { label: "Invited", count: pipelineCounts.invited },
    { label: "Started", count: pipelineCounts.started },
    { label: "Completed", count: pipelineCounts.completed }
  ];
  const funnelMax = Math.max(...funnelSteps.map((step) => step.count), 1);

  return (
    <Stack spacing={4}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Overview
          </Typography>
          <Typography color="text.secondary">
            High-level hiring activity for your team.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={() => navigate("/app/jobs/new")}>
            Create job
          </Button>
          <Button variant="outlined" onClick={() => navigate("/app/jobs")}>
            Review jobs
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: "Open roles", value: jobsByStatus.open || 0, icon: <PersonSearchIcon color="primary" /> },
          { label: "Invites sent", value: invites.length, icon: <TrendingUpIcon color="primary" /> },
          { label: "Reports ready", value: reportsReady, icon: <CheckCircleIcon color="primary" /> },
          { label: "Go decisions", value: goDecisions, icon: <AutoGraphIcon color="primary" /> }
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(135deg, rgba(17, 24, 39, 0.02), rgba(59, 130, 246, 0.06))"
              }}
            >
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>{stat.icon}</Box>
                  <Chip size="small" label="Last 30 days" variant="outlined" />
                </Box>
                <Typography variant="h5">{stat.value}</Typography>
                <Typography color="text.secondary">{stat.label}</Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Pipeline snapshot</Typography>
              {pipelineCounts.invited + pipelineCounts.started + pipelineCounts.completed > 0 ? (
                <Stack spacing={1.5}>
                  {funnelSteps.map((stage, index) => {
                    const width = `${Math.max((stage.count / funnelMax) * 100, 20)}%`;
                    const tone =
                      index === 0
                        ? "rgba(59, 130, 246, 0.18)"
                        : index === 1
                        ? "rgba(59, 130, 246, 0.12)"
                        : "rgba(59, 130, 246, 0.08)";
                    return (
                      <Box key={stage.label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 110 }}>
                          <Typography variant="subtitle2">{stage.label}</Typography>
                          <Typography variant="h6">{stage.count}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              height: 44,
                              width,
                              minWidth: 140,
                              borderRadius: 3,
                              border: "1px solid",
                              borderColor: "divider",
                              background: tone
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary">No candidate activity yet.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Recent activity</Typography>
              <Stack spacing={1.5}>
                {recentReports.length === 0 && recentInvites.length === 0 ? (
                  <Typography color="text.secondary">No activity yet.</Typography>
                ) : (
                  <>
                    {recentReports.map((report) => {
                      const candidate = candidateById.get(report.candidateId);
                      const jobTitle = candidate ? jobById.get(candidate.jobId)?.title : null;
                      return (
                        <Box key={report.sessionId} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Chip size="small" label="Report" />
                          <Typography variant="body2">
                            {candidate?.name || "Candidate"} decision {report.decision ?? "—"} in {jobTitle || "a role"}
                          </Typography>
                        </Box>
                      );
                    })}
                    {recentInvites.map((candidate) => {
                      const jobTitle = jobById.get(candidate.jobId)?.title;
                      return (
                        <Box key={candidate.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Chip size="small" label="Invite" />
                          <Typography variant="body2">
                            {candidate.name} invited to {jobTitle || "a role"}
                          </Typography>
                        </Box>
                      );
                    })}
                  </>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default DashboardPage;
