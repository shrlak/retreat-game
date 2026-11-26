// Models server/index.ts concurrency: each request loads the row, applies the action,
// and saves only if `v` is unchanged (optimistic lock), retrying up to ATTEMPTS times.
// DB calls get random latency so simultaneous phones really interleave.
import * as E from "../../server/engine.js";
export function occTransport({ seed = 1, attempts = 8, latency = [5, 40], backoff = 0 } = {}) {
  let s = seed >>> 0 || 1;
  const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const db = new Map(); // code -> {state(json), v}
  const sleep = () => new Promise((r) => setTimeout(r, latency[0] + rng() * (latency[1] - latency[0])));
  const load = async (code) => { await sleep(); const row = db.get(code); return row && { state: JSON.parse(row.state), v: row.v }; };
  const save = async (code, state, prevV) => { await sleep(); const row = db.get(code); if (row.v !== prevV) return false; db.set(code, { state: JSON.stringify(state), v: state.v }); return true; };
  const stats = { conflicts: 0, gaveUp: 0, ms: [] };
  async function call(body) {
    const t0 = performance.now();
    try { return await call0(body); } finally { stats.ms.push(performance.now() - t0); }
  }
  async function call0(body) {
    const now = Date.now();
    if (body.action === "create") {
      const code = E.randCode(rng);
      const r = E.createState(code, body.name, { now, rng });
      db.set(code, { state: JSON.stringify(r.state), v: r.state.v });
      return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(r.state, r.player.id, now) };
    }
    const code = body.code;
    for (let a = 0; a < attempts; a++) {
      if (a && backoff) await new Promise((r) => setTimeout(r, rng() * backoff * a));
      const row = await load(code);
      if (!row) return { ok: false, error: "no room" };
      const { state, v: prevV } = row;
      if (body.action === "join") {
        const r = E.joinPlayer(state, body.name, body.token, { now, rng });
        if (r.error) return { ok: false, error: r.error };
        if (r.changed) state.v += 1;
        if (!(await save(code, state, prevV))) { stats.conflicts++; continue; }
        return { ok: true, code, playerId: r.player.id, token: r.player.token, view: E.viewFor(state, r.player.id, now) };
      }
      const me = state.players.find((p) => p.id === body.playerId);
      if (!me || me.token !== body.token) return { ok: false, error: "다시 입장해 주세요" };
      const res = E.applyAction(state, { ...body, playerId: me.id }, { now, rng });
      if (res.error) return { ok: false, error: res.error };
      if (state.v === prevV) return { ok: true, view: E.viewFor(state, me.id, now) };
      if (!(await save(code, state, prevV))) { stats.conflicts++; continue; }
      return { ok: true, view: E.viewFor(state, me.id, now) };
    }
    stats.gaveUp++;
    return { ok: false, error: "동시에 너무 많은 요청이 왔어요. 다시 눌러 주세요" };
  }
  return { call, stats, kind: "occ" };
}
