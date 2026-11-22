// LocalStorage & Session persistence layer for Vinxa Web

const STORAGE_KEY = 'vinxa_live_meetings_v1';

export const sampleMeetings = [
  {
    id: 'ev-demo-101',
    title: 'Product Strategy & Sprint Planning — Sprint 24',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    durationSeconds: 1420,
    sources: ['Microphone', 'Tab Audio (Meet)'],
    summary: 'The team aligned on the Escape Velocity 2.0 Hackathon roadmap. Agreed to prioritize the core recording and live transcript loop first before diving into vector RAG. Confirmed speaker diarization and privacy consent flows are mandatory for full rubric marks.',
    decisions: [
      'Focus strictly on the Web Track must-haves: Dual Audio, <2s transcription, and instant AI summary.',
      'Adopt SQLite / In-Context retrieval first for fast and stable live demo.',
      'Make consent dialog non-dismissible before audio capture initiates.'
    ],
    actionItems: [
      { id: 1, task: 'Test browser tab audio capture with getDisplayMedia in Chrome & Edge', owner: 'Aman', deadline: 'Today, 6 PM', completed: true },
      { id: 2, task: 'Finalize 1-page PRD and system architecture diagram', owner: 'Priya', deadline: 'Tomorrow morning', completed: false },
      { id: 3, task: 'Verify JSON response parsing for post-call action items', owner: 'Dev Team', deadline: 'Before demo', completed: false }
    ],
    highlights: [
      { id: 1, timestamp: '03:15', note: 'Decision to use direct in-context prompt over vector DB' },
      { id: 2, timestamp: '08:42', note: 'Discussion regarding Edge tab audio compatibility' }
    ],
    transcript: [
      { speaker: 'Speaker 1 (Host)', text: 'Welcome everyone to the sprint review. Let us verify our Escape Velocity build plan.', time: '00:02' },
      { speaker: 'Speaker 2', text: 'Hey, I checked the judging criteria. Working product is 30% and privacy is 10%. We must have the consent modal.', time: '00:15' },
      { speaker: 'Speaker 1 (Host)', text: 'Agreed. Recording cannot start without explicit user consent. What about tab audio?', time: '00:32' },
      { speaker: 'Speaker 2', text: 'We are merging getUserMedia and getDisplayMedia with Web Audio API. It works seamlessly in both Chrome and Edge.', time: '00:54' },
      { speaker: 'Speaker 1 (Host)', text: 'Excellent! Once recording stops, LLM should instantly output structured JSON for summary and action items.', time: '01:20' }
    ]
  }
];

export function getMeetings() {
  if (typeof window === 'undefined') return sampleMeetings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleMeetings));
      return sampleMeetings;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read meetings from localStorage', err);
    return sampleMeetings;
  }
}

export function saveMeeting(meeting) {
  if (typeof window === 'undefined') return;
  const current = getMeetings();
  const updated = [meeting, ...current.filter(m => m.id !== meeting.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync to server store for cross-device shareable links
  try {
    fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting)
    }).catch(() => {});
  } catch (e) {}

  return updated;
}

export function getMeetingById(id) {
  const all = getMeetings();
  return all.find(m => m.id === id) || null;
}

export function deleteMeeting(id) {
  if (typeof window === 'undefined') return;
  const current = getMeetings();
  const filtered = current.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function searchMeetings(query) {
  if (!query || !query.trim()) return getMeetings();
  const q = query.toLowerCase().trim();
  const all = getMeetings();

  return all.filter(m => {
    const matchTitle = m.title.toLowerCase().includes(q);
    const matchSummary = m.summary?.toLowerCase().includes(q);
    const matchTranscript = m.transcript?.some(t => t.text.toLowerCase().includes(q));
    const matchActions = m.actionItems?.some(a => a.task.toLowerCase().includes(q) || a.owner?.toLowerCase().includes(q));
    return matchTitle || matchSummary || matchTranscript || matchActions;
  });
}

