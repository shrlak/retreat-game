// Simulated-player harness. Bots only ever look at their own view (like a phone client).
// Every view every bot receives is recorded and checked against the oracle at the end.
import { EVIL, SIZES, FAILS, teamOf, expectedKnowledge, allegianceAt } from "./oracle.mjs";

function mkRng(seed) {
  let s = (seed >>> 0) || 7;
  return () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function sample(rng, arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, k);
}

const FORBIDDEN_KEYS = new Set(["roleOf", "questCards", "token", "votes_pending", "acked_map", "allegiance", "loyaltyDeck", "excaliburResults_all"]);

export async function playGame(transport, opts = {}) {
  const {
    n = 5, roles: roles0 = { merlin: true, percival: true, morgana: true, assassin: true, mordred: false, oberon: false },
    lady = false, lancelot = 0, excalibur = false, seed = 1, approveProb = 0.6, evilFailProb = 0.7, chaos = 0.15, maxSteps = 4000,
  } = opts;
  let roles = { ...roles0 };
  const rng = mkRng(seed);
  const findings = [];
  const log = [];
  const tag = `n=${n} seed=${seed} lady=${lady}${lancelot ? " lancelot=" + lancelot : ""}${excalibur ? " excalibur" : ""} roles=${Object.keys(roles).filter((k) => roles[k]).join("+") || "none"}`;
  const bad = (id, msg, extra) => findings.push({ id, msg, tag, extra, step: log.length });
  const call = async (body) => {
    const r = await transport.call(body);
    log.push({ body: { ...body, token: body.token ? "…" : undefined }, ok: r.ok, error: r.error });
    if (transport.crashes && transport.crashes.length) bad("CRASH", `server error on ${body.action}`, transport.crashes.splice(0)[0]);
    return r;
  };

  // ---- lobby
  const bots = [];
  const c = await call({ action: "create", name: "봇1" });
  if (!c.ok) { bad("API", "create failed", c.error); return { findings, log, tag }; }
  const code = c.code;
  bots.push({ name: "봇1", id: c.playerId, token: c.token, views: [c.view] });
  for (let i = 2; i <= n; i++) {
    const j = await call({ action: "join", code, name: `봇${i}` });
    if (!j.ok) { bad("API", `join ${i} failed`, j.error); return { findings, log, tag }; }
    bots.push({ name: `봇${i}`, id: j.playerId, token: j.token, views: [j.view] });
  }
  const host = bots[0];
  const act = async (b, action, params = {}) => {
    const r = await call({ action, code, playerId: b.id, token: b.token, ...params });
    if (r.ok && r.view) b.views.push(r.view);
    return r;
  };
  // join-by-name hijack probe (lobby): duplicate names must be refused
  const dup = await call({ action: "join", code, name: "봇2" });
  if (dup.ok && dup.playerId === bots[1].id) bad("H3", "lobby: joining with an existing name returned that player's seat");

  let r = await act(host, "settings", { settings: { roles, lady, maxPlayers: 10, ...(lancelot ? { lancelot } : {}), ...(excalibur ? { excalibur } : {}) } });
  if (!r.ok) { bad("API", "settings refused", r.error); return { findings, log, tag }; }
  const eff = r.view.settings.roles;
  for (const k of Object.keys(roles)) if (!!eff[k] !== !!roles[k]) { roles = { ...roles, ...eff }; break; }
  // start before ready must be refused
  r = await act(host, "start");
  if (r.ok) bad("LOBBY", "start allowed while players not ready");
  for (const b of bots.slice(1)) await act(b, "ready", { ready: true });
  r = await act(host, "start");
  if (!r.ok) { return { findings, log, tag, setupRefused: r.error }; }

  // ---- in-game probe: a stranger typing another player's exact name
  const hijack = await call({ action: "join", code, name: bots[1].name });
  if (hijack.ok && hijack.playerId === bots[1].id && hijack.view?.me?.role) {
    bad("H3-LEAK", "in game, joining with another player's exact name returns their seat and secret role (no token needed)",
      { gotRole: hijack.view.me.role });
    // the engine rotates the token: re-adopt it so the real bot keeps playing
    bots[1].token = hijack.token;
  }

  // ---- play
  const truth = { leaderSeq: [], cardsPlayed: {}, ladyEvents: [], played: {}, excal: [] };
  let steps = 0;
  let lastVoteSeq = 0, lastQuestSeq = 0, lastLadySeq = 0;
  let firstLeaderId = null, firstLadyHolder = null;
  const seatOf = {};
  while (steps++ < maxSteps) {
    // everyone refreshes
    const views = [];
    for (const b of bots) {
      const s = await act(b, "state");
      if (!s.ok) { bad("API", `state failed for ${b.name}`, s.error); return { findings, log, tag }; }
      views.push(s.view);
    }
    const v = views[0];
    for (const p of v.players) seatOf[p.id] = p.seat;
    if (views.some((x) => x.phase !== v.phase || x.v !== v.v)) bad("SYNC", "players saw different phase/version in same tick");
    if (v.phase === "end") break;

    if (v.phase === "reveal") {
      for (const b of bots) await act(b, "ack");
      continue;
    }
    if (v.phase === "propose") {
      if (!firstLeaderId) { firstLeaderId = v.leaderId; firstLadyHolder = v.ladyHolderId; }
      truth.leaderSeq.push({ round: v.round, proposalNo: v.proposalNo, leaderId: v.leaderId });
      const leader = bots.find((b) => b.id === v.leaderId);
      const lv = views[bots.indexOf(leader)];
      const size = v.quests[v.round].size;
      // chaos: a non-leader tries to propose
      if (rng() < chaos) {
        const other = pick(rng, bots.filter((b) => b !== leader));
        const x = await act(other, "propose", { team: sample(rng, v.players.map((p) => p.id), size) });
        if (x.ok) bad("C2", "non-leader proposal accepted");
      }
      if (rng() < chaos) {
        const x = await act(leader, "propose", { team: sample(rng, v.players.map((p) => p.id), size + 1) });
        if (x.ok) bad("C2", "wrong team size accepted");
      }
      if (v.excalibur && rng() < chaos) {
        const x = await act(leader, "propose", { team: [leader.id, ...v.players.map((p) => p.id).filter((id) => id !== leader.id).slice(0, size - 1)], excaliburTo: leader.id });
        if (x.ok) bad("X1", "leader could give Excalibur to themselves");
        if (x.ok) continue;
      }
      let team;
      if (lv.me.team === "evil") team = [leader.id, ...sample(rng, v.players.map((p) => p.id).filter((id) => id !== leader.id), size - 1)];
      else team = sample(rng, v.players.map((p) => p.id), size);
      const extra = v.excalibur ? { excaliburTo: pick(rng, team.filter((id) => id !== leader.id)) } : {};
      const x = await act(leader, "propose", { team, ...extra });
      if (!x.ok) bad("C2", "legal proposal refused", x.error);
      continue;
    }
    if (v.phase === "vote") {
      // leak probe: during voting nobody may see this proposal's votes
      for (const b of bots) {
        if (rng() < 0.5 && !views[bots.indexOf(b)].votedIds.includes(b.id)) {
          await act(b, "vote", { approve: rng() < approveProb });
        }
      }
      for (const b of bots) {
        const bv = b.views[b.views.length - 1];
        if (bv.phase === "vote" && bv.lastVote && bv.lastVote.round === bv.round && bv.lastVote.proposalNo === bv.proposalNo && bv.lastVote.seq > lastVoteSeq)
          bad("C4-LEAK", "votes of the current proposal visible before everyone voted");
      }
      for (const b of bots) {
        const bv = views[bots.indexOf(b)];
        if (!bv.votedIds.includes(b.id) && b.views[b.views.length - 1].phase === "vote") await act(b, "vote", { approve: rng() < approveProb });
      }
      continue;
    }
    if (v.phase === "quest") {
      const team = v.proposal.team;
      const outsider = bots.find((b) => !team.includes(b.id));
      if (outsider && rng() < chaos) {
        const x = await act(outsider, "quest", { success: true });
        if (x.ok) bad("D1", "non-member played a quest card");
      }
      for (const id of team) {
        const b = bots.find((x) => x.id === id);
        const bv = views[bots.indexOf(b)];
        if (bv.questPlayedIds.includes(id)) continue;
        if (bv.me.team === "good" && rng() < chaos) {
          const x = await act(b, "quest", { success: false });
          if (x.ok) bad("D2", "good player was allowed to play a fail card");
          if (x.ok) { truth.cardsPlayed[`${v.round}`] = (truth.cardsPlayed[`${v.round}`] || 0) + 1; continue; }
        }
        const success = bv.me.team === "good" ? true : !(rng() < evilFailProb);
        const x = await act(b, "quest", { success });
        if (x.ok) (truth.played[v.round] ||= {})[id] = success;
        if (!x.ok) bad("D1", "legal quest card refused", x.error);
        else if (!success) truth.cardsPlayed[`${v.round}`] = (truth.cardsPlayed[`${v.round}`] || 0) + 1;
        if (x.ok && rng() < chaos) {
          const y = await act(b, "quest", { success: true });
          if (y.ok) bad("D1", "same player played two quest cards");
        }
      }
      continue;
    }
    if (v.phase === "excalibur") {
      const holderId = v.proposal && v.proposal.excaliburTo;
      const holder = bots.find((b) => b.id === holderId);
      if (!holder) { bad("X2", "excalibur phase without a holder"); break; }
      const others = v.proposal.team.filter((id) => id !== holderId);
      const outsider = bots.find((b) => b.id !== holderId);
      const y = await act(outsider, "excalibur", { targetId: others[0] });
      if (y.ok) { bad("X2", "someone other than the holder used Excalibur"); continue; }
      if (rng() < chaos) { const z = await act(holder, "excalibur", { targetId: holderId }); if (z.ok) { bad("X2", "holder used Excalibur on themselves"); continue; } }
      const targetId = rng() < 0.6 ? pick(rng, others) : null;
      const x = await act(holder, "excalibur", { targetId });
      if (!x.ok) bad("X2", "legal Excalibur use refused", x.error);
      else {
        truth.excal.push({ round: v.round, holderId, targetId, original: targetId && truth.played[v.round] ? truth.played[v.round][targetId] : undefined });
        if (targetId && truth.played[v.round] && targetId in truth.played[v.round]) {
          const before = truth.played[v.round][targetId];
          truth.played[v.round][targetId] = !before;
          truth.cardsPlayed[`${v.round}`] = (truth.cardsPlayed[`${v.round}`] || 0) + (before ? 1 : -1);
        }
      }
      continue;
    }
    if (v.phase === "lady") {
      const holder = bots.find((b) => b.id === v.ladyHolderId);
      const used = new Set(v.ladyUsedBy);
      const usedOther = v.ladyUsedBy.filter((id) => id !== holder.id);
      if (usedOther.length && rng() < chaos * 2) {
        const x = await act(holder, "lady", { targetId: pick(rng, usedOther) });
        if (x.ok) bad("F4", "lady used on a previous holder");
        if (x.ok) continue;
      }
      const target = pick(rng, v.players.map((p) => p.id).filter((id) => !used.has(id)));
      const x = await act(holder, "lady", { targetId: target });
      if (!x.ok) bad("F4", "legal lady target refused", x.error);
      else truth.ladyEvents.push({ holderId: holder.id, targetId: target, round: v.round });
      continue;
    }
    if (v.phase === "assassin") {
      const a = bots.find((b) => b.id === v.assassinId);
      if (!a) { bad("E2", "assassin phase but assassinId is not a player"); break; }
      const av = views[bots.indexOf(a)];
      if (av.me.team !== "evil") bad("E2", "assassin is not evil");
      const nonA = bots.find((b) => b !== a);
      const y = await act(nonA, "assassinate", { targetId: a.id });
      if (y.ok) bad("E2", "a non-assassin was allowed to assassinate");
      if (y.ok) continue;
      const knownEvil = new Set(av.me.knowledge.map((k) => k.id));
      const cands = v.players.map((p) => p.id).filter((id) => id !== a.id && !knownEvil.has(id));
      const x = await act(a, "assassinate", { targetId: pick(rng, cands) });
      if (!x.ok) bad("E1", "assassination refused", x.error);
      continue;
    }
    if (v.phase === "lobby") { bad("FLOW", "game fell back to lobby"); break; }
  }
  if (steps >= maxSteps) bad("FLOW", "game did not finish within step budget");

  // ---- final views & verification
  for (const b of bots) { const s = await act(b, "state"); }
  const end = bots[0].views[bots[0].views.length - 1];
  const result = { winner: end.winner, winReason: end.winReason };
  verify({ bots, end, n, roles, lady, lancelot, excalibur, truth, firstLeaderId, firstLadyHolder, seatOf, bad });
  return { findings, log, tag, result, code, effectiveRoles: roles };
}

function deepScan(obj, path, visit) {
  if (obj && typeof obj === "object") {
    for (const [k, val] of Object.entries(obj)) { visit(k, val, `${path}.${k}`); deepScan(val, `${path}.${k}`, visit); }
  }
}

function verify({ bots, end, n, roles, lady, lancelot = 0, excalibur = false, truth, firstLeaderId, firstLadyHolder, seatOf, bad }) {
  if (end.phase !== "end") { bad("FLOW", `final phase is ${end.phase}`); return; }
  const roleOf = end.revealed;
  if (!roleOf) { bad("END", "revealed roles missing at end"); return; }
  const ids = bots.map((b) => b.id);
  // composition
  const rs = Object.values(roleOf);
  const evilN = rs.filter((r) => teamOf(r) === "evil").length;
  if (evilN !== EVIL[n]) bad("A2", `evil count ${evilN}, expected ${EVIL[n]}`);
  for (const k of ["merlin", "percival", "morgana", "mordred", "oberon"]) {
    const has = rs.includes(k);
    if (!!roles[k] !== has) bad("A5", `role ${k} enabled=${!!roles[k]} but in game=${has}`);
  }
  if (rs.filter((r) => r === "merlin").length > 1) bad("A5", "two merlins");
  for (const k of ["lancelotGood", "lancelotEvil"]) if (rs.includes(k) !== !!lancelot) bad("L0", `${k} in game=${rs.includes(k)} with lancelot=${lancelot}`);
  if ((end.lancelot || 0) !== (lancelot || 0)) bad("L0", `view lancelot=${end.lancelot}, set ${lancelot}`);
  if (lancelot) {
    const lr = end.loyaltyRevealed || [];
    const played = end.quests.filter((q) => q.result).length;
    const expCards = Math.max(0, Math.min(played, 4) - 1) + (end.winReason === "rejections" && played >= 2 ? 1 : 0);
    if (lr.length > 3) bad("L4", `${lr.length} loyalty cards revealed`);
    if (lr.some((c) => c.round < 2)) bad("L4", "loyalty card revealed before the 3rd quest");
    if (lr.filter((c) => c.card === "switch").length > 2) bad("L4", "more than 2 switch cards");
    if (new Set(lr.map((c) => c.round)).size !== lr.length) bad("L4", "two loyalty cards in one round");
    if (end.finalTeams) for (const [id, r] of Object.entries(roleOf))
      if (end.finalTeams[id] !== allegianceAt(r, lr)) bad("L7", `${r} final team ${end.finalTeams[id]}, expected ${allegianceAt(r, lr)}`);
    void expCards;
  }
  if (JSON.stringify(end.teamSizes) !== JSON.stringify(SIZES[n])) bad("A3", `team sizes ${end.teamSizes}`);
  if (JSON.stringify(end.failsNeeded) !== JSON.stringify(FAILS(n))) bad("A4", `failsNeeded ${end.failsNeeded}`);
  if (end.evilCount !== EVIL[n]) bad("A2", `view evilCount ${end.evilCount}`);
  const sortedPublic = (end.rolesInGame || []).slice().sort().join(",");
  if (sortedPublic !== rs.slice().sort().join(",")) bad("A6", "rolesInGame differs from actual roles");

  // leader rotation (C1): each successive proposal → next seat
  for (let i = 1; i < truth.leaderSeq.length; i++) {
    const a = seatOf[truth.leaderSeq[i - 1].leaderId], b = seatOf[truth.leaderSeq[i].leaderId];
    if (b !== (a + 1) % n) { bad("C1", `leader went seat ${a} → ${b}`); break; }
  }
  // proposals & hammer (C5/C6)
  for (const lv of end.voteHistory) {
    const yes = Object.values(lv.votes).filter(Boolean).length;
    if ((yes * 2 > n) !== lv.approved) bad("C4", `vote ${yes}/${n} approved=${lv.approved}`);
    if (Object.keys(lv.votes).length !== n) bad("C4", "not everyone's vote recorded");
    if (lv.proposalNo > 5) bad("C5", "more than 5 proposals in a round");
  }
  const rej5 = end.voteHistory.find((x) => x.proposalNo === 5 && !x.approved);
  if (rej5 && !(end.winner === "evil" && end.winReason === "rejections")) bad("C5", "5th rejection did not end the game for evil");
  if (end.winReason === "rejections" && !rej5) bad("C5", "ended by rejections without a 5th rejected proposal");
  // quests (D3/D4/A4)
  let succ = 0, fail = 0;
  end.quests.forEach((q, i) => {
    if (!q.result) return;
    const expFails = truth.cardsPlayed[`${i}`] || 0;
    if (excalibur && !truth.excal.some((x) => x.round === i)) bad("X2", `quest ${i + 1} resolved without an Excalibur step`);
    if (q.fails !== expFails) bad("D3", `quest ${i + 1}: ${q.fails} fails shown, ${expFails} played`);
    const exp = q.fails >= FAILS(n)[i] ? "fail" : "success";
    if (q.result !== exp) bad("A4", `quest ${i + 1}: ${q.fails} fails → ${q.result}, expected ${exp}`);
    if (q.team.length !== SIZES[n][i]) bad("A3", `quest ${i + 1} team size ${q.team.length}`);
    q.result === "success" ? succ++ : fail++;
  });
  if (end.winReason === "fails" && fail < 3) bad("D4", "evil won by fails with <3 failed quests");
  if (fail >= 3 && end.winReason !== "fails") bad("D4", "3 failed quests but game didn't end for evil");
  const merlinIn = rs.includes("merlin");
  if (succ >= 3) {
    if (merlinIn) {
      if (!["assassinHit", "assassinFailed"].includes(end.winReason)) bad("E1", "3 successes with merlin but no assassination");
      const hit = roleOf[end.assassinTargetId] === "merlin";
      if (hit && end.winner !== "evil") bad("E1", "assassin hit merlin but evil did not win");
      if (!hit && end.winner !== "good") bad("E1", "assassin missed but good did not win");
      if (end.assassinTargetId === end.assassinId) bad("E3", "assassin targeted themselves (engine allowed it)");
    } else if (end.winReason !== "quests" || end.winner !== "good") bad("E4", "3 successes without merlin should be a plain good win");
  }
  // lady (F2-F5)
  if (lady) {
    if (firstLadyHolder && firstLeaderId && seatOf[firstLadyHolder] !== (seatOf[firstLeaderId] - 1 + n) % n)
      bad("F2", "first lady holder is not to the right of the first leader");
    const prevHolders = new Set([firstLadyHolder]);
    for (const e of truth.ladyEvents) {
      if (prevHolders.has(e.targetId)) bad("F4", "lady target was a previous holder");
      prevHolders.add(e.targetId);
    }
    const R = end.quests.filter((q) => q.result).length;
    const endedAtQuest = ["fails", "quests", "assassinHit", "assassinFailed"].includes(end.winReason);
    const expectedUses = [2, 3, 4].filter((i) => i < R || (i === R && !endedAtQuest)).length;
    if (truth.ladyEvents.length !== expectedUses)
      bad("F3", `lady used ${truth.ladyEvents.length}x after ${R} quests (expected ${expectedUses}, end=${end.winReason})`);
  } else if (truth.ladyEvents.length) bad("F1", "lady phase happened with lady off");
  if (!excalibur && truth.excal.length) bad("X1", "Excalibur phase happened with Excalibur off");

  // ---- leak checks over every view every bot ever received (B1-B6, D3, F5)
  const tokens = new Set(bots.map((b) => b.token));
  for (const b of bots) {
    const exp = expectedKnowledge(roleOf, b.id, lancelot);
    let checkedKnowledge = false;
    for (const view of b.views) {
      if (!view) continue;
      const inGame = !["lobby"].includes(view.phase) && view.me.role;
      if (view.phase !== "end" && view.revealed) bad("B6", `${b.name} saw revealed roles during ${view.phase}`);
      if (view.phase !== "end" && view.phase !== "assassin" && view.assassinId) bad("B6", `${b.name} saw assassinId during ${view.phase}`);
      if (inGame) {
        if (view.me.role !== roleOf[b.id]) bad("B6", `${b.name} me.role changed`);
        const curTeam = allegianceAt(roleOf[b.id], view.loyaltyRevealed);
        if (view.me.team !== curTeam) bad("L8", `${b.name} me.team ${view.me.team}, expected ${curTeam}`);
        if ("startTeam" in view.me && view.me.startTeam !== teamOf(roleOf[b.id])) bad("L8", `${b.name} me.startTeam wrong`);
        if (view.phase !== "end" && view.finalTeams) bad("L8", `${b.name} saw finalTeams during ${view.phase}`);
        const got = new Map(view.me.knowledge.map((k) => [k.id, k.tag]));
        for (const [id] of exp.optional || []) if (got.get(id) === "evil") got.delete(id);
        const a = [...got].sort().join("|"), e = [...exp].sort().join("|");
        if (a !== e && !checkedKnowledge) {
          bad("B1-5", `${b.name} (${roleOf[b.id]}) knowledge wrong`, { got: [...got].map(([id, t]) => `${roleOf[id]}:${t}`), expected: [...exp].map(([id, t]) => `${roleOf[id]}:${t}`) });
          checkedKnowledge = true;
        }
        for (const lr of view.me.ladyResults) {
          const mine = truth.ladyEvents.some((e) => e.holderId === b.id && e.targetId === lr.targetId);
          if (!mine) bad("F5", `${b.name} has a lady result it did not earn`);
          const ev = truth.ladyEvents.find((e) => e.holderId === b.id && e.targetId === lr.targetId);
          const expT = ev ? allegianceAt(roleOf[lr.targetId], end.loyaltyRevealed, ev.round) : teamOf(roleOf[lr.targetId]);
          if (lr.team !== expT) bad(lancelot ? "L9" : "F5", `lady result shows ${lr.team} for ${roleOf[lr.targetId]}, expected ${expT}`);
        }
        for (const xr of view.me.excaliburResults || []) {
          const ev = truth.excal.find((x) => x.holderId === b.id && x.round === xr.round && x.targetId === xr.targetId);
          if (!ev) bad("X3", `${b.name} has an Excalibur result it did not earn`);
          else if (xr.original !== ev.original) bad("X3", `${b.name} Excalibur shows original=${xr.original}, played ${ev.original}`);
        }
      }
      deepScan(view, "view", (k, val, path) => {
        if (FORBIDDEN_KEYS.has(k)) bad("B6", `${b.name} view has forbidden key ${path}`);
        if (k === "role" && path !== "view.me.role") bad("B6", `${b.name} view has role at ${path}`);
        if (typeof val === "string" && tokens.has(val)) bad("B6", `${b.name} view contains a player token at ${path}`);
        if (k === "team" && path.startsWith("view.players")) bad("B6", `${b.name} sees a team in players list`);
        if (k === "original" && !path.startsWith("view.me.excaliburResults")) bad("X3", `${b.name} sees an Excalibur original card at ${path}`);
      });
    }
  }
}
