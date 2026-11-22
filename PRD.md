# Vinxa Live (Web Track) — One-Page PRD
**Product**: Vinxa Live — AI-Powered Enterprise Meeting Notetaker  
**Event**: Escape Velocity Hackathon 2.0 (EVOCS & Velloe)  
**Track**: Track 01 — Vinxa Web  

---

## 1. Problem Statement
Meeting participants and team leads spend up to 20% of their working hours manually jotting down notes, identifying action item owners, and chasing decisions across disconnected video calls. Traditional bots (that join as fake attendees) require admin permissions, intrude on meeting confidentiality, fail when calendar links change, and produce static transcripts hours after calls end.

## 2. Target User & Persona
- **Persona**: Team Lead / Engineering Manager / Product Designer on back-to-back calls (Google Meet, Microsoft Teams, Zoom).
- **Core User Story**: *"As a team lead on back-to-back calls, I want to open a browser tab, hit record, and get clean structured notes and assigned action items the moment my call ends, with zero installation."*

---

## 3. Product Principles & Architecture
1. **Zero Install & No Bot Intrusion**: Runs 100% in the user's browser tab using Web Audio API + MediaDevices API.
2. **Dual-Audio Mixing**: Captures both user microphone (`getUserMedia`) and remote meeting participants from a shared tab (`getDisplayMedia`) into a unified audio stream.
3. **Sub-2-Second Live Transcription**: Continuous streaming speech-to-text with interim (partial) gray text and finalized high-confidence lines with timestamps.
4. **Speaker Diarization**: Alternating speaker labeling (`Speaker 1 / Speaker 2`) tagged per segment.
5. **Instant Post-Meeting Intelligence**: Auto-generated structured summary, verified decisions, and action items with owners and deadlines upon hitting "End Meeting".
6. **Privacy & Trust Guard (10% Judging Rubric)**:
   - Mandatory Consent Prompt before capture starts.
   - Persistent Live Red Recording Indicator + Audio Visualizer.
   - Permanent Hard Delete (erases transcript, audio, notes, and search index).

---

## 4. Key Trade-offs Made
| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Meeting Q&A Strategy** | Direct In-Context Retrieval + SQLite Keyword Search | Zero embedding latency, immune to vector indexing lag, 100% deterministic during live 5-minute jury demo. |
| **Audio Capture** | Web Audio API Destination Merger | Avoids backend audio uploading bottlenecks; client-side mixing keeps latency <2s. |
| **Privacy Model** | Client-First Persistence | User data stays in their browser environment with immediate one-click wipe capability. |

---

## 5. Success Metrics
- **Transcription Latency**: < 2.0 seconds from speech to screen render.
- **AI Synthesis Speed**: Under 3.5 seconds to generate summary, decisions, and action items post-call.
- **Privacy Compliance**: 100% consent dialog completion rate prior to capture initiation.

