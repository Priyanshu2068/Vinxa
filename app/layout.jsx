import './globals.css';

export const metadata = {
  title: 'Vinxa Live — AI Meeting Intelligence & Real-time Notetaker',
  description: 'Ultra-fast speech transcription, speaker diarization, executive summaries, and action items for high-performance teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07080b] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
