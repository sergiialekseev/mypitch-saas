import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

interface InterviewItem {
  id: string;
  title: string;
  role: string;
  company: string;
  createdAt?: Timestamp;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interviewsQuery = query(collection(db, "interviews"), orderBy("createdAt", "desc"), limit(25));
    const unsubscribe = onSnapshot(interviewsQuery, (snapshot) => {
      const nextItems = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<InterviewItem, "id">)
      }));
      setItems(nextItems);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          setStatus("online");
        } else {
          setStatus("degraded");
        }
      } catch (err) {
        setStatus("offline");
      }
    };

    loadStatus();
  }, []);

  const handleAdd = async () => {
    setError(null);
    if (!title || !role || !company) {
      setError("Add a title, role, and company to continue.");
      return;
    }

    try {
      await addDoc(collection(db, "interviews"), {
        title,
        role,
        company,
        ownerId: user?.uid || null,
        createdAt: serverTimestamp()
      });
      setTitle("");
      setRole("");
      setCompany("");
    } catch (err) {
      setError("Could not save the interview session.");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "interviews", id));
  };

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
    <Container sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Welcome back, {user?.email}. Capture your next interview session plan.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Session builder</Typography>
              {statusChip}
            </Box>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Session title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />
              <TextField label="Role" value={role} onChange={(event) => setRole(event.target.value)} fullWidth />
              <TextField label="Company" value={company} onChange={(event) => setCompany(event.target.value)} fullWidth />
              <Button variant="contained" onClick={handleAdd} sx={{ minWidth: 140 }}>
                Add
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Recent sessions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {items.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">No sessions yet. Create your first one above.</Typography>
              </Paper>
            ) : (
              items.map((item) => (
                <Paper key={item.id} sx={{ p: 3, display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1">{item.title}</Typography>
                    <Typography color="text.secondary">
                      {item.role} at {item.company}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.createdAt ? item.createdAt.toDate().toLocaleString() : "Just now"}
                    </Typography>
                  </Box>
                  <Button variant="text" color="secondary" onClick={() => handleDelete(item.id)}>
                    Remove
                  </Button>
                </Paper>
              ))
            )}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default DashboardPage;
