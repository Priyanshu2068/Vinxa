import { NextResponse } from 'next/server';

export async function GET() {
  const keys = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 5)}... (len: ${process.env.GEMINI_API_KEY.length})` : 'MISSING',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 5)}... (len: ${process.env.GOOGLE_API_KEY.length})` : 'MISSING',
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? `${process.env.NEXT_PUBLIC_GEMINI_API_KEY.substring(0, 5)}...` : 'MISSING',
    GROK_API_KEY: process.env.GROK_API_KEY ? 'PRESENT' : 'MISSING',
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY ? 'PRESENT' : 'MISSING',
  };

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  let geminiTest = 'Not attempted';

  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in 2 words.' }] }]
        })
      });
      const data = await res.text();
      geminiTest = {
        status: res.status,
        ok: res.ok,
        bodyPreview: data.substring(0, 200)
      };
    } catch (err) {
      geminiTest = { error: err.message };
    }
  }

  return NextResponse.json({
    keys,
    geminiTest
  });
}
