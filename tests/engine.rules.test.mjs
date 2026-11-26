// Unit tests: server/engine.js against the original Avalon rules (RULES_CHECKLIST.md IDs in names).
// Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../server/engine.js";
import { EVIL, SIZES, FAILS, expectedKnowledge } from "./lib/oracle.mjs";

function seeded(s = 42) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function room(n, settings = {}, seed = 42) {
  const rng = seeded(seed);
  const { state, player } = E.createState("TEST1", "p0", { rng, now: 1 });
  const ids = [player.id];
  for (let i = 1; i < n; i++) ids.push(E.joinPlayer(state, `p${i}`, null, { rng, now: 1 }).player.id);
  const host = ids[0];
  const ok = (r) => assert.ok(!r.error, r.error);
  ok(E.applyAction(state, { action: "settings", playerId: host, settings }, { rng }));
  for (const id of ids.slice(1)) ok(E.applyAction(state, { action: "ready", playerId: id, ready: true }, { rng }));
  return { state, ids, host, rng, act: (id, action, p = {}) => E.applyAction(state, { action, playerId: id, ...p }, { rng }) };
}
function started(n, settings, seed) {
  const r = room(n, settings, seed);
  assert.ok(!r.act(r.host, "start").error);
  for (const id of r.ids) r.act(id, "ack");
  assert.equal(r.state.phase, "propose");
  return r;
}
const seats = (s) => s.players.map((p) => p.id);
const leader = (s) => s.players[s.game.leaderSeat].id;
function proposeAndVote(r, approveCount) {
  const g = r.state.game, size = g.quests[g.round].size;
  assert.ok(!r.act(leader(r.state), "propose", { team: seats(r.state).slice(0, size) }).error);
  seats(r.state).forEach((id, i) => r.act(id, "vote", { approve: i < approveCount }));
}
function playQuest(r, failCount) {
  const g = r.state.game;
  let f = failCount;
  // make the first `failCount` team members evil for this test
  for (const id of g.proposal.team) {
    if (f > 0) { g.roleOf[id] = "minion"; if (g.allegiance) g.allegiance[id] = "evil"; assert.ok(!r.act(id, "quest", { success: false }).error); f--; }
    else assert.ok(!r.act(id, "quest", { success: true }).error);
  }
}

test("A1 start needs 5..10 players", () => {
  const r4 = room(4); assert.ok(r4.act(r4.host, "start").error);
  const r5 = room(5); assert.ok(!r5.act(r5.host, "start").error);
  const r10 = room(10); assert.ok(E.joinPlayer(r10.state, "extra").error, "11th player must be refused");
});

for (const n of [5, 6, 7, 8, 9, 10]) {
  test(`A2/A3/A4 composition and quest table for ${n}`, () => {
    const r = started(n, {});
    const roles = Object.values(r.state.game.roleOf);
    assert.equal(roles.filter((x) => ["assassin", "morgana", "mordred", "oberon", "minion"].includes(x)).length, EVIL[n]);
    assert.deepEqual(r.state.game.quests.map((q) => q.size), SIZES[n]);
    assert.deepEqual(r.state.game.quests.map((q) => q.failsNeeded), FAILS(n));
  });
}

test("A4 quest 4 with 7 players: one fail still succeeds, two fail", () => {
  for (const [fails, exp] of [[1, "success"], [2, "fail"]]) {
    const r = started(7, {});
    const g = r.state.game;
    g.round = 3; // 4th quest
    proposeAndVote(r, 7);
    playQuest(r, fails);
    assert.equal(g.quests[3].result, exp);
  }
});
test("A4 quest 4 with 6 players: one fail fails", () => {
  const r = started(6, {});
  r.state.game.round = 3;
  proposeAndVote(r, 6);
  playQuest(r, 1);
  assert.equal(r.state.game.quests[3].result, "fail");
});

test("A7 too many evil specials refused at start", () => {
  const r = room(5, { roles: { merlin: true, morgana: true, mordred: true, oberon: true } });
  assert.ok(r.act(r.host, "start").error);
});

test("C2 only leader proposes, exact size, no unknown ids", () => {
  const r = started(5, {});
  const L = leader(r.state), other = seats(r.state).find((x) => x !== L);
  assert.ok(r.act(other, "propose", { team: seats(r.state).slice(0, 2) }).error);
  assert.ok(r.act(L, "propose", { team: seats(r.state).slice(0, 3) }).error);
  assert.ok(r.act(L, "propose", { team: [L, "nobody"] }).error);
  assert.ok(r.act(L, "propose", { team: [L, L] }).error, "duplicates must not count twice");
  assert.ok(!r.act(L, "propose", { team: [L, other] }).error, "C3 leader may include self");
});

test("C4 tie is a rejection (6 players, 3-3)", () => {
  const r = started(6, {});
  proposeAndVote(r, 3);
  assert.equal(r.state.game.lastVote.approved, false);
  assert.equal(r.state.phase, "propose");
});
test("C4 strict majority approves (5 players, 3-2)", () => {
  const r = started(5, {});
  proposeAndVote(r, 3);
  assert.equal(r.state.phase, "quest");
});

test("C1/C5 leader rotates clockwise; 5th rejection → evil wins", () => {
  const r = started(5, {});
  const first = r.state.game.leaderSeat;
  for (let k = 1; k <= 5; k++) {
    assert.equal(r.state.game.leaderSeat, (first + k - 1) % 5);
    assert.equal(r.state.game.proposalNo, k);
    proposeAndVote(r, 0);
  }
  assert.equal(r.state.phase, "end");
  assert.equal(r.state.game.winner, "evil");
  assert.equal(r.state.game.winReason, "rejections");
});

test("C6 rejection count resets after a quest", () => {
  const r = started(5, {});
  for (let k = 0; k < 4; k++) proposeAndVote(r, 0);
  proposeAndVote(r, 5);
  playQuest(r, 0);
  assert.equal(r.state.game.proposalNo, 1);
  assert.equal(r.state.game.round, 1);
});

test("D1/D2 quest cards: members only, once, good can't fail", () => {
  const r = started(5, { roles: { merlin: true } });
  proposeAndVote(r, 5);
  const g = r.state.game, team = g.proposal.team;
  const outsider = seats(r.state).find((x) => !team.includes(x));
  assert.ok(r.act(outsider, "quest", { success: true }).error);
  g.roleOf[team[0]] = "servant";
  assert.ok(r.act(team[0], "quest", { success: false }).error);
  assert.ok(!r.act(team[0], "quest", { success: true }).error);
  assert.ok(r.act(team[0], "quest", { success: true }).error, "second card refused");
});

test("D3 quest result shows count only, not who failed", () => {
  const r = started(5, {});
  proposeAndVote(r, 5);
  playQuest(r, 1);
  const v = E.viewFor(r.state, r.ids[0], 1);
  assert.equal(v.lastQuest.fails, 1);
  assert.ok(!JSON.stringify(v.lastQuest).includes("questCards"));
  assert.deepEqual(Object.keys(v.lastQuest).sort(), ["fails", "result", "round", "seq", "successes", "team"]);
});

test("D4/E1 three successes with merlin → assassination; hit = evil, miss = good", () => {
  for (const hit of [true, false]) {
    const r = started(5, { roles: { merlin: true } });
    for (let q = 0; q < 3; q++) { proposeAndVote(r, 5); playQuest(r, 0); }
    assert.equal(r.state.phase, "assassin");
    const g = r.state.game;
    const merlin = Object.keys(g.roleOf).find((id) => g.roleOf[id] === "merlin");
    const other = Object.keys(g.roleOf).find((id) => g.roleOf[id] === "servant");
    const nonA = seats(r.state).find((id) => id !== g.assassinId);
    assert.ok(r.act(nonA, "assassinate", { targetId: merlin }).error, "E2 only the assassin");
    r.act(g.assassinId, "assassinate", { targetId: hit ? merlin : other });
    assert.equal(g.winner, hit ? "evil" : "good");
  }
});
test("E4 no merlin → three successes is a plain good win", () => {
  const r = started(5, { roles: { merlin: false, morgana: false } });
  for (let q = 0; q < 3; q++) { proposeAndVote(r, 5); playQuest(r, 0); }
  assert.equal(r.state.phase, "end");
  assert.equal(r.state.game.winReason, "quests");
});
test("D4 three fails → evil wins at once", () => {
  const r = started(5, {});
  for (let q = 0; q < 3; q++) { proposeAndVote(r, 5); playQuest(r, 1); }
  assert.equal(r.state.game.winner, "evil");
  assert.equal(r.state.game.winReason, "fails");
});
test("E3 (warning) assassin should not be able to name themselves", () => {
  const r = started(5, { roles: { merlin: true } });
  for (let q = 0; q < 3; q++) { proposeAndVote(r, 5); playQuest(r, 0); }
  const res = r.act(r.state.game.assassinId, "assassinate", { targetId: r.state.game.assassinId });
  assert.ok(res.error, "engine lets the assassin target themselves (good wins by accident)");
});

test("B1-B5 night knowledge matches the rulebook for every role, all optional roles on", () => {
  for (const n of [7, 8, 9, 10]) for (let seed = 1; seed < 30; seed++) {
    const r = started(n, { roles: { merlin: true, percival: true, morgana: true, mordred: true, oberon: n >= 10 } }, seed);
    for (const id of r.ids) {
      const v = E.viewFor(r.state, id, 1);
      const got = new Map(v.me.knowledge.map((k) => [k.id, k.tag]));
      assert.deepEqual([...got].sort(), [...expectedKnowledge(r.state.game.roleOf, id)].sort(), `${v.me.role} n=${n}`);
    }
  }
});

test("F2/F4/F5 lady: starts right of first leader, after quest 2, no previous holders, holder-only result", () => {
  const r = started(7, { lady: true });
  const g = r.state.game, n = 7;
  assert.equal(r.state.players.findIndex((p) => p.id === g.ladyHolderId), (g.leaderSeat - 1 + n) % n);
  proposeAndVote(r, 7); playQuest(r, 0);
  assert.equal(r.state.phase, "propose", "no lady after quest 1");
  proposeAndVote(r, 7); playQuest(r, 0);
  assert.equal(r.state.phase, "lady", "lady after quest 2");
  const holder = g.ladyHolderId;
  assert.ok(r.act(holder, "lady", { targetId: holder }).error, "not self");
  const target = seats(r.state).find((id) => id !== holder);
  const others = seats(r.state).filter((id) => id !== holder && id !== target);
  assert.ok(r.act(others[0], "lady", { targetId: target }).error, "only holder");
  assert.ok(!r.act(holder, "lady", { targetId: target }).error);
  assert.equal(E.viewFor(r.state, holder, 1).me.ladyResults.length, 1);
  for (const id of others) assert.equal(E.viewFor(r.state, id, 1).me.ladyResults.length, 0);
  // next lady: new holder can't look at the old holder
  proposeAndVote(r, 7); playQuest(r, 0);
  if (r.state.phase === "lady") assert.ok(r.act(target, "lady", { targetId: holder }).error);
});

test("B6 views never carry other players' secrets before the end", () => {
  const r = started(8, { roles: { merlin: true, percival: true, morgana: true, mordred: true }, lady: true });
  const tokens = r.state.players.map((p) => p.token);
  for (const id of r.ids) {
    const s = JSON.stringify(E.viewFor(r.state, id, 1));
    for (const t of tokens) assert.ok(!s.includes(t), "token leaked");
    assert.ok(!s.includes("roleOf"));
    const v = JSON.parse(s);
    assert.equal(v.revealed, null);
    assert.equal(v.assassinId, null);
  }
});

test("H3 in-game rejoin by exact name must not hand over another player's role without proof", () => {
  const r = started(5, {});
  const victim = r.state.players[1];
  const res = E.joinPlayer(r.state, victim.name, null, { now: 2 });
  assert.ok(res.error, "anyone who types a player's name gets their seat and secret role");
});

test("H3b a player whose phone is locked (no polling >15 s) can have their seat and role taken by anyone typing their name", () => {
  const r = started(5, {});
  const victim = r.state.players[1];
  victim.lastSeen = 0; // phone in pocket, browser suspended
  const res = E.joinPlayer(r.state, victim.name, null, { now: 60_000 });
  assert.ok(res.error, "name-only rejoin of an idle seat hands over the secret role without any proof");
});
