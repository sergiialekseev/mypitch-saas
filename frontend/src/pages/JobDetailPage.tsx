import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Chip,
  Container,
  Drawer,
  TableSortLabel,
  Menu,
  MenuItem,
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
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { apiRequest } from "../api/client";
import type { Candidate, Invite, Job } from "../types";
import InviteCandidatesPanel from "../components/candidates/InviteCandidatesPanel";
import Loader from "../components/ui/Loader";
import TableCard from "../components/ui/TableCard";

type CandidateResult = {
  candidateId: string;
  sessionId: string;
  sessionStatus: string;
  reportId?: string | null;
  score?: number | null;
  reportCreatedAt?: string | null;
};

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [actionCandidateId, setActionCandidateId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "status" | "report" | "score">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const candidateNameRef = useRef<HTMLInputElement | null>(null);
  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
  const statusMenuOpen = Boolean(statusAnchorEl);
  const actionMenuOpen = Boolean(actionAnchorEl);

  const jobStatuses = [
    { value: "open", label: "Open" },
    { value: "paused", label: "Paused" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" }
  ] as const;

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{
        job: Job;
        candidates: Candidate[];
        invites: Invite[];
        candidateResults?: CandidateResult[];
      }>(
        `/api/v1/jobs/${jobId}`,
        { auth: true }
      );
      setJob(data.job);
      setCandidates(data.candidates || []);
      setInvites(data.invites || []);
      setCandidateResults(data.candidateResults || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (inviteDrawerOpen) {
      candidateNameRef.current?.focus();
    }
  }, [inviteDrawerOpen]);

  const inviteByCandidate = useMemo(() => {
    return new Map(invites.map((invite) => [invite.candidateId, invite]));
  }, [invites]);

  const resultByCandidate = useMemo(() => {
    return new Map(candidateResults.map((result) => [result.candidateId, result]));
  }, [candidateResults]);

  const sortedCandidates = useMemo(() => {
    const copy = [...candidates];
    copy.sort((a, b) => {
      const resultA = resultByCandidate.get(a.id);
      const resultB = resultByCandidate.get(b.id);
      const reportA = resultA?.reportId ? 1 : 0;
      const reportB = resultB?.reportId ? 1 : 0;
      const scoreA = resultA?.score ?? -1;
      const scoreB = resultB?.score ?? -1;

      let compare = 0;
      switch (sortKey) {
        case "name":
          compare = a.name.localeCompare(b.name);
          break;
        case "status":
          compare = a.status.localeCompare(b.status);
          break;
        case "report":
          compare = reportA - reportB;
          break;
        case "score":
          compare = scoreA - scoreB;
          break;
        default:
          compare = 0;
      }
      return sortDirection === "asc" ? compare : -compare;
    });
    return copy;
  }, [candidates, resultByCandidate, sortKey, sortDirection]);

  const handleCreateCandidate = async (payload: { name: string; email: string }) => {
    if (!jobId) return;
    const data = await apiRequest<{ candidate: Candidate; invite: Invite }>(`/api/v1/jobs/${jobId}/candidates`, {
      method: "POST",
      auth: true,
      body: payload
    });
    setCandidates((prev) => [data.candidate, ...prev]);
    setInvites((prev) => [data.invite, ...prev]);
  };


  const handleCopy = async (invite: Invite) => {
    const inviteUrl = new URL(`/c/${invite.id}`, publicAppUrl).toString();
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handlePreview = () => {
    if (!job) return;
    window.open(`/preview/jobs/${job.id}`, "_blank", "noopener,noreferrer");
  };

  const openInviteDrawer = () => setInviteDrawerOpen(true);
  const handleStatusMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };
  const handleStatusMenuClose = () => setStatusAnchorEl(null);

  const handleStatusChange = async (newStatus: Job["status"]) => {
    if (!jobId || !job || job.status === newStatus) return;
    setStatusError(null);
    setStatusUpdating(true);
    const prevJob = job;
    setJob({ ...job, status: newStatus });
    try {
      const data = await apiRequest<{ job: Job }>(`/api/v1/jobs/${jobId}`, {
        method: "PUT",
        auth: true,
        body: { status: newStatus }
      });
      setJob(data.job);
    } catch (err) {
      setJob(prevJob);
      setStatusError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setStatusUpdating(false);
      handleStatusMenuClose();
    }
  };

  const handleActionMenuOpen = (event: MouseEvent<HTMLElement>, candidateId: string) => {
    setActionAnchorEl(event.currentTarget);
    setActionCandidateId(candidateId);
  };
  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
    setActionCandidateId(null);
  };

  const handleSort = (key: "name" | "status" | "report" | "score") => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  if (loading) {
    return (
      <Loader variant="page" label="Loading job..." />
    );
  }

  if (!job) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Job not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/app")}>Go back</Button>
      </Container>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        <Breadcrumbs>
          <Button component={RouterLink} to="/app/jobs" variant="outlined" size="small">
            Back
          </Button>
          <Typography color="text.primary">{job.title}</Typography>
        </Breadcrumbs>
        {statusError ? <Alert severity="error">{statusError}</Alert> : null}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h4">{job.title}</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleStatusMenuOpen}
                endIcon={<ArrowDropDownIcon />}
                disabled={statusUpdating}
              >
                {jobStatuses.find((status) => status.value === job.status)?.label || job.status}
              </Button>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" onClick={openInviteDrawer}>
              Invite candidates
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/app/jobs/${job.id}/edit`)}>
              Edit job
            </Button>
            <Button variant="outlined" onClick={handlePreview}>
              Preview
            </Button>
          </Stack>
        </Box>

        <TableCard title="Candidates">
          {candidates.length === 0 ? (
            <Typography color="text.secondary">No candidates yet.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={sortKey === "name" ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === "name"}
                        direction={sortKey === "name" ? sortDirection : "asc"}
                        onClick={() => handleSort("name")}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell sortDirection={sortKey === "status" ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === "status"}
                        direction={sortKey === "status" ? sortDirection : "asc"}
                        onClick={() => handleSort("status")}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={sortKey === "score" ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === "score"}
                        direction={sortKey === "score" ? sortDirection : "asc"}
                        onClick={() => handleSort("score")}
                      >
                        Score
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={sortKey === "report" ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === "report"}
                        direction={sortKey === "report" ? sortDirection : "asc"}
                        onClick={() => handleSort("report")}
                      >
                        Report
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCandidates.map((candidate) => {
                    const result = resultByCandidate.get(candidate.id);
                    const scoreValue = result?.score ?? null;
                    return (
                      <TableRow key={candidate.id} hover>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>
                          <Chip label={candidate.status} variant="outlined" size="small" />
                        </TableCell>
                        <TableCell>{scoreValue === null ? "-" : scoreValue}</TableCell>
                        <TableCell>
                          <Chip
                            label={result?.reportId ? "Ready" : "Pending"}
                            color={result?.reportId ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <ButtonGroup variant="outlined" size="small">
                              <Button
                                disabled={!result?.reportId}
                                onClick={() => navigate(`/app/jobs/${job.id}/candidates/${candidate.id}`)}
                              >
                                View report
                              </Button>
                              <Button
                                size="small"
                                aria-controls={actionMenuOpen ? "candidate-actions-menu" : undefined}
                                aria-haspopup="menu"
                                aria-expanded={actionMenuOpen ? "true" : undefined}
                                onClick={(event) => handleActionMenuOpen(event, candidate.id)}
                              >
                                <ArrowDropDownIcon fontSize="small" />
                              </Button>
                            </ButtonGroup>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TableCard>
      </Stack>

      <Menu
        id="status-menu"
        anchorEl={statusAnchorEl}
        open={statusMenuOpen}
        onClose={handleStatusMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {jobStatuses.map((status) => (
          <MenuItem
            key={status.value}
            selected={job.status === status.value}
            onClick={() => handleStatusChange(status.value)}
          >
            {status.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        id="candidate-actions-menu"
        anchorEl={actionAnchorEl}
        open={actionMenuOpen}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem
          disabled={!actionCandidateId || !resultByCandidate.get(actionCandidateId)?.reportId}
          onClick={() => {
            if (!actionCandidateId) return;
            navigate(`/app/jobs/${job.id}/candidates/${actionCandidateId}`);
            handleActionMenuClose();
          }}
        >
          View report
        </MenuItem>
        <MenuItem
          disabled={!actionCandidateId || !inviteByCandidate.get(actionCandidateId)}
          onClick={async () => {
            if (!actionCandidateId) return;
            const invite = inviteByCandidate.get(actionCandidateId);
            if (!invite) return;
            await handleCopy(invite);
            handleActionMenuClose();
          }}
        >
          {actionCandidateId && inviteByCandidate.get(actionCandidateId) && copiedInviteId === inviteByCandidate.get(actionCandidateId)?.id
            ? "Copied invite link"
            : "Copy invite link"}
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: "45vw" }, p: { xs: 3, md: 4 } } }}
      >
        <Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <InviteCandidatesPanel
            jobId={jobId}
            canInvite={Boolean(job?.questions?.length)}
            onCreateCandidate={handleCreateCandidate}
            onError={setError}
            candidateNameRef={candidateNameRef}
          />
        </Stack>
      </Drawer>
    </>
  );
};

export default JobDetailPage;
