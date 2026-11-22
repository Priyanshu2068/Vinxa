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
  Copy, 
  Check, 
  Radio
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
    { role: 'assistant', text: 'Hello! I am Vinxa AI. Ask me anything about this meeting — like "What were the key decisions?" or "What did we decide on pricing?"' }
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
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
            <p className="text-xs text-slate-400 mt-2">This meeting might have been permanently deleted.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cyan-950 border border-cyan-800 rounded-xl text-xs text-cyan-300 font-semibold"
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
    const shareUrl = `${window.location.origin}/share/${meeting.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDelete = () => {
    if (confirm('Permanent Delete: Are you sure? This recording, notes, and transcript will be permanently wiped from the database.')) {
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
        el.classList.add('bg-cyan-500/20');
        setTimeout(() => el.classList.remove('bg-cyan-500/20'), 2000);
      }
    }, 100);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar />

      {/* Top Controls Bar */}
      <div className="border-b border-cyan-950/60 bg-[#09181a]/90 backdrop-blur-md px-4 lg:px-8 py-4 sticky top-[61px] z-20 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Shareable Link'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800/40 transition-colors ml-2"
              title="Delete Permanently"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 flex-1">
        {/* Header Information */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-cyan-300/70 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {new Date(meeting.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {Math.round(meeting.durationSeconds / 60)} minutes
            </span>
            <span>•</span>
            <span>Sources: {meeting.sources?.join(', ') || 'Microphone'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {meeting.title}
          </h1>
        </div>

        {/* Highlights Row (if any) */}
        {meeting.highlights && meeting.highlights.length > 0 && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              Marked Highlights (Click to jump to transcript)
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {meeting.highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => jumpToHighlight(h.timestamp)}
                  className="px-3 py-1 rounded-lg text-xs bg-[#0b1e21] hover:bg-cyan-900/50 border border-cyan-800/60 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <span className="font-mono text-cyan-400 font-bold">{h.timestamp}</span>
                  <span>— {h.note}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-950 gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'summary'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            AI Summary & Action Items
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'transcript'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Full Diarized Transcript ({meeting.transcript?.length || 0} lines)
          </button>
        </div>

        {/* TAB 1: Summary, Decisions, Action Items & Ask Vinxa Q&A */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Executive Summary */}
              <div className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Executive Summary</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {meeting.summary}
                </p>
              </div>

              {/* Key Decisions */}
              <div className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Key Decisions</span>
                </h3>
                <ul className="space-y-2">
                  {(meeting.decisions || []).map((decision, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="p-6 rounded-2xl bg-[#0d2225] border border-cyan-950 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Action Items ({actionItems.filter(a => a.completed).length}/{actionItems.length} completed)</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {actionItems.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => toggleActionItem(action.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        action.completed
                          ? 'bg-[#081517] border-cyan-950 opacity-60'
                          : 'bg-[#10292c] border-cyan-900/60 hover:border-cyan-500/40'
                      }`}
                    >
                      <button className="mt-0.5 text-cyan-400">
                        {action.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <SquareIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${action.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {action.task}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                          <span>Owner: <strong className="text-cyan-300">{action.owner}</strong></span>
                          <span>•</span>
                          <span>Deadline: {action.deadline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: "Ask Vinxa" Q&A Assistant */}
            <div className="p-6 rounded-2xl bg-[#0b1c1e] border border-cyan-500/30 flex flex-col h-[560px] shadow-xl">
              <div className="flex items-center gap-2 pb-4 border-b border-cyan-950">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ask Vinxa (Meeting Q&A)</h3>
                  <p className="text-[10px] text-cyan-300/70">Context-grounded answers from transcript</p>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'ml-auto bg-cyan-950 border border-cyan-700 text-cyan-100 font-medium'
                        : 'mr-auto bg-[#081517] border border-cyan-950 text-slate-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isAnswering && (
                  <div className="mr-auto p-3 rounded-xl bg-[#081517] text-cyan-400 text-xs italic animate-pulse">
                    Vinxa is reading meeting context...
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              <div className="py-2 flex flex-wrap gap-1.5 border-t border-cyan-950">
                <button
                  onClick={() => handleAskQuestion('What did we decide on pricing?')}
                  className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-[10px] text-cyan-300 border border-cyan-800/40"
                >
                  &quot;Pricing decision?&quot;
                </button>
                <button
                  onClick={() => handleAskQuestion('List all action items with owners')}
                  className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-[10px] text-cyan-300 border border-cyan-800/40"
                >
                  &quot;Action items?&quot;
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
                  className="flex-1 bg-[#071315] border border-cyan-950 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Diarized Transcript */}
        {activeTab === 'transcript' && (
          <div ref={transcriptContainerRef} className="p-6 rounded-2xl bg-[#091719] border border-cyan-950 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950 text-xs text-slate-400">
              <span>Timestamp &amp; Speaker Tagging</span>
              <span>Total Lines: {meeting.transcript?.length || 0}</span>
            </div>

            <div className="space-y-4">
              {(meeting.transcript || []).map((t, idx) => (
                <div
                  key={idx}
                  id={`line-${t.time}`}
                  className="p-3 rounded-xl hover:bg-cyan-950/30 transition-colors flex items-start gap-4"
                >
                  <span className="text-xs font-mono font-bold text-cyan-400/90 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-900 shrink-0">
                    {t.time}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-teal-300 mr-2">
                      {t.speaker}:
                    </span>
                    <span className="text-sm text-slate-200 leading-relaxed">
                      {t.text}
                    </span>
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
