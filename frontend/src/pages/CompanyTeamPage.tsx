import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import TableCard from "../components/ui/TableCard";
import {
  createCompanyInvite,
  getCompany,
  listCompanyInvites,
  resendCompanyInvite,
  revokeCompanyInvite,
  type CompanyInvite,
  type CompanyInfo
} from "../api/companyInvites";

const CompanyTeamPage = () => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [invites, setInvites] = useState<CompanyInvite[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [companyRes, invitesRes] = await Promise.all([getCompany(), listCompanyInvites()]);
      setCompany(companyRes.company);
      setInvites(invitesRes.invites || []);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load team data.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await createCompanyInvite(email);
      setInvites((prev) => [response.invite, ...prev]);
      setEmail("");
      setActionSuccess("Invite sent.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send invite.");
    }
  };

  const handleCopy = async (link?: string) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setActionSuccess("Invite link copied.");
    } catch {
      setActionError("Failed to copy invite link.");
    }
  };

  const handleResend = async (inviteId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await resendCompanyInvite(inviteId);
      setActionSuccess("Invite resent.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to resend invite.");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await revokeCompanyInvite(inviteId);
      setInvites((prev) => prev.map((invite) => (invite.id === inviteId ? { ...invite, status: "revoked" } : invite)));
      setActionSuccess("Invite revoked.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to revoke invite.");
    }
  };

  if (status === "loading") {
    return (
      <Stack spacing={2} sx={{ py: 4 }}>
        <Typography color="text.secondary">Loading team workspace...</Typography>
      </Stack>
    );
  }

  if (status === "error") {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || "Unable to load team workspace."}</Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Team</Typography>
        <Typography color="text.secondary">
          Invite teammates to join {company?.name || "your company"}.
        </Typography>
      </Box>

      <TableCard
        title="Invite teammates"
        subtitle={company?.website || "Use company emails only."}
        action={
          <Button variant="outlined" size="small" onClick={loadData}>
            Refresh
          </Button>
        }
      >
        <Stack spacing={2}>
          {actionError ? <Alert severity="error">{actionError}</Alert> : null}
          {actionSuccess ? <Alert severity="success">{actionSuccess}</Alert> : null}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Work email"
              placeholder={`name@${company?.domains?.[0] || "company.com"}`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              sx={{ flex: 1, minWidth: 240 }}
            />
            <Button variant="contained" onClick={handleInvite} disabled={!email.trim()}>
              Send invite
            </Button>
          </Box>
        </Stack>
      </TableCard>

      <TableCard title="Pending & recent invites" subtitle="Invites expire automatically.">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    <Chip label={invite.status} size="small" />
                  </TableCell>
                  <TableCell>{invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy invite link">
                      <span>
                        <IconButton size="small" onClick={() => handleCopy(invite.link)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Resend invite">
                      <span>
                        <IconButton size="small" onClick={() => handleResend(invite.id)}>
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Revoke invite">
                      <span>
                        <IconButton size="small" onClick={() => handleRevoke(invite.id)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">No invites yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </TableCard>
    </Stack>
  );
};

export default CompanyTeamPage;
