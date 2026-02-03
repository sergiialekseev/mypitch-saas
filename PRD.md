># PRD — MyPitch (B2B)

## Purpose
Document business requirements and core product logic so future changes stay consistent with intended behavior.

## Primary Users
- Recruiter (creates jobs, invites candidates, reviews reports)
- Candidate (completes live interview)

## Core Goals
- Structured AI interviews with consistent questions
- Fast, clear candidate experience
- Reliable session handling and reporting

## Non‑Goals (for now)
- Company/multi‑tenant org management
- Long‑term analytics and benchmarking

---

# Functional Requirements

## Job Creation & Editing
- Language selection is mandatory for each job.
- Interview questions are authored/selected by recruiter.
- Job description is structured/normalized into Markdown.
- Review step allows edits to language, title, questions, and description before save.

## Candidate Interview Session
### Entry
- Candidate opens invite link.
- Live session initializes after verification.

### Session Start Behavior
- The AI initiates the first greeting.
- UI shows a short intro overlay while the session connects.
- After connection is established, the interview screen appears after a 3‑second delay.

### Session Flow
- AI asks questions one by one.
- Candidate answers via audio.
- AI listens and replies with audio.
- Transcript display shows only the latest AI response.

### Timer
- Duration: 15 minutes.
- Countdown starts after session is connected and intro overlay completes.
- Warning at 5 minutes remaining.
- Warning at 2 minutes remaining.
- At 0 minutes: session auto‑ends and report generation begins.

### Reconnect Behavior
- If the live socket closes unexpectedly (e.g., token expires), the client should reconnect automatically.
- Session state (timer, transcript state, greeting) is preserved on reconnect.
- UI should remain stable; controls are temporarily disabled during reconnect.

### End Session
- User can manually end session.
- Auto‑end on timer completion.
- After end, report generation starts immediately.

### Report Generation
- Runs on backend after session end.
- Outputs a single report structure shared for recruiter and candidate views.
- Each question includes a decision (Go/Doubt/No-Go) plus a short note.
- Overall report includes a Go/Doubt/No-Go decision and a summary.
- UI shows a blocking overlay during analysis.

---

# Business Logic

## Interview Language
- Each job has a single selected language.
- AI must speak only the selected language, even if candidate speaks another.

## Prompts
- All prompts are centralized in backend (`backend/src/prompts.ts`).
- Frontend never supplies prompts directly; it only sends session metadata.

## Session Stability
- Use ephemeral token for live sessions.
- Expect token expiration (e.g., ~10 minutes) and handle with reconnect.

---

# UX Principles
- Clear, minimal UI during interview.
- No dead air: show loader before live view.
- Critical states (reconnecting, analyzing) must be visible.

---

# Open Questions
- Should session timer persist across page refresh?
- Do we need to resume AI context after reconnect beyond last turn?
