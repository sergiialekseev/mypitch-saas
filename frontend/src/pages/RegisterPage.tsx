import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../api/client";

const RegisterPage = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const blockedDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "yandex.com",
    "yandex.ru",
    "mail.ru",
    "gmx.com",
    "gmx.de",
    "zoho.com",
    "qq.com",
    "163.com",
    "126.com",
    "live.com",
    "msn.com"
  ]);

  const validateCompanyForm = () => {
    if (!companyName.trim()) {
      setError("Company name is required.");
      return false;
    }
    if (!companyWebsite.trim()) {
      setError("Company website is required.");
      return false;
    }
    return true;
  };

  const validateEmailDomain = (value: string) => {
    const domain = value.split("@")[1]?.toLowerCase();
    if (!domain || blockedDomains.has(domain)) {
      setError("Please use a work email address (company domain).");
      return false;
    }
    return true;
  };

  const createCompany = async () => {
    await apiRequest(
      "/api/v1/companies",
      {
        method: "POST",
        auth: true,
        body: {
          name: companyName,
          website: companyWebsite
        }
      }
    );
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validateCompanyForm()) return;
    if (!validateEmailDomain(email)) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await createCompany();
      navigate("/app/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message || "Registration failed. Try a stronger password or different email.");
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    if (!validateCompanyForm()) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const currentEmail = auth.currentUser?.email || "";
      if (!validateEmailDomain(currentEmail)) {
        await signOut(auth);
        setLoading(false);
        return;
      }
      await createCompany();
      navigate("/app/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message || "Google sign-in failed.");
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 8 }} maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Create your account</Typography>
          <Typography color="text.secondary">
            Create a new company workspace. Team members will join via invite links.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Company name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
            <TextField
              label="Company website"
              placeholder="company.com"
              value={companyWebsite}
              onChange={(event) => setCompanyWebsite(event.target.value)}
              required
            />
          </Box>
          <Button variant="outlined" onClick={handleGoogleRegister} disabled={loading}>
            Continue with Google
          </Button>
          <Divider>or</Divider>
          <Box component="form" onSubmit={handleRegister} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button variant="contained" type="submit" disabled={loading}>
              Create account
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Already have an account? <RouterLink to="/login">Sign in</RouterLink>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Joining an existing company? Ask your admin for an invite link.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
