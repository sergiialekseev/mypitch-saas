import "dotenv/config";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});
const db = getFirestore();
const auth = getAuth();

const app = express();
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["*"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json());

const appBaseUrl = (process.env.PUBLIC_APP_URL || "http://localhost:5173").replace(/\/$/, "");
const inviteTtlDays = Number(process.env.INVITE_TTL_DAYS || 7);
const liveModelId = process.env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";

const buildInviteLink = (inviteId: string) => `${appBaseUrl}/c/${inviteId}`;

const getAuthToken = (req: express.Request) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
};

const requireAuth: express.RequestHandler = async (req, res, next) => {
  try {
    const token = getAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Missing auth token" });
      return;
    }
    const decoded = await auth.verifyIdToken(token);
    res.locals.authUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid auth token" });
  }
};

const getRecruiterId = (res: express.Response) => (res.locals.authUser as DecodedIdToken).uid;

const isInviteExpired = (expiresAt?: Timestamp) => {
  if (!expiresAt) return false;
  return expiresAt.toMillis() < Date.now();
};

const buildSystemPrompt = (title: string) =>
  `You are a recruiter conducting an interview for the role: ${title}. Ask structured questions and keep responses concise.`;

const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }
  return apiKey;
};

const createGeminiClient = () => new GoogleGenAI({ apiKey: getGeminiApiKey() });

const createLiveTokenClient = () => new GoogleGenAI({ apiKey: getGeminiApiKey(), apiVersion: "v1alpha" });

const saveReport = async (sessionRef: FirebaseFirestore.DocumentReference, session: FirebaseFirestore.DocumentData, reportData: Record<string, unknown>) => {
  const now = Timestamp.now();
  const reportRef = db.collection("reports").doc(sessionRef.id);

  await reportRef.set({
    sessionId: sessionRef.id,
    recruiterId: session.recruiterId,
    candidateId: session.candidateId,
    jobId: session.jobId,
    createdAt: now,
    ...reportData
  });

  await sessionRef.update({ status: "ended", endedAt: now });
  await db.collection("candidates").doc(session.candidateId).update({ status: "completed", updatedAt: now });
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mypitch-backend" });
});

app.post("/api/v1/jobs", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const { title, description } = req.body || {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const now = Timestamp.now();
  const jobRef = await db.collection("jobs").add({
    recruiterId,
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    status: "open",
    createdAt: now,
    updatedAt: now
  });

  res.status(201).json({
    job: {
      id: jobRef.id,
      recruiterId,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      status: "open",
      createdAt: now.toDate().toISOString()
    }
  });
});

app.get("/api/v1/jobs", requireAuth, async (_req, res) => {
  const recruiterId = getRecruiterId(res);
  const snapshot = await db.collection("jobs").where("recruiterId", "==", recruiterId).orderBy("createdAt", "desc").get();
  const jobs = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null
    };
  });

  res.json({ jobs });
});

app.get("/api/v1/jobs/:jobId", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const jobRef = db.collection("jobs").doc(req.params.jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists || jobSnap.data()?.recruiterId !== recruiterId) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const jobData = jobSnap.data() || {};
  const candidatesSnap = await db
    .collection("candidates")
    .where("jobId", "==", jobSnap.id)
    .orderBy("createdAt", "desc")
    .get();
  const invitesSnap = await db.collection("invites").where("jobId", "==", jobSnap.id).get();

  const candidates = candidatesSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null
    };
  });

  const invites = invitesSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      link: buildInviteLink(docSnap.id),
      createdAt: data.createdAt?.toDate().toISOString() || null,
      expiresAt: data.expiresAt?.toDate().toISOString() || null,
      usedAt: data.usedAt?.toDate().toISOString() || null
    };
  });

  res.json({
    job: {
      id: jobSnap.id,
      ...jobData,
      createdAt: jobData.createdAt?.toDate().toISOString() || null,
      updatedAt: jobData.updatedAt?.toDate().toISOString() || null
    },
    candidates,
    invites
  });
});

app.post("/api/v1/jobs/:jobId/candidates", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const { name, email } = req.body || {};

  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }

  const jobRef = db.collection("jobs").doc(req.params.jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists || jobSnap.data()?.recruiterId !== recruiterId) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const now = Timestamp.now();
  const candidateRef = db.collection("candidates").doc();
  await candidateRef.set({
    recruiterId,
    jobId: jobRef.id,
    name: name.trim(),
    email: email.trim(),
    status: "invited",
    createdAt: now,
    updatedAt: now
  });

  const inviteId = crypto.randomBytes(16).toString("hex");
  const expiresAt = Timestamp.fromMillis(Date.now() + inviteTtlDays * 24 * 60 * 60 * 1000);

  await db.collection("invites").doc(inviteId).set({
    recruiterId,
    jobId: jobRef.id,
    candidateId: candidateRef.id,
    status: "created",
    expiresAt,
    createdAt: now
  });

  res.status(201).json({
    candidate: {
      id: candidateRef.id,
      recruiterId,
      jobId: jobRef.id,
      name: name.trim(),
      email: email.trim(),
      status: "invited",
      createdAt: now.toDate().toISOString()
    },
    invite: {
      id: inviteId,
      candidateId: candidateRef.id,
      status: "created",
      expiresAt: expiresAt.toDate().toISOString(),
      link: buildInviteLink(inviteId)
    }
  });
});

app.get("/api/v1/invites/:inviteId", async (req, res) => {
  const inviteRef = db.collection("invites").doc(req.params.inviteId);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }

  const invite = inviteSnap.data() || {};
  if (invite.status !== "created" || isInviteExpired(invite.expiresAt)) {
    if (invite.status === "created" && isInviteExpired(invite.expiresAt)) {
      await inviteRef.update({ status: "expired" });
    }
    res.status(410).json({ error: "Invite expired or already used" });
    return;
  }

  const [jobSnap, candidateSnap] = await Promise.all([
    db.collection("jobs").doc(invite.jobId).get(),
    db.collection("candidates").doc(invite.candidateId).get()
  ]);

  if (!jobSnap.exists || !candidateSnap.exists) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }

  const job = jobSnap.data() || {};
  const candidate = candidateSnap.data() || {};

  res.json({
    invite: {
      id: inviteSnap.id,
      status: invite.status,
      expiresAt: invite.expiresAt?.toDate().toISOString() || null
    },
    job: {
      id: jobSnap.id,
      title: job.title,
      description: job.description || ""
    },
    candidate: {
      id: candidateSnap.id,
      name: candidate.name,
      email: candidate.email
    }
  });
});

app.get("/api/v1/sessions/:sessionId", async (req, res) => {
  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const session = sessionSnap.data() || {};
  const [jobSnap, candidateSnap] = await Promise.all([
    db.collection("jobs").doc(session.jobId).get(),
    db.collection("candidates").doc(session.candidateId).get()
  ]);

  if (!jobSnap.exists || !candidateSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const job = jobSnap.data() || {};
  const candidate = candidateSnap.data() || {};

  res.json({
    session: {
      id: sessionSnap.id,
      status: session.status,
      startedAt: session.startedAt?.toDate().toISOString() || null,
      endedAt: session.endedAt?.toDate().toISOString() || null
    },
    job: {
      id: jobSnap.id,
      title: job.title,
      description: job.description || ""
    },
    candidate: {
      id: candidateSnap.id,
      name: candidate.name,
      email: candidate.email
    }
  });
});

app.post("/api/v1/invites/:inviteId/accept", async (req, res) => {
  const inviteRef = db.collection("invites").doc(req.params.inviteId);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }

  const invite = inviteSnap.data() || {};
  if (invite.status !== "created") {
    res.status(409).json({ error: "Invite already used" });
    return;
  }

  if (isInviteExpired(invite.expiresAt)) {
    await inviteRef.update({ status: "expired" });
    res.status(410).json({ error: "Invite expired" });
    return;
  }

  const now = Timestamp.now();
  const jobSnap = await db.collection("jobs").doc(invite.jobId).get();
  const jobTitle = jobSnap.exists ? jobSnap.data()?.title || "Interview" : "Interview";
  const systemPrompt = buildSystemPrompt(jobTitle);

  await inviteRef.update({ status: "used", usedAt: now });
  await db.collection("candidates").doc(invite.candidateId).update({ status: "started", updatedAt: now });

  const sessionRef = db.collection("sessions").doc();
  await sessionRef.set({
    recruiterId: invite.recruiterId,
    jobId: invite.jobId,
    candidateId: invite.candidateId,
    inviteId: inviteSnap.id,
    status: "active",
    startedAt: now,
    systemPrompt
  });

  res.json({
    session: {
      id: sessionRef.id,
      inviteId: inviteSnap.id,
      status: "active",
      startedAt: now.toDate().toISOString()
    }
  });
});

app.post("/api/v1/sessions/:sessionId/transcripts", async (req, res) => {
  const { role, text } = req.body || {};

  if (!role || !["user", "ai"].includes(role) || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "role and text are required" });
    return;
  }

  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const session = sessionSnap.data() || {};
  await db.collection("transcripts").add({
    sessionId: sessionRef.id,
    recruiterId: session.recruiterId,
    candidateId: session.candidateId,
    role,
    text: text.trim(),
    createdAt: FieldValue.serverTimestamp()
  });

  res.json({ ok: true });
});

app.get("/api/v1/sessions/:sessionId/gemini-token", async (req, res) => {
  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const session = sessionSnap.data() || {};
  if (session.status !== "active") {
    res.status(409).json({ error: "Session is not active" });
    return;
  }

  try {
    const ai = createLiveTokenClient();
    const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime
      }
    });

    if (!token.name) {
      res.status(500).json({ error: "Failed to create session token" });
      return;
    }

    res.json({ token: token.name, expiresAt: expireTime, model: liveModelId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session token" });
  }
});

app.post("/api/v1/sessions/:sessionId/end", async (req, res) => {
  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await sessionRef.update({ status: "ended", endedAt: Timestamp.now() });
  res.json({ ok: true });
});

app.post("/api/v1/sessions/:sessionId/report", async (req, res) => {
  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const session = sessionSnap.data() || {};
  await saveReport(sessionRef, session, req.body || {});
  res.json({ ok: true });
});

app.post("/api/v1/sessions/:sessionId/report/generate", async (req, res) => {
  const sessionRef = db.collection("sessions").doc(req.params.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const session = sessionSnap.data() || {};
  const [jobSnap, candidateSnap] = await Promise.all([
    db.collection("jobs").doc(session.jobId).get(),
    db.collection("candidates").doc(session.candidateId).get()
  ]);

  if (!jobSnap.exists || !candidateSnap.exists) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const transcriptsSnap = await db.collection("transcripts").where("sessionId", "==", sessionRef.id).get();
  const transcripts = transcriptsSnap.docs
    .map((docSnap) => docSnap.data())
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return aTime - bTime;
    })
    .map((entry) => `${entry.role === "user" ? "User" : "Coach"}: ${entry.text}`);

  const conversationHistory = transcripts.join("\n");
  if (!conversationHistory || conversationHistory.length < 10) {
    await sessionRef.update({ status: "ended", endedAt: Timestamp.now() });
    res.json({ ok: true, skipped: true });
    return;
  }

  const job = jobSnap.data() || {};
  const systemPrompt = session.systemPrompt || buildSystemPrompt(job.title || "Interview");
  const prompt = `
Act as a World-Class Executive Communications Coach.
Analyze the following transcript of a roleplay session.

Topic: ${job.title || "Interview"}
Goal: ${job.description || ""}
Hidden AI Instructions (What the user faced): ${systemPrompt}

TRANSCRIPT:
${conversationHistory}

TASK:
1. Identify the primary language spoken by the user.
2. Provide feedback *in that identified language*.
3. Analyze the user's "Psychological Vibe". Were they defensive? Apologetic? Clear?
4. Find 2-3 specific "Pivot Points" where the user missed an opportunity or made a mistake.
   - IMPORTANT: For "original_phrase", you must quote the user *EXACTLY* as they appear in the transcript. 
   - DO NOT paraphrase or summarize what the user said. 
   - If the user did not say a specific phrase, DO NOT invent one. Only use text that actually exists in the TRANSCRIPT under 'User'.
   - Write a "Perfect Script" for what they SHOULD have said.
   - Explain why.

Output JSON matching the schema.
  `;

  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "0-100 performance score" },
            language_detected: { type: Type.STRING, description: "e.g. English, Spanish, German" },
            summary: { type: Type.STRING, description: "2 sentence summary in the detected language" },
            psychological_analysis: {
              type: Type.STRING,
              description: "Analysis of tone, confidence, and emotional intelligence in the detected language"
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of strengths" },
            feedback_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original_phrase: { type: Type.STRING },
                  better_version: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["missed_opportunity", "critical_error", "good_tactic"] }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      res.status(500).json({ error: "No JSON response from model" });
      return;
    }

    const reportData = JSON.parse(jsonText) as Record<string, unknown>;
    await saveReport(sessionRef, session, reportData);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Report generation failed" });
  }
});

app.get("/api/v1/sessions/:sessionId/report", async (req, res) => {
  const reportSnap = await db.collection("reports").doc(req.params.sessionId).get();

  if (!reportSnap.exists) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const report = reportSnap.data() || {};
  res.json({ report: { id: reportSnap.id, ...report } });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
