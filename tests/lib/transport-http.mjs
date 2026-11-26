// Real server over HTTP (CONTRACT.md "Client → server API").
// env: FN_URL, ANON_KEY
export function httpTransport({ url = process.env.FN_URL, anon = process.env.ANON_KEY } = {}) {
  if (!url) throw new Error("FN_URL not set");
  async function call(body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 200)}` }; }
  }
  return { call, kind: "http" };
}
