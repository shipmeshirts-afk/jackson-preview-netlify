// netlify/functions/generate.js
export async function handler(event) {
  try {
    const isGet = event.httpMethod === "GET";
    const params = isGet ? (event.queryStringParameters || {}) : JSON.parse(event.body || "{}");
    let { prompt = "", style = "", size = "1024x1024", seed = "" } = params;

    const clean = (s) => (s || "").toString().trim();
    prompt = clean(prompt); style = clean(style); size = clean(size); seed = clean(seed);

    const keywords = encodeURIComponent(`${prompt} ${style}`.trim() || "logo");
    const sig = seed || Math.floor(Math.random() * 1e9);
    const url = `https://source.unsplash.com/${size}/?${keywords}&sig=${sig}`;
    const fallback = `https://picsum.photos/seed/${encodeURIComponent((prompt||"logo")+"-"+sig)}/${size.replace("x","/")}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ url, fallback })
    };
  } catch (err) {
    return { statusCode: 400, body: err?.message || "Bad Request" };
  }
}
