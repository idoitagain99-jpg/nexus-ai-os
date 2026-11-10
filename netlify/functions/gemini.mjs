export default async (request) => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Gemini API key is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  try {
    const body = await request.json();
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const contents = history.map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(item.text || '').slice(0, 8000) }] })).filter(item => item.parts[0].text);
    if (!contents.length) return new Response(JSON.stringify({ error: 'Message is empty.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const result = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ system_instruction: { parts: [{ text: 'You are NEXUS, a helpful personal AI assistant inside NEXUS AI OS. Be clear, practical, honest, and concise. Do not claim to have performed actions outside this chat. Ask for confirmation before consequential actions.' }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }) });
    const data = await result.json();
    if (!result.ok) return new Response(JSON.stringify({ error: data?.error?.message || 'Gemini service returned an error.' }), { status: result.status, headers: { 'Content-Type': 'application/json' } });
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!reply) throw new Error('Gemini returned an empty response.');
    return new Response(JSON.stringify({ reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
