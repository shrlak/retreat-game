// 빛의 원정대 — rules engine. Pure JS (ESM), no deps. Runs in Deno and Node.
// State is a plain JSON object. Never send it to clients: use viewFor().

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;
export const EVIL_COUNT = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
export const TEAM_SIZES = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};
export const BALANCE_SIZES = { 5: [3, 2, 3, 2, 3], 7: [2, 3, 4, 3, 4] };
export function teamSizes(n, settings) {
  if (settings && settings.balance && BALANCE_SIZES[n]) return BALANCE_SIZES[n];
  return TEAM_SIZES[n] ?? null;
}
export const GOOD_ROLES = ["merlin", "percival", "servant"];
export const EVIL_ROLES = ["assassin", "morgana", "mordred", "oberon", "minion"];
export const ONLINE_MS = 15000;

export function teamOf(role) {
  return EVIL_ROLES.includes(role) ? "evil" : "good";
}
export function failsNeeded(n) {
  return [1, 1, 1, n >= 7 ? 2 : 1, 1];
}

export const DEFAULT_SETTINGS = {
  roles: { merlin: true, percival: true, morgana: true, assassin: true, mordred: false, oberon: false },
  lady: false,
  balance: false,
  maxPlayers: 10,
};

function defaultRng() {
  return Math.random();
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randId(rng, len = 10) {
  const c = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += c[Math.floor(rng() * c.length)];
  return s;
}
export function randCode(rng = defaultRng) {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += c[Math.floor(rng() * c.length)];
  return s;
}

function cleanName(name) {
  const n = String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 12);
  return n;
}

function err(msg) {
  return { error: msg };
}

/** Build the role list for n players from settings. Returns {roles} or {error}. */
export function buildRoles(n, settings) {
  const r = settings.roles || {};
  const evilN = EVIL_COUNT[n];
  const good = [];
  const evil = [];
  if (r.merlin) good.push("merlin");
  if (r.percival) {
    if (!r.merlin) return err("파수꾼은 선지자가 있어야 넣을 수 있어요");
    good.push("percival");
  }
  if (r.assassin) evil.push("assassin");
  if (r.morgana) evil.push("morgana");
  if (r.mordred) evil.push("mordred");
  if (r.oberon) evil.push("oberon");
  if (evil.length > evilN) return err(`${n}명일 때 유혹의 무리는 ${evilN}명이라 특수 역할을 줄여야 해요`);
  if (good.length > n - evilN) return err("빛의 일꾼 특수 역할이 너무 많아요");
  while (good.length < n - evilN) good.push("servant");
  while (evil.length < evilN) evil.push("minion");
  return { roles: [...good, ...evil] };
}

export function createState(code, hostName, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const rng = ctx.rng ?? defaultRng;
  const name = cleanName(hostName);
  if (!name) return err("이름을 입력해 주세요");
  const p = newPlayer(name, 0, now, rng);
  const state = {
    code,
    v: 1,
    createdAt: now,
    phase: "lobby",
    hostId: p.id,
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    players: [p],
    game: null,
    seqs: { vote: 0, quest: 0, lady: 0 },
  };
  return { state, player: p };
}

function newPlayer(name, seat, now, rng) {
  return { id: randId(rng, 8), token: randId(rng, 20), name, seat, ready: false, lastSeen: now };
}

function P(state, id) {
  return state.players.find((p) => p.id === id);
}

/** Join or rejoin. Returns {player} or {error}. Mutates state. */
export function joinPlayer(state, name, token, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const rng = ctx.rng ?? defaultRng;
  if (token) {
    const byTok = state.players.find((p) => p.token === token);
    if (byTok) {
      byTok.lastSeen = now;
      return { player: byTok };
    }
  }
  const n = cleanName(name);
  if (!n) return err("이름을 입력해 주세요");
  const same = state.players.find((p) => p.name === n);
  if (state.phase !== "lobby") {
    if (!same) return err("이미 시작된 게임이에요. 처음 쓴 이름 그대로 입력하면 다시 들어갈 수 있어요");
    // name-only rejoin is allowed only for a seat whose phone has been gone a while,
    // so nobody can take over (and peek at) an active player's seat.
    if (now - same.lastSeen < ONLINE_MS) return err("그 이름은 지금 접속 중이에요. 원래 폰에서 다시 열어 주세요");
    same.token = randId(rng, 20); // rejoin from another device: old device is signed out
    same.lastSeen = now;
    return { player: same, changed: true };
  }
  if (same) return err("같은 이름이 이미 있어요. 다른 이름을 써 주세요");
  if (state.players.length >= Math.min(MAX_PLAYERS, state.settings.maxPlayers || MAX_PLAYERS))
    return err("방이 가득 찼어요");
  const p = newPlayer(n, state.players.length, now, rng);
  state.players.push(p);
  return { player: p, changed: true };
}

function reseat(state) {
  state.players.forEach((p, i) => (p.seat = i));
}

function mergeSettings(cur, patch) {
  const out = JSON.parse(JSON.stringify(cur));
  if (patch && typeof patch === "object") {
    if (patch.roles && typeof patch.roles === "object") {
      for (const k of ["merlin", "percival", "morgana", "assassin", "mordred", "oberon"]) {
        if (k in patch.roles) out.roles[k] = !!patch.roles[k];
      }
    }
    if ("lady" in patch) out.lady = !!patch.lady;
    if ("balance" in patch) out.balance = !!patch.balance;
    if ("maxPlayers" in patch) {
      const m = Math.round(Number(patch.maxPlayers));
      if (m >= MIN_PLAYERS && m <= MAX_PLAYERS) out.maxPlayers = m;
    }
  }
  // dependencies
  if (!out.roles.merlin) {
    out.roles.percival = false;
    out.roles.assassin = false;
  }
  if (out.roles.merlin && !out.roles.assassin) out.roles.assassin = true;
  return out;
}

function startGame(state, rng) {
  const n = state.players.length;
  const built = buildRoles(n, state.settings);
  if (built.error) return built;
  const roles = shuffle(built.roles, rng);
  // random seating order for the table, keeps fun + fairness
  const order = shuffle(state.players.map((p) => p.id), rng);
  state.players.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  reseat(state);
  const roleOf = {};
  state.players.forEach((p, i) => (roleOf[p.id] = roles[i]));
  const leaderSeat = Math.floor(rng() * n);
  let assassinId = null;
  if (roles.includes("merlin")) {
    const a = state.players.find((p) => roleOf[p.id] === "assassin");
    if (a) assassinId = a.id;
    else {
      const evils = state.players.filter((p) => teamOf(roleOf[p.id]) === "evil");
      assassinId = evils[Math.floor(rng() * evils.length)].id;
    }
  }
  const lady = !!state.settings.lady;
  const ladyHolder = lady ? state.players[(leaderSeat - 1 + n) % n].id : null;
  state.game = {
    roleOf,
    rolesInGame: built.roles.slice().sort(),
    acked: {},
    round: 0,
    proposalNo: 1,
    leaderSeat,
    quests: teamSizes(n, state.settings).map((size, i) => ({ size, failsNeeded: failsNeeded(n)[i], result: null, team: [], fails: null })),
    proposal: null,
    votes: {},
    questCards: {},
    lastVote: null,
    lastQuest: null,
    lastLady: null,
    voteHistory: [],
    lady,
    ladyHolderId: ladyHolder,
    ladyUsedBy: ladyHolder ? [ladyHolder] : [],
    ladyResults: {}, // holderId -> [{targetId, team}]
    assassinId,
    assassinTargetId: null,
    winner: null,
    winReason: null,
  };
  state.phase = "reveal";
  return {};
}

function leaderId(state) {
  return state.players[state.game.leaderSeat].id;
}

function nextLeader(state) {
  const g = state.game;
  g.leaderSeat = (g.leaderSeat + 1) % state.players.length;
}

function endGame(state, winner, reason) {
  state.game.winner = winner;
  state.game.winReason = reason;
  state.phase = "end";
}

function afterQuestResolved(state) {
  const g = state.game;
  const succ = g.quests.filter((q) => q.result === "success").length;
  const fail = g.quests.filter((q) => q.result === "fail").length;
  if (fail >= 3) return endGame(state, "evil", "fails");
  if (succ >= 3) {
    if (g.assassinId) {
      state.phase = "assassin";
      return;
    }
    return endGame(state, "good", "quests");
  }
  g.round += 1;
  g.proposalNo = 1;
  g.proposal = null;
  nextLeader(state);
  // lady after quests 2,3,4 (round index 1,2,3 just finished => now round 2,3,4)
  if (g.lady && g.round >= 2 && g.round <= 4) {
    const candidates = state.players.filter((p) => !g.ladyUsedBy.includes(p.id));
    if (candidates.length) {
      state.phase = "lady";
      return;
    }
  }
  state.phase = "propose";
}

/**
 * Apply an action. msg = {action, playerId, ...params}. Mutates state.
 * Returns {} on success, {error} on refusal. Bumps state.v when something changed.
 */
export function applyAction(state, msg, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const rng = ctx.rng ?? defaultRng;
  const me = P(state, msg.playerId);
  if (!me) return err("이 방의 참가자가 아니에요");
  me.lastSeen = now;
  const isHost = state.hostId === me.id;
  const g = state.game;
  const a = msg.action;
  const res = (() => {
    switch (a) {
      case "ready": {
        if (state.phase !== "lobby") return err("지금은 준비를 바꿀 수 없어요");
        me.ready = !!msg.ready;
        return {};
      }
      case "settings": {
        if (!isHost) return err("방장만 설정을 바꿀 수 있어요");
        if (state.phase !== "lobby") return err("게임 중에는 설정을 바꿀 수 없어요");
        state.settings = mergeSettings(state.settings, msg.settings);
        if (state.players.length > state.settings.maxPlayers) state.settings.maxPlayers = state.players.length;
        state.players.forEach((p) => (p.ready = false)); // settings changed → re-confirm
        return {};
      }
      case "kick": {
        if (!isHost) return err("방장만 내보낼 수 있어요");
        if (state.phase !== "lobby") return err("게임 중에는 내보낼 수 없어요");
        if (msg.targetId === me.id) return err("자기 자신은 내보낼 수 없어요");
        const i = state.players.findIndex((p) => p.id === msg.targetId);
        if (i < 0) return err("없는 참가자예요");
        state.players.splice(i, 1);
        reseat(state);
        return {};
      }
      case "leave": {
        if (state.phase !== "lobby") return err("게임 중에는 나갈 수 없어요");
        const i = state.players.findIndex((p) => p.id === me.id);
        state.players.splice(i, 1);
        reseat(state);
        if (isHost && state.players.length) state.hostId = state.players[0].id;
        return {};
      }
      case "start": {
        if (!isHost) return err("방장만 시작할 수 있어요");
        if (state.phase !== "lobby") return err("이미 시작했어요");
        const n = state.players.length;
        if (n < MIN_PLAYERS) return err(`최소 ${MIN_PLAYERS}명이 필요해요 (지금 ${n}명)`);
        if (n > MAX_PLAYERS) return err(`최대 ${MAX_PLAYERS}명까지예요`);
        const notReady = state.players.filter((p) => p.id !== state.hostId && !p.ready);
        if (notReady.length) return err(`아직 준비 안 된 사람: ${notReady.map((p) => p.name).join(", ")}`);
        return startGame(state, rng);
      }
      case "ack": {
        if (state.phase !== "reveal") return err("지금은 확인 단계가 아니에요");
        g.acked[me.id] = true;
        if (state.players.every((p) => g.acked[p.id])) state.phase = "propose";
        return {};
      }
      case "skipReveal": {
        if (!isHost || state.phase !== "reveal") return err("방장만 넘길 수 있어요");
        state.phase = "propose";
        return {};
      }
      case "propose": {
        if (state.phase !== "propose") return err("지금은 원정대를 고를 때가 아니에요");
        if (leaderId(state) !== me.id) return err("조장만 원정대를 고를 수 있어요");
        const team = Array.isArray(msg.team) ? [...new Set(msg.team)] : [];
        const size = g.quests[g.round].size;
        if (team.length !== size) return err(`이번 사명에는 ${size}명을 골라야 해요`);
        if (!team.every((id) => P(state, id))) return err("없는 참가자가 있어요");
        g.proposal = { team };
        g.votes = {};
        state.phase = "vote";
        return {};
      }
      case "vote": {
        if (state.phase !== "vote") return err("지금은 투표 시간이 아니에요");
        if (typeof msg.approve !== "boolean") return err("찬성 또는 반대를 골라 주세요");
        g.votes[me.id] = msg.approve;
        if (Object.keys(g.votes).length === state.players.length) {
          const yes = Object.values(g.votes).filter(Boolean).length;
          const approved = yes * 2 > state.players.length;
          state.seqs.vote += 1;
          g.lastVote = {
            seq: state.seqs.vote,
            round: g.round,
            proposalNo: g.proposalNo,
            leaderId: leaderId(state),
            team: g.proposal.team.slice(),
            votes: { ...g.votes },
            approved,
          };
          g.voteHistory.push(g.lastVote);
          g.votes = {};
          if (approved) {
            g.questCards = {};
            state.phase = "quest";
          } else {
            if (g.proposalNo >= 5) {
              endGame(state, "evil", "rejections");
            } else {
              g.proposalNo += 1;
              g.proposal = null;
              nextLeader(state);
              state.phase = "propose";
            }
          }
        }
        return {};
      }
      case "quest": {
        if (state.phase !== "quest") return err("지금은 사명 카드를 낼 때가 아니에요");
        if (!g.proposal.team.includes(me.id)) return err("원정대원만 카드를 낼 수 있어요");
        if (me.id in g.questCards) return err("이미 카드를 냈어요");
        let success = msg.success !== false;
        if (teamOf(g.roleOf[me.id]) === "good" && !success) return err("빛의 일꾼은 축복 카드만 낼 수 있어요");
        g.questCards[me.id] = success;
        if (Object.keys(g.questCards).length === g.proposal.team.length) {
          const fails = Object.values(g.questCards).filter((x) => !x).length;
          const q = g.quests[g.round];
          q.team = g.proposal.team.slice();
          q.fails = fails;
          q.result = fails >= q.failsNeeded ? "fail" : "success";
          state.seqs.quest += 1;
          g.lastQuest = {
            seq: state.seqs.quest,
            round: g.round,
            team: q.team.slice(),
            successes: q.team.length - fails,
            fails,
            result: q.result,
          };
          g.questCards = {};
          afterQuestResolved(state);
        }
        return {};
      }
      case "lady": {
        if (state.phase !== "lady") return err("지금은 등불을 쓸 때가 아니에요");
        if (g.ladyHolderId !== me.id) return err("등불을 가진 사람만 쓸 수 있어요");
        const t = P(state, msg.targetId);
        if (!t || t.id === me.id) return err("다른 사람을 골라 주세요");
        if (g.ladyUsedBy.includes(t.id)) return err("이미 등불을 가졌던 사람은 고를 수 없어요");
        (g.ladyResults[me.id] ||= []).push({ targetId: t.id, team: teamOf(g.roleOf[t.id]) });
        state.seqs.lady += 1;
        g.lastLady = { seq: state.seqs.lady, holderId: me.id, targetId: t.id };
        g.ladyHolderId = t.id;
        g.ladyUsedBy.push(t.id);
        state.phase = "propose";
        return {};
      }
      case "assassinate": {
        if (state.phase !== "assassin") return err("지금은 지목할 때가 아니에요");
        if (g.assassinId !== me.id) return err("정탐꾼만 지목할 수 있어요");
        const t = P(state, msg.targetId);
        if (!t) return err("없는 참가자예요");
        if (t.id === me.id) return err("자기 자신은 지목할 수 없어요");
        g.assassinTargetId = t.id;
        if (g.roleOf[t.id] === "merlin") endGame(state, "evil", "assassinHit");
        else endGame(state, "good", "assassinFailed");
        return {};
      }
      case "restart": {
        if (!isHost) return err("방장만 새 게임을 열 수 있어요");
        if (state.phase !== "end") return err("게임이 끝난 뒤에 할 수 있어요");
        state.game = null;
        state.phase = "lobby";
        state.players.forEach((p) => (p.ready = false));
        return {};
      }
      case "state":
        return { noChange: true };
      default:
        return err("알 수 없는 동작이에요");
    }
  })();
  if (!res.error && !res.noChange) state.v += 1;
  return res;
}

/** What one player may see. */
export function viewFor(state, playerId, now = Date.now()) {
  const g = state.game;
  const meP = P(state, playerId);
  if (!meP) return null;
  const n = state.players.length;
  const players = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    isHost: p.id === state.hostId,
    ready: p.id === state.hostId ? true : !!p.ready,
    online: now - p.lastSeen < ONLINE_MS,
    acked: g ? !!g.acked[p.id] : false,
  }));
  const base = {
    code: state.code,
    v: state.v,
    phase: state.phase,
    settings: state.settings,
    playerCount: n,
    evilCount: EVIL_COUNT[n] ?? null,
    teamSizes: teamSizes(n, state.settings),
    failsNeeded: n >= MIN_PLAYERS ? failsNeeded(n) : null,
    players,
  };
  const me = {
    id: meP.id,
    name: meP.name,
    seat: meP.seat,
    isHost: meP.id === state.hostId,
    ready: meP.id === state.hostId ? true : !!meP.ready,
    role: null,
    team: null,
    knowledge: [],
    acked: false,
    myVote: null,
    myQuestPlayed: false,
    ladyResults: [],
  };
  if (!g) {
    const preview = n >= MIN_PLAYERS && n <= MAX_PLAYERS ? buildRoles(n, state.settings) : null;
    return {
      ...base,
      me,
      rolesInGame: preview && preview.roles ? preview.roles.slice().sort() : null,
      setupError: preview && preview.error ? preview.error : null,
      round: 0,
      proposalNo: 1,
      leaderId: null,
      ladyHolderId: null,
      ladyUsedBy: [],
      quests: (teamSizes(n, state.settings) || []).map((size, i) => ({ size, failsNeeded: failsNeeded(n)[i], result: null, team: [], fails: null })),
      proposal: null,
      votedIds: [],
      questPlayedIds: [],
      lastVote: null,
      lastQuest: null,
      lastLady: null,
      voteHistory: [],
      winner: null,
      winReason: null,
      assassinId: null,
      assassinTargetId: null,
      revealed: null,
    };
  }
  const myRole = g.roleOf[meP.id];
  me.role = myRole;
  me.team = teamOf(myRole);
  me.acked = !!g.acked[meP.id];
  me.myVote = meP.id in g.votes ? g.votes[meP.id] : null;
  me.myQuestPlayed = meP.id in g.questCards;
  me.ladyResults = (g.ladyResults[meP.id] || []).slice();
  for (const p of state.players) {
    if (p.id === meP.id) continue;
    const r = g.roleOf[p.id];
    if (myRole === "merlin" && teamOf(r) === "evil" && r !== "mordred") me.knowledge.push({ id: p.id, tag: "evil" });
    if (myRole === "percival" && (r === "merlin" || r === "morgana")) me.knowledge.push({ id: p.id, tag: "merlinCandidate" });
    if (me.team === "evil" && myRole !== "oberon" && teamOf(r) === "evil" && r !== "oberon")
      me.knowledge.push({ id: p.id, tag: "evil" });
  }
  const ended = state.phase === "end";
  const showAssassin = state.phase === "assassin" || ended;
  return {
    ...base,
    me,
    rolesInGame: g.rolesInGame,
    setupError: null,
    round: g.round,
    proposalNo: g.proposalNo,
    leaderId: leaderId(state),
    ladyHolderId: g.ladyHolderId,
    ladyUsedBy: g.ladyUsedBy.slice(),
    quests: g.quests.map((q) => ({ ...q, team: q.team.slice() })),
    proposal: g.proposal ? { team: g.proposal.team.slice() } : null,
    votedIds: Object.keys(g.votes),
    questPlayedIds: Object.keys(g.questCards),
    lastVote: g.lastVote,
    lastQuest: g.lastQuest,
    lastLady: g.lastLady,
    voteHistory: g.voteHistory,
    winner: g.winner,
    winReason: g.winReason,
    assassinId: showAssassin ? g.assassinId : null,
    assassinTargetId: g.assassinTargetId,
    revealed: ended ? { ...g.roleOf } : null,
  };
}
