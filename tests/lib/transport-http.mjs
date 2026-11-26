// Real server over HTTP (CONTRACT.md "Client → server API"). Works in Node and in a browser.
// Node env: FN_URL, ANON_KEY. Records each call's round-trip time in .timings (ms).
export function httpTransport({ url, anon } = {}) {
  const env = typeof process !== "undefined" ? process.env : {};
  url = url || env.FN_URL;
  anon = anon || env.ANON_KEY;
  if (!url) throw new Error("FN_URL not set");
  const timings = [];
  async function call(body) {
    const t0 = performance.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    timings.push({ action: body.action, ms: performance.now() - t0, bytes: txt.length });
    try { return JSON.parse(txt); } catch { return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 200)}` }; }
  }
  return { call, timings, kind: "http" };
}
