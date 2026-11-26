// window.DevUI — plain fallback UI (used only when ui/ui.js is missing). Also used for end-to-end tests.
(function () {
  let root, api, T, view = null, picks = new Set();
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k === "class") e.className = v;
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
    return e;
  };
  const name = (id) => (view.players.find((p) => p.id === id) || {}).name || "?";
  const roleName = (r) => (T.roles[r] || {}).name || r;
  function toast(msg) {
    const t = h("div", { class: "dev-toast", "data-testid": "toast" }, msg);
    Object.assign(t.style, { position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)", background: "#c0392b", color: "#fff", padding: "10px 16px", borderRadius: "10px", zIndex: 99 });
    document.body.append(t);
    setTimeout(() => t.remove(), 3000);
  }
  function btn(label, fn, extra = {}) {
    return h("button", { ...extra, on: { click: fn }, style: "margin:4px;padding:10px 14px;font-size:16px" }, label);
  }
  function home(opts = {}) {
    const n = h("input", { placeholder: "이름", "data-testid": "name", style: "font-size:18px;padding:8px" });
    const c = h("input", { placeholder: "방 코드", "data-testid": "code", value: opts.code || "", style: "font-size:18px;padding:8px;text-transform:uppercase" });
    return h("div", {}, h("h1", {}, T.title), h("p", {}, T.subtitle), n, h("br"),
      btn("방 만들기", () => api.create(n.value), { "data-testid": "create" }), h("hr"), c,
      btn("참가하기", () => api.join(c.value, n.value), { "data-testid": "join" }));
  }
  function playersList(mark) {
    return h("ul", {}, view.players.map((p) => h("li", { "data-pid": p.id },
      p.name, p.isHost ? " 👑" : "", view.leaderId === p.id ? ` [${T.terms.leader}]` : "",
      view.ladyHolderId === p.id ? ` [${T.terms.lady}]` : "", p.online ? "" : " (연결 끊김)", mark ? mark(p) : "")));
  }
  function tracker() {
    return h("div", { "data-testid": "tracker" }, view.quests.map((q, i) => h("span", { style: `display:inline-block;margin:3px;padding:6px;border:1px solid #aaa;border-radius:50%;${i === view.round ? "outline:2px solid gold" : ""}` },
      q.result === "success" ? "✓" : q.result === "fail" ? "✗" : q.size, q.failsNeeded > 1 ? "*" : "")), ` 제안 ${view.proposalNo}/5`);
  }
  function me() {
    const m = view.me;
    if (!m.role) return null;
    return h("div", { "data-testid": "myrole", "data-role": m.role, style: "border:1px solid #666;padding:8px;margin:6px 0" },
      `내 역할: ${roleName(m.role)} (${T.teams[m.team].name})`,
      m.knowledge.length ? h("div", {}, m.knowledge.map((k) => `${name(k.id)}=${T.knowledgeText[k.tag]}`).join(", ")) : null,
      m.ladyResults.length ? h("div", {}, m.ladyResults.map((r) => `${T.terms.lady}: ${name(r.targetId)} → ${T.teams[r.team].name}`).join(", ")) : null);
  }
  function pickList(n, onDone, label, filter = () => true) {
    return h("div", {}, view.players.filter(filter).map((p) => h("label", { style: "display:block;font-size:18px" },
      h("input", { type: n === 1 ? "radio" : "checkbox", name: "pick", "data-pick": p.id, checked: picks.has(p.id), on: { change: (e) => {
        if (n === 1) picks = new Set([p.id]); else e.target.checked ? picks.add(p.id) : picks.delete(p.id);
      } } }), p.name)), btn(label, () => onDone([...picks]), { "data-testid": "submit-pick" }));
  }
  function render(v, opts = {}) {
    if (!root) return;
    const prevPhase = view && view.phase;
    view = v;
    if (!v || prevPhase !== v.phase || (v && v.proposalNo)) { if (!v || prevPhase !== v.phase) picks = new Set(); }
    root.innerHTML = "";
    root.style.cssText = "padding:16px;font-family:sans-serif;max-width:480px;margin:auto";
    if (!v) return root.append(home(opts));
    const m = v.me;
    const top = h("div", { "data-testid": "phase", "data-phase": v.phase }, `방 ${v.code} · ${v.phase}`);
    root.append(top);
    if (v.phase === "lobby") {
      root.append(playersList((p) => (p.ready ? " ✅" : " ⏳")));
      root.append(h("div", {}, `인원 ${v.playerCount}명 · 역할: ${(v.rolesInGame || []).map(roleName).join(", ")}`), v.setupError ? h("div", { style: "color:#e74c3c" }, v.setupError) : null);
      if (m.isHost) {
        const s = v.settings;
        const toggle = (k) => h("label", { style: "display:block" }, h("input", { type: "checkbox", "data-setting": k, checked: s.roles[k], on: { change: (e) => api.settings({ roles: { [k]: e.target.checked } }) } }), roleName(k));
        root.append(h("div", {}, ["merlin", "percival", "morgana", "mordred", "oberon"].map(toggle),
          h("label", { style: "display:block" }, h("input", { type: "checkbox", "data-setting": "lady", checked: s.lady, on: { change: (e) => api.settings({ lady: e.target.checked }) } }), T.terms.lady),
          h("label", { style: "display:block" }, h("input", { type: "checkbox", "data-setting": "balance", checked: s.balance, on: { change: (e) => api.settings({ balance: e.target.checked }) } }), "밸런스 모드")));
        root.append(btn("게임 시작", () => api.start(), { "data-testid": "start" }));
      } else {
        root.append(btn(m.ready ? "준비 취소" : T.terms.ready, () => api.ready(!m.ready), { "data-testid": "ready" }));
      }
      root.append(btn("나가기", () => api.leave(), { "data-testid": "leave" }));
      return;
    }
    root.append(me(), tracker());
    if (v.lastVote) root.append(h("div", { "data-testid": "lastvote" }, `지난 투표: ${v.lastVote.approved ? "가결" : "부결"} — ` + Object.entries(v.lastVote.votes).map(([id, b]) => `${name(id)}${b ? "○" : "×"}`).join(" ")));
    if (v.lastQuest) root.append(h("div", { "data-testid": "lastquest" }, `지난 사명: ${v.lastQuest.result} (방해 ${v.lastQuest.fails})`));
    if (v.phase === "reveal") {
      root.append(playersList((p) => (p.acked ? " 👀" : "")));
      if (!m.acked) root.append(btn("확인했어요", () => api.ack(), { "data-testid": "ack" }));
      if (m.isHost) root.append(btn("모두 기다리지 않고 시작", () => api.skipReveal()));
    } else if (v.phase === "propose") {
      root.append(playersList());
      if (v.leaderId === m.id) root.append(h("p", {}, `${v.quests[v.round].size}명을 고르세요`), pickList(v.quests[v.round].size, (ids) => api.propose(ids), "원정대 제안"));
      else root.append(h("p", {}, `${name(v.leaderId)}님이 원정대를 고르는 중`));
    } else if (v.phase === "vote") {
      root.append(h("p", { "data-testid": "proposal" }, "제안된 원정대: " + v.proposal.team.map(name).join(", ")));
      root.append(playersList((p) => (v.votedIds.includes(p.id) ? " 🗳" : "")));
      if (m.myVote === null) root.append(btn(T.terms.approve, () => api.vote(true), { "data-testid": "approve" }), btn(T.terms.reject, () => api.vote(false), { "data-testid": "reject" }));
      else root.append(h("p", {}, "투표 완료"));
    } else if (v.phase === "quest") {
      root.append(h("p", {}, "원정대: " + v.proposal.team.map(name).join(", ")));
      if (v.proposal.team.includes(m.id) && !m.myQuestPlayed)
        root.append(btn(T.terms.success, () => api.quest(true), { "data-testid": "success" }), m.team === "evil" ? btn(T.terms.fail, () => api.quest(false), { "data-testid": "fail" }) : null);
      else root.append(h("p", {}, `카드 낸 사람 ${v.questPlayedIds.length}/${v.proposal.team.length}`));
    } else if (v.phase === "lady") {
      if (v.ladyHolderId === m.id) root.append(pickList(1, (ids) => api.lady(ids[0]), T.terms.ladyAction, (p) => !v.ladyUsedBy.includes(p.id)));
      else root.append(h("p", {}, `${name(v.ladyHolderId)}님이 ${T.terms.lady}을 쓰는 중`));
    } else if (v.phase === "assassin") {
      if (v.assassinId === m.id) root.append(pickList(1, (ids) => api.assassinate(ids[0]), T.terms.assassinate, (p) => p.id !== m.id));
      else root.append(h("p", {}, `${name(v.assassinId)}님(정탐꾼)이 선지자를 찾는 중`));
    } else if (v.phase === "end") {
      root.append(h("h2", { "data-testid": "winner", "data-winner": v.winner }, `${T.teams[v.winner].name} 승리! ${T.winText[v.winReason] || ""}`));
      root.append(h("ul", {}, v.players.map((p) => h("li", {}, `${p.name}: ${roleName(v.revealed[p.id])}`))));
      if (m.isHost) root.append(btn("한 판 더", () => api.restart(), { "data-testid": "restart" }));
      root.append(btn("처음으로", () => api.home()));
    }
  }
  window.DevUI = { init(r, a, theme) { root = r; api = a; T = theme; }, render, toast };
})();
