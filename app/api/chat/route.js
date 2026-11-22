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

    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    const grokKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();

    // 1. Primary Engine: Google Gemini 1.5 Flash
    if (geminiKey) {
      try {
        const prompt = `You are Vinxa Q&A Agent. Answer the user's question strictly using the meeting context provided below. If the answer is not mentioned, state clearly that it was not discussed. Keep answers professional and direct.

Context:
${contextText}

Question: ${question}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) return NextResponse.json({ answer });
        } else {
          console.error('Gemini Chat Error:', await res.text());
        }
      } catch (err) {
        console.error('Gemini chat failed:', err);
      }
    }

    // 2. Secondary Engine: Grok / xAI
    if (grokKey) {
      try {
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokKey}`
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content: `You are Vinxa Q&A Agent. Answer the user's question strictly using the meeting context provided below. If the answer is not mentioned, state clearly that it was not discussed. Keep answers professional and direct.\n\nContext:\n${contextText}`
              },
              { role: 'user', content: question }
            ],
            temperature: 0.3
          })
        });

        if (grokRes.ok) {
          const data = await grokRes.json();
          const answer = data.choices[0].message.content;
          return NextResponse.json({ answer });
        }
      } catch (grokErr) {
        console.warn('Grok chat failed', grokErr);
      }
    }

    // 3. Dynamic In-Context Search Fallback (strictly grounded in THIS meeting's transcript)
    const qLower = question.toLowerCase();
    const spokenLines = transcript || [];

    if (qLower.includes('decision') || qLower.includes('decide')) {
      const foundDecisions = decisions && decisions.length > 0
        ? `Decisions from this meeting:\n• ${decisions.join('\n• ')}`
        : 'No explicit decisions were recorded in this transcript.';
      return NextResponse.json({ answer: foundDecisions });
    }

    if (qLower.includes('action') || qLower.includes('task') || qLower.includes('todo') || qLower.includes('who')) {
      const foundActions = actionItems && actionItems.length > 0
        ? `Action items logged:\n` + actionItems.map(a => `• ${a.task} (${a.owner || 'Unassigned'})`).join('\n')
        : 'No specific action items were found in this conversation.';
      return NextResponse.json({ answer: foundActions });
    }

    // Search for matching words in the actual spoken transcript
    const searchTerms = qLower.split(/\s+/).filter(w => w.length > 3);
    const matched = spokenLines.filter(line => 
      searchTerms.some(term => line.text.toLowerCase().includes(term))
    );

    if (matched.length > 0) {
      const excerpts = matched.slice(0, 3).map(m => `[${m.time || '00:00'}] ${m.speaker}: "${m.text}"`).join('\n');
      return NextResponse.json({
        answer: `Here is what was said in the meeting regarding your question:\n${excerpts}`
      });
    }

    return NextResponse.json({
      answer: `This topic ("${question}") was not mentioned in this meeting transcript. The recorded discussion was: "${summary || (spokenLines[0] ? spokenLines[0].text : 'No speech recorded')}".`
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}

