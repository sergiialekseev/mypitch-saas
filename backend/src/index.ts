import "dotenv/config";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./constants/languages";
import { buildJobFormatPrompt, buildReportPrompt, buildSystemPrompt, buildLiveOpeningPrompt } from "./prompts";

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
const allowedLanguages = new Set<string>(LANGUAGES);

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

const normalizeMarkdown = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const extractSummary = (markdown: string) => {
  if (!markdown) return "";
  const firstLine = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "";
  const cleaned = firstLine.replace(/^#+\s*/, "");
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
};

const parseQuestionsMarkdown = (markdown: string) => {
  if (!markdown) return [];
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^([-*+]|\d+\.)\s+/, "").replace(/^\[.?]\s+/, "").trim())
    .filter((line) => line.length > 0);
};

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

app.get("/api/v1/meta/languages", requireAuth, (_req, res) => {
  res.json({
    languages: LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE
  });
});

app.post("/api/v1/jobs/format", requireAuth, async (req, res) => {
  const { rawText } = req.body || {};
  const normalizedRaw = normalizeMarkdown(rawText);

  if (!normalizedRaw) {
    res.status(400).json({ error: "rawText is required" });
    return;
  }

  const prompt = buildJobFormatPrompt(normalizedRaw);

  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short, clear job title" },
            markdown: { type: Type.STRING, description: "Formatted GitHub-flavored Markdown" }
          }
        }
      }
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      res.status(500).json({ error: "Failed to generate markdown" });
      return;
    }

    const parsed = JSON.parse(jsonText) as { title?: string; markdown?: string };
    const markdown = parsed.markdown?.trim() || normalizedRaw;
    const title = parsed.title?.trim() || "";
    if (!markdown) {
      res.status(500).json({ error: "Failed to generate markdown" });
      return;
    }

    res.json({ markdown, title });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate markdown" });
  }
});

app.post("/api/v1/jobs", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const { title, rawDescription, description, descriptionMarkdown, questionsMarkdown, language } = req.body || {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  if (language !== undefined && (typeof language !== "string" || !allowedLanguages.has(language))) {
    res.status(400).json({ error: "language must be one of the allowed values" });
    return;
  }

  const resolvedLanguage = language || DEFAULT_LANGUAGE;

  const normalizedRawDescription = normalizeMarkdown(rawDescription);
  if (!normalizedRawDescription) {
    res.status(400).json({ error: "rawDescription is required" });
    return;
  }

  const normalizedDescription = normalizeMarkdown(description);
  const normalizedDescriptionMarkdown = normalizeMarkdown(descriptionMarkdown);
  if (!normalizedDescriptionMarkdown) {
    res.status(400).json({ error: "descriptionMarkdown is required" });
    return;
  }
  const normalizedQuestionsMarkdown = normalizeMarkdown(questionsMarkdown);
  const questions = parseQuestionsMarkdown(normalizedQuestionsMarkdown);

  const now = Timestamp.now();
  const jobRef = await db.collection("jobs").add({
    recruiterId,
    title: title.trim(),
    rawDescription: normalizedRawDescription,
    description: normalizedDescription || extractSummary(normalizedDescriptionMarkdown),
    descriptionMarkdown: normalizedDescriptionMarkdown,
    questionsMarkdown: normalizedQuestionsMarkdown,
    questions,
    language: resolvedLanguage,
    status: "open",
    createdAt: now,
    updatedAt: now
  });

  res.status(201).json({
    job: {
      id: jobRef.id,
      recruiterId,
      title: title.trim(),
      rawDescription: normalizedRawDescription,
      description: normalizedDescription || extractSummary(normalizedDescriptionMarkdown),
      descriptionMarkdown: normalizedDescriptionMarkdown,
      questionsMarkdown: normalizedQuestionsMarkdown,
      questions,
      language: resolvedLanguage,
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
      language: data.language || DEFAULT_LANGUAGE,
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
  const sessionsSnap = await db.collection("sessions").where("jobId", "==", jobSnap.id).get();
  const reportsSnap = await db.collection("reports").where("jobId", "==", jobSnap.id).get();

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

  const sessions = sessionsSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      candidateId: data.candidateId,
      status: data.status,
      startedAt: data.startedAt?.toDate().toISOString() || null,
      endedAt: data.endedAt?.toDate().toISOString() || null
    };
  });

  const reportsBySession = new Map(
    reportsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return [
        docSnap.id,
        {
          id: docSnap.id,
          candidateId: data.candidateId,
          decision: typeof data.overallDecision === "string" ? data.overallDecision : null,
          createdAt: data.createdAt?.toDate().toISOString() || null
        }
      ];
    })
  );

  const candidateResults = sessions.map((session) => {
    const report = reportsBySession.get(session.id);
    return {
      candidateId: session.candidateId,
      sessionId: session.id,
      sessionStatus: session.status,
      reportId: report?.id || null,
      decision: report?.decision ?? null,
      reportCreatedAt: report?.createdAt || null
    };
  });

  res.json({
    job: {
      id: jobSnap.id,
      ...jobData,
      language: jobData.language || DEFAULT_LANGUAGE,
      createdAt: jobData.createdAt?.toDate().toISOString() || null,
      updatedAt: jobData.updatedAt?.toDate().toISOString() || null
    },
    candidates,
    invites,
    candidateResults
  });
});

app.get("/api/v1/jobs/:jobId/preview", async (req, res) => {
  const jobRef = db.collection("jobs").doc(req.params.jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const jobData = jobSnap.data() || {};

  res.json({
    job: {
      id: jobSnap.id,
      title: jobData.title || "",
      descriptionMarkdown: jobData.descriptionMarkdown || "",
      questionsMarkdown: jobData.questionsMarkdown || ""
    }
  });
});

app.get("/api/v1/jobs/:jobId/candidates/:candidateId/report", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const { jobId, candidateId } = req.params;
  const jobRef = db.collection("jobs").doc(jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists || jobSnap.data()?.recruiterId !== recruiterId) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const candidateSnap = await db.collection("candidates").doc(candidateId).get();
  if (!candidateSnap.exists || candidateSnap.data()?.jobId !== jobId) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const sessionsSnap = await db
    .collection("sessions")
    .where("jobId", "==", jobId)
    .where("candidateId", "==", candidateId)
    .limit(1)
    .get();

  if (sessionsSnap.empty) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const sessionDoc = sessionsSnap.docs[0];
  const sessionData = sessionDoc.data();
  const reportSnap = await db.collection("reports").doc(sessionDoc.id).get();

  if (!reportSnap.exists) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const reportData = reportSnap.data() || {};
  const jobData = jobSnap.data() || {};
  const candidateData = candidateSnap.data() || {};

  res.json({
    job: {
      id: jobSnap.id,
      title: jobData.title || ""
    },
    candidate: {
      id: candidateSnap.id,
      name: candidateData.name || "",
      email: candidateData.email || ""
    },
    session: {
      id: sessionDoc.id,
      status: sessionData.status,
      startedAt: sessionData.startedAt?.toDate().toISOString() || null,
      endedAt: sessionData.endedAt?.toDate().toISOString() || null
    },
    report: {
      id: reportSnap.id,
      ...reportData
    }
  });
});

app.put("/api/v1/jobs/:jobId", requireAuth, async (req, res) => {
  const recruiterId = getRecruiterId(res);
  const { title, rawDescription, description, descriptionMarkdown, questionsMarkdown, status, language } = req.body || {};
  const jobRef = db.collection("jobs").doc(req.params.jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists || jobSnap.data()?.recruiterId !== recruiterId) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    res.status(400).json({ error: "title must be a non-empty string" });
    return;
  }

  const allowedStatuses = new Set(["open", "paused", "closed", "archived"]);
  if (status !== undefined) {
    if (typeof status !== "string" || !allowedStatuses.has(status)) {
      res.status(400).json({ error: "status must be one of: open, paused, closed, archived" });
      return;
    }
  }

  if (language !== undefined && (typeof language !== "string" || !allowedLanguages.has(language))) {
    res.status(400).json({ error: "language must be one of the allowed values" });
    return;
  }

  const normalizedDescription = normalizeMarkdown(description);
  const normalizedDescriptionMarkdown = normalizeMarkdown(descriptionMarkdown) || normalizedDescription;
  const normalizedQuestionsMarkdown = normalizeMarkdown(questionsMarkdown);
  const questions = parseQuestionsMarkdown(normalizedQuestionsMarkdown);
  const normalizedRawDescription = normalizeMarkdown(rawDescription);

  const updatePayload: Record<string, unknown> = {
    updatedAt: Timestamp.now()
  };

  if (title !== undefined) updatePayload.title = title.trim();
  if (rawDescription !== undefined) updatePayload.rawDescription = normalizedRawDescription;
  if (description !== undefined) updatePayload.description = normalizedDescription;
  if (descriptionMarkdown !== undefined) updatePayload.descriptionMarkdown = normalizedDescriptionMarkdown;
  if (questionsMarkdown !== undefined) {
    updatePayload.questionsMarkdown = normalizedQuestionsMarkdown;
    updatePayload.questions = questions;
  }
  if (status !== undefined) updatePayload.status = status;
  if (language !== undefined) updatePayload.language = language;

  if (descriptionMarkdown !== undefined && !normalizedDescription) {
    updatePayload.description = extractSummary(normalizedDescriptionMarkdown);
  }

  await jobRef.update(updatePayload);
  const updatedSnap = await jobRef.get();
  const updatedJob = updatedSnap.data() || {};

  res.json({
    job: {
      id: updatedSnap.id,
      ...updatedJob,
      createdAt: updatedJob.createdAt?.toDate().toISOString() || null,
      updatedAt: updatedJob.updatedAt?.toDate().toISOString() || null
    }
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

  const jobData = jobSnap.data() || {};
  if (!Array.isArray(jobData.questions) || jobData.questions.length === 0) {
    res.status(400).json({ error: "Add interview questions before inviting candidates." });
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
      description: job.description || "",
      descriptionMarkdown: job.descriptionMarkdown || "",
      questionsMarkdown: job.questionsMarkdown || ""
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
  const jobQuestions = Array.isArray(job.questions) ? job.questions : [];
  const language = job.language || DEFAULT_LANGUAGE;
  const systemPrompt =
    session.systemPrompt ||
    buildSystemPrompt(
      job.title || "Interview",
      job.descriptionMarkdown || job.rawDescription || job.description || "",
      jobQuestions,
      language,
      candidate.name
    );

  if (!session.systemPrompt && systemPrompt) {
    await sessionRef.update({ systemPrompt });
  }
  const openingPrompt = session.openingPrompt || buildLiveOpeningPrompt(candidate.name, language);

  res.json({
    session: {
      id: sessionSnap.id,
      status: session.status,
      systemPrompt,
      openingPrompt,
      startedAt: session.startedAt?.toDate().toISOString() || null,
      endedAt: session.endedAt?.toDate().toISOString() || null
    },
    job: {
      id: jobSnap.id,
      title: job.title,
      description: job.description || "",
      rawDescription: job.rawDescription || "",
      descriptionMarkdown: job.descriptionMarkdown || "",
      questionsMarkdown: job.questionsMarkdown || "",
      questions: jobQuestions
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
  const jobData = jobSnap.exists ? jobSnap.data() || {} : {};
  const candidateSnap = await db.collection("candidates").doc(invite.candidateId).get();
  const candidateData = candidateSnap.exists ? candidateSnap.data() || {} : {};
  const language = jobData.language || DEFAULT_LANGUAGE;
  const systemPrompt = buildSystemPrompt(
    jobData.title || "Interview",
    jobData.descriptionMarkdown || jobData.rawDescription || jobData.description || "",
    Array.isArray(jobData.questions) ? jobData.questions : [],
    language,
    candidateData.name
  );
  const openingPrompt = buildLiveOpeningPrompt(candidateData.name, language);

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
    systemPrompt,
    openingPrompt
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
  const jobQuestions = Array.isArray(job.questions) ? job.questions : [];
  const candidate = candidateSnap.data() || {};
  const language = job.language || "English";
  const systemPrompt =
    session.systemPrompt ||
    buildSystemPrompt(
      job.title || "Interview",
      job.descriptionMarkdown || job.rawDescription || job.description || "",
      jobQuestions,
      language,
      candidate.name
    );
  const prompt = buildReportPrompt({
    jobTitle: job.title || "Interview",
    jobDescription: job.description || "",
    systemPrompt,
    conversationHistory,
    questions: jobQuestions
  });

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
            summary: { type: Type.STRING, description: "2-3 sentence summary in the user's language" },
            overallDecision: {
              type: Type.STRING,
              description: "Overall decision: Go, Doubt, or No-Go",
              enum: ["Go", "Doubt", "No-Go"]
            },
            qa: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  decision: {
                    type: Type.STRING,
                    description: "Answer decision: Go, Doubt, or No-Go",
                    enum: ["Go", "Doubt", "No-Go"]
                  },
                  note: { type: Type.STRING, description: "Brief reasoning for the decision" }
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
