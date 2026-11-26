// Optional modules: 갈림길의 순례자 (Lancelot, official variants 1-3), 말씀 두루마리 (Excalibur), host-approved rejoin.
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

test("Lancelot (official rulebook): v1 deck 3 blank + 2 switch, v2 deals 5 of 7 face up, v3 has no deck", () => {
  for (const variant of [1, 2, 3]) {
    const r = room(7, { lancelot: variant });
    assert.ok(roleId(r.g, "lancelotGood") && roleId(r.g, "lancelotEvil"));
    assert.equal(Object.values(r.g.roleOf).filter((x) => E.teamOf(x) === "evil").length, 3);
    if (variant === 1) assert.deepEqual(r.g.loyaltyDeck.slice().sort(), ["none", "none", "none", "switch", "switch"]);
    else assert.equal(r.g.loyaltyDeck.length, 0);
    if (variant === 2) {
      assert.equal(r.g.loyaltyPlan.length, 5);
      assert.ok(r.g.loyaltyPlan.filter((c) => c === "switch").length <= 2);
      assert.deepEqual(E.viewFor(r.state, r.ids[0], 1000).loyaltyPlan, r.g.loyaltyPlan, "v2 cards are public from the start");
    } else assert.equal(r.g.loyaltyPlan, null);
  }
});

test("Lancelot knowledge (official): evil (not Oberon) sees Evil Lancelot, he sees no one; only v3 Lancelots know each other", () => {
  for (const variant of [1, 2, 3]) {
    const r = room(10, { lancelot: variant, roles: { oberon: true, mordred: false } });
    const le = roleId(r.g, "lancelotEvil"), lg = roleId(r.g, "lancelotGood");
    const ob = roleId(r.g, "oberon");
    for (const id of Object.keys(r.g.roleOf)) {
      const role = r.g.roleOf[id];
      if (E.teamOf(role) !== "evil" || id === le) continue;
      const sees = E.viewFor(r.state, id, 1000).me.knowledge.some((k) => k.id === le && k.tag === "evil");
      assert.equal(sees, role !== "oberon", "v" + variant + " " + role + " seeing evil Lancelot");
    }
    const leK = E.viewFor(r.state, le, 1000).me.knowledge, lgK = E.viewFor(r.state, lg, 1000).me.knowledge;
    assert.ok(!leK.some((k) => k.tag === "evil"), "evil Lancelot keeps his eyes closed");
    assert.ok(!leK.some((k) => k.id === ob));
    assert.equal(lgK.some((k) => k.id === le && k.tag === "lancelot"), variant === 3);
    assert.equal(leK.some((k) => k.id === lg && k.tag === "lancelot"), variant === 3);
    const merlin = roleId(r.g, "merlin");
    assert.ok(E.viewFor(r.state, merlin, 1000).me.knowledge.some((k) => k.id === le), "seer sees evil Lancelot");
  }
});

test("Lancelot v2: a switch takes effect at the start of its round, and Lancelots must play for their current side", () => {
  const r = room(7, { lancelot: 2 });
  const lg = roleId(r.g, "lancelotGood"), le = roleId(r.g, "lancelotEvil");
  // reset to the start allegiance and use a fixed plan: switch at round 2 (index 1)
  r.g.allegiance[lg] = "good"; r.g.allegiance[le] = "evil"; r.g.loyaltyRevealed = [];
  r.g.loyaltyPlan = ["none", "switch", "none", "none", "none"];
  const team0 = [le, ...r.ids.filter((id) => id !== le)].slice(0, r.g.quests[0].size);
  passProposal(r, team0);
  assert.ok(r.act(le, "quest", { success: true }).error, "evil Lancelot must fail in v2");
  for (const id of team0) r.act(id, "quest", { success: E.viewFor(r.state, id, 1000).me.team === "good" ? true : false });
  assert.equal(r.g.round, 1);
  assert.equal(E.viewFor(r.state, lg, 1000).me.team, "evil", "switched at the start of round 2");
  const team1 = [lg, ...r.ids.filter((id) => id !== lg)].slice(0, r.g.quests[1].size);
  passProposal(r, team1);
  assert.equal(r.act(lg, "quest", { success: true }).errorKey, "lancelotMustFail");
  assert.deepEqual(r.act(lg, "quest", { success: false }), {});
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
