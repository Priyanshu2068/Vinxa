import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { transcript, title } = await request.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const conversationText = transcript
      .map(t => `[${t.time || '00:00'}] ${t.speaker}: ${t.text}`)
      .join('\n');

    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    const grokKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();

    // 1. Primary Engine: Google Gemini 1.5 Flash (Ultra-fast, 1M context, native JSON)
    if (geminiKey) {
      try {
        const prompt = `You are Vinxa Live AI, an enterprise intelligence assistant. Analyze this exact meeting transcript and output strictly valid JSON with this exact schema:
{
  "summary": "Concise paragraph strictly summarizing what was actually discussed in this specific transcript.",
  "decisions": ["Clear decisions made based on this transcript (or empty array if none)"],
  "actionItems": [
    { "id": 1, "task": "Concrete task mentioned in speech", "owner": "Speaker or person named", "deadline": "Mentioned timeframe or Soon", "completed": false }
  ]
}

Meeting Transcript:
${conversationText}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.summary) {
            return NextResponse.json(parsed);
          }
        } else {
          const errDetail = await res.text();
          console.error('Gemini API Error (Status ' + res.status + '):', errDetail);
        }
      } catch (apiErr) {
        console.error('Gemini API call failed:', apiErr);
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
                content: 'You are Vinxa Live AI. You must respond strictly in JSON matching: {"summary": "string", "decisions": ["string"], "actionItems": [{"id": 1, "task": "string", "owner": "string", "deadline": "string", "completed": false}]}'
              },
              {
                role: 'user',
                content: `Analyze this transcript strictly:\n\n${conversationText}`
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (grokRes.ok) {
          const grokData = await grokRes.json();
          const parsed = JSON.parse(grokData.choices[0].message.content);
          return NextResponse.json(parsed);
        }
      } catch (grokErr) {
        console.error('Grok API call failed:', grokErr);
      }
    }

    // 3. Dynamic Natural Fallback (Extracts directly from the ACTUAL words spoken, never static fake text)
    const validLines = transcript.filter(t => t.text && t.text.trim().length > 0);
    const spokenSentences = validLines.map(t => t.text.trim());
    const firstSpeaker = validLines[0]?.speaker || 'Speaker 1';

    let dynamicSummary = '';
    if (spokenSentences.length === 0) {
      dynamicSummary = 'Brief audio session recorded. No audible speech segments detected in this transcript.';
    } else {
      dynamicSummary = `Discussion points captured for "${title || 'Meeting Sync'}": ` + spokenSentences.slice(0, 4).join(' ');
    }

    // Detect real decisions from actual words
    const decisionKeywords = ['agree', 'decid', 'will', 'plan', 'choose', 'confirm', 'final'];
    const dynamicDecisions = validLines
      .filter(line => decisionKeywords.some(k => line.text.toLowerCase().includes(k)))
      .map(line => `${line.speaker}: "${line.text}"`);

    if (dynamicDecisions.length === 0 && validLines.length > 0) {
      dynamicDecisions.push(`Aligned on: "${validLines[validLines.length - 1].text.slice(0, 90)}"`);
    }

    // Extract actual action items from spoken phrases
    const actionKeywords = ['need', 'must', 'have to', 'should', 'will', 'action', 'do', 'make', 'send', 'test', 'finish', 'complete'];
    const dynamicActionItems = validLines
      .filter(line => actionKeywords.some(k => line.text.toLowerCase().includes(k)))
      .slice(0, 4)
      .map((line, idx) => ({
        id: idx + 1,
        task: line.text,
        owner: line.speaker || firstSpeaker,
        deadline: 'Pending follow-up',
        completed: false
      }));

    if (dynamicActionItems.length === 0 && validLines.length > 0) {
      dynamicActionItems.push({
        id: 1,
        task: `Follow up on: "${validLines[0].text.slice(0, 80)}"`,
        owner: firstSpeaker,
        deadline: 'Next meeting',
        completed: false
      });
    }

    return NextResponse.json({
      summary: dynamicSummary,
      decisions: dynamicDecisions,
      actionItems: dynamicActionItems
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

