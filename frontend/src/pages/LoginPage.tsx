import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch (err) {
      setError("Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/app");
    } catch (err) {
      setError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 8 }} maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Welcome back</Typography>
          <Typography color="text.secondary">Sign in to continue your interview prep.</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button variant="outlined" onClick={handleGoogleLogin} disabled={loading}>
            Continue with Google
          </Button>
          <Divider>or</Divider>
          <Box component="form" onSubmit={handleEmailLogin} sx={{ display: "grid", gap: 2 }}>
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
              Sign in
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            New here? <RouterLink to="/register">Create an account</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default LoginPage;
