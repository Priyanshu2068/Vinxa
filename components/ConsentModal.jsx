'use client';
import { ShieldCheck, Check, X } from 'lucide-react';

export default function ConsentModal({ isOpen, onConfirm, onDeny }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel-elevated rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-white/10">
        <button
          onClick={onDeny}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Recording Consent
            </h3>
            <p className="text-xs text-slate-400">
              Enterprise Privacy &amp; Compliance Guard
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
          <p className="font-semibold text-white">
            Please confirm before starting the live session:
          </p>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Microphone and optional tab audio will be captured locally.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Real-time speech-to-text will stream live onto your screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Action items, key decisions, and executive summary auto-generate upon end.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>You retain full ownership; wipe data permanently anytime.</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onDeny}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
          >
            Allow &amp; Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
