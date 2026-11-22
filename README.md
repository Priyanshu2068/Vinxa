# Vinxa Live — Web-Based AI Meeting Notetaker
> **Enterprise Intelligence & Real-Time Meeting Notetaker**  
> *"Open a tab. Start talking. Get clean notes before your next meeting starts."*

---

## 🚀 Key Features

- 🎙️ **Dual-Audio Capture**: Captures microphone (`getUserMedia`) + shared browser tab audio (`getDisplayMedia`) merged via Web Audio API.
- ⚡ **Sub-2s Streaming Transcription**: Real-time speech-to-text with interim partials (gray text) and finalized transcript (white text).
- 🏷️ **Speaker Diarization**: Automatic speaker tags (`Speaker 1 / Speaker 2`) and timestamps on every line.
- 🧠 **Instant Post-Meeting Intelligence**:
  - Executive Summary
  - Key Decisions list
  - Action Items with assignees, deadlines, and interactive completion checkboxes.
- 🛡️ **Privacy & Trust Guard**:
  - Pre-capture Consent Prompt (*Allow / Deny*).
  - Prominent blinking red **LIVE RECORDING** banner with live timer and audio level visualizer.
  - Permanent Hard Delete option with database wipe.
- 🔍 **Full-Text Keyword Search**: Real-time search across all past meetings, summaries, and transcripts.
- 📄 **Universal Export**:
  - Download as **Markdown (`.md`)**
  - Instant **Print / PDF export**
- 🔗 **Shareable Read-Only Link**: Clean, public view (`/share/[id]`) with no edit/delete buttons for seamless stakeholder sharing.
- 🎯 **Advanced Capabilities**:
  - **Live Moment Highlight**: Bookmark important moments during live calls with one-click jump-to-transcript.
  - **Ask Vinxa (Meeting Q&A)**: Ask natural language questions (*"What did we decide on pricing?"*) directly answered from meeting context.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework & Core** | **Next.js 14 (App Router)** & **React 18** | High-performance server/client architecture, dynamic routing (`/notes/[id]`, `/share/[id]`). |
| **Styling & UI Components** | **Tailwind CSS** & **Lucide React** | Sleek enterprise dark-mode UI, responsive layouts, accessibility icons, custom visualizers. |
| **Dual Audio Capture** | **Web Audio API** & **MediaDevices API** | Real-time audio mixing of Microphone (`getUserMedia`) and Browser Tab audio (`getDisplayMedia`). |
| **Live Speech-to-Text** | **Streaming STT Engine** | Sub-2-second continuous transcription with interim tokens (gray text) and speaker diarization. |
| **AI Intelligence Engine** | **Gemini 1.5 Flash API** | Structured JSON extraction for Executive Summary, Decisions, and Action Items with assignees. |
| **Local Persistence & Search**| **LocalStorage / IndexedDB** | Zero-latency client persistence, full-text search indexing across titles, transcripts, and notes. |
| **Export Engines** | **Markdown Engine & CSS Print/PDF** | Instant clean `.md` document download and print-ready PDF reports. |

---

## 🛠️ System Architecture

```
[ User Microphone ] ───┐
                       ├──> [ Web Audio API Mixer ] ───> [ Real-Time Streaming STT ]
[ Tab Audio (Meet) ] ──┘          (AudioContext)                     │ (<2s lag)
                                                                     ▼
                                                          [ Live UI Transcript ]
                                                                     │
                                                   (When User Clicks "End Meeting")
                                                                     │
                                                                     ▼
                                                          [ AI Intelligence Engine ]
                                                          (Gemini / Context Parser)
                                                                     │
                                       ┌─────────────────────────────┴─────────────────────────────┐
                                       ▼                                                           ▼
                           [ Structured Notes ]                                       [ Ask Vinxa Q&A Chat ]
                     (Summary / Decisions / Actions)                             (Context-grounded Assistant)
```

---

## 🏁 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env.local` if you wish to use live Gemini API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is provided, the app automatically switches to its built-in intelligent synthesizer so demos never fail!)*

### 3. Run Locally
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in Chrome or Edge.

