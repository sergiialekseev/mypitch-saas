//report generation schema (summary/score/qa)
type BuildReportPromptParams = {
  jobTitle: string;
  jobDescription: string;
  systemPrompt: string;
  conversationHistory: string;
  questions: string[];
};

//live interview prompt
export const buildSystemPrompt = (jobTitle: string, descriptionMarkdown: string, questions: string[]) => {
  const questionList = questions.length ? questions.map((q, index) => `${index + 1}. ${q}`).join("\n") : "";
  return `
You are a recruiter conducting an interview for the role: ${jobTitle}.

Job description (markdown):
${descriptionMarkdown || "No description provided."}

Interview questions (ask in order, one at a time, wait for the answer before the next):
${questionList || "Ask standard screening questions about experience, motivation, and role fit."}

Rules:
1. Follow the question order exactly and do not skip or reorder.
2. Ask one question at a time and wait for the candidate's reply.
3. Keep responses concise and spoken-friendly.
  `.trim();
};

//job markdown generation
export const buildJobFormatPrompt = (rawInput: string) => `
You are an expert recruiter and editor.
Convert the raw job description below into clean GitHub-flavored Markdown.
Use clear headings and bullet lists. Keep the content faithful to the input.
Do not invent details that are not in the text.

Required sections (include only if present in the text):
- Role summary
- Responsibilities
- Requirements
- Nice to have
- Benefits
- Location
- Hiring process

Return ONLY Markdown. No extra commentary.

RAW INPUT:
${rawInput}
`.trim();

export const buildReportPrompt = ({
  jobTitle,
  jobDescription,
  systemPrompt,
  conversationHistory,
  questions
}: BuildReportPromptParams) => {
  const questionList = questions.length
    ? questions.map((question, index) => `${index + 1}. ${question}`).join("\n")
    : "No predefined questions.";

  return `
Act as a World-Class Executive Communications Coach.
Analyze the following transcript of a roleplay session.

Topic: ${jobTitle || "Interview"}
Goal: ${jobDescription || ""}
Hidden AI Instructions (What the user faced): ${systemPrompt}
Interview questions list (if provided):
${questionList}

TRANSCRIPT:
${conversationHistory}

TASK:
1. Provide an overall performance score from 0-100.
2. Provide a 2-3 sentence summary in the primary language spoken by the user.
3. Build a question/answer table:
   - Use the Interview questions list if provided; otherwise, use the coach's questions from the transcript.
   - For each question, find the user's answer from the transcript (lines starting with "User:").
   - If no answer is found, use an empty string and score 0 for that question.
   - Provide a score from 0-100 for each answer.

Output JSON matching the schema.
  `.trim();
};
