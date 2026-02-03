import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import {
  getCompanyProfile,
  getRecruiterProfile,
  updateCompanyProfile,
  updateRecruiterProfile,
  type CompanyProfile,
  type RecruiterProfile
} from "../api/companyProfile";

const CompanySettingsPage = () => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterTitle, setRecruiterTitle] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [companyRes, recruiterRes] = await Promise.all([getCompanyProfile(), getRecruiterProfile()]);
      setCompany(companyRes.company);
      setRecruiter(recruiterRes.recruiter);
      setCompanyName(companyRes.company.name || "");
      setCompanyWebsite(companyRes.company.website || "");
      setCompanyLogo(companyRes.company.logoUrl || "");
      setRecruiterName(recruiterRes.recruiter.name || "");
      setRecruiterTitle(recruiterRes.recruiter.title || "");
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveCompany = async () => {
    setSaveMessage(null);
    try {
      const response = await updateCompanyProfile({
        name: companyName,
        website: companyWebsite,
        logoUrl: companyLogo
      });
      setCompany(response.company);
      setSaveMessage("Company profile updated.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to update company.");
    }
  };

  const handleSaveRecruiter = async () => {
    setSaveMessage(null);
    try {
      const response = await updateRecruiterProfile({
        name: recruiterName,
        title: recruiterTitle
      });
      setRecruiter(response.recruiter);
      setSaveMessage("Your profile updated.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to update profile.");
    }
  };

  if (status === "loading") {
    return (
      <Stack spacing={2} sx={{ py: 4 }}>
        <Typography color="text.secondary">Loading settings...</Typography>
      </Stack>
    );
  }

  if (status === "error") {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || "Unable to load settings."}</Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography color="text.secondary">Manage company and recruiter profile details.</Typography>
      </Box>

      {saveMessage ? <Alert severity="info">{saveMessage}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Company profile</Typography>
          <TextField
            label="Company name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />
          <TextField
            label="Company website"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
            required
          />
          <TextField
            label="Company logo URL"
            value={companyLogo}
            onChange={(event) => setCompanyLogo(event.target.value)}
            helperText="Paste a hosted logo URL (SVG/PNG)."
          />
          <Button variant="contained" onClick={handleSaveCompany}>
            Save company
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Your profile</Typography>
          <TextField
            label="Full name"
            value={recruiterName}
            onChange={(event) => setRecruiterName(event.target.value)}
          />
          <TextField
            label="Title"
            value={recruiterTitle}
            onChange={(event) => setRecruiterTitle(event.target.value)}
          />
          <Button variant="contained" onClick={handleSaveRecruiter}>
            Save profile
          </Button>
        </Stack>
      </Paper>

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Company ID: {company?.id || "—"} • Recruiter ID: {recruiter?.id || "—"}
      </Typography>
    </Stack>
  );
};

export default CompanySettingsPage;
