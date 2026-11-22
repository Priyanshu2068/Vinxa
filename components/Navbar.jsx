'use client';
import Link from 'next/link';
import { Mic, Shield, Sparkles, FolderArchive } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-cyan-950/40 bg-[#0A191B]/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-300 flex items-center justify-center text-black font-extrabold shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                VINXA <span className="text-cyan-400 font-light">LIVE</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded-full">
                Web Track
              </span>
            </div>
            <p className="text-[11px] text-teal-300/60 font-medium">Enterprise Meeting Intelligence</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-cyan-950/30 border border-cyan-800/40 rounded-full text-xs text-cyan-200/80">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Consent & Privacy Guard Active</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-800/50 transition-colors"
          >
            <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Meetings</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

