// Tests the deployed request handler (server/handler.js) against a fake Supabase.
import { test } from "node:test";
import assert from "node:assert/strict";
import { handlerTransport } from "./lib/transport-handler.mjs";
import { playGame } from "./lib/harness.mjs";

const fast = { latency: [0, 2] };

test("full bot games run through the real handler for every player count", async () => {
  for (const n of [5, 6, 7, 8, 9, 10]) for (const lady of [false, true]) {
    const t = handlerTransport({ seed: n, ...fast });
    const r = await playGame(t, { n, lady, seed: n * 7 + (lady ? 1 : 0), roles: { merlin: true, percival: true, morgana: true, assassin: true, mordred: n >= 7, oberon: n === 10 } });
    assert.ok(r.result, `n=${n} did not finish: ${r.setupRefused || ""}`);
    assert.deepEqual(r.findings.map((f) => `[${f.id}] ${f.msg}`), [], r.tag);
  }
});

test("Lancelot (both modes) and Excalibur games run through the real handler", async () => {
  for (const n of [7, 8, 10]) for (const lancelot of [1, 2, 3]) for (const excalibur of [false, true]) {
    const t = handlerTransport({ seed: n + lancelot, ...fast });
    const r = await playGame(t, { n, lady: n >= 8, lancelot, excalibur, seed: n * 13 + lancelot * 3 + (excalibur ? 1 : 0), roles: { merlin: true, percival: true, morgana: true, assassin: true, mordred: false, oberon: false } });
    assert.ok(r.result, `${r.tag} did not finish: ${r.setupRefused || ""}`);
    assert.deepEqual(r.findings.map((f) => `[${f.id}] ${f.msg}`), [], r.tag);
  }
});

test("bad requests get clean errors, never a crash", async () => {
  const t = handlerTransport(fast);
  const bad = async (req, status) => { const r = await t.raw(req); assert.equal(r.status, status); };
  await bad(new Request("http://x/", { method: "GET" }), 405);
  await bad(new Request("http://x/", { method: "POST", body: "{nope" }), 400);
  await bad(new Request("http://x/", { method: "POST", body: "null" }), 400);
  await bad(new Request("http://x/", { method: "POST", body: JSON.stringify({ action: "create", name: "x".repeat(9000) }) }), 413);
  const c = await t.call({ action: "create", name: "방장" });
  assert.ok(c.ok);
  for (const body of [
    { action: "join", code: "ZZZZZ", name: "a" },
    { action: "join", code: "", name: "a" },
    { action: "join", code: c.code, name: "" },
    { action: "join", code: c.code, name: "   " },
    { action: "state", code: c.code, playerId: c.playerId, token: "wrong" },
    { action: "state", code: c.code, playerId: "nobody", token: c.token },
    { action: "hack", code: c.code, playerId: c.playerId, token: c.token },
    { action: "start", code: c.code, playerId: c.playerId, token: c.token },
    { action: "settings", code: c.code, playerId: c.playerId, token: c.token, settings: "lol" },
    { action: "propose", code: c.code, playerId: c.playerId, token: c.token, team: "x" },
    { action: "vote", code: c.code, playerId: c.playerId, token: c.token, approve: "yes" },
  ]) {
    const r = await t.call(body);
    assert.equal(typeof r.ok, "boolean", JSON.stringify(body));
    if (body.action !== "settings") assert.equal(r.ok, false, JSON.stringify(body));
    if (r.error) assert.match(r.error, /[가-힣]/, "errors should be Korean for the phone toast");
  }
  // lowercase / spaced code still joins
  const j = await t.call({ action: "join", code: ` ${c.code.toLowerCase()} `, name: "참가자" });
  assert.ok(j.ok, j.error);
  // 11th player refused
  for (let i = 0; i < 8; i++) await t.call({ action: "join", code: c.code, name: `p${i}` });
  const full = await t.call({ action: "join", code: c.code, name: "열한번째" });
  assert.equal(full.ok, false);
});

test("a polled `state` with nothing new does not write to the DB every time", async () => {
  const t = handlerTransport(fast);
  const c = await t.call({ action: "create", name: "방장" });
  const before = t.stats.db;
  for (let i = 0; i < 20; i++) await t.call({ action: "state", code: c.code, playerId: c.playerId, token: c.token });
  const perPoll = (t.stats.db - before) / 20;
  assert.ok(perPoll <= 1.2, `each idle poll costs ${perPoll} DB calls`);
});

for (const n of [5, 10]) test(`${n} phones tapping at once through the real handler (steady 30 ms DB)`, async () => {
  let errors = [];
  for (let seed = 1; seed <= 10; seed++) {
    const t = handlerTransport({ seed, latency: [30, 34] });
    const c = await t.call({ action: "create", name: "p0" });
    const js = await Promise.all(Array.from({ length: n - 1 }, (_, i) => t.call({ action: "join", code: c.code, name: `p${i + 1}` })));
    errors.push(...js.filter((j) => !j.ok).map((j) => `join: ${j.error}`));
    const ps = [{ id: c.playerId, token: c.token }, ...js.filter((j) => j.ok).map((j) => ({ id: j.playerId, token: j.token }))];
    if (ps.length < n) continue;
    const A = (p, action, x = {}) => t.call({ action, code: c.code, playerId: p.id, token: p.token, ...x });
    for (const r of await Promise.all(ps.slice(1).map((p) => A(p, "ready", { ready: true })))) if (!r.ok) errors.push(`ready: ${r.error}`);
    const st = await A(ps[0], "start");
    if (!st.ok) { errors.push(`start: ${st.error}`); continue; }
    for (const r of await Promise.all(ps.map((p) => A(p, "ack")))) if (!r.ok) errors.push(`ack: ${r.error}`);
    const v = (await A(ps[0], "state")).view;
    await A(ps.find((p) => p.id === v.leaderId), "propose", { team: ps.slice(0, v.quests[0].size).map((p) => p.id) });
    for (const r of await Promise.all(ps.map((p) => A(p, "vote", { approve: true })))) if (!r.ok) errors.push(`vote: ${r.error}`);
  }
  assert.equal(errors.length, 0, `${errors.length} taps failed over 10 rooms: ${[...new Set(errors)].slice(0, 3).join(" | ")}`);
});

test("lag: a tap's response does not wait on the realtime broadcast round trip", async () => {
  const t = handlerTransport({ latency: [40, 40] });
  const c = await t.call({ action: "create", name: "p0" });
  t.stats.ms.length = 0;
  await t.call({ action: "join", code: c.code, name: "p1" });
  const ms = t.stats.ms[0];
  // load + save = 80 ms of DB time; anything beyond ~one more round trip is the awaited broadcast
  assert.ok(ms < 110, `join took ${ms.toFixed(0)} ms with 40 ms per DB/realtime call: the broadcast is awaited before replying (+1 round trip per tap)`);
});
