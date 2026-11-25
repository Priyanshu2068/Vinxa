'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getMeetingById, saveMeeting } from '../../../lib/storage';
import { Calendar, Clock, Sparkles, CheckCircle2, ListTodo, ShieldCheck } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#07080b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading intelligence notes...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#07080b]">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Meeting Notes Not Available</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            This link may be invalid or the notes have been removed by the session host.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col antialiased">
      {/* Top Read-Only Bar */}
      <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2 text-center text-xs text-indigo-300">
        🔒 <strong>Read-Only Shared View</strong> — Captured via Vinxa Live Enterprise Intelligence
      </div>

      <header className="border-b border-white/[0.06] bg-[#07080b]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">
              VINXA <span className="text-indigo-400 font-normal">LIVE</span>
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Session: {meeting.id}
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
        {/* Title Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              {Math.round(meeting.durationSeconds / 60)} minutes
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {meeting.title}
          </h1>
        </div>

        {/* Executive Summary */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-3">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Executive Summary</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {meeting.summary}
          </p>
        </section>

        {/* Key Decisions */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-3.5">
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Decisions</span>
          </h2>
          <div className="space-y-2">
            {(meeting.decisions || []).map((d, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300 p-3 rounded-2xl bg-white/[0.02]">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="leading-relaxed">{d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Items */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
          <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            <span>Action Items &amp; Responsibilities</span>
          </h2>
          <div className="space-y-2.5">
            {(meeting.actionItems || []).map((action) => (
              <div key={action.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3.5">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 ${action.completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-white font-medium">{action.task}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    Owner: <span className="text-indigo-300 font-semibold">{action.owner || 'Unassigned'}</span> • Deadline: {action.deadline || 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Diarized Transcript */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Full Diarized Transcript</h2>
          <div className="space-y-3.5">
            {(meeting.transcript || []).map((t, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm p-2 rounded-xl hover:bg-white/[0.02]">
                <span className="text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md shrink-0">
                  {t.time}
                </span>
                <div>
                  <span className={`font-bold mr-2 text-xs ${t.speaker === 'Speaker 2' ? 'text-purple-300' : 'text-indigo-300'}`}>
                    {t.speaker}:
                  </span>
                  <span className="text-slate-300 leading-relaxed">{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
