// Optional modules: 갈림길의 순례자 (Lancelot, two variants), 말씀 두루마리 (Excalibur), host-approved rejoin.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../server/engine.js";

let seed = 7;
const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
function room(n, settings, now = 1000) {
  const { state, player } = E.createState("ABCD", "p0", { now, rng });
  const ids = [player.id];
  for (let i = 1; i < n; i++) ids.push(E.joinPlayer(state, "p" + i, null, { now, rng }).player.id);
  const act = (id, action, x = {}, t = now) => E.applyAction(state, { action, playerId: id, ...x }, { now: t, rng });
  assert.deepEqual(act(ids[0], "settings", { settings }), {});
  for (const id of ids.slice(1)) act(id, "ready", { ready: true });
  assert.deepEqual(act(ids[0], "start"), {});
  act(ids[0], "skipReveal");
  return { state, ids, act, g: state.game };
}
const roleId = (g, r) => Object.keys(g.roleOf).find((id) => g.roleOf[id] === r);
function passProposal(r, team, extra = {}) {
  const leader = E.viewFor(r.state, r.ids[0], 1000).leaderId;
  const res = r.act(leader, "propose", { team, ...extra });
  assert.deepEqual(res, {}, JSON.stringify(res));
  for (const id of r.ids) r.act(id, "vote", { approve: true });
  return leader;
}

test("Lancelot adds one pilgrim to each side and the loyalty deck has 3 blank + 2 switch", () => {
  for (const variant of [1, 2]) {
    const r = room(7, { lancelot: variant });
    assert.ok(roleId(r.g, "lancelotGood") && roleId(r.g, "lancelotEvil"));
    assert.equal(Object.values(r.g.roleOf).filter((x) => E.teamOf(x) === "evil").length, 3);
    assert.deepEqual(r.g.loyaltyDeck.slice().sort(), ["none", "none", "none", "switch", "switch"]);
  }
});

test("Lancelot knowledge: variant 1 hidden from evil, variant 2 the two pilgrims see each other and evil sees the evil pilgrim", () => {
  const r1 = room(8, { lancelot: 1 });
  const le1 = roleId(r1.g, "lancelotEvil"), lg1 = roleId(r1.g, "lancelotGood");
  const evilIds = Object.keys(r1.g.roleOf).filter((id) => E.teamOf(r1.g.roleOf[id]) === "evil" && id !== le1);
  for (const id of evilIds) assert.ok(!E.viewFor(r1.state, id, 1000).me.knowledge.some((k) => k.id === le1), "v1 evil must not see evil pilgrim");
  assert.equal(E.viewFor(r1.state, le1, 1000).me.knowledge.length, 0);
  assert.equal(E.viewFor(r1.state, lg1, 1000).me.knowledge.length, 0);
  const merlin = roleId(r1.g, "merlin");
  assert.ok(E.viewFor(r1.state, merlin, 1000).me.knowledge.some((k) => k.id === le1), "seer sees evil pilgrim");

  const r2 = room(8, { lancelot: 2 });
  const le2 = roleId(r2.g, "lancelotEvil"), lg2 = roleId(r2.g, "lancelotGood");
  assert.ok(E.viewFor(r2.state, lg2, 1000).me.knowledge.some((k) => k.id === le2 && k.tag === "lancelot"));
  assert.ok(E.viewFor(r2.state, le2, 1000).me.knowledge.some((k) => k.id === lg2 && k.tag === "lancelot"));
  const evil2 = Object.keys(r2.g.roleOf).find((id) => r2.g.roleOf[id] === "morgana");
  assert.ok(E.viewFor(r2.state, evil2, 1000).me.knowledge.some((k) => k.id === le2 && k.tag === "evil"));
});

test("Loyalty switch flips both pilgrims from round 3, and quest cards follow the current side", () => {
  const r = room(7, { lancelot: 1 });
  r.g.loyaltyDeck = ["switch", "none", "none", "none", "switch"];
  const lg = roleId(r.g, "lancelotGood");
  for (let q = 0; q < 2; q++) {
    const size = r.g.quests[r.g.round].size;
    const team = r.ids.slice(0, size);
    passProposal(r, team);
    for (const id of team) r.act(id, "quest", { success: true });
  }
  assert.equal(r.g.round, 2);
  assert.deepEqual(r.g.loyaltyRevealed, [{ round: 2, card: "switch" }]);
  assert.equal(E.viewFor(r.state, lg, 1000).me.team, "evil");
  const size = r.g.quests[2].size;
  const team = [lg, ...r.ids.filter((id) => id !== lg)].slice(0, size);
  passProposal(r, team);
  assert.deepEqual(r.act(lg, "quest", { success: false }), {}, "switched pilgrim may now hinder");
});

test("Excalibur: must go to a team member other than the leader; holder may flip one card and learns it privately", () => {
  const r = room(6, { excalibur: true });
  const leader = E.viewFor(r.state, r.ids[0], 1000).leaderId;
  const size = r.g.quests[0].size;
  const team = [leader, ...r.ids.filter((id) => id !== leader)].slice(0, size);
  assert.ok(r.act(leader, "propose", { team }).error, "needs excaliburTo");
  assert.ok(r.act(leader, "propose", { team, excaliburTo: leader }).error, "not the leader");
  const holder = team[1];
  passProposal(r, team, { excaliburTo: holder });
  for (const id of team) r.act(id, "quest", { success: true });
  assert.equal(r.state.phase, "excalibur");
  assert.ok(r.act(team[0], "excalibur", { targetId: team[1] }).error, "only holder");
  assert.ok(r.act(holder, "excalibur", { targetId: holder }).error, "not self");
  assert.deepEqual(r.act(holder, "excalibur", { targetId: team[0] }), {});
  assert.equal(r.g.quests[0].result, "fail");
  assert.deepEqual(E.viewFor(r.state, holder, 1000).me.excaliburResults, [{ round: 0, targetId: team[0], original: true }]);
  assert.deepEqual(E.viewFor(r.state, team[0], 1000).me.excaliburResults, []);
  assert.deepEqual(E.viewFor(r.state, r.ids[5], 1000).lastQuest.excalibur, { holderId: holder, targetId: team[0] });
});

test("Excalibur holder may pass without flipping", () => {
  const r = room(5, { excalibur: true });
  const leader = E.viewFor(r.state, r.ids[0], 1000).leaderId;
  const team = [leader, r.ids.find((id) => id !== leader)];
  passProposal(r, team, { excaliburTo: team[1] });
  for (const id of team) r.act(id, "quest", { success: true });
  assert.deepEqual(r.act(team[1], "excalibur", {}), {});
  assert.equal(r.g.quests[0].result, "success");
});

test("Rejoin from a new phone needs the host to open the seat; a locked phone alone is not enough", () => {
  const r = room(5, {});
  const victim = r.state.players.find((p) => p.id !== r.state.hostId);
  const later = 1000 + 60000;
  assert.ok(E.joinPlayer(r.state, victim.name, null, { now: later, rng }).error, "name alone must not take the seat");
  assert.ok(r.act(r.ids[1] === victim.id ? r.ids[2] : r.ids[1], "allowRejoin", { targetId: victim.id }, later).error, "only host");
  r.state.players.find((p) => p.id === r.state.hostId).lastSeen = later;
  assert.deepEqual(r.act(r.state.hostId, "allowRejoin", { targetId: victim.id }, later), {});
  assert.equal(E.viewFor(r.state, r.state.hostId, later).rejoinOpenFor, victim.id);
  const oldToken = victim.token;
  const j = E.joinPlayer(r.state, victim.name, null, { now: later + 1000, rng });
  assert.equal(j.player.id, victim.id);
  assert.notEqual(j.player.token, oldToken, "old phone signed out");
  assert.ok(E.joinPlayer(r.state, victim.name, null, { now: later + 2000, rng }).error, "seat closes after one use");
});

test("A player can take over as host only after the host has been away a minute", () => {
  const r = room(5, {});
  const other = r.ids.find((id) => id !== r.state.hostId);
  assert.ok(r.act(other, "claimHost", {}, 1000 + 30000).error);
  assert.deepEqual(r.act(other, "claimHost", {}, 1000 + 70000), {});
  assert.equal(r.state.hostId, other);
});

test("Phase clock: every phase change bumps phaseSeq and stamps phaseStartedAt", () => {
  const r = room(5, {});
  const v1 = E.viewFor(r.state, r.ids[0], 5000);
  const leader = v1.leaderId;
  r.act(leader, "propose", { team: r.ids.slice(0, 2) }, 4000);
  const v2 = E.viewFor(r.state, r.ids[0], 5000);
  assert.equal(v2.phaseSeq, v1.phaseSeq + 1);
  assert.equal(v2.phaseStartedAt, 4000);
  assert.equal(v2.prevPhase, "propose");
  assert.equal(v2.serverNow, 5000);
});
