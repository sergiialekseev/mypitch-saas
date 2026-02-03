export type Job = {
  id: string;
  title: string;
  description: string;
  rawDescription?: string;
  descriptionMarkdown?: string;
  questionsMarkdown?: string;
  questions?: string[];
  language?: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Candidate = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Invite = {
  id: string;
  candidateId: string;
  status: string;
  link: string;
  expiresAt?: string | null;
  usedAt?: string | null;
};

export type Session = {
  id: string;
  inviteId: string;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type Report = {
  id: string;
  overallDecision?: "Go" | "Doubt" | "No-Go";
  summary?: string;
  qa?: {
    question: string;
    answer: string;
    decision: "Go" | "Doubt" | "No-Go";
    note?: string;
  }[];
};

export type Topic = {
  title: string;
  description: string;
  systemPrompt: string;
  openingPrompt?: string;
  voice?: string;
  emoji?: string;
};
