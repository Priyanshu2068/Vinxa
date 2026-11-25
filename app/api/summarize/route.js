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
        const prompt = `You are Vinxa Executive Intelligence Engine. Your job is to extract 100% accurate, high-fidelity meeting minutes from the provided transcript.

STRICT ACCURACY RULES:
1. Grounding & Anti-Hallucination: Extract ONLY what was explicitly stated or agreed upon in the transcript. Do NOT invent facts, technologies, tasks, or timelines that were not spoken.
2. Ignore Casual Banter: Filter out mic checks ("am I audible?", "can you hear me?"), greetings, and filler remarks.
3. Summary: Provide a sharp, professional 2-3 sentence executive synthesis explaining the core objective, main discussion points, and end status.
4. Decisions: List specific decisions confirmed by participants (e.g. "Agreed to use Next.js", "Approved Q3 budget"). If no concrete decisions were made, return an empty array [].
5. Action Items: Extract concrete, actionable commitments.
   - "task": Start with an active imperative verb (e.g. "Prepare client proposal", "Fix login race condition").
   - "owner": Attribute specifically to the speaker (e.g. "Speaker 1", "Speaker 2") or person named who took ownership or was assigned.
   - "deadline": Exact timeframe mentioned (e.g., "by Friday", "tomorrow 2 PM", "next sprint"). If no timeline was mentioned, use "TBD / Next sync".
   - "completed": false

Output strictly valid JSON with this exact schema:
{
  "summary": "Executive summary paragraph...",
  "decisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    {
      "id": 1,
      "task": "Concrete task description",
      "owner": "Speaker 1 / Name",
      "deadline": "Timeframe or TBD / Next sync",
      "completed": false
    }
  ]
}

Meeting Transcript:
${conversationText}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              topP: 0.8
            }
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

