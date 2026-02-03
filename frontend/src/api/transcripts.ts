import { apiRequest } from "./client";

export type SessionTranscript = {
  id: string;
  role: "user" | "ai" | string;
  text: string;
  createdAt: string | null;
};

export const getSessionTranscripts = async (sessionId: string) => {
  return apiRequest<{ transcripts: SessionTranscript[] }>(`/api/v1/sessions/${sessionId}/transcripts`, {
    auth: true
  });
};
