// HTTP handler for the "mist-game" function. Plain fetch to PostgREST (no SDK), so it also runs in Node.
import * as E from "./engine.js";
import { errOf } from "./messages.js";
const errFields = (r) => ({ error: r.error, errorKey: r.errorKey ?? null, errorParams: r.errorParams ?? null, errorEn: r.errorEn ?? r.error });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });

export function makeHandler({ url, key, table = "mist_rooms" }) {
  const H = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };
  const rest = `${url}/rest/v1/${table}`;

  async function load(code) {
    const r = await fetch(`${rest}?code=eq.${encodeURIComponent(code)}&select=state,v`, { headers: H });
    if (!r.ok) throw new Error(`load ${r.status} ${await r.text()}`);
    const rows = await r.json();
    return rows[0] || null;
  }
  async function insert(code, state) {
    const r = await fetch(rest, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ code, state, v: state.v }) });
    if (r.status === 409) return false;
    if (!r.ok) throw new Error(`insert ${r.status} ${await r.text()}`);
    return true;
  }
  async function save(code, state, prevV) {
    const r = await fetch(`${rest}?code=eq.${encodeURIComponent(code)}&v=eq.${prevV}&select=code`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ state, v: state.v, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) throw new Error(`save ${r.status} ${await r.text()}`);
    return (await r.json()).length > 0;
  }
  async function cleanup(now) {
    await fetch(`${rest}?updated_at=lt.${new Date(now - 3 * 864e5).toISOString()}`, { method: "DELETE", headers: H }).catch(() => {});
  }
  // reply right away; the realtime ping finishes in the background (EdgeRuntime keeps it alive)
  function later(p) {
    const safe = Promise.resolve(p).catch(() => {});
    try {
      if (globalThis.EdgeRuntime && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(safe);
    } catch {}
  }
  function broadcast(code, v) {
    return fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ messages: [{ topic: `mist:${code}`, event: "update", payload: { v }, private: false }] }),
    }).catch(() => {});
  }
  const normCode = (c) => String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  async function handle(body) {
    const action = String(body.action ?? "");
    const now = Date.now();
    if (action === "create") {
      if (Math.random() < 0.1) await cleanup(now);
      for (let i = 0; i < 6; i++) {
        const code = E.randCode();
        const r = E.createState(code, body.name, { now });
        if (r.error) return { ok: false, ...errFields(r) };
        if (!(await insert(code, r.state))) continue;
        return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(r.state, r.player.id, now) };
      }
      return { ok: false, ...errOf("방을 만들지 못했어요. 다시 시도해 주세요") };
    }
    const code = normCode(body.code);
    if (!code) return { ok: false, ...errOf("방 코드를 입력해 주세요") };
    for (let attempt = 0; attempt < 14; attempt++) {
      // optimistic concurrency: when another phone saved first, wait a little (jittered, growing) and redo
      if (attempt) await new Promise((r) => setTimeout(r, Math.random() * Math.min(600, 40 * 2 ** attempt) + 15));
      const row = await load(code);
      if (!row) return { ok: false, ...errOf("그런 방이 없어요. 코드를 확인해 주세요") };
      const state = row.state;
      const prevV = row.v;
      if (action === "join") {
        const r = E.joinPlayer(state, body.name, body.token, { now });
        if (r.error) return { ok: false, ...errFields(r) };
        if (r.changed) state.v += 1;
        if (!(await save(code, state, prevV))) continue;
        if (r.changed) later(broadcast(code, state.v));
        return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(state, r.player.id, now) };
      }
      const me = state.players.find((p) => p.id === body.playerId);
      if (!me || me.token !== body.token) return { ok: false, ...errOf("방에서 나가졌어요. 다시 입장해 주세요"), kicked: true };
      const res = E.applyAction(state, { ...body, playerId: me.id }, { now });
      if (res.error) return { ok: false, ...errFields(res), view: E.viewFor(state, me.id, now) };
      const changed = state.v !== prevV;
      if (!changed && now - (me._seenSaved ?? 0) < 5000) return { ok: true, view: E.viewFor(state, me.id, now) };
      if (!changed) me._seenSaved = now;
      if (!(await save(code, state, prevV))) {
        if (!changed) return { ok: true, view: E.viewFor(state, me.id, now) };
        continue;
      }
      if (changed) later(broadcast(code, state.v));
      return { ok: true, view: action === "leave" ? null : E.viewFor(state, me.id, now) };
    }
    return { ok: false, ...errOf("동시에 너무 많은 요청이 왔어요. 다시 눌러 주세요") };
  }

  return async function (req) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ ok: false, ...errOf("POST only") }, 405);
    let body;
    try {
      const text = await req.text();
      if (text.length > 8000) return json({ ok: false, ...errOf("too large") }, 413);
      body = JSON.parse(text);
      if (!body || typeof body !== "object") throw 0;
    } catch {
      return json({ ok: false, ...errOf("bad json") }, 400);
    }
    try {
      return json(await handle(body));
    } catch (e) {
      console.error(e);
      return json({ ok: false, ...errOf("서버 오류가 났어요. 잠시 후 다시 시도해 주세요") }, 500);
    }
  };
}
