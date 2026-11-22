import './globals.css';

export const metadata = {
  title: 'Vinxa Live — AI Meeting Notetaker & Enterprise Intelligence',
  description: 'Real-time dual-audio speech transcription, speaker diarization, AI summaries and action items for teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#081315] text-[#E6F1F2] antialiased selection:bg-[#07D2E0]/30 selection:text-[#07D2E0]">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
