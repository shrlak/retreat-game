// Runs the REAL server/handler.js in-process, with an in-memory fake of Supabase PostgREST + Realtime
// behind a stubbed fetch (with configurable latency). Exercises the exact code that gets deployed.
import { makeHandler } from "../../server/handler.js";

export function handlerTransport({ seed = 1, latency = [5, 40] } = {}) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const rows = new Map(); // code -> {state(json string), v, updated_at}
  const stats = { db: 0, broadcasts: 0, ms: [], status: {} };
  const sleep = () => new Promise((r) => setTimeout(r, latency[0] + rnd() * (latency[1] - latency[0])));
  const BASE = "http://fake.supabase.local";
  const fakeFetch = async (input, init = {}) => {
    const u = new URL(typeof input === "string" ? input : input.url);
    const method = (init.method || "GET").toUpperCase();
    await sleep();
    stats.db++;
    const resp = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    if (u.pathname === "/realtime/v1/api/broadcast") { stats.broadcasts++; return resp({}, 202); }
    if (!u.pathname.startsWith("/rest/v1/")) return resp({ message: "not found" }, 404);
    const eq = (k) => { const v = u.searchParams.get(k); return v && v.startsWith("eq.") ? decodeURIComponent(v.slice(3)) : null; };
    if (method === "GET") {
      const row = rows.get(eq("code"));
      return resp(row ? [{ state: JSON.parse(row.state), v: row.v }] : []);
    }
    if (method === "POST") {
      const b = JSON.parse(init.body);
      if (rows.has(b.code)) return resp({ code: "23505" }, 409);
      rows.set(b.code, { state: JSON.stringify(b.state), v: b.v, updated_at: new Date().toISOString() });
      return new Response(null, { status: 201 });
    }
    if (method === "PATCH") {
      const code = eq("code"), v = Number(eq("v"));
      const row = rows.get(code);
      if (!row || row.v !== v) return resp([]);
      const b = JSON.parse(init.body);
      rows.set(code, { state: JSON.stringify(b.state), v: b.v, updated_at: b.updated_at });
      return resp([{ code }]);
    }
    if (method === "DELETE") return resp(null, 204);
    return resp({}, 405);
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const u = typeof input === "string" ? input : input.url;
    return u.startsWith(BASE) ? fakeFetch(input, init) : realFetch(input, init);
  };
  const handler = makeHandler({ url: BASE, key: "service-key" });
  const crashes = [];
  const origErr = console.error;
  async function call(body) {
    const t0 = performance.now();
    console.error = (e) => crashes.push(String(e && e.stack || e).split("\n").slice(0, 2).join(" "));
    const res = await handler(new Request("http://fn.local/mist-game", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));
    console.error = origErr;
    stats.ms.push(performance.now() - t0);
    stats.status[res.status] = (stats.status[res.status] || 0) + 1;
    return res.json();
  }
  const raw = (req) => handler(req);
  return { call, raw, stats, rows, crashes, kind: "handler" };
}
