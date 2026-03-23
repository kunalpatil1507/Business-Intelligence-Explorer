const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', {
          status: 405,
          headers: CORS
        });
      }

      const body = await request.json();

      // ✅ validation
      if (!body || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({ error: "Invalid request format" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS }
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.XAI_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-3-fast',
          messages: body.messages
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: "xAI API error",
          status: response.status
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...CORS }
        });
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }
  }
};