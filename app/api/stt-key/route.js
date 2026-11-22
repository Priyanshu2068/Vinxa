import { NextResponse } from 'next/server';

export async function GET() {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (deepgramKey) {
    return NextResponse.json({ available: true, key: deepgramKey, provider: 'deepgram' });
  }
  return NextResponse.json({ available: false, provider: 'native' });
}

