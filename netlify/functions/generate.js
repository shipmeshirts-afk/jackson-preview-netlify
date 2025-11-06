// netlify/functions/generate.js
export async function handler(event) {
  try {
    const { prompt = "", style = "", size = "1024x1024", seed = "" } = JSON.parse(event.body || "{}");
    const keywords = encodeURIComponent(`${prompt} ${style}`.trim());
    const url = `https://source.unsplash.com/${size}/?${keywords}&sig=${seed || Math.floor(Math.random()*1e9)}`;
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) };
  } catch (err) {
    return { statusCode: 400, body: err?.message || "Bad Request" };
  }
}
