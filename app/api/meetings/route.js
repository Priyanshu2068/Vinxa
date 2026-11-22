import { NextResponse } from 'next/server';
import { sampleMeetings } from '../../../lib/storage';

// Global serverless in-memory store (persists across warm function invocations)
if (!global.__vinxa_store) {
  global.__vinxa_store = new Map();
  // Preload sample meetings
  sampleMeetings.forEach(m => global.__vinxa_store.set(m.id, m));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const meeting = global.__vinxa_store.get(id);
    if (meeting) {
      return NextResponse.json(meeting);
    }
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const list = Array.from(global.__vinxa_store.values());
  return NextResponse.json(list);
}

export async function POST(request) {
  try {
    const meeting = await request.json();
    if (!meeting || !meeting.id) {
      return NextResponse.json({ error: 'Invalid meeting data' }, { status: 400 });
    }

    global.__vinxa_store.set(meeting.id, meeting);
    return NextResponse.json({ success: true, id: meeting.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save meeting' }, { status: 500 });
  }
}

