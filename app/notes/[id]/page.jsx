'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { getMeetingById, saveMeeting, deleteMeeting } from '../../../lib/storage';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Trash2, 
  CheckSquare, 
  Square as SquareIcon, 
  Bookmark, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Printer, 
  Check, 
  FileText,
  CheckCircle2,
  ListTodo,
  Layers,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id;

  const [meeting, setMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'transcript'
  const [actionItems, setActionItems] = useState([]);
  
  // Q&A Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am Vinxa AI. Ask me anything about this meeting — like "What were the main topics?" or "Summarize the decisions."' }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const transcriptContainerRef = useRef(null);

  useEffect(() => {
    if (meetingId) {
      const found = getMeetingById(meetingId);
      if (found) {
        setMeeting(found);
        setActionItems(found.actionItems || []);
      }
    }
  }, [meetingId]);

  if (!meeting) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-4 max-w-sm">
            <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
            <p className="text-xs text-slate-400">This session recording may have been permanently deleted from storage.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs text-indigo-300 font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleActionItem = (id) => {
    const updated = actionItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setActionItems(updated);
    const updatedMeeting = { ...meeting, actionItems: updated };
    setMeeting(updatedMeeting);
    saveMeeting(updatedMeeting);
  };

  const handleAskQuestion = async (preset) => {
    const questionText = preset || inputQuestion;
    if (!questionText.trim()) return;

    const userMsg = { role: 'user', text: questionText };
    setChatMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsAnswering(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          transcript: meeting.transcript,
          summary: meeting.summary,
          decisions: meeting.decisions,
          actionItems: meeting.actionItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Could not fetch response. Please try again.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error contacting AI assistant.' }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${meeting.title}
Date: ${new Date(meeting.date).toLocaleString()}
Duration: ${Math.round(meeting.durationSeconds / 60)} minutes
Audio Sources: ${meeting.sources?.join(', ') || 'Microphone'}

---

## Executive Summary
${meeting.summary}

---

## Key Decisions
${(meeting.decisions || []).map(d => `- ${d}`).join('\n')}

---

## Action Items
${(meeting.actionItems || []).map(a => `- [${a.completed ? 'x' : ' '}] ${a.task} (Owner: ${a.owner}, Deadline: ${a.deadline})`).join('\n')}

---

## Full Diarized Transcript
${(meeting.transcript || []).map(t => `**[${t.time}] ${t.speaker}:** ${t.text}`).join('\n\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/\s+/g, '_')}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    let shareUrl = `${window.location.origin}/share/${meeting.id}`;
    try {
      const snapshot = {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        durationSeconds: meeting.durationSeconds,
        sources: meeting.sources,
        summary: meeting.summary,
        decisions: meeting.decisions,
        actionItems: meeting.actionItems,
        highlights: meeting.highlights,
        transcript: meeting.transcript?.slice(-50) || []
      };
      const encoded = encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(snapshot))));
      shareUrl = `${window.location.origin}/share/${meeting.id}?d=${encoded}`;
    } catch (err) {
      console.warn('URL compression fallback:', err);
    }

    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDelete = () => {
    if (confirm('Permanently delete this meeting recording and intelligence data?')) {
      deleteMeeting(meeting.id);
      router.push('/');
    }
  };

  const jumpToHighlight = (timeStr) => {
    setActiveTab('transcript');
    setTimeout(() => {
      const el = document.getElementById(`line-${timeStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-indigo-500/20');
        setTimeout(() => el.classList.remove('bg-indigo-500/20'), 2500);
      }
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-16">
      <Navbar />

      {/* Top Action Bar */}
      <div className="border-b border-white/[0.06] bg-[#07080b]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 sticky top-16 z-20 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </Link>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 hover:border-indigo-500/40 transition-all shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Markdown</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all ml-1"
              title="Delete Permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Header Information */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {new Date(meeting.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-md bg-white/[0.04]">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              {Math.round(meeting.durationSeconds / 60)} minutes
            </span>
            <span>•</span>
            <span className="text-slate-500">Sources: {meeting.sources?.join(', ') || 'Microphone'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {meeting.title}
          </h1>
        </div>

        {/* Highlights Row (if any) */}
        {meeting.highlights && meeting.highlights.length > 0 && (
          <div className="p-4 rounded-2xl glass-panel space-y-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              Bookmarked Highlights (Click to jump to transcript)
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {meeting.highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => jumpToHighlight(h.timestamp)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 text-slate-200 transition-all flex items-center gap-2"
                >
                  <span className="font-mono text-amber-400 font-bold">{h.timestamp}</span>
                  <span>{h.note}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] gap-6 text-sm font-semibold print:hidden">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 flex items-center gap-2 transition-colors relative ${
              activeTab === 'summary' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Summary &amp; Action Items</span>
            {activeTab === 'summary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 flex items-center gap-2 transition-colors relative ${
              activeTab === 'transcript' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Full Transcript ({meeting.transcript?.length || 0})</span>
            {activeTab === 'transcript' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: Summary & Action Items + AI Q&A Panel */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2 Cols): Executive Summary, Decisions, Action Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Executive Summary */}
              <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-3.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-wide uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {meeting.summary}
                </p>
              </section>

              {/* Key Decisions */}
              <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wide uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Decisions</span>
                </div>
                <div className="space-y-2.5">
                  {(meeting.decisions || []).map((decision, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-emerald-400 font-bold text-sm">✓</span>
                      <p className="text-sm text-slate-200 leading-relaxed">{decision}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Action Items with Checkboxes */}
              <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm tracking-wide uppercase">
                    <ListTodo className="w-4 h-4" />
                    <span>Action Items &amp; Responsibilities</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {actionItems.filter(a => a.completed).length} of {actionItems.length} completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {actionItems.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => toggleActionItem(action.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        action.completed 
                          ? 'bg-white/[0.01] border-white/[0.04] opacity-60' 
                          : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/[0.08]'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 text-slate-400 hover:text-white">
                        {action.completed ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <SquareIcon className="w-5 h-5 text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-medium ${action.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {action.task}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            {action.owner || 'Unassigned'}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Due: {action.deadline || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column (1 Col): "Ask Vinxa" Q&A Assistant */}
            <div className="rounded-3xl glass-panel-elevated p-6 flex flex-col h-[600px] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ask Vinxa Copilot</h3>
                  <p className="text-[11px] text-slate-400">Contextual intelligence from meeting</p>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'ml-auto bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20'
                        : 'mr-auto bg-white/[0.03] border border-white/[0.06] text-slate-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isAnswering && (
                  <div className="mr-auto p-3.5 rounded-2xl bg-white/[0.03] text-indigo-300 text-xs italic animate-pulse">
                    Vinxa is analyzing transcript context...
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              <div className="py-2.5 flex flex-wrap gap-1.5 border-t border-white/[0.06]">
                <button
                  onClick={() => handleAskQuestion('What were the main topics discussed in this meeting?')}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 border border-white/[0.08] transition-colors"
                >
                  &quot;Main topics?&quot;
                </button>
                <button
                  onClick={() => handleAskQuestion('List all action items and next steps with owners')}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 border border-white/[0.08] transition-colors"
                >
                  &quot;Action items?&quot;
                </button>
                <button
                  onClick={() => handleAskQuestion('What decisions were confirmed during the call?')}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 border border-white/[0.08] transition-colors"
                >
                  &quot;Decisions?&quot;
                </button>
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ask a question about this meeting..."
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  className="flex-1 bg-white/[0.03] border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Diarized Transcript */}
        {activeTab === 'transcript' && (
          <div ref={transcriptContainerRef} className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Acoustic Speaker Diarization &amp; Timeline</span>
              <span className="font-mono">{meeting.transcript?.length || 0} transcript segments</span>
            </div>

            <div className="space-y-4">
              {(meeting.transcript || []).map((t, idx) => (
                <div
                  key={idx}
                  id={`line-${t.time}`}
                  className="p-4 rounded-2xl hover:bg-white/[0.02] transition-colors flex items-start gap-4 group"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    t.speaker === 'Speaker 2' 
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' 
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                  }`}>
                    {t.speaker === 'Speaker 2' ? 'S2' : 'S1'}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{t.speaker}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                        {t.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {t.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
