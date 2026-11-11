export default async (request) => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  const send = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method !== 'POST') return send({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send({ error: 'GEMINI_API_KEY is missing in Netlify environment variables. Save it and redeploy.' }, 503);

  try {
    const body = await request.json();
    const history = Array.isArray(body.history) ? body.history.filter(item => !(item?.role === 'assistant' && String(item.text || '').startsWith('Connection error:'))).slice(-6) : [];
    const contents = history
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && String(item.text || '').trim())
      .map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(item.text).slice(0, 8000) }]
      }));

    // Gemini conversation history must begin with a user turn.
    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) return send({ error: 'Please send a message first.' }, 400);

    const result = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: 'You are NEXUS, a helpful personal AI assistant inside NEXUS AI OS. Be clear, practical, honest, and concise. Do not claim to have performed actions outside this chat. Ask for confirmation before consequential actions.' }]
        },
        contents,
        // Gemini 3.8 Flash uses its default thinking/sampling settings.
        generationConfig: { maxOutputTokens: 1024, thinkingConfig: { thinkingLevel: 'low' } }
      })
    });

    const raw = await result.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { return send({ error: 'Gemini returned a non-JSON response (HTTP ' + result.status + '). ' + raw.slice(0, 500) }, 502); }

    if (!result.ok) {
      const detail = data?.error?.message || data?.message || JSON.stringify(data);
      console.error('Gemini API error', result.status, detail);
      return send({ error: 'Gemini API HTTP ' + result.status + ': ' + detail }, result.status);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!reply) {
      console.error('Gemini response had no text', JSON.stringify(data).slice(0, 1500));
      return send({ error: 'Gemini responded but did not return text. Check the prompt or safety response.' }, 502);
    }
    return send({ reply });
  } catch (error) {
    console.error('NEXUS function error', error);
    return send({ error: error?.message || 'Unexpected server error.' }, 500);
  }
};
