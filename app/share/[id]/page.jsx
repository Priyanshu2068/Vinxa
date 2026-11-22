'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getMeetingById, saveMeeting } from '../../../lib/storage';
import { Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ShareableNotesPage() {
  const params = useParams();
  const meetingId = params.id;
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. First priority: Check URL data payload '?d=' (guaranteed cross-device sharing)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('d');
      if (dataParam) {
        const decoded = JSON.parse(decodeURIComponent(atob(decodeURIComponent(dataParam))));
        if (decoded && (decoded.title || decoded.summary)) {
          setMeeting(decoded);
          saveMeeting(decoded);
          setLoading(false);
          return;
        }
      }
    } catch (urlErr) {
      console.warn('URL data decode error, trying storage fallback', urlErr);
    }

    // 2. Second priority: Local browser storage
    if (meetingId) {
      const found = getMeetingById(meetingId);
      if (found) {
        setMeeting(found);
        setLoading(false);
        return;
      }

      // 3. Third priority: Server API route
      fetch(`/api/meetings?id=${meetingId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && !data.error) {
            setMeeting(data);
            saveMeeting(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#081315]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-cyan-300/80">Loading shared intelligence notes...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#081315]">
        <div>
          <h2 className="text-xl font-bold text-white">Meeting Notes Not Available</h2>
          <p className="text-xs text-slate-400 mt-2">This link may be invalid or the notes have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081315] text-[#E6F1F2] flex flex-col">
      {/* Read-Only Banner */}
      <div className="bg-cyan-950/90 border-b border-cyan-800/40 px-4 py-2 text-center text-xs text-cyan-300">
        🔒 <strong>Read-Only Shared View</strong> — Powered by Vinxa Live Enterprise Intelligence
      </div>

      <header className="border-b border-cyan-950 px-4 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-extrabold text-lg text-white">
            VINXA <span className="text-cyan-400 font-light">LIVE</span>
          </span>
          <span className="text-xs text-cyan-400/80 font-mono">
            ID: {meeting.id}
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-cyan-300/70 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {Math.round(meeting.durationSeconds / 60)} minutes
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">
            {meeting.title}
          </h1>
        </div>

        {/* Executive Summary */}
        <section className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Executive Summary</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {meeting.summary}
          </p>
        </section>

        {/* Key Decisions */}
        <section className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Key Decisions</span>
          </h2>
          <ul className="space-y-2">
            {(meeting.decisions || []).map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Action Items */}
        <section className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Action Items &amp; Owners</span>
          </h2>
          <div className="space-y-2.5">
            {(meeting.actionItems || []).map((action) => (
              <div key={action.id} className="p-3.5 rounded-xl bg-[#10292c] border border-cyan-900/60 flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 ${action.completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-sm text-white font-medium">{action.task}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Owner: <strong className="text-cyan-300">{action.owner}</strong> • Deadline: {action.deadline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Diarized Transcript */}
        <section className="p-6 rounded-2xl bg-[#091719] border border-cyan-950 space-y-4">
          <h2 className="text-base font-bold text-white">Full Diarized Transcript</h2>
          <div className="space-y-3">
            {(meeting.transcript || []).map((t, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-900 shrink-0">
                  {t.time}
                </span>
                <div>
                  <span className="font-bold text-teal-300 mr-2">{t.speaker}:</span>
                  <span className="text-slate-300">{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

