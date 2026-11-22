import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, transcript, summary, decisions, actionItems } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const contextText = `
Meeting Summary:
${summary || 'N/A'}

Key Decisions:
${(decisions || []).join('\n')}

Action Items:
${(actionItems || []).map(a => `- ${a.task} (Owner: ${a.owner}, Deadline: ${a.deadline})`).join('\n')}

Full Transcript:
${(transcript || []).map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n')}
`;

    // If Gemini Key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are Vinxa Q&A Agent. Answer the user's question strictly using the meeting context provided below. If the answer is not mentioned, state clearly that it was not discussed. Keep answers professional and direct.

Context:
${contextText}

Question: ${question}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          return NextResponse.json({ answer });
        }
      } catch (err) {
        console.warn('Gemini chat failed, falling back to local context search', err);
      }
    }

    // Smart Local In-Context Search Fallback
    const qLower = question.toLowerCase();
    let answer = '';

    if (qLower.includes('decision') || qLower.includes('decide')) {
      answer = decisions && decisions.length > 0 
        ? `Here are the key decisions from the meeting:\n• ${decisions.join('\n• ')}`
        : 'No specific decisions were finalized during this call.';
    } else if (qLower.includes('action') || qLower.includes('todo') || qLower.includes('task') || qLower.includes('who')) {
      answer = actionItems && actionItems.length > 0
        ? `Here are the assigned action items:\n` + actionItems.map(a => `• ${a.task} — Assigned to: ${a.owner} (${a.deadline})`).join('\n')
        : 'No specific action items were logged.';
    } else if (qLower.includes('pricing') || qLower.includes('cost') || qLower.includes('money')) {
      const match = (transcript || []).find(t => t.text.toLowerCase().includes('pricing') || t.text.toLowerCase().includes('cost'));
      answer = match 
        ? `Regarding pricing, ${match.speaker} noted: "${match.text}".`
        : 'Pricing was not explicitly debated in this session; the team prioritized core execution first.';
    } else {
      // Find closest matching transcript line
      const words = qLower.split(' ').filter(w => w.length > 3);
      const matched = (transcript || []).filter(t => words.some(w => t.text.toLowerCase().includes(w)));
      if (matched.length > 0) {
        answer = `Based on the discussion, ${matched[0].speaker} mentioned: "${matched[0].text}".`;
      } else {
        answer = `Summary of context: ${summary ? summary.slice(0, 200) + '...' : 'The conversation focused on sprint deliverables and product setup.'}`;
      }
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}

