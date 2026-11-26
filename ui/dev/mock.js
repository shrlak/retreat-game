/* 빛의 원정대 — in-browser mock server + bots + dev panel (dev harness only, never shipped in index.html).
 * Classic script, ES2020, no modules. Defines window.MockServer.
 *
 *   MockServer.api      same shape as the UI api in CONTRACT.md (acts as the player you control)
 *   MockServer.boot()   reads URL params, injects the DEV panel, starts the 4 s poll
 *   MockServer.engine   a classic-script port of server/engine.js (kept byte-for-byte in logic;
 *                       a parity test compares it with the real engine)
 *   MockServer.dev      helpers used by the panel and by headless tests
 *
 * URL params: ?n=7  ?auto=1  ?phase=reveal|propose|vote|quest|lady|assassin|end|end-evil|rejections
 *             ?as=leader|assassin|lady|host|evil|good|<role key>  ?speed=3  ?seed=42  ?name=나  ?bots=0
 */
(function () {
  "use strict";

  // =====================================================================
  // Engine port, generated from server/engine.js (md5 a92b6b31a4e6…): `export` dropped,
  // `||=` rewritten for ES2020. Don't edit rules here: change server/engine.js and re-port,
  // so the mock never drifts from the server.
  // =====================================================================
  var E = (function () {
  // 빛의 원정대 — rules engine. Pure JS (ESM), no deps. Runs in Deno and Node.
  import { errOf } from "./messages.js";
  // State is a plain JSON object. Never send it to clients: use viewFor().

  const MIN_PLAYERS = 5;
  const MAX_PLAYERS = 10;
  const EVIL_COUNT = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
  const TEAM_SIZES = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };
  const BALANCE_SIZES = { 5: [3, 2, 3, 2, 3], 7: [2, 3, 4, 3, 4] };
  function teamSizes(n, settings) {
    if (settings && settings.balance && BALANCE_SIZES[n]) return BALANCE_SIZES[n];
    return TEAM_SIZES[n] ?? null;
  }
  const GOOD_ROLES = ["merlin", "percival", "servant", "lancelotGood"];
  const EVIL_ROLES = ["assassin", "morgana", "mordred", "oberon", "minion", "lancelotEvil"];
  const LOYALTY_DECK = ["none", "none", "none", "switch", "switch"];
  const ONLINE_MS = 15000;
  const REJOIN_MS = 120000; // how long a host-opened seat stays open for a new device
  const HOST_AWAY_MS = 60000; // after this long offline, another player may take over as host
  const TRANSITION_MS = 1800; // how long every phone plays a scene transition, started at phaseStartedAt

  function teamOf(role) {
    return EVIL_ROLES.includes(role) ? "evil" : "good";
  }
  function failsNeeded(n) {
    return [1, 1, 1, n >= 7 ? 2 : 1, 1];
  }

  const DEFAULT_SETTINGS = {
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
  function randCode(rng = defaultRng) {
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
  function buildRoles(n, settings) {
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

  function createState(code, hostName, ctx = {}) {
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
  function joinPlayer(state, name, token, ctx = {}) {
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
  function applyAction(state, msg, ctx = {}) {
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
            (g.excaliburResults[me.id] = g.excaliburResults[me.id] || []).push({ round: g.round, targetId, original });
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
          (g.ladyResults[me.id] = g.ladyResults[me.id] || []).push({ targetId: t.id, team: curTeam(g, t.id) });
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
  function viewFor(state, playerId, now = Date.now()) {
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

    return {
      MIN_PLAYERS: MIN_PLAYERS, MAX_PLAYERS: MAX_PLAYERS, EVIL_COUNT: EVIL_COUNT, TEAM_SIZES: TEAM_SIZES,
      BALANCE_SIZES: BALANCE_SIZES, GOOD_ROLES: GOOD_ROLES, EVIL_ROLES: EVIL_ROLES, ONLINE_MS: ONLINE_MS,
      DEFAULT_SETTINGS: DEFAULT_SETTINGS,
      teamSizes: teamSizes, teamOf: teamOf, failsNeeded: failsNeeded, buildRoles: buildRoles, randCode: randCode,
      createState: createState, joinPlayer: joinPlayer, applyAction: applyAction, viewFor: viewFor,
    };
  })();

  // =====================================================================
  // Mock server
  // =====================================================================
  var W = typeof window !== "undefined" ? window : globalThis;
  var BOT_NAMES = ["은혜", "소망", "사랑", "기쁨", "평강", "믿음", "온유", "화평", "충성", "인내", "양선", "절제"];
  var LATENCY = 120;
  var OFFLINE_ERR = { ok: false, error: "인터넷 연결을 확인해 주세요", offline: true };

  function params() {
    try { return new URLSearchParams(W.location ? W.location.search : ""); } catch (e) { return new URLSearchParams(""); }
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var S = {
    state: null,          // engine state of the one mock room
    controlledId: null,   // the seat you play (null = home screen)
    lastSession: null,    // {code, playerId, name} for resume()
    botsOn: true,
    speed: 1,
    offline: false,
    offlineTimer: null,
    timers: {},           // playerId -> bot timeout
    stalled: {},          // playerId -> true if a bot action was refused (avoid loops)
    disconnected: {},     // playerId -> true: seat stops polling/acting (shows offline after 15 s)
    rng: Math.random,
    nPlayers: 6,
    asTarget: null,
    asApplied: true,
    pollTimer: null,
    listeners: [],
    log: [],
  };

  function ctx() { return { now: Date.now(), rng: S.rng }; }
  function find(id) { return S.state ? S.state.players.find(function (p) { return p.id === id; }) : null; }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function viewFor(pid) {
    if (!S.state || !pid) return null;
    return clone(E.viewFor(S.state, pid, Date.now()));
  }
  function ui() { return W.UI && typeof W.UI.render === "function" ? W.UI : null; }
  function toast(msg) { var u = ui(); if (u && u.toast) { try { u.toast(msg); } catch (e) { console.error(e); } } }
  function pick(arr) { return arr[Math.floor(S.rng() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(S.rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function roleOf(pid) { return S.state && S.state.game ? S.state.game.roleOf[pid] : null; }
  function leaderOf() { var g = S.state.game; return g ? S.state.players[g.leaderSeat].id : null; }
  function name(pid) { var p = find(pid); return p ? p.name : "?"; }

  function act(pid, msg) {
    var m = Object.assign({}, msg, { playerId: pid });
    var r = E.applyAction(S.state, m, ctx());
    S.log.push({ v: S.state.v, pid: pid, msg: msg, error: r.error || null });
    if (S.log.length > 400) S.log.shift();
    return r;
  }

  // ---------- rendering ----------
  function renderView(v) {
    var u = ui();
    if (!u) return;
    try { u.render(v); } catch (e) { console.error("[mock] UI.render threw", e); }
  }
  function renderNow() {
    if (S.offline || !S.controlledId) return; // no session → home screen stays as is (don't wipe inputs)
    if (!find(S.controlledId)) { S.controlledId = null; renderView(null); return; }
    renderView(viewFor(S.controlledId));
  }
  function afterChange() {
    S.stalled = {};
    applyAsIfPending();
    renderNow();
    schedule();
    panelUpdate();
    S.listeners.forEach(function (cb) { try { cb(S.state); } catch (e) { console.error(e); } });
  }
  function setControlled(pid, opts) {
    if (S.timers[pid]) { clearTimeout(S.timers[pid]); delete S.timers[pid]; }
    S.controlledId = pid;
    if (pid) {
      var p = find(pid);
      S.lastSession = { code: S.state.code, playerId: pid, name: p ? p.name : "" };
      delete S.disconnected[pid];
    }
    if (!opts || !opts.silent) afterChange();
  }

  // ---------- bot brains ----------
  var BOT_POL = { hostStarts: true, vote: "random", quest: "random", team: "random", assassin: "random" };

  function knownEvil(pid) {
    var v = E.viewFor(S.state, pid, Date.now());
    return v.me.knowledge.filter(function (k) { return k.tag === "evil"; }).map(function (k) { return k.id; });
  }
  function isEvil(pid) {
    var g = S.state && S.state.game, r = roleOf(pid);
    if (g && g.allegiance && g.allegiance[pid] && (r === "lancelotGood" || r === "lancelotEvil")) return g.allegiance[pid] === "evil";
    return E.teamOf(r) === "evil";
  }

  function pickTeam(pid, pol) {
    var st = S.state, g = st.game, q = g.quests[g.round], size = q.size;
    var ids = st.players.map(function (p) { return p.id; });
    var team = [];
    if (pol.team === "good" || pol.team === "evil") {
      var want = pol.team === "evil";
      var first = shuffle(ids.filter(function (id) { return isEvil(id) === want; }));
      var rest = shuffle(ids.filter(function (id) { return isEvil(id) !== want; }));
      if (want) { team = first.slice(0, Math.min(q.failsNeeded + 1, size)); rest = rest.concat(first.slice(team.length)); }
      else team = first.slice(0, size);
      var more = shuffle(rest.filter(function (id) { return team.indexOf(id) < 0; }));
      while (team.length < size && more.length) team.push(more.shift());
      return team;
    }
    if (S.rng() < 0.75) team.push(pid);
    // an evil bot that knows friends likes to bring one along
    if (isEvil(pid) && S.rng() < 0.5) {
      var friends = shuffle(knownEvil(pid)).filter(function (id) { return team.indexOf(id) < 0; });
      if (friends.length && team.length < size) team.push(friends[0]);
    }
    var others = shuffle(ids.filter(function (id) { return team.indexOf(id) < 0; }));
    while (team.length < size) team.push(others.shift());
    return team;
  }
  function voteChoice(pid, pol) {
    if (pol.vote === "approve") return true;
    if (pol.vote === "reject") return false;
    var g = S.state.game, team = g.proposal.team;
    var p = 0.6;
    if (team.indexOf(pid) >= 0) p = 0.8;
    if (leaderOf() === pid) p = 0.95;
    if (isEvil(pid)) {
      var friends = knownEvil(pid).concat([pid]);
      p = team.some(function (id) { return friends.indexOf(id) >= 0; }) ? Math.max(p, 0.8) : 0.35;
    } else if (g.proposalNo === 5) p = 0.9;
    return S.rng() < p;
  }
  function questChoice(pid, pol) {
    if (!isEvil(pid)) return true;
    if (pol.quest === "success") return true;
    if (pol.quest === "fail") return false;
    return S.rng() >= 0.5;
  }
  function assassinPick(pid, pol) {
    var st = S.state, g = st.game;
    var evil = knownEvil(pid);
    var others = st.players.map(function (p) { return p.id; }).filter(function (id) { return id !== pid; });
    var merlin = others.filter(function (id) { return g.roleOf[id] === "merlin"; })[0];
    if (pol.assassin === "hit" && merlin) return merlin;
    var cands = others.filter(function (id) { return evil.indexOf(id) < 0; });
    if (pol.assassin === "miss") {
      var miss = others.filter(function (id) { return g.roleOf[id] !== "merlin"; });
      var missGood = miss.filter(function (id) { return evil.indexOf(id) < 0; });
      return pick(missGood.length ? missGood : miss);
    }
    return pick(cands.length ? cands : others);
  }

  /** What this seat would do right now under policy pol, or null. */
  function decide(pid, pol) {
    var st = S.state;
    if (!st) return null;
    var g = st.game, me = find(pid);
    if (!me) return null;
    pol = pol || BOT_POL;
    switch (st.phase) {
      case "lobby": {
        if (st.hostId !== pid) return me.ready ? null : { action: "ready", ready: true };
        if (!pol.hostStarts) return null;
        var n = st.players.length;
        if (n < E.MIN_PLAYERS || n > E.MAX_PLAYERS) return null;
        if (st.players.some(function (p) { return p.id !== st.hostId && !p.ready; })) return null;
        if (E.buildRoles(n, st.settings).error) return null;
        return { action: "start" };
      }
      case "reveal":
        return g.acked[pid] ? null : { action: "ack" };
      case "propose":
        if (leaderOf() !== pid) return null;
        var tm = pickTeam(pid, pol), pr = { action: "propose", team: tm };
        if (g.excalibur) { var others = tm.filter(function (id) { return id !== pid; }); if (!others.length) { tm[tm.length - 1] = st.players.filter(function (p) { return tm.indexOf(p.id) < 0 && p.id !== pid; })[0].id; others = tm.filter(function (id) { return id !== pid; }); } pr.excaliburTo = pick(others.map(function (id) { return { id: id }; })).id; }
        return pr;
      case "vote":
        return pid in g.votes ? null : { action: "vote", approve: voteChoice(pid, pol) };
      case "quest":
        if (g.proposal.team.indexOf(pid) < 0 || pid in g.questCards) return null;
        return { action: "quest", success: questChoice(pid, pol) };
      case "lady": {
        if (g.ladyHolderId !== pid) return null;
        var c = st.players.filter(function (p) { return p.id !== pid && g.ladyUsedBy.indexOf(p.id) < 0; });
        return c.length ? { action: "lady", targetId: pick(c).id } : null;
      }
      case "excalibur": {
        if (!g.proposal || g.proposal.excaliburTo !== pid) return null;
        var mates = g.proposal.team.filter(function (id) { return id !== pid; });
        if (!mates.length || S.rng() < 0.35) return { action: "excalibur" };
        return { action: "excalibur", targetId: pick(mates.map(function (id) { return { id: id }; })).id };
      }
      case "assassin":
        return g.assassinId === pid ? { action: "assassinate", targetId: assassinPick(pid, pol) } : null;
    }
    return null;
  }

  // ---------- bot scheduler (async, for the browser) ----------
  function clearTimers() {
    Object.keys(S.timers).forEach(function (k) { clearTimeout(S.timers[k]); });
    S.timers = {};
  }
  function schedule() {
    if (!S.state || !S.botsOn) return;
    S.state.players.forEach(function (p) {
      var id = p.id;
      if (id === S.controlledId || S.timers[id] || S.disconnected[id] || S.stalled[id]) return;
      var d = decide(id, BOT_POL);
      if (!d) return;
      var delay = (400 + S.rng() * 1000) / S.speed;
      if (d.action === "start") delay *= 2.5; // give the human a moment to look at the lobby
      S.timers[id] = setTimeout(function () {
        delete S.timers[id];
        if (!S.botsOn || !S.state || id === S.controlledId || S.disconnected[id] || !find(id)) return;
        var d2 = decide(id, BOT_POL);
        if (!d2) return;
        var r = act(id, d2);
        if (r.error) { S.stalled[id] = true; console.warn("[mock] bot action refused", name(id), d2, r.error); return; }
        if (!r.noChange) afterChange();
      }, delay);
    });
  }

  // ---------- room helpers ----------
  function addBot() {
    var st = S.state;
    if (!st) return null;
    var used = st.players.map(function (p) { return p.name; });
    var nm = BOT_NAMES.filter(function (x) { return used.indexOf(x) < 0; })[0] || "봇" + (st.players.length + 1);
    var r = E.joinPlayer(st, nm, undefined, ctx());
    if (r.error) return r;
    if (r.changed) st.v += 1;
    return r;
  }
  function addBots(k) { for (var i = 0; i < k; i++) { var r = addBot(); if (!r || r.error) break; } }
  function newRoom(hostName, n) {
    clearTimers();
    S.stalled = {}; S.disconnected = {};
    var r = E.createState(E.randCode(S.rng), hostName, ctx());
    if (r.error) return r;
    S.state = r.state;
    addBots(Math.max(0, (n || S.nPlayers) - 1));
    return r;
  }
  function hardReset() {
    var st = S.state;
    clearTimers();
    S.stalled = {};
    st.game = null;
    st.phase = "lobby";
    st.players.forEach(function (p) { p.ready = false; });
    st.v += 1;
  }

  // ---------- fast-forward (sync: everyone incl. you acts instantly) ----------
  var GOALS = {
    reveal:     { phase: "reveal",   pol: { vote: "approve" } },
    propose:    { phase: "propose",  pol: { vote: "approve" }, again: true },
    vote:       { phase: "vote",     pol: { vote: "approve" }, again: true },
    quest:      { phase: "quest",    pol: { vote: "approve" }, again: true },
    lady:       { phase: "lady",     pol: { vote: "approve", quest: "success", team: "good" }, lady: true },
    assassin:   { phase: "assassin", pol: { vote: "approve", quest: "success", team: "good" }, merlin: true },
    endGood:    { phase: "end", winner: "good", pol: { vote: "approve", quest: "success", team: "good", assassin: "miss" } },
    endEvil:    { phase: "end", winner: "evil", pol: { vote: "approve", quest: "fail", team: "evil" } },
    rejections: { phase: "end", winner: "evil", reason: "rejections", pol: { vote: "reject" } },
    endAny:     { phase: "end", pol: {} },
  };
  var GOAL_ALIASES = { end: "endGood", "end-good": "endGood", good: "endGood", "end-evil": "endEvil", evil: "endEvil", reject: "rejections" };

  function reached(goal) {
    var st = S.state;
    if (st.phase !== goal.phase) return false;
    if (goal.winner && st.game.winner !== goal.winner) return false;
    if (goal.reason && st.game.winReason !== goal.reason) return false;
    return true;
  }
  function successes(g) { return g.quests.filter(function (q) { return q.result === "success"; }).length; }
  function prepare(goal) {
    var st = S.state, g = st.game;
    var inGame = st.phase !== "lobby";
    var bad = st.phase === "end" ||
      (goal.phase === "reveal" && inGame) ||
      (st.phase === "assassin" && goal.phase !== "end") ||
      (goal.lady && inGame && (!g.lady || g.round >= 4 || successes(g) >= 2)) ||
      (goal.merlin && inGame && !g.assassinId);
    if (bad) hardReset();
    if (st.phase !== "lobby") return;
    var min = Math.max(E.MIN_PLAYERS, Math.min(E.MAX_PLAYERS, S.nPlayers));
    if (st.players.length < min) {
      if (st.settings.maxPlayers < min) act(st.hostId, { action: "settings", settings: { maxPlayers: min } });
      addBots(min - st.players.length);
    }
    var patch = null;
    if (goal.lady && !st.settings.lady) patch = { lady: true };
    if (goal.merlin && !st.settings.roles.merlin) patch = Object.assign(patch || {}, { roles: { merlin: true } });
    if (patch) act(st.hostId, { action: "settings", settings: patch });
    // drop optional evil roles until the setup is legal
    var drop = ["oberon", "mordred", "morgana"];
    while (E.buildRoles(st.players.length, st.settings).error && drop.length) {
      var o = {}; o[drop.shift()] = false;
      act(st.hostId, { action: "settings", settings: { roles: o } });
    }
  }
  /** Drive every seat (you included) until the goal phase. Returns true if reached. */
  function fastForward(goalKey, opts) {
    goalKey = GOAL_ALIASES[goalKey] || goalKey;
    var goal = GOALS[goalKey];
    if (!goal) { toast("알 수 없는 단계: " + goalKey); return false; }
    if (!S.state) {
      var made = newRoom("나", S.nPlayers);
      if (made.error) return false;
      setControlled(made.player.id, { silent: true });
    }
    if (reached(goal) && !goal.again) { panelUpdate(); return true; }
    clearTimers();
    S.stalled = {};
    prepare(goal);
    var pol = Object.assign({ hostStarts: true, vote: "random", quest: "random", team: "random", assassin: "random" }, goal.pol);
    var left = !reached(goal), resets = 0;
    for (var i = 0; i < 8000; i++) {
      if (reached(goal)) { if (left) break; } else left = true;
      // the game ended (or hit the assassination) before the goal: start a fresh game and go on
      if (goal.phase !== "end" && (S.state.phase === "end" || (S.state.phase === "assassin" && goal.phase !== "assassin")) && resets < 5) {
        resets++;
        hardReset();
        prepare(goal);
        continue;
      }
      var actor = null, d = null;
      for (var k = 0; k < S.state.players.length; k++) {
        var id = S.state.players[k].id;
        d = decide(id, pol);
        if (d) { actor = id; break; }
      }
      if (!actor) break;
      var r = act(actor, d);
      if (r.error) { console.warn("[mock] fast-forward refused", name(actor), d, r.error); break; }
    }
    var ok = reached(goal);
    if (!ok && !(opts && opts.quiet)) toast("그 단계까지 가지 못했어요. 한 번 더 눌러 보세요 (" + S.state.phase + ")");
    afterChange();
    return ok;
  }

  // ---------- ?as= ----------
  function resolveAs(key) {
    var st = S.state, g = st.game;
    if (!g) return key === "host" ? st.hostId : null;
    var ids = st.players.map(function (p) { return p.id; });
    switch (key) {
      case "host": return st.hostId;
      case "leader": return leaderOf();
      case "assassin": return g.assassinId || ids.filter(function (id) { return g.roleOf[id] === "assassin"; })[0] || null;
      case "lady": return g.ladyHolderId;
      case "evil": {
        var e = ids.filter(function (id) { return isEvil(id) && g.roleOf[id] !== "oberon"; });
        return e.length ? pick(e) : null;
      }
      case "good": {
        var s = ids.filter(function (id) { return g.roleOf[id] === "servant"; });
        return s.length ? pick(s) : null;
      }
      case "team": {
        var t = g.proposal ? g.proposal.team : [];
        return t.length ? t[0] : null;
      }
      default: return ids.filter(function (id) { return g.roleOf[id] === key; })[0] || null;
    }
  }
  function applyAsIfPending() {
    if (S.asApplied || !S.asTarget || !S.state || !S.state.game) return;
    S.asApplied = true;
    var id = resolveAs(S.asTarget);
    if (id) setControlled(id, { silent: true });
    else toast("이 게임에는 '" + S.asTarget + "' 자리가 없어요");
  }
  function controlAs(key) {
    if (!S.state) return false;
    var id = resolveAs(key);
    if (!id) { toast("이 게임에는 '" + key + "' 자리가 없어요"); return false; }
    setControlled(id);
    return true;
  }

  // ---------- network simulation ----------
  function setNavOnline(on) {
    try {
      if (on) delete W.navigator.onLine;
      else Object.defineProperty(W.navigator, "onLine", { configurable: true, get: function () { return false; } });
    } catch (e) { /* ignore */ }
  }
  function connHook(on) {
    var u = ui();
    if (u && typeof u.setConnection === "function") { try { u.setConnection(on ? "online" : "offline"); } catch (e) { console.error(e); } }
    try { W.dispatchEvent(new Event(on ? "online" : "offline")); } catch (e) { /* node */ }
  }
  function simulateOffline(sec) {
    sec = sec || 15;
    if (S.offlineTimer) clearTimeout(S.offlineTimer);
    S.offline = true;
    setNavOnline(false);
    connHook(false);
    S.offlineUntil = Date.now() + sec * 1000;
    panelUpdate();
    S.offlineTimer = setTimeout(function () {
      S.offline = false;
      S.offlineTimer = null;
      setNavOnline(true);
      connHook(true);
      renderNow();
      panelUpdate();
    }, sec * 1000);
  }
  function toggleDisconnectBot() {
    if (!S.state) return;
    var ids = Object.keys(S.disconnected);
    if (ids.length) { S.disconnected = {}; schedule(); panelUpdate(); return; }
    var bots = S.state.players.filter(function (p) { return p.id !== S.controlledId; });
    if (!bots.length) return;
    var b = pick(bots);
    S.disconnected[b.id] = true;
    if (S.timers[b.id]) { clearTimeout(S.timers[b.id]); delete S.timers[b.id]; }
    toast("[DEV] " + b.name + " 연결 끊김 (15초 뒤 오프라인 표시)");
    panelUpdate();
  }
  function poll() {
    if (!S.state) return;
    var now = Date.now();
    S.state.players.forEach(function (p) { if (!S.disconnected[p.id]) p.lastSeen = now; });
    renderNow(); // same v → tests idempotent rendering
    panelUpdate();
  }

  // ---------- api (what UI.init receives) ----------
  function call(fn) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var r;
        try { r = fn(); } catch (e) { console.error(e); r = { ok: false, error: "목업 서버 오류: " + e.message }; }
        if (r && r.ok === false && r.error) toast(r.error);
        resolve(r);
      }, LATENCY);
    });
  }
  function asMe(action, extra) {
    return call(function () {
      if (S.offline) return OFFLINE_ERR;
      if (!S.state || !S.controlledId || !find(S.controlledId)) return { ok: false, error: "방에 들어가 있지 않아요" };
      var r = act(S.controlledId, Object.assign({ action: action }, extra || {}));
      if (r.error) return { ok: false, error: r.error };
      if (!r.noChange) afterChange();
      return { ok: true, view: viewFor(S.controlledId) };
    });
  }
  function entered(r) {
    setControlled(r.player.id);
    return { ok: true, code: S.state.code, playerId: r.player.id, token: r.player.token, view: viewFor(r.player.id) };
  }
  var api = {
    create: function (nm) {
      return call(function () {
        if (S.offline) return OFFLINE_ERR;
        var r = newRoom(nm, S.nPlayers);
        if (r.error) return { ok: false, error: r.error };
        S.asApplied = !S.asTarget;
        return entered(r);
      });
    },
    join: function (code, nm) {
      return call(function () {
        if (S.offline) return OFFLINE_ERR;
        if (!S.state) {
          var c = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
          var made = newRoom(BOT_NAMES[0], Math.max(1, S.nPlayers - 1));
          if (made.error) return { ok: false, error: made.error };
          if (c.length === 5) S.state.code = c;
        }
        var r = E.joinPlayer(S.state, nm, undefined, ctx());
        if (r.error) return { ok: false, error: r.error };
        if (r.changed) S.state.v += 1;
        S.stalled = {};
        return entered(r);
      });
    },
    state: function () { return asMe("state"); },
    ready: function (b) { return asMe("ready", { ready: !!b }); },
    settings: function (s) { return asMe("settings", { settings: s }); },
    kick: function (id) { return asMe("kick", { targetId: id }); },
    start: function () { return asMe("start"); },
    ack: function () { return asMe("ack"); },
    skipReveal: function () { return asMe("skipReveal"); },
    propose: function (ids) { return asMe("propose", { team: ids }); },
    vote: function (b) { return asMe("vote", { approve: !!b }); },
    quest: function (b) { return asMe("quest", { success: !!b }); },
    lady: function (id) { return asMe("lady", { targetId: id }); },
    assassinate: function (id) { return asMe("assassinate", { targetId: id }); },
    restart: function () { return asMe("restart"); },
    leave: function () {
      return call(function () {
        if (S.offline) return OFFLINE_ERR;
        if (S.state && S.controlledId && find(S.controlledId)) {
          if (S.state.phase === "lobby") {
            var r = act(S.controlledId, { action: "leave" });
            if (r.error) return { ok: false, error: r.error };
            S.lastSession = null;
          }
        }
        S.controlledId = null;
        afterChange();
        renderView(null);
        return { ok: true };
      });
    },
    home: function () {
      S.controlledId = null;
      afterChange();
      renderView(null);
      return Promise.resolve({ ok: true });
    },
    lastSession: function () {
      var s = S.lastSession;
      return s && S.state && find(s.playerId) ? { code: s.code, playerId: s.playerId, name: s.name, token: "mock" } : null;
    },
    resume: function () {
      return call(function () {
        var s = api.lastSession();
        if (!s) return { ok: false };
        setControlled(s.playerId);
        return { ok: true, code: s.code, playerId: s.playerId, view: viewFor(s.playerId) };
      });
    },
  };

  // =====================================================================
  // DEV panel (self-contained, .devp- classes only)
  // =====================================================================
  var panel = null, panelOpen = false;
  var CSS = [
    ".devp-fab{position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:999;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#ffe7a8;background:rgba(10,12,30,.55);border:1px solid rgba(255,231,168,.35);border-radius:8px;padding:7px 8px;opacity:.55;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    ".devp-fab:hover,.devp-fab.devp-on{opacity:1}",
    ".devp-fab.devp-off{background:#7d1d3f;opacity:1}",
    ".devp{position:fixed;left:8px;bottom:calc(44px + env(safe-area-inset-bottom,0px));z-index:999;width:min(330px,calc(100vw - 16px));max-height:72vh;overflow:auto;-webkit-overflow-scrolling:touch;background:rgba(9,11,28,.96);color:#eee;border:1px solid rgba(255,231,168,.3);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.6);font:12px/1.35 -apple-system,'Noto Sans KR',sans-serif;padding:8px 10px 10px;display:none}",
    ".devp.devp-show{display:block}",
    ".devp h4{margin:10px 0 4px;font-size:10px;letter-spacing:.06em;color:#ffe7a8;opacity:.8;font-weight:700}",
    ".devp-head{display:flex;align-items:center;gap:6px;font:11px ui-monospace,Menlo,monospace;color:#ccc}",
    ".devp-head b{color:#ffe7a8}",
    ".devp-x{margin-left:auto;background:none;border:0;color:#aaa;font-size:16px;cursor:pointer;padding:0 4px}",
    ".devp-row{display:flex;flex-wrap:wrap;gap:4px}",
    ".devp-b{background:#1c2350;color:#eee;border:1px solid rgba(255,255,255,.14);border-radius:7px;padding:5px 7px;font:inherit;cursor:pointer}",
    ".devp-b:hover{border-color:#ffe7a8}",
    ".devp-b.devp-sel{background:#ffe7a8;color:#1a1530;border-color:#ffe7a8;font-weight:700}",
    ".devp-b.devp-warn{background:#5a1a33}",
    ".devp-pl{display:flex;flex-direction:column;gap:3px}",
    ".devp-p{display:flex;align-items:center;gap:6px;width:100%;text-align:left;background:#141a3c;color:#eee;border:1px solid transparent;border-radius:7px;padding:4px 6px;font:inherit;cursor:pointer}",
    ".devp-p.devp-me{border-color:#ffe7a8;background:#2a2550}",
    ".devp-dot{width:7px;height:7px;border-radius:50%;flex:none;background:#666}",
    ".devp-good{background:#ffd77a}.devp-evil{background:#e0486e}",
    ".devp-nm{font-weight:600;min-width:42px}",
    ".devp-role{opacity:.75;font-size:11px}",
    ".devp-tags{margin-left:auto;display:flex;gap:3px;font-size:10px}",
    ".devp-tag{background:rgba(255,255,255,.1);border-radius:5px;padding:1px 4px}",
    ".devp-note{opacity:.6;font-size:11px;margin-top:4px}",
  ].join("\n");

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function roleName(r) {
    var T = W.THEME;
    return r ? ((T && T.roles && T.roles[r] && T.roles[r].name) || r) : "";
  }
  var PHASE_KO = { lobby: "대기실", reveal: "역할 확인", propose: "원정대 구성", vote: "투표", quest: "사명", lady: "등불", assassin: "지목", end: "끝" };

  function panelHTML() {
    var st = S.state, h = [];
    h.push('<div class="devp-head"><b>DEV</b>');
    if (st) h.push(esc(st.code) + " · " + esc(PHASE_KO[st.phase] || st.phase) + " · v" + st.v + (st.game ? " · 사명" + (st.game.round + 1) + " 제안" + st.game.proposalNo : ""));
    else h.push("방 없음");
    h.push('<button class="devp-x" data-a="close" aria-label="닫기">×</button></div>');

    if (st) {
      var g = st.game;
      h.push("<h4>조종할 사람 (누르면 그 사람 화면)</h4><div class='devp-pl'>");
      st.players.forEach(function (p) {
        var r = g ? g.roleOf[p.id] : null, tags = [];
        if (p.id === st.hostId) tags.push("방장");
        if (g && leaderOf() === p.id) tags.push("조장");
        if (g && g.ladyHolderId === p.id) tags.push("등불");
        if (g && g.assassinId === p.id) tags.push("지목권");
        if (g && g.proposal && g.proposal.team.indexOf(p.id) >= 0 && (st.phase === "vote" || st.phase === "quest")) tags.push("원정대");
        if (!g && p.ready && p.id !== st.hostId) tags.push("준비");
        if (S.disconnected[p.id]) tags.push("끊김");
        h.push('<button class="devp-p' + (p.id === S.controlledId ? " devp-me" : "") + '" data-a="ctl" data-id="' + esc(p.id) + '">' +
          '<span class="devp-dot ' + (r ? (E.teamOf(r) === "evil" ? "devp-evil" : "devp-good") : "") + '"></span>' +
          '<span class="devp-nm">' + esc(p.name) + "</span>" +
          '<span class="devp-role">' + esc(roleName(r)) + "</span>" +
          '<span class="devp-tags">' + tags.map(function (t) { return '<span class="devp-tag">' + t + "</span>"; }).join("") + "</span></button>");
      });
      h.push("</div>");
      if (g) {
        h.push("<div class='devp-row' style='margin-top:4px'>");
        [["leader", "조장"], ["assassin", "지목권"], ["lady", "등불"], ["evil", "유혹"], ["merlin", "선지자"], ["percival", "파수꾼"], ["host", "방장"]].forEach(function (x) {
          h.push('<button class="devp-b" data-a="as" data-k="' + x[0] + '">' + x[1] + "</button>");
        });
        h.push("</div>");
      }
    }

    h.push("<h4>봇</h4><div class='devp-row'>");
    h.push('<button class="devp-b' + (S.botsOn ? " devp-sel" : "") + '" data-a="bots">봇 ' + (S.botsOn ? "켜짐" : "꺼짐") + "</button>");
    [1, 3, 10].forEach(function (x) { h.push('<button class="devp-b' + (S.speed === x ? " devp-sel" : "") + '" data-a="speed" data-k="' + x + '">' + x + "x</button>"); });
    if (st && st.phase === "lobby") h.push('<button class="devp-b" data-a="addbot">+ 봇</button>');
    if (st) h.push('<button class="devp-b' + (Object.keys(S.disconnected).length ? " devp-sel" : "") + '" data-a="dc">봇 1명 끊기</button>');
    h.push("</div>");

    h.push("<h4>빨리 감기</h4><div class='devp-row'>");
    [["reveal", "역할 확인"], ["propose", "구성"], ["vote", "투표"], ["quest", "사명"], ["lady", "등불"], ["assassin", "지목"], ["endGood", "끝: 빛 승"], ["endEvil", "끝: 유혹 승"], ["rejections", "끝: 반대 5번"]].forEach(function (x) {
      h.push('<button class="devp-b" data-a="ff" data-k="' + x[0] + '">' + x[1] + "</button>");
    });
    h.push("</div>");

    h.push("<h4>네트워크 · 방</h4><div class='devp-row'>");
    h.push('<button class="devp-b' + (S.offline ? " devp-warn" : "") + '" data-a="offline">' + (S.offline ? "오프라인 중… " + Math.max(0, Math.ceil((S.offlineUntil - Date.now()) / 1000)) + "초" : "오프라인 15초") + "</button>");
    h.push('<button class="devp-b" data-a="newroom">새 방(' + S.nPlayers + '명)</button>');
    h.push('<button class="devp-b" data-a="home">홈 화면</button>');
    h.push("</div>");
    h.push('<div class="devp-note">' + (W.UI ? "" : "ui/ui.js가 아직 없어요. ") + "URL: ?n=7&auto=1&phase=vote&as=leader&speed=3</div>");
    return h.join("");
  }
  function panelUpdate() {
    if (!panel || !panelOpen) return;
    var sc = panel.scrollTop;
    panel.innerHTML = panelHTML();
    panel.scrollTop = sc;
  }
  function fabUpdate() {
    if (!S.fab) return;
    S.fab.className = "devp-fab" + (panelOpen ? " devp-on" : "") + (S.offline ? " devp-off" : "");
  }
  function onPanelClick(e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-a]") : null;
    if (!t) return;
    var a = t.getAttribute("data-a"), k = t.getAttribute("data-k");
    switch (a) {
      case "close": panelOpen = false; panel.classList.remove("devp-show"); fabUpdate(); return;
      case "ctl": setControlled(t.getAttribute("data-id")); break;
      case "as": controlAs(k); break;
      case "bots": S.botsOn = !S.botsOn; if (!S.botsOn) clearTimers(); else { S.stalled = {}; schedule(); } break;
      case "speed": S.speed = Number(k) || 1; clearTimers(); schedule(); break;
      case "addbot": { var r = addBot(); if (r && r.error) toast(r.error); afterChange(); break; }
      case "dc": toggleDisconnectBot(); break;
      case "ff": fastForward(k); break;
      case "offline": simulateOffline(15); fabUpdate(); break;
      case "newroom": newRoom("나", S.nPlayers); S.asApplied = true; setControlled(S.state.players[0].id); break;
      case "home": api.home(); break;
    }
    panelUpdate();
  }
  function injectPanel() {
    var D = W.document;
    if (!D || panel) return;
    var style = D.createElement("style");
    style.textContent = CSS;
    D.head.appendChild(style);
    var fab = D.createElement("button");
    fab.className = "devp-fab";
    fab.textContent = "DEV";
    fab.setAttribute("aria-label", "개발자 패널");
    fab.addEventListener("click", function () {
      panelOpen = !panelOpen;
      panel.classList.toggle("devp-show", panelOpen);
      fabUpdate();
      panelUpdate();
    });
    panel = D.createElement("div");
    panel.className = "devp";
    panel.addEventListener("click", onPanelClick);
    D.body.appendChild(panel);
    D.body.appendChild(fab);
    S.fab = fab;
    setInterval(function () { if (S.offline) { panelUpdate(); } fabUpdate(); }, 1000);
  }

  // =====================================================================
  // boot
  // =====================================================================
  function configure(q) {
    var n = Number(q.get("n"));
    if (n >= 1 && n <= 10) S.nPlayers = Math.round(n);
    var sp = Number(q.get("speed"));
    if (sp > 0) S.speed = sp;
    if (q.get("seed")) S.rng = mulberry32(Number(q.get("seed")) || 1);
    if (q.get("bots") === "0") S.botsOn = false;
    S.asTarget = q.get("as") || null;
  }
  function boot() {
    var q = params();
    configure(q);
    injectPanel();
    if (!S.pollTimer) S.pollTimer = setInterval(poll, 4000);
    var phase = q.get("phase");
    var auto = q.get("auto") === "1" || !!phase || !!S.asTarget;
    if (!auto) return Promise.resolve();
    return api.create(q.get("name") || "나").then(function () {
      if (phase && phase !== "lobby") {
        S.asApplied = !S.asTarget;
        fastForward(phase);
      }
    });
  }

  W.MockServer = {
    api: api,
    boot: boot,
    engine: E,
    viewFor: viewFor,
    dev: {
      get state() { return S.state; },
      get controlledId() { return S.controlledId; },
      get log() { return S.log; },
      configure: function (o) {
        if (o.n) S.nPlayers = o.n;
        if (o.speed) S.speed = o.speed;
        if ("bots" in o) { S.botsOn = !!o.bots; if (!S.botsOn) clearTimers(); else schedule(); }
        if (o.seed != null) S.rng = mulberry32(o.seed);
        if (o.rng) S.rng = o.rng;
        if ("as" in o) { S.asTarget = o.as; S.asApplied = !o.as; }
      },
      newRoom: function (nm, n) { var r = newRoom(nm || "나", n); if (!r.error) setControlled(null, { silent: true }); return r; },
      setControlled: setControlled,
      controlAs: controlAs,
      decide: decide,
      act: act,
      fastForward: fastForward,
      simulateOffline: simulateOffline,
      toggleDisconnectBot: toggleDisconnectBot,
      addBot: addBot,
      hardReset: hardReset,
      schedule: schedule,
      clearTimers: clearTimers,
      poll: poll,
      onChange: function (cb) { S.listeners.push(cb); },
      BOT_POL: BOT_POL,
      GOALS: GOALS,
    },
  };
})();
