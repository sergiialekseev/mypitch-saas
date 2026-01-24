import "dotenv/config";
import express from "express";
import cors from "cors";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const app = express();
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["*"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mypitch-backend" });
});

app.get("/api/interviews", async (_req, res) => {
  const snapshot = await db.collection("interviews").orderBy("createdAt", "desc").limit(25).get();
  const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  res.json({ items });
});

app.post("/api/interviews", async (req, res) => {
  const { title, role, company } = req.body || {};
  if (!title || !role || !company) {
    res.status(400).json({ error: "title, role, and company are required" });
    return;
  }

  const docRef = await db.collection("interviews").add({
    title,
    role,
    company,
    createdAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: docRef.id });
});

app.delete("/api/interviews/:id", async (req, res) => {
  await db.collection("interviews").doc(req.params.id).delete();
  res.status(204).send();
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
