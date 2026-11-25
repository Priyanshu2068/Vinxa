'use client';
import { Bookmark, Square, Volume2, Users, Radio, Mic, MicOff } from 'lucide-react';

export default function RecordingBanner({
  durationSeconds,
  audioLevel,
  sources,
  currentSpeaker = 'Speaker 1',
  isMicMuted = false,
  onToggleMicMute,
  onToggleSpeaker,
  onAddHighlight,
  onStop
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel-elevated rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl shadow-black/60 border border-white/10">
        {/* Left: Recording Status & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-mono tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>REC</span>
            <span className="text-white ml-1">{formatTime(durationSeconds)}</span>
          </div>

          {/* Soundwave bars animated with audio level */}
          <div className="hidden sm:flex items-center gap-1 h-5 px-2">
            {[40, 75, 55, 90, 60, 45, 80].map((h, i) => {
              const activeHeight = Math.max(4, Math.round((h * (audioLevel || 20)) / 100));
              return (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full transition-all duration-75"
                  style={{ height: `${activeHeight}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* Center: Audio Source & Active Speaker Selector */}
        <div className="flex items-center gap-2">
          {/* Host Mic Mute Toggle */}
          <button
            onClick={onToggleMicMute}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
              isMicMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08] hover:border-indigo-500/40'
            }`}
            title={isMicMuted ? 'Your mic is MUTED. Click to unmute.' : 'Click to mute your mic (record only meeting tab/others)'}
          >
            {isMicMuted ? (
              <MicOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isMicMuted ? 'Mic Muted' : 'Mic On'}</span>
          </button>

          <button
            onClick={onToggleSpeaker}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-indigo-500/40 transition-all group"
            title="Click to toggle speaking turn"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>{currentSpeaker}</span>
            <span className="text-[10px] text-slate-500 ml-0.5">(Switch)</span>
          </button>

          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/[0.03] text-slate-400 border border-white/[0.06]">
            {sources.join(' + ')}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddHighlight}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
            title="Bookmark important moment with timestamp"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden xs:inline">Bookmark</span>
          </button>

          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Finish Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
