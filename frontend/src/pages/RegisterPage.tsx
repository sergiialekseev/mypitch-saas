import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch (err) {
      setError("Registration failed. Try a stronger password or different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
          <Typography variant="h4">Create your account</Typography>
          <Typography color="text.secondary">Start your MyPitch workspace in minutes.</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
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
        </Stack>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
