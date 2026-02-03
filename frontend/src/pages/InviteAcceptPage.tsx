import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import { acceptCompanyInvite, getCompanyInvite } from "../api/companyInvites";

const InviteAcceptPage = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanyInvite(inviteId);
        setInviteEmail(data.invite.email);
        setCompanyName(data.company.name);
        setCompanyLogo(data.company.logoUrl || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite not available.");
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteId]);

  const finishInvite = async () => {
    if (!inviteId) return;
    await acceptCompanyInvite(inviteId);
    navigate("/app/dashboard");
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!inviteId) return;
    setActionLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, inviteEmail, password);
      await finishInvite();
    } catch (err) {
      setError("Registration failed. Try a stronger password or sign in instead.");
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch {
        // ignore
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!inviteId) return;
    setActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, inviteEmail, password);
      await finishInvite();
    } catch (err) {
      setError("Sign in failed. Check your password.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    if (!inviteId) return;
    setActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const currentEmail = auth.currentUser?.email?.toLowerCase() || "";
      if (currentEmail !== inviteEmail.toLowerCase()) {
        await signOut(auth);
        setError("Google account does not match the invite email.");
        return;
      }
      await finishInvite();
    } catch (err) {
      setError("Google sign-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography color="text.secondary">Loading invite...</Typography>
      </Container>
    );
  }

  if (error && !inviteEmail) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="h4">Join {companyName}</Typography>
            <Typography color="text.secondary">Accept your MyPitch invite to continue.</Typography>
          </Stack>
          {companyLogo ? (
            <Box
              component="img"
              src={companyLogo}
              alt={companyName}
              sx={{ height: 40, width: "auto", alignSelf: "flex-start" }}
            />
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button variant="outlined" onClick={handleGoogle} disabled={actionLoading}>
            Continue with Google
          </Button>
          <Divider>or</Divider>
          <Box
            component="form"
            onSubmit={mode === "register" ? handleRegister : handleSignIn}
            sx={{ display: "grid", gap: 2 }}
          >
            <TextField label="Invite email" value={inviteEmail} disabled />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button variant="contained" type="submit" disabled={actionLoading}>
              {mode === "register" ? "Create account & join" : "Sign in & join"}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {mode === "register" ? "Already have an account?" : "Need to create an account?"}{" "}
            <Button variant="text" onClick={() => setMode(mode === "register" ? "signin" : "register")}>
              {mode === "register" ? "Sign in instead" : "Create account"}
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default InviteAcceptPage;
