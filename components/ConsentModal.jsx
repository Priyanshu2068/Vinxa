'use client';
import { AlertCircle, ShieldCheck, X } from 'lucide-react';

export default function ConsentModal({ isOpen, onConfirm, onDeny }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e2124] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-cyan-950/50 relative">
        <button
          onClick={onDeny}
          className="absolute top-4 right-4 text-cyan-200/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Meeting Recording Consent
            </h3>
            <p className="text-xs text-cyan-300/70 mt-1">
              Required by Vinxa Enterprise Privacy & Compliance Guard
            </p>
          </div>
        </div>

        <div className="my-5 p-3.5 bg-[#091618] border border-cyan-950 rounded-xl space-y-2 text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-cyan-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            Is meeting ko record aur transcribe kiya jaayega:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li>Microphone and optional shared tab audio will be processed.</li>
            <li>Real-time speech-to-text transcript will be generated live.</li>
            <li>AI will extract decisions and action items upon completion.</li>
            <li>You can permanently delete this recording anytime.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onDeny}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Deny & Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-lg shadow-cyan-400/20 active:scale-95"
          >
            Allow & Start Recording
          </button>
        </div>
      </div>
    </div>
  );
}

