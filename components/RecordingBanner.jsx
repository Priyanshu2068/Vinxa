'use client';
import { Bookmark, Square, Volume2 } from 'lucide-react';

export default function RecordingBanner({
  durationSeconds,
  audioLevel,
  sources,
  onAddHighlight,
  onStop
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-[61px] z-30 bg-red-950/70 border-b border-red-500/40 backdrop-blur-md px-4 py-3 shadow-lg shadow-red-950/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Blinking Red Indicator & Timer */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute opacity-75" />
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 relative shadow-md shadow-red-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-red-300">
                LIVE RECORDING ACTIVE
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-900/60 text-white border border-red-700/50">
                {formatTime(durationSeconds)}
              </span>
            </div>
            <p className="text-[10px] text-red-200/60 mt-0.5">
              Audio Sources: {sources.join(' + ')}
            </p>
          </div>
        </div>

        {/* Center: Live Audio Level Bar */}
        <div className="hidden md:flex items-center gap-2 bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-800/30">
          <Volume2 className="w-3.5 h-3.5 text-red-300" />
          <div className="w-24 h-2 bg-red-950 rounded-full overflow-hidden border border-red-900">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-red-400 transition-all duration-75"
              style={{ width: `${Math.max(8, audioLevel)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-red-300/80">{audioLevel}%</span>
        </div>

        {/* Right: Actions (Highlight moment & Stop) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onAddHighlight}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/40 transition-colors shadow-sm"
            title="Mark this key moment in the transcript"
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
            <span>Highlight Moment</span>
          </button>

          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/40 transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>End Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
}

