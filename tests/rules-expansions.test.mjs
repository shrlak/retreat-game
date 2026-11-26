// Expansion rules from the official rulebooks, written by the test thread (the build's own checks are in expansions.test.mjs).
// Lancelot = official variants 1/2/3 (Indie Boards & Cards 2012), Excalibur (Big Box). IDs from RULES_CHECKLIST.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../server/engine.js";
import { EVIL, expectedKnowledge, teamOf } from "./lib/oracle.mjs";

function seeded(s = 42) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function started(n, settings, seed = 42) {
  const rng = seeded(seed);
  const { state, player } = E.createState("TEST1", "p0", { rng, now: 1 });
  const ids = [player.id];
  for (let i = 1; i < n; i++) ids.push(E.joinPlayer(state, `p${i}`, null, { rng, now: 1 }).player.id);
  const act = (id, action, p = {}) => E.applyAction(state, { action, playerId: id, ...p }, { rng, now: 1 });
  assert.ok(!act(ids[0], "settings", { settings }).error);
  for (const id of ids.slice(1)) act(id, "ready", { ready: true });
  const st = act(ids[0], "start");
  if (st.error) return { error: st.error };
  for (const id of ids) act(id, "ack");
  assert.equal(state.phase, "propose");
  return { state, ids, act, g: state.game, view: (id) => E.viewFor(state, id, 1) };
}
const NONE = { merlin: false, percival: false, morgana: false, assassin: false, mordred: false, oberon: false };
const leader = (s) => s.players[s.game.leaderSeat].id;
const byRole = (r, role) => Object.keys(r.g.roleOf).find((id) => r.g.roleOf[id] === role);
const know = (v) => new Map(v.me.knowledge.map((k) => [k.id, k.tag]));
function approve(r, team, extra = {}) {
  const x = r.act(leader(r.state), "propose", { team, ...extra });
  assert.ok(!x.error, x.error);
  for (const id of r.state.players.map((p) => p.id)) r.act(id, "vote", { approve: true });
  assert.equal(r.state.phase, "quest");
}
function teamFor(r, must = []) {
  const size = r.g.quests[r.g.round].size;
  const L = leader(r.state);
  const rest = r.state.players.map((p) => p.id).filter((id) => id !== L && !must.includes(id));
  return [...new Set([...must, L, ...rest])].slice(0, size);
}
function playAll(r, cards = {}) {
  for (const id of r.g.proposal.team) {
    const x = r.act(id, "quest", { success: cards[id] ?? true });
    assert.ok(!x.error, x.error);
  }
}
function finishRound(r) {
  const team = teamFor(r);
  const extra = r.g.excalibur ? { excaliburTo: team.find((id) => id !== leader(r.state)) } : {};
  approve(r, team, extra);
  // play what each side may play (v2 Lancelots are forced)
  for (const id of r.g.proposal.team) r.act(id, "quest", { success: r.view(id).me.team === "good" });
  if (r.state.phase === "excalibur") assert.ok(!r.act(r.g.proposal.excaliburTo, "excalibur", { targetId: null }).error);
  if (r.state.phase === "lady") { const h = r.g.ladyHolderId; const t = r.state.players.find((p) => !r.g.ladyUsedBy.includes(p.id)).id; r.act(h, "lady", { targetId: t }); }
}

for (const n of [5, 7, 10]) test(`L0 Lancelot adds one good and one evil Lancelot, evil count stays ${EVIL[n]} (n=${n})`, () => {
  const r = started(n, { lancelot: 1, roles: NONE });
  const roles = Object.values(r.g.roleOf);
  assert.equal(roles.filter((x) => x === "lancelotGood").length, 1);
  assert.equal(roles.filter((x) => x === "lancelotEvil").length, 1);
  assert.equal(roles.filter((x) => teamOf(x) === "evil").length, EVIL[n]);
});

test("L0/A7 Lancelot takes an evil slot: 5 players + merlin/assassin/morgana + Lancelot is refused", () => {
  const r = started(5, { lancelot: 1, roles: { ...NONE, merlin: true, assassin: true, morgana: true } });
  assert.ok(r.error, "should refuse: 3 evil specials for 2 evil seats");
});

for (const variant of [1, 2, 3]) test(`L1/L2 night (variant ${variant}): evil team (not Oberon) sees Evil Lancelot, he sees no one`, () => {
  const r = started(10, { lancelot: variant, roles: { ...NONE, merlin: true, assassin: true, morgana: true, oberon: true } });
  const lg = byRole(r, "lancelotGood"), le = byRole(r, "lancelotEvil"), ob = byRole(r, "oberon"), a = byRole(r, "assassin");
  assert.equal(know(r.view(a)).get(le), "evil", "assassin sees Evil Lancelot");
  assert.ok(!know(r.view(ob)).has(le), "Oberon sees no one");
  const leKnows = know(r.view(le));
  for (const [id, tag] of leKnows) assert.ok(variant === 3 && id === lg && tag === "lancelot", "Evil Lancelot sees no evil");
  assert.equal(know(r.view(lg)).has(le), variant === 3, "Lancelots know each other only in variant 3");
  for (const id of r.ids) {
    const exp = expectedKnowledge(r.g.roleOf, id, variant);
    const got = know(r.view(id));
    for (const [oid] of exp.optional) got.delete(oid);
    assert.deepEqual([...got].sort(), [...exp].sort(), `${r.g.roleOf[id]} knowledge`);
  }
});

test("L0 variant 3: the two Lancelots see each other tagged lancelot, no loyalty cards", () => {
  const r = started(8, { lancelot: 3, roles: { ...NONE, merlin: true, assassin: true } });
  const lg = byRole(r, "lancelotGood"), le = byRole(r, "lancelotEvil");
  assert.equal(know(r.view(lg)).get(le), "lancelot");
  assert.equal(know(r.view(le)).get(lg), "lancelot");
  finishRound(r); finishRound(r); finishRound(r);
  assert.equal(r.view(lg).loyaltyRevealed.length, 0);
  assert.equal(r.view(lg).loyaltyPlan, null);
});

test("L5 variant 2: 5 of 7 loyalty cards dealt face up, everyone sees the same plan, card i acts at the start of round i", () => {
  const r = started(8, { lancelot: 2, roles: { ...NONE, merlin: true, assassin: true } });
  const plan = r.view(r.ids[0]).loyaltyPlan;
  assert.equal(plan.length, 5);
  assert.ok(plan.filter((c) => c === "switch").length <= 2 && plan.filter((c) => c === "none").length >= 3);
  for (const id of r.ids) assert.deepEqual(r.view(id).loyaltyPlan, plan);
  assert.deepEqual(r.view(r.ids[0]).loyaltyRevealed, [{ round: 0, card: plan[0] }]);
  finishRound(r);
  assert.deepEqual(r.view(r.ids[0]).loyaltyRevealed.map((c) => c.card), plan.slice(0, 2));
});

test("L6 variant 2: Lancelots must play for their current side", () => {
  const r = started(8, { lancelot: 2, roles: { ...NONE, merlin: true, assassin: true } });
  r.g.loyaltyPlan = ["none", "switch", "none", "none", "none"];
  const lg = byRole(r, "lancelotGood"), le = byRole(r, "lancelotEvil");
  // the dealt round-0 card already took effect at start; reset it to match the plan we set
  r.g.allegiance[lg] = "good"; r.g.allegiance[le] = "evil"; r.g.loyaltyRevealed = [{ round: 0, card: "none" }];
  approve(r, teamFor(r, [lg, le]));
  const x = r.act(le, "quest", { success: true });
  assert.ok(x.error, "Evil Lancelot must fail");
  assert.ok(r.act(lg, "quest", { success: false }).error, "Good Lancelot must succeed");
  assert.ok(!r.act(le, "quest", { success: false }).error);
  for (const id of r.g.proposal.team) if (!(id in r.g.questCards)) assert.ok(!r.act(id, "quest", { success: true }).error);
  assert.equal(r.g.round, 1);
  // round 2 card was a switch: now Good Lancelot is evil and must fail
  assert.equal(r.view(lg).me.team, "evil");
  approve(r, teamFor(r, [lg, le]));
  assert.ok(r.act(lg, "quest", { success: true }).error, "switched Good Lancelot must now fail");
  assert.ok(r.act(le, "quest", { success: false }).error, "switched Evil Lancelot must now succeed");
});


test("L4/L7/L8 a switch card flips both Lancelots' current team, quest rule follows it, nobody else learns it", () => {
  const r = started(8, { lancelot: 1, roles: { ...NONE, merlin: true, assassin: true } });
  r.g.loyaltyDeck = ["switch", "none", "none", "none", "switch"];
  const lg = byRole(r, "lancelotGood"), le = byRole(r, "lancelotEvil");
  finishRound(r); finishRound(r);
  assert.equal(r.g.round, 2);
  assert.deepEqual(r.g.loyaltyRevealed.map((c) => c.card), ["switch"]);
  const vg = r.view(lg), ve = r.view(le);
  assert.equal(vg.me.team, "evil"); assert.equal(vg.me.startTeam, "good");
  assert.equal(ve.me.team, "good"); assert.equal(ve.me.startTeam, "evil");
  for (const id of r.ids) {
    const v = r.view(id);
    assert.equal(v.finalTeams ?? null, null);
    assert.ok(!JSON.stringify(v).includes('"allegiance"'));
  }
  approve(r, teamFor(r, [lg, le]));
  assert.ok(r.act(le, "quest", { success: false }).error, "evil Lancelot turned good must not play fail");
  assert.ok(!r.act(lg, "quest", { success: false }).error, "good Lancelot turned evil may play fail");
});

test("L4 variant 1: 5-card deck (3 no change, 2 switch), no card before the 3rd round", () => {
  const r = started(7, { lancelot: 1, roles: NONE });
  assert.deepEqual(r.g.loyaltyDeck.slice().sort(), ["none", "none", "none", "switch", "switch"]);
  finishRound(r);
  assert.equal(r.g.round, 1);
  assert.equal(r.g.loyaltyRevealed.length, 0);
});

test("L9 lady on a switched Lancelot shows the team they are on now (engine choice)", () => {
  const r = started(8, { lancelot: 1, lady: true, roles: { ...NONE, merlin: true, assassin: true } });
  r.g.loyaltyDeck = ["switch", "none", "none", "none", "switch"];
  const lg = byRole(r, "lancelotGood");
  finishRound(r);
  approve(r, teamFor(r)); for (const id of r.g.proposal.team) r.act(id, "quest", { success: true });
  assert.equal(r.state.phase, "lady");
  const h = r.g.ladyHolderId;
  if (h === lg || r.g.ladyUsedBy.includes(lg)) return;
  assert.ok(!r.act(h, "lady", { targetId: lg }).error);
  assert.equal(r.view(h).me.ladyResults.at(-1).team, "evil");
});

test("X1 the leader must give Excalibur to another team member", () => {
  const r = started(7, { excalibur: true, roles: NONE });
  const L = leader(r.state), team = teamFor(r);
  const outsider = r.state.players.map((p) => p.id).find((id) => !team.includes(id));
  assert.ok(r.act(L, "propose", { team }).error, "missing holder");
  assert.ok(r.act(L, "propose", { team, excaliburTo: L }).error, "leader keeps it");
  assert.ok(r.act(L, "propose", { team, excaliburTo: outsider }).error, "outsider holds it");
  assert.ok(!r.act(L, "propose", { team, excaliburTo: team.find((id) => id !== L) }).error);
});

test("X2/X3/X4/X5 holder flips one other member's card; only the holder learns the original", () => {
  const r = started(7, { excalibur: true, roles: NONE });
  const L = leader(r.state), team = teamFor(r);
  const holder = team.find((id) => id !== L);
  const target = team.find((id) => id !== holder);
  approve(r, team, { excaliburTo: holder });
  playAll(r);
  assert.equal(r.state.phase, "excalibur");
  const other = r.state.players.map((p) => p.id).find((id) => id !== holder);
  assert.ok(r.act(other, "excalibur", { targetId: target }).error, "non-holder");
  assert.ok(r.act(holder, "excalibur", { targetId: holder }).error, "self");
  const outsider = r.state.players.map((p) => p.id).find((id) => !team.includes(id));
  assert.ok(r.act(holder, "excalibur", { targetId: outsider }).error, "not on team");
  assert.ok(!r.act(holder, "excalibur", { targetId: target }).error);
  assert.equal(r.g.quests[0].fails, 1, "a good player's success became a fail (X5)");
  assert.deepEqual(r.view(holder).me.excaliburResults, [{ round: 0, targetId: target, original: true }]);
  for (const id of r.ids) if (id !== holder) {
    assert.deepEqual(r.view(id).me.excaliburResults, []);
    assert.ok(!JSON.stringify(r.view(id)).includes('"original"'));
  }
});

test("X2 holder may decline to use Excalibur", () => {
  const r = started(6, { excalibur: true, roles: NONE });
  const team = teamFor(r), holder = team.find((id) => id !== leader(r.state));
  approve(r, team, { excaliburTo: holder });
  playAll(r);
  assert.ok(!r.act(holder, "excalibur", { targetId: null }).error);
  assert.equal(r.g.quests[0].result, "success");
  assert.equal(r.g.quests[0].fails, 0);
});
