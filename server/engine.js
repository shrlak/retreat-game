// 빛의 원정대 — rules engine. Pure JS (ESM), no deps. Runs in Deno and Node.
import { errOf } from "./messages.js";
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
export const GOOD_ROLES = ["merlin", "percival", "servant", "lancelotGood"];
export const EVIL_ROLES = ["assassin", "morgana", "mordred", "oberon", "minion", "lancelotEvil"];
export const LOYALTY_DECK = ["none", "none", "none", "switch", "switch"];
export const ONLINE_MS = 15000;
export const REJOIN_MS = 120000; // how long a host-opened seat stays open for a new device
export const HOST_AWAY_MS = 60000; // after this long offline, another player may take over as host
export const TRANSITION_MS = 1800; // how long every phone plays a scene transition, started at phaseStartedAt

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
  lancelot: 0, // 0 off, 1 = quiet variant, 2 = known variant
  excalibur: false,
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

function err(msg, params) {
  return errOf(msg, params);
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
  if (settings.lancelot) {
    good.push("lancelotGood");
    evil.push("lancelotEvil");
  }
  if (evil.length > evilN) return err("tooManyEvilSpecials", { n, evil: evilN });
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
    phaseSeq: 1,
    phaseStartedAt: now,
    prevPhase: null,
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
    if (!same) return err("이미 시작된 게임이에요. 원래 폰에서 다시 열면 이어서 할 수 있어요");
    // Seats belong to the device that holds the secret token. A new device may take a seat by
    // name only after the host opened that seat (allowRejoin) in the last REJOIN_MS.
    const open = state.rejoin && state.rejoin.playerId === same.id && now < state.rejoin.until;
    if (!open) return err("원래 폰에서 다시 열어 주세요. 폰을 바꿨다면 방장에게 '다시 입장 허용'을 부탁하세요");
    same.token = randId(rng, 20); // the old device is signed out
    same.lastSeen = now;
    state.rejoin = null;
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
    if ("excalibur" in patch) out.excalibur = !!patch.excalibur;
    if ("lancelot" in patch) {
      const l = Number(patch.lancelot === true ? 1 : patch.lancelot);
      out.lancelot = l === 1 || l === 2 ? l : 0;
    }
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
      const evils = state.players.filter((p) => teamOf(roleOf[p.id]) === "evil" && roleOf[p.id] !== "lancelotEvil");
      assassinId = evils[Math.floor(rng() * evils.length)].id;
    }
  }
  const allegiance = {};
  for (const p of state.players) allegiance[p.id] = teamOf(roleOf[p.id]);
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
    allegiance,
    lancelot: state.settings.lancelot || 0,
    loyaltyDeck: state.settings.lancelot ? shuffle(LOYALTY_DECK, rng) : [],
    loyaltyRevealed: [], // [{round, card}]
    excalibur: !!state.settings.excalibur,
    excaliburResults: {}, // holderId -> [{round, targetId, original:bool}]
    lastExcalibur: null,
    winner: null,
    winReason: null,
  };
  state.phase = "reveal";
  return {};
}

const isLancelot = (r) => r === "lancelotGood" || r === "lancelotEvil";
// current team: Lancelots can switch sides during the game; everyone else stays with their role's team
function curTeam(g, id) {
  const r = g.roleOf[id];
  return isLancelot(r) && g.allegiance && g.allegiance[id] ? g.allegiance[id] : teamOf(r);
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

function resolveQuest(state) {
  const g = state.game;
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
  if (g.excalibur)
    g.lastQuest.excalibur = g.lastExcalibur && g.lastExcalibur.round === g.round ? { holderId: g.lastExcalibur.holderId, targetId: g.lastExcalibur.targetId } : null;
  g.questCards = {};
  afterQuestResolved(state);
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
  if (g.lancelot && g.round >= 2 && g.loyaltyDeck.length) {
    const card = g.loyaltyDeck.shift();
    g.loyaltyRevealed.push({ round: g.round, card });
    if (card === "switch") {
      for (const id of Object.keys(g.roleOf)) {
        if (g.roleOf[id] === "lancelotGood" || g.roleOf[id] === "lancelotEvil")
          g.allegiance[id] = g.allegiance[id] === "good" ? "evil" : "good";
      }
    }
  }
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
  const before = state.phase + ":" + (state.game ? state.game.round + "/" + state.game.proposalNo : "");
  const beforePhase = state.phase;
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
      case "allowRejoin": {
        if (!isHost) return err("방장만 다시 입장을 허용할 수 있어요");
        if (state.phase === "lobby") return err("대기실에서는 그냥 다시 참가하면 돼요");
        const t = P(state, msg.targetId);
        if (!t || t.id === me.id) return err("다른 참가자를 골라 주세요");
        if (now - t.lastSeen < ONLINE_MS) return err("그 사람은 지금 접속 중이에요");
        state.rejoin = { playerId: t.id, until: now + REJOIN_MS };
        return {};
      }
      case "claimHost": {
        const host = P(state, state.hostId);
        if (isHost) return err("이미 방장이에요");
        if (host && now - host.lastSeen < HOST_AWAY_MS) return err("방장이 아직 접속해 있어요");
        state.hostId = me.id;
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
        if (n < MIN_PLAYERS) return err("minPlayers", { min: MIN_PLAYERS, n });
        if (n > MAX_PLAYERS) return err("maxPlayers", { max: MAX_PLAYERS });
        const notReady = state.players.filter((p) => p.id !== state.hostId && !p.ready);
        if (notReady.length) return err("notAllReady", { names: notReady.map((p) => p.name).join(", ") });
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
        if (team.length !== size) return err("teamSize", { size });
        if (!team.every((id) => P(state, id))) return err("없는 참가자가 있어요");
        let excaliburTo = null;
        if (g.excalibur) {
          excaliburTo = msg.excaliburTo;
          if (!team.includes(excaliburTo) || excaliburTo === me.id)
            return err("말씀 두루마리는 조장이 아닌 원정대원 한 명에게 줘야 해요");
        }
        g.proposal = { team, excaliburTo };
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
        if (curTeam(g, me.id) === "good" && !success) return err("빛의 일꾼은 축복 카드만 낼 수 있어요");
        g.questCards[me.id] = success;
        if (Object.keys(g.questCards).length === g.proposal.team.length) {
          if (g.excalibur && g.proposal.excaliburTo) {
            state.phase = "excalibur";
            return {};
          }
          resolveQuest(state);
        }
        return {};
      }
      case "excalibur": {
        if (state.phase !== "excalibur") return err("지금은 말씀 두루마리를 쓸 때가 아니에요");
        if (g.proposal.excaliburTo !== me.id) return err("두루마리를 받은 사람만 쓸 수 있어요");
        let targetId = msg.targetId || null;
        if (targetId) {
          if (targetId === me.id || !g.proposal.team.includes(targetId)) return err("다른 원정대원을 골라 주세요");
          const original = g.questCards[targetId];
          g.questCards[targetId] = !original;
          (g.excaliburResults[me.id] ||= []).push({ round: g.round, targetId, original });
        }
        g.lastExcalibur = { round: g.round, holderId: me.id, targetId };
        resolveQuest(state);
        return {};
      }
      case "lady": {
        if (state.phase !== "lady") return err("지금은 등불을 쓸 때가 아니에요");
        if (g.ladyHolderId !== me.id) return err("등불을 가진 사람만 쓸 수 있어요");
        const t = P(state, msg.targetId);
        if (!t || t.id === me.id) return err("다른 사람을 골라 주세요");
        if (g.ladyUsedBy.includes(t.id)) return err("이미 등불을 가졌던 사람은 고를 수 없어요");
        (g.ladyResults[me.id] ||= []).push({ targetId: t.id, team: curTeam(g, t.id) });
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
  if (!res.error && !res.noChange) {
    state.v += 1;
    const after = state.phase + ":" + (state.game ? state.game.round + "/" + state.game.proposalNo : "");
    if (after !== before) {
      state.phaseSeq = (state.phaseSeq || 0) + 1;
      state.phaseStartedAt = now;
      state.prevPhase = beforePhase;
    }
  }
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
    // synced scene transitions: every phone starts the transition at phaseStartedAt (server ms clock)
    phaseSeq: state.phaseSeq || 1,
    phaseStartedAt: state.phaseStartedAt || state.createdAt,
    prevPhase: state.prevPhase || null,
    transitionMs: TRANSITION_MS,
    serverNow: now,
    rejoinOpenFor: state.rejoin && now < state.rejoin.until ? state.rejoin.playerId : null,
    hostAway: (() => { const h = P(state, state.hostId); return !h || now - h.lastSeen >= HOST_AWAY_MS; })(),
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
      setupErrorKey: preview && preview.error ? preview.errorKey : null,
      setupErrorParams: preview && preview.error ? preview.errorParams : null,
      setupErrorEn: preview && preview.error ? preview.errorEn : null,
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
  me.team = curTeam(g, meP.id);
  me.startTeam = teamOf(myRole);
  me.excaliburResults = ((g.excaliburResults || {})[meP.id] || []).slice();
  me.acked = !!g.acked[meP.id];
  me.myVote = meP.id in g.votes ? g.votes[meP.id] : null;
  me.myQuestPlayed = meP.id in g.questCards;
  me.ladyResults = (g.ladyResults[meP.id] || []).slice();
  for (const p of state.players) {
    if (p.id === meP.id) continue;
    const r = g.roleOf[p.id];
    if (myRole === "merlin" && teamOf(r) === "evil" && r !== "mordred") me.knowledge.push({ id: p.id, tag: "evil" });
    if (myRole === "percival" && (r === "merlin" || r === "morgana")) me.knowledge.push({ id: p.id, tag: "merlinCandidate" });
    const quietLancelot = g.lancelot !== 2; // variant 1: evil Lancelot and the evil team don't know each other
    const hidesFromEvil = (role) => role === "oberon" || (quietLancelot && role === "lancelotEvil");
    if (me.startTeam === "evil" && !hidesFromEvil(myRole) && teamOf(r) === "evil" && !hidesFromEvil(r))
      me.knowledge.push({ id: p.id, tag: "evil" });
    if (g.lancelot === 2 && (myRole === "lancelotGood" || myRole === "lancelotEvil") && (r === "lancelotGood" || r === "lancelotEvil"))
      me.knowledge.push({ id: p.id, tag: "lancelot" });
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
    proposal: g.proposal ? { team: g.proposal.team.slice(), excaliburTo: g.proposal.excaliburTo || null } : null,
    lancelot: g.lancelot || 0,
    loyaltyRevealed: (g.loyaltyRevealed || []).slice(),
    loyaltyLeft: (g.loyaltyDeck || []).length,
    excalibur: !!g.excalibur,
    lastExcalibur: g.lastExcalibur || null,
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
    finalTeams: ended ? Object.fromEntries(state.players.map((p) => [p.id, curTeam(g, p.id)])) : null,
  };
}
