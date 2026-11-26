// In-process stand-in for the edge function: same request/response shape as CONTRACT.md,
// backed directly by server/engine.js. Lets the bot harness run without network.
import * as REAL from "../../server/engine.js";

export function localTransport({ seed = 1, engine = REAL } = {}) {
  const E = engine;
  let s = seed >>> 0 || 1;
  const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const rooms = new Map();
  let clock = 1_700_000_000_000;
  const now = () => (clock += 50);
  async function call(body) {
    const { action, code, playerId, token } = body;
    if (action === "create") {
      let c;
      do c = E.randCode(rng); while (rooms.has(c));
      const r = E.createState(c, body.name, { now: now(), rng });
      if (r.error) return { ok: false, error: r.error };
      rooms.set(c, r.state);
      return { ok: true, code: c, playerId: r.player.id, token: r.player.token, view: E.viewFor(r.state, r.player.id, now()) };
    }
    const st = rooms.get(String(code || "").toUpperCase());
    if (!st) return { ok: false, error: "방을 찾을 수 없어요" };
    if (action === "join") {
      const r = E.joinPlayer(st, body.name, body.token, { now: now(), rng });
      if (r.error) return { ok: false, error: r.error };
      if (r.changed) st.v += 1;
      return { ok: true, code: st.code, playerId: r.player.id, token: r.player.token, view: E.viewFor(st, r.player.id, now()) };
    }
    const p = st.players.find((x) => x.id === playerId);
    if (!p || p.token !== token) return { ok: false, error: "다시 들어와 주세요" };
    const { action: _a, code: _c, token: _t, ...rest } = body;
    const r = E.applyAction(st, { ...rest, action, playerId }, { now: now(), rng });
    if (r.error) return { ok: false, error: r.error };
    return { ok: true, view: E.viewFor(st, playerId, now()) };
  }
  return { call, rooms, rng, kind: "local" };
}
