import { NextResponse } from 'next/server';

export async function GET() {
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

  // Test ListModels on v1beta and v1
  let v1betaList = null;
  let v1List = null;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    v1betaList = {
      status: res.status,
      body: await res.json()
    };
  } catch (e) {
    v1betaList = { error: e.message };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`);
    v1List = {
      status: res.status,
      body: await res.json()
    };
  } catch (e) {
    v1List = { error: e.message };
  }

  return NextResponse.json({
    keyPrefix: geminiKey.substring(0, 8),
    keyLength: geminiKey.length,
    v1betaList,
    v1List
  });
}
