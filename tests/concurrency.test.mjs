// "Everyone taps at once": all phones send their action in the same instant,
// through a model of server/index.ts's load → apply → save-if-unchanged loop.
import { test } from "node:test";
import assert from "node:assert/strict";
import { occTransport } from "./lib/transport-occ.mjs";

async function roomOf(t, n) {
  const c = await t.call({ action: "create", name: "p0" });
  const ps = [{ id: c.playerId, token: c.token }];
  // simultaneous joins
  const js = await Promise.all(Array.from({ length: n - 1 }, (_, i) => t.call({ action: "join", code: c.code, name: `p${i + 1}` })));
  for (const j of js) if (j.ok) ps.push({ id: j.playerId, token: j.token });
  return { code: c.code, ps, joinErrors: js.filter((j) => !j.ok).map((j) => j.error) };
}
const A = (t, code, p, action, x = {}) => t.call({ action, code, playerId: p.id, token: p.token, ...x });

for (const n of [5, 8, 10]) {
  test(`${n} phones join, ready, ack and vote at the same instant — nobody gets an error`, async () => {
    let errors = [];
    for (let seed = 1; seed <= 20; seed++) {
      const t = occTransport({ seed });
      const r = await roomOf(t, n);
      errors.push(...r.joinErrors.map((e) => `join: ${e}`));
      if (r.ps.length < n) continue;
      const [host, ...rest] = r.ps;
      await A(t, r.code, host, "settings", { settings: { roles: { merlin: true, percival: true, morgana: true } } });
      for (const x of await Promise.all(rest.map((p) => A(t, r.code, p, "ready", { ready: true })))) if (!x.ok) errors.push(`ready: ${x.error}`);
      const st = await A(t, r.code, host, "start");
      if (!st.ok) { errors.push(`start: ${st.error}`); continue; }
      for (const x of await Promise.all(r.ps.map((p) => A(t, r.code, p, "ack")))) if (!x.ok) errors.push(`ack: ${x.error}`);
      const v = (await A(t, r.code, host, "state")).view;
      const leader = r.ps.find((p) => p.id === v.leaderId);
      await A(t, r.code, leader, "propose", { team: r.ps.slice(0, v.quests[0].size).map((p) => p.id) });
      for (const x of await Promise.all(r.ps.map((p) => A(t, r.code, p, "vote", { approve: true })))) if (!x.ok) errors.push(`vote: ${x.error}`);
      const after = (await A(t, r.code, host, "state")).view;
      if (after.phase !== "quest") errors.push(`after simultaneous votes phase=${after.phase} (votes lost, ${after.votedIds.length}/${n} recorded)`);
    }
    const uniq = [...new Set(errors)];
    assert.equal(errors.length, 0, `${errors.length} failed taps over 20 rooms, e.g.: ${uniq.slice(0, 4).join(" | ")}`);
  });
}
