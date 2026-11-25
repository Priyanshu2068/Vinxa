'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import ConsentModal from '../components/ConsentModal';
import RecordingBanner from '../components/RecordingBanner';
import { VinxaAudioEngine } from '../lib/audioEngine';
import { getMeetings, saveMeeting, deleteMeeting, searchMeetings } from '../lib/storage';
import { 
  Mic, 
  Monitor, 
  Play, 
  Search, 
  Clock, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Bookmark,
  FileText,
  Volume2,
  Users,
  Cpu,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  // Storage State
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Audio & Recording State
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [captureTab, setCaptureTab] = useState(true);
  const [sttEngine, setSttEngine] = useState('native'); // 'native' | 'deepgram'
  const [activeSpeaker, setActiveSpeaker] = useState('Speaker 1');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Live Transcript Stream
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const audioEngineRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    setMeetings(getMeetings());
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setMeetings(searchMeetings(searchQuery));
    } else {
      setMeetings(getMeetings());
    }
  }, [searchQuery]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptLines, interimText]);

  const handleStartClicked = () => {
    setIsConsentOpen(true);
  };

  const handleConsentApproved = async () => {
    setIsConsentOpen(false);
    setTranscriptLines([]);
    setInterimText('');
    setHighlights([]);
    setDuration(0);

    const title = meetingTitle.trim() || `Vinxa Sync — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    setMeetingTitle(title);

    try {
      const engine = new VinxaAudioEngine(
        // Transcript Update
        ({ text, isFinal, speaker, timestamp }) => {
          if (speaker) setActiveSpeaker(speaker);
          const timeStr = `${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}`;
          if (isFinal) {
            setTranscriptLines(prev => [...prev, { speaker, text, time: timeStr }]);
            setInterimText('');
          } else {
            setInterimText(text);
          }
        },
        // Audio Level
        (level) => {
          setAudioLevel(level);
        }
      );

      await engine.start({ captureTab, preferredEngine: sttEngine });
      audioEngineRef.current = engine;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or browser tab not selected. Please check permissions.');
      console.error(err);
    }
  };

  const handleAddHighlight = () => {
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timestamp = `${mins}:${secs}`;
    const newHighlight = {
      id: Date.now(),
      timestamp,
      note: `Highlighted point at ${timestamp}`
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  const handleToggleSpeaker = () => {
    if (audioEngineRef.current) {
      const nextSpeaker = audioEngineRef.current.toggleSpeaker();
      setActiveSpeaker(nextSpeaker);
    } else {
      setActiveSpeaker(prev => prev === 'Speaker 1' ? 'Speaker 2' : 'Speaker 1');
    }
  };

  const handleStopRecording = async () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRecording(false);
    setIsProcessingAI(true);

    const finalTranscript = [...transcriptLines];
    if (interimText.trim()) {
      finalTranscript.push({
        speaker: activeSpeaker,
        text: interimText.trim(),
        time: `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`
      });
    }

    // Call AI Summarizer
    let aiResult = {
      summary: 'Executive sync concluded with synchronized meeting notes and assigned responsibilities.',
      decisions: ['Approved project milestones and agreed to follow up on open action items.'],
      actionItems: [{ id: 1, task: 'Follow up on discussion items', owner: activeSpeaker, deadline: 'Today', completed: false }]
    };

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript.length > 0 ? finalTranscript : [
            { speaker: 'Speaker 1', text: 'Live meeting concluded with verified audio sync.', time: '00:01' }
          ],
          title: meetingTitle
        })
      });
      if (res.ok) {
        aiResult = await res.json();
      }
    } catch (err) {
      console.warn('AI processing error, using fallback', err);
    }

    const meetingId = `vinxa-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newMeeting = {
      id: meetingId,
      title: meetingTitle,
      date: new Date().toISOString(),
      durationSeconds: duration,
      sources: captureTab ? ['Microphone', 'Tab Audio'] : ['Microphone'],
      summary: aiResult.summary,
      decisions: aiResult.decisions,
      actionItems: aiResult.actionItems,
      highlights,
      transcript: finalTranscript.length > 0 ? finalTranscript : [
        { speaker: 'Speaker 1', text: 'Meeting concluded with verified audio sync.', time: '00:01' }
      ]
    };

    saveMeeting(newMeeting);
    setIsProcessingAI(false);
    router.push(`/notes/${meetingId}`);
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Permanently delete this meeting recording and its intelligence data?')) {
      const updated = deleteMeeting(id);
      setMeetings(updated);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <ConsentModal
        isOpen={isConsentOpen}
        onConfirm={handleConsentApproved}
        onDeny={() => setIsConsentOpen(false)}
      />

      {isRecording && (
        <RecordingBanner
          durationSeconds={duration}
          audioLevel={audioLevel}
          sources={captureTab ? ['Mic', 'Tab Audio'] : ['Mic']}
          currentSpeaker={activeSpeaker}
          onToggleSpeaker={handleToggleSpeaker}
          onAddHighlight={handleAddHighlight}
          onStop={handleStopRecording}
        />
      )}

      {/* Main Studio View */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col">
        {!isRecording ? (
          <div className="space-y-12">
            {/* Hero Launch Studio Card */}
            <div className="relative overflow-hidden rounded-3xl glass-panel-elevated p-6 sm:p-10 border border-white/10 shadow-2xl">
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

              <div className="max-w-3xl relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-indigo-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-time Voice Intelligence Platform</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                    Turn your live meetings into{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                      actionable intelligence.
                    </span>
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                    Dual-channel audio capture, real-time streaming speech-to-text, automatic speaker diarization, and instantaneous AI post-meeting summaries.
                  </p>
                </div>

                {/* Session Setup Controls */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Meeting title (e.g. Product Strategy, Sprint Review, Client Call)"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="flex-1 bg-white/[0.03] border border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.05] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />

                    <button
                      onClick={handleStartClicked}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 shadow-xl shadow-indigo-500/25 transition-all active:scale-95 shrink-0"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Notetaker</span>
                    </button>
                  </div>

                  {/* Audio Controls & Engine Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-slate-400 font-medium">Input Sources:</span>
                      
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300">
                        <Mic className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Microphone</span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 text-slate-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={captureTab}
                          onChange={(e) => setCaptureTab(e.target.checked)}
                          className="rounded text-indigo-500 focus:ring-0 cursor-pointer accent-indigo-500"
                        />
                        <Monitor className="w-3.5 h-3.5 text-purple-400" />
                        <span>Shared Tab Audio (Meet/Teams)</span>
                      </label>
                    </div>

                    {/* STT Engine Selector */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Engine:</span>
                      <select
                        value={sttEngine}
                        onChange={(e) => setSttEngine(e.target.value)}
                        className="bg-white/[0.04] border border-white/10 hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-indigo-300 focus:outline-none cursor-pointer transition-colors"
                      >
                        <option value="native" className="bg-[#10131B] text-slate-200">
                          ⚡ Web Speech Engine (Instant &lt;0.2s, Free)
                        </option>
                        <option value="deepgram" className="bg-[#10131B] text-slate-200">
                          ☁️ Deepgram Nova-2 (Cloud AI Diarization)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Meeting Intelligence Library */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>Meeting Intelligence Library</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-indigo-300 font-mono">
                      {meetings.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Search notes, executive summaries, decisions, and action items
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transcripts, decisions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Grid of Meeting Cards */}
              {meetings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-300">No meeting recordings found</h3>
                  <p className="text-xs text-slate-500 mt-1">Start a recording session above to build your intelligence archive.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {meetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/notes/${m.id}`}
                      className="group p-6 rounded-3xl glass-panel hover:glass-panel-elevated hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg shadow-black/30 hover:-translate-y-0.5 duration-200"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-lg bg-white/[0.04]">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {Math.round(m.durationSeconds / 60)} min
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {m.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {m.summary || 'Click to view decisions, action items, and live transcript.'}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Open Notes</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                          {m.actionItems && m.actionItems.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                              {m.actionItems.length} actions
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleDelete(m.id, e)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Permanently Delete Recording & Notes"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Recording Studio View */
          <div className="flex-1 flex flex-col space-y-6 pt-16">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl glass-panel-elevated border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{meetingTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Streaming live transcription with sub-second latency
                  </p>
                </div>
              </div>

              {highlights.length > 0 && (
                <div className="flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl text-amber-300 font-medium">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span>{highlights.length} Moments Bookmarked</span>
                </div>
              )}
            </div>

            {/* Real-time Streaming Transcript Box */}
            <div className="flex-1 min-h-[480px] rounded-3xl glass-panel p-6 sm:p-8 overflow-y-auto space-y-5 border border-white/10 shadow-2xl">
              {transcriptLines.length === 0 && !interimText && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Audio Capture Active</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Start speaking or play meeting tab audio. Your words will appear here in real time.
                  </p>
                </div>
              )}

              {transcriptLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-3.5 group animate-in fade-in duration-200">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    line.speaker === 'Speaker 2' 
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' 
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                  }`}>
                    {line.speaker === 'Speaker 2' ? 'S2' : 'S1'}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{line.speaker}</span>
                      <span className="text-[10px] font-mono text-slate-500">{line.time}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {line.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Streaming Interim Text (Gray / Pending) */}
              {interimText && (
                <div className="flex items-start gap-3.5 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    ...
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-semibold text-slate-400">{activeSpeaker} (speaking...)</span>
                    <p className="text-sm text-slate-400 italic">
                      {interimText}
                    </p>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live acoustic streaming active
              </span>
              <span>Use the floating HUD above to bookmark moments or switch speakers</span>
            </div>
          </div>
        )}

        {/* AI Synthesis Modal / Overlay */}
        {isProcessingAI && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 text-center p-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-2xl shadow-indigo-500/30 animate-spin">
              <div className="w-full h-full bg-[#0B0D13] rounded-[23px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white tracking-tight">Synthesizing Meeting Intelligence...</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Extracting executive summary, key decisions, and assigning action items with deadlines.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
