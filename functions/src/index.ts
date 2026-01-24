import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const helloMyPitch = onRequest(async (_req, res) => {
  const snapshot = await db.collection("interviews").limit(1).get();
  res.json({ message: "MyPitch functions online", sampleCount: snapshot.size });
});
