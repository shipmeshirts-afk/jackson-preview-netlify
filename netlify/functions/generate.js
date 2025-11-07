// netlify/functions/generate.js
// Uses OpenAI Images if OPENAI_API_KEY is set, else falls back to placeholder URLs.

const SIZE_MAP = new Set(["1024x1024", "1024x1536", "1536x1024", "512x512", "2048x2048"]);

exports.handler = async (event) => {
  try {
    const isGet = event.httpMethod === "GET";
    const params = isGet ? (event.queryStringParameters || {}) : JSON.parse(event.body || "{}");

    let prompt = (params.prompt || "").toString().trim();
    const style = (params.style || "").toString().trim();
    const size = SIZE_MAP.has((params.size || "").toString()) ? params.size.toString() : "1024x1024";
    const seed = (params.seed || "").toString().trim();

    const [w, h] = size.split("x").map(n => parseInt(n, 10) || 1024);

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY && prompt) {
      const guidedPrompt = `${style || "clean vector logo"}, flat colors, high contrast, simple shapes, crisp edges, no background, centered mark; ${prompt}`;

      try {
        const resp = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: guidedPrompt,
            size: `${w}x${h}`,
            response_format: "b64_json",
          }),
        });

        if (!resp.ok) {
          const msg = await resp.text();
          throw new Error(`OpenAI error ${resp.status}: ${msg}`);
        }

        const data = await resp.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
            body: JSON.stringify({ dataUrl: `data:image/png;base64,${b64}` })
          };
        }
      } catch(err) {
        console.error("OpenAI generation failed:", err);
      }
    }

    // ---- FALLBACK ----
    const encoded = encodeURIComponent(`${prompt} ${style}`.trim());
    const fallback = `https://picsum.photos/seed/${encoded}/${w}/${h}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ fallback })
    };

  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message || "Bad Request" }),
    };
  }
};
