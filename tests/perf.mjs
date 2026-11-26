// Lag check: how long the server's work takes per tap, how big each phone's download is,
// and how much DB traffic a full table of phones makes. Run: node tests/perf.mjs
import * as E from "../server/engine.js";
import { localTransport } from "./lib/transport-local.mjs";
import { playGame } from "./lib/harness.mjs";

// 1) worst-case late-game state: 10 players, longest possible game (every round goes to the 5th proposal)
function seeded(s = 9) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const rng = seeded();
const { state, player } = E.createState("PERF1", "p0", { rng, now: 1 });
const ids = [player.id];
for (let i = 1; i < 10; i++) ids.push(E.joinPlayer(state, `참가자${i}`, null, { rng, now: 1 }).player.id);
E.applyAction(state, { action: "settings", playerId: ids[0], settings: { roles: { merlin: true, percival: true, morgana: true, mordred: true, oberon: true }, lady: true } }, { rng });
ids.slice(1).forEach((id) => E.applyAction(state, { action: "ready", playerId: id, ready: true }, { rng }));
E.applyAction(state, { action: "start", playerId: ids[0] }, { rng });
ids.forEach((id) => E.applyAction(state, { action: "ack", playerId: id }, { rng }));
const L = () => state.players[state.game.leaderSeat].id;
let applyMs = [], viewMs = [];
const timed = (arr, f) => { const t = process.hrtime.bigint(); const r = f(); arr.push(Number(process.hrtime.bigint() - t) / 1e6); return r; };
for (let round = 0; round < 5 && state.phase !== "end"; round++) {
  for (let k = 0; k < 5 && state.phase !== "end"; k++) {
    const size = state.game.quests[state.game.round].size;
    timed(applyMs, () => E.applyAction(state, { action: "propose", playerId: L(), team: ids.slice(0, size) }, { rng }));
    const approve = k === 4 - (round === 4 ? 1 : 0) ; // approve on the 4th/5th try → max history without hammer
    ids.forEach((id) => timed(applyMs, () => E.applyAction(state, { action: "vote", playerId: id, approve: approve }, { rng })));
    if (state.phase === "quest") break;
  }
  if (state.phase === "quest") for (const id of state.game.proposal.team) timed(applyMs, () => E.applyAction(state, { action: "quest", playerId: id, success: round % 2 === 0 || E.teamOf(state.game.roleOf[id]) === "good" }, { rng }));
  if (state.phase === "lady") { const t = ids.find((id) => !state.game.ladyUsedBy.includes(id)); E.applyAction(state, { action: "lady", playerId: state.game.ladyHolderId, targetId: t }, { rng }); }
  for (let i = 0; i < 200; i++) ids.forEach((id) => timed(viewMs, () => E.viewFor(state, id, 1)));
}
const viewBytes = Math.max(...ids.map((id) => Buffer.byteLength(JSON.stringify({ ok: true, view: E.viewFor(state, id, 1) }))));
const stateBytes = Buffer.byteLength(JSON.stringify(state));
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)].toFixed(3);
console.log(`longest 10-player game: ${state.game.voteHistory.length} proposals, phase=${state.phase}`);
console.log(`engine applyAction: p50 ${pct(applyMs, 0.5)} ms, p99 ${pct(applyMs, 0.99)} ms`);
console.log(`engine viewFor:     p50 ${pct(viewMs, 0.5)} ms, p99 ${pct(viewMs, 0.99)} ms`);
console.log(`one phone's download per refresh: ${(viewBytes / 1024).toFixed(1)} KB; stored room row: ${(stateBytes / 1024).toFixed(1)} KB`);

// 2) traffic model from web/net.js + server/index.ts (10 phones, 4 s polling, realtime nudges on every change)
const phones = 10, pollS = 4, game = { minutes: 30, changes: 0 };
const r = await playGame(localTransport({ seed: 5 }), { n: 10, roles: { merlin: true, percival: true, morgana: true }, lady: true, seed: 5, chaos: 0 });
game.changes = r.log.filter((l) => l.ok && !["state"].includes(l.body.action)).length;
const pollsPerMin = (phones * 60) / pollS;
const nudgeReqs = game.changes * phones; // every change → every phone refreshes once
const reqPerMin = pollsPerMin + nudgeReqs / game.minutes + game.changes / game.minutes;
console.log(`taps in a full 10-player game: ${game.changes}; function calls/min (30-min game): ~${Math.round(reqPerMin)} (${(reqPerMin / 60).toFixed(1)}/s)`);
console.log(`download per phone per minute: ~${(((60 / pollS) + nudgeReqs / phones / game.minutes) * viewBytes / 1024).toFixed(0)} KB`);
