/* 빛의 원정대 — board screen (phases propose / vote / quest / lady / assassin).
   Layout: top bar · quest track + rejection track · players table · action panel.
   update() runs on every view (polls): it only patches parts whose html changed, and applies
   local picks (seat selection, chosen card) as classes so nothing re-animates on polls. */
(function () {
  'use strict';
  const K = window.UI._k;

  // ---------- Korean particles for themed words (terms may be renamed in config.js) ----------
  const lastCode = w => { const s = String(w || ''); return s.charCodeAt(s.length - 1); };
  const batchim = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const rieul = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 8; };
  const jo = (w, withB, noB) => w + (batchim(w) ? withB : noB);   // jo('사명','을','를')
  const ro = w => w + (batchim(w) && !rieul(w) ? '으로' : '로');

  // ---------- themed words ----------
  const W = {
    quest: () => K.term('quest', '사명'),
    team: () => K.term('questTeam', '원정대'),
    leader: () => K.term('leader', '조장'),
    success: () => K.term('success', '축복'),
    fail: () => K.term('fail', '방해'),
    approve: () => K.term('approve', '찬성'),
    reject: () => K.term('reject', '반대'),
    lady: () => K.term('lady', '등불'),
    assassinate: () => K.term('assassinate', '지목')
  };
  const e = K.esc;
  const nm = (v, id) => e(K.pname(v, id));

  // ---------- one-time CSS ----------
  function injectCSS() {
    if (document.getElementById('bd-style')) return;
    const s = document.createElement('style'); s.id = 'bd-style';
    s.textContent = `
.bd-root { position: relative; z-index: 0; }
.bd-root > .bd-veil { position: fixed; inset: 0; z-index: -1; }
.bd-top .grow { padding-right: 2px; }
.bd-top .ux-top-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-top .ux-icon-btn { width: 36px; height: 36px; border-radius: 11px; font-size: 16px; }
.bd-top .ux-icon-btn.on { border-color: var(--gold); background: rgba(244,201,107,.16); }
.bd-top .ux-role-chip { padding: 3px 10px 3px 3px; gap: 6px; font-size: 12px; color: var(--text); flex: none; }
.bd-top .ux-role-chip .dot { width: 22px; height: 30px; border-radius: 5px; }
.bd-top .ux-role-chip .dot img { object-position: 50% 50%; }
.bd-trackp { overflow: hidden; padding: 8px 8px 12px; }
.bd-trackp > .ux-rose { width: 340px; height: 340px; margin: -170px 0 0 -170px; opacity: .10; }
.bd-trackp > *:not(.ux-rose) { position: relative; }
.bd-trackp .ux-track { padding: 12px 6px 14px; }
.bd-qwrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; }
.bd-qwrap .ux-quest { width: 100%; }
.bd-qn { font-size: 10px; color: var(--text-mute); letter-spacing: .06em; }
.bd-qwrap.cur .bd-qn { color: var(--gold); }
.bd-qwrap .two + .bd-qn, .bd-qwrap.two-b .bd-qn { margin-top: 3px; }
.ux-quest.current::after { content: ''; position: absolute; inset: -7px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.55); animation: spin 14s linear infinite; }
.bd-rejl { margin-right: 4px; }
.ux-rej.last.on { animation: bd-throb 1.4s ease-in-out infinite; }
@keyframes bd-throb { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }
.bd-warn { margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px; background: rgba(224,72,110,.13); border: 1px solid rgba(224,72,110,.45); color: #ffc6d3; font-size: 13px; line-height: 1.45; text-align: center; animation: popIn .45s var(--ease-spring) both; }
.bd-warn b { color: #fff; }
.ux-seat { color: inherit; font: inherit; width: 100%; }
.ux-seat .check { color: transparent; }
.ux-seat.fresh { animation: popIn .45s var(--ease-spring) both; animation-delay: calc(var(--i, 0) * 35ms); }
.ux-seat .icons span img { width: 100%; height: 100%; border: 0; background: none; border-radius: 50%; }
.ux-seat .icons .lamp img { padding: 1px; }
.ux-seat .sub { flex-wrap: wrap; min-height: 14px; margin-top: 2px; }
.ux-seat .sub .off { color: var(--text-mute); }
.ux-seat .sub .tm { color: var(--gold); }
.ux-seat .done { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(111,227,166,.16); animation: popIn .4s var(--ease-spring) both; }
.ux-seat.on-team { background: rgba(244,201,107,.07); }
.ux-seat.selectable { cursor: pointer; }
.ux-seat.disabled { pointer-events: none; }
.bd-action { overflow: hidden; }
.bd-action.turn { border-color: rgba(244,201,107,.5); box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 0 1px rgba(244,201,107,.25), 0 0 26px rgba(244,201,107,.18); }
.bd-action.dark { border-color: rgba(224,72,110,.45); box-shadow: 0 10px 30px rgba(0,0,0,.4), 0 0 26px rgba(224,72,110,.2); }
.bd-action.dark .ux-action-title { color: #ffc2d1; }
.bd-glow { position: absolute; left: 50%; top: -60px; width: 260px; height: 160px; margin-left: -130px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(255,215,122,.22), transparent); animation: breathe 3.6s ease-in-out infinite; }
.bd-action.dark .bd-glow { background: radial-gradient(closest-side, rgba(224,72,110,.22), transparent); }
.bd-action > div { position: relative; }
.bd-tag { display: flex; justify-content: center; margin-bottom: 8px; }
.bd-hint { text-align: center; margin: -4px 0 12px; }
.bd-note { text-align: center; font-size: 12px; color: #ffb3c4; margin: -6px 0 12px; }
.bd-count { text-align: center; font-size: 14px; color: var(--text-dim); margin: 2px 0 12px; }
.bd-count b { font-size: 24px; font-weight: 900; color: var(--gold-hi); font-variant-numeric: tabular-nums; display: inline-block; transition: transform .25s var(--ease-spring); }
.bd-count b.bump { transform: scale(1.3); }
.bd-count.full b { color: var(--ok); }
.bd-pickname { text-align: center; font-size: 15px; margin: 2px 0 12px; color: var(--text-dim); min-height: 22px; }
.bd-pickname b { color: var(--gold-hi); }
.bd-action.dark .bd-pickname b { color: #ff9db5; }
.bd-root .ux-choices { margin: 4px 0 14px; }
.bd-root .ux-choice { max-width: 148px; aspect-ratio: 4 / 5; font-size: 21px; }
.bd-root .ux-choice img { width: 58%; }
.bd-done { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0 2px; }
.bd-done .seal { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; font-weight: 900; color: #2a1a02;
  background: radial-gradient(circle at 40% 35%, #fff4cf, var(--gold) 55%, var(--gold-deep)); box-shadow: 0 0 22px var(--good-glow); animation: stamp .7s var(--ease-spring) both; }
.bd-done .t { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--gold-hi); }
.bd-live { margin-top: 14px; }
.bd-live:empty { display: none; }
.bd-prog-l { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
.bd-prog-l b { color: var(--text); font-variant-numeric: tabular-nums; }
.bd-next { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; margin-top: 14px; font-size: 12px; color: var(--text-mute); }
.bd-next .ux-chip { padding: 3px 9px; font-size: 12px; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.bd-next .arr { opacity: .5; }
.bd-ti { width: 16px; height: 16px; vertical-align: -3px; }
.bd-wait-ic { width: 54px; height: 54px; }
.bd-wait-ic img { width: 100%; height: 100%; animation: breathe 2.6s ease-in-out infinite; }
`;
    document.head.appendChild(s);
  }

  // ---------- state helpers ----------
  const showMarks = () => !!K.store.get('showMarks', false);
  const meId = v => (v.me && v.me.id) || null;
  const keyOf = v => v.phase + '|' + v.round + '|' + v.proposalNo;
  const onTeamIds = v => (v.proposal && v.proposal.team) || [];

  /* What the current action needs from me: mode multi (propose), single (lady/assassin) or none. */
  function pickMode(v) {
    const me = meId(v); const ps = K.players(v);
    if (v.phase === 'propose' && v.leaderId === me) return { mode: 'multi', size: K.teamSize(v), allowed: new Set(ps.map(p => p.id)), kind: 'team' };
    if (v.phase === 'lady' && v.ladyHolderId === me) {
      const used = new Set(v.ladyUsedBy || []);
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && !used.has(p.id)).map(p => p.id)), kind: 'lady' };
    }
    if (v.phase === 'assassin' && v.assassinId === me) {
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && K.knowOf(v, p.id).indexOf('evil') < 0).map(p => p.id)), kind: 'assassin' };
    }
    return { mode: null, size: 0, allowed: new Set(), kind: null };
  }

  function isMyTurn(v) {
    const me = v.me || {};
    if (v.phase === 'propose') return v.leaderId === me.id;
    if (v.phase === 'vote') return me.myVote == null;
    if (v.phase === 'quest') return onTeamIds(v).indexOf(me.id) >= 0 && !me.myQuestPlayed;
    if (v.phase === 'lady') return v.ladyHolderId === me.id;
    if (v.phase === 'assassin') return v.assassinId === me.id;
    return false;
  }

  // ---------- top bar ----------
  function topHtml(v) {
    const n = (v.round || 0) + 1; let title = e(W.quest()) + ' ' + n, sub = '';
    if (v.phase === 'propose') sub = (v.proposalNo || 1) + '번째 제안 · ' + e(W.leader()) + ' ' + nm(v, v.leaderId);
    else if (v.phase === 'vote') sub = (v.proposalNo || 1) + '번째 제안 · 투표 중';
    else if (v.phase === 'quest') sub = e(W.quest()) + ' 수행 중';
    else if (v.phase === 'lady') sub = e(W.lady()) + ' · ' + nm(v, v.ladyHolderId);
    else if (v.phase === 'assassin') { title = '마지막 ' + e(W.assassinate()); sub = '모든 것이 이 한 번에 달렸어요'; }
    const marks = showMarks();
    return '<div class="grow"><div class="ux-top-title">' + title + '</div><div class="ux-top-sub">' + sub + '</div></div>' +
      '<button class="ux-icon-btn' + (marks ? ' on' : '') + '" data-act="bd-marks" aria-label="알고 있는 정보 표시" aria-pressed="' + marks + '">' + (marks ? '👁' : '🙈') + '</button>' +
      '<button class="ux-icon-btn" data-act="bd-history" aria-label="지난 기록">📜</button>' +
      '<button class="ux-chip ux-role-chip" data-act="bd-role" aria-label="내 역할 보기"><span class="dot">' + K.backImg() + '</span>내 역할</button>' +
      K.soundBtn();
  }

  // ---------- quest track + rejection track ----------
  function trackHtml(v) {
    const qs = v.quests || [];
    const sizes = K.sizes(v);
    const prev = K.local.prevResults; const now = Date.now();
    K.local.justAt = K.local.justAt || {};
    const fresh = [];
    let out = '<div class="ux-rose" aria-hidden="true"></div><div class="ux-track">';
    for (let i = 0; i < 5; i++) {
      const q = qs[i] || { size: sizes[i], failsNeeded: K.questFails(v, i), result: null };
      const res = q.result;
      if (prev && res && !prev[i]) { K.local.justAt[i] = now; fresh.push({ i, res }); }
      const just = res && K.local.justAt[i] && now - K.local.justAt[i] < 1500;
      const cur = !res && i === v.round && v.phase !== 'assassin';
      const two = (q.failsNeeded || K.questFails(v, i)) >= 2;
      out += '<div class="bd-qwrap' + (cur ? ' cur' : '') + '"><div class="ux-quest' + (cur ? ' current' : '') + (res ? ' ' + res : '') + (just ? ' just' : '') + '" data-q="' + i + '">' +
        (res ? K.tokenImg(res === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || sizes[i] || '') + '</span>') +
        (two && !res ? '<span class="two">' + e(W.fail()) + ' 2</span>' : '') +
        '</div><span class="bd-qn">' + (i + 1) + '</span></div>';
    }
    out += '</div>';
    K.local.prevResults = qs.map(q => q && q.result);
    const filled = Math.max(0, Math.min(5, (v.proposalNo || 1) - 1));
    const showRej = v.phase === 'propose' || v.phase === 'vote';
    out += '<div class="ux-rejects"><span class="bd-rejl">' + e(W.reject()) + ' 누적</span>';
    for (let i = 1; i <= 5; i++) out += '<span class="ux-rej' + (showRej && i <= filled ? ' on' : '') + (i === 5 ? ' last' : '') + '">' + (i === 5 ? '!' : '') + '</span>';
    out += '</div>';
    if (showRej && v.proposalNo >= 5) {
      out += '<div class="bd-warn">⚠ <b>마지막 제안</b>이에요. 이번 ' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.reject(), '으로', '로')) + ' 무산되면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.</div>';
    }
    return { html: out, fresh };
  }

  // ---------- players table ----------
  function seatItems(v, pm) {
    const me = meId(v); const marks = showMarks();
    const team = new Set(onTeamIds(v));
    const done = new Set(v.phase === 'vote' ? (v.votedIds || []) : v.phase === 'quest' ? (v.questPlayedIds || []) : []);
    return K.players(v).map((p, i) => {
      const sel = pm.mode && pm.allowed.has(p.id);
      const dis = pm.mode && !sel;
      const cls = ['ux-seat'];
      if (sel) cls.push('selectable');
      if (dis) cls.push('disabled');
      if (pm.kind === 'assassin' && sel) cls.push('evil-pick', 'ux-target-ring');
      if (team.size && team.has(p.id) && (v.phase === 'vote' || v.phase === 'quest')) cls.push('on-team');
      if (p.id === me) cls.push('is-me');
      let icons = '';
      if (p.id === v.leaderId && v.phase !== 'assassin') icons += '<span class="leader" title="' + e(W.leader()) + '">' + K.tokenImg('leader') + '</span>';
      if (v.ladyHolderId && p.id === v.ladyHolderId && v.phase !== 'assassin') icons += '<span class="lamp" title="' + e(W.lady()) + '">' + K.tokenImg('lady') + '</span>';
      let sub = '';
      if (p.online === false) sub += '<span class="off">연결 끊김</span>';
      if (cls.indexOf('on-team') >= 0) sub += '<span class="tm">' + e(W.team()) + '</span>';
      if (marks && p.id !== me) {
        K.knowOf(v, p.id).forEach(t => { sub += '<span class="knowtag ' + (t === 'merlinCandidate' ? 'merlinCandidate' : 'evil') + '">' + e(K.knowText(t)) + '</span>'; });
        const lt = K.ladyOf(v, p.id);
        if (lt) sub += '<span class="knowtag ' + (lt === 'evil' ? 'evil' : 'good') + '">🪔 ' + e(K.teamName(lt)) + '</span>';
      }
      const tag = sel ? 'button' : 'div';
      const html = '<' + tag + ' class="' + cls.join(' ') + '" style="--i:' + i + '"' + (sel ? ' type="button" data-act="bd-seat" data-id="' + e(p.id) + '"' : '') + ' data-pid="' + e(p.id) + '">' +
        K.avatar(p, true) +
        '<div class="meta"><div class="ux-player-name">' + e(p.name) + (p.id === me ? '<small>나</small>' : '') + '</div><div class="sub">' + sub + '</div></div>' +
        (done.has(p.id) ? '<span class="done" aria-label="완료">✓</span>' : '') +
        (sel ? '<span class="check">✓</span>' : '') +
        (icons ? '<div class="icons">' + icons + '</div>' : '') +
        '</' + tag + '>';
      return { key: p.id, html };
    });
  }

  // ---------- action panel ----------
  const teamChips = v => '<div class="ux-team-row">' + onTeamIds(v).map(id => {
    const p = K.player(v, id) || { id, name: '?' };
    return '<span class="ux-team-chip">' + K.avatar(p, false) + e(p.name) + (K.isMe(v, id) ? ' <small style="opacity:.6">나</small>' : '') + '</span>';
  }).join('') + '</div>';
  const hintLine = (phase, key, params) => { const h = typeof K.hint === 'function' ? K.hint(phase, key, params) : ''; return h ? '<p class="ux-muted bd-hint">' + e(h) + '</p>' : ''; };
  const twoNote = v => K.questFails(v, v.round) >= 2 ? '<p class="bd-note">이번 ' + e(jo(W.quest(), '은', '는')) + ' ' + e(W.fail()) + ' 카드가 2장 나와야 실패해요</p>' : '';
  const waiting = (iconHtml) => '<div class="ux-waiting">' + (iconHtml ? '<div class="bd-wait-ic">' + iconHtml + '</div>' : '') + '<span class="ux-dots"><i></i><i></i><i></i></span></div>';
  const progress = (label, k, n) => '<div class="bd-prog-l"><span>' + label + '</span><b>' + k + ' / ' + n + '</b></div><div class="ux-progress"><i style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></i></div>';
  const doneSeal = t => '<div class="bd-done"><div class="seal">✓</div><div class="t">' + t + '</div></div>';

  function nextLeaders(v) {
    const ps = K.players(v); const i = ps.findIndex(p => p.id === v.leaderId);
    if (i < 0 || ps.length < 2) return '';
    const names = [];
    for (let k = 1; k <= Math.min(3, ps.length - 1); k++) names.push(ps[(i + k) % ps.length]);
    return '<div class="bd-next"><span>다음 ' + e(W.leader()) + '</span>' + names.map((p, j) => (j ? '<span class="arr">›</span>' : '') + '<span class="ux-chip">' + e(p.name) + (K.isMe(v, p.id) ? ' (나)' : '') + '</span>').join('') + '</div>';
  }

  function choiceCards(a, b) {
    return '<div class="ux-choices">' +
      '<button type="button" class="ux-choice ' + a.cls + '" data-act="bd-choice" data-val="1">' + K.tokenImg(a.tok) + e(a.label) + (a.small ? '<small>' + e(a.small) + '</small>' : '') + '</button>' +
      '<button type="button" class="ux-choice ' + b.cls + '" data-act="bd-choice" data-val="0">' + K.tokenImg(b.tok) + e(b.label) + (b.small ? '<small>' + e(b.small) + '</small>' : '') + '</button></div>';
  }

  /* returns { head, ctl, live, mood } — head/ctl only change with the phase key or my own progress. */
  function actionParts(v) {
    const me = v.me || {}; const ph = v.phase;
    const n = (v.players || []).length;
    const P = { head: '', ctl: '', live: '', mood: '' };
    if (ph === 'propose') {
      const size = K.teamSize(v);
      if (v.leaderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('leader', 'bd-ti') + ' 이번 ' + e(W.leader()) + '</span></div>' +
          '<h3 class="ux-action-title">' + e(jo(W.team(), '을', '를')) + ' 꾸려 주세요</h3>' +
          '<p class="ux-action-sub">' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '에 함께 갈 <b>' + size + '명</b>을 위 자리에서 골라요.<br>나도 포함할 수 있어요.</p>' +
          twoNote(v) + hintLine('propose', 'leader', { size });
        P.ctl = '<div class="bd-count" data-bd="count"><b data-bd="k">0</b> / ' + size + '명 선택</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-propose" data-bd="go" disabled>이 ' + e(ro(W.team())) + ' 제안하기</button>' + nextLeaders(v);
      } else {
        P.head = '<h3 class="ux-action-title">' + e(W.leader()) + ' ' + nm(v, v.leaderId) + '님이 고르는 중</h3>' +
          '<p class="ux-action-sub">' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '에 갈 ' + e(W.team()) + ' <b>' + size + '명</b>을 정하고 있어요.<br>누구를 보내면 좋을지 함께 이야기해 보세요.</p>' +
          twoNote(v) + hintLine('propose', 'others', { leaderName: K.pname(v, v.leaderId) });
        P.ctl = waiting(K.tokenImg('leader')) + nextLeaders(v);
      }
    } else if (ph === 'vote') {
      const last = v.proposalNo >= 5;
      P.head = '<h3 class="ux-action-title">이 ' + e(W.team()) + '에' + ' ' + e(W.approve()) + '하시나요?</h3>' +
        '<p class="ux-action-sub">' + e(W.leader()) + ' ' + nm(v, v.leaderId) + '님의 제안 · ' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '</p>' + teamChips(v);
      if (me.myVote == null) {
        P.mood = 'turn';
        P.ctl = (last ? '<div class="bd-warn" style="margin:0 0 12px">이번에 ' + e(jo(W.reject(), '이', '가')) + ' 많으면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 바로 승리</b>해요</div>' : '') +
          hintLine('vote', 'all') +
          choiceCards({ cls: 'approve', tok: 'approve', label: W.approve(), small: '이대로 출발' }, { cls: 'reject', tok: 'reject', label: W.reject(), small: '다시 꾸리기' }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-vote" data-bd="go" disabled>투표하기</button>';
      } else {
        P.ctl = doneSeal('투표 완료') + hintLine('vote', 'voted') + '<p class="ux-muted ux-center">모두 투표하면 결과가 함께 공개돼요</p>';
      }
      P.live = progress('투표한 사람', (v.votedIds || []).length, n);
    } else if (ph === 'quest') {
      const team = onTeamIds(v); const mine = team.indexOf(me.id) >= 0;
      if (mine && !me.myQuestPlayed) {
        P.mood = 'turn';
        P.head = '<h3 class="ux-action-title">' + e(W.quest()) + ' 카드를 내 주세요</h3>' +
          '<p class="ux-action-sub">몰래 한 장을 골라요. 누가 무엇을 냈는지는 아무도 몰라요.</p>' + teamChips(v) + twoNote(v) + hintLine('quest', 'onTeam');
        // Both cards look identical for everyone (a neighbour must not learn my team). Good players get a toast on fail.
        P.ctl = choiceCards({ cls: 'success', tok: 'success', label: W.success() }, { cls: 'fail', tok: 'fail', label: W.fail() }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-quest" data-bd="go" disabled>제출하기</button>';
      } else if (mine) {
        P.head = '<h3 class="ux-action-title">' + e(W.team()) + ' 카드를 기다리는 중</h3>' + teamChips(v);
        P.ctl = doneSeal('제출 완료') + hintLine('quest', 'played');
      } else {
        P.head = '<h3 class="ux-action-title">' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.quest(), '을', '를')) + ' 수행 중이에요</h3>' +
          '<p class="ux-action-sub">카드가 모두 모이면 섞어서 공개돼요.</p>' + teamChips(v) + twoNote(v) + hintLine('quest', 'offTeam');
        P.ctl = waiting(K.tokenImg('success'));
      }
      P.live = progress('카드를 낸 사람', (v.questPlayedIds || []).length, team.length || K.teamSize(v));
    } else if (ph === 'lady') {
      if (v.ladyHolderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">🪔 ' + e(W.lady()) + '</span></div>' +
          '<h3 class="ux-action-title">' + e(ro(W.lady())) + ' 한 사람을 비춰 보세요</h3>' +
          '<p class="ux-action-sub">고른 사람이 어느 편인지 <b>나만</b> 알게 돼요.<br>' + e(jo(W.lady(), '을', '를')) + ' 가졌던 사람은 고를 수 없어요.</p>' + hintLine('lady', 'holder');
        P.ctl = '<div class="bd-pickname" data-bd="pick">위 자리에서 한 사람을 골라 주세요</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-lady" data-bd="go" disabled>' + e(ro(W.lady())) + ' 비춰보기</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + nm(v, v.ladyHolderId) + '님이 ' + e(jo(W.lady(), '을', '를')) + ' 비추는 중</h3>' +
          '<p class="ux-action-sub">비춘 사람의 편은 ' + e(jo(W.lady(), '을', '를')) + ' 든 사람만 알게 돼요.</p>' + hintLine('lady', 'others', { holderName: K.pname(v, v.ladyHolderId) });
        P.ctl = waiting(K.tokenImg('lady'));
      }
    } else if (ph === 'assassin') {
      P.mood = 'dark';
      const seer = K.roleName('merlin') || '선지자';
      if (v.assassinId && v.assassinId === me.id) {
        P.head = '<h3 class="ux-action-title">' + e(jo(seer, '을', '를')) + ' 찾아내세요</h3>' +
          '<p class="ux-action-sub">맞히면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.<br>동료들과 의논한 뒤 신중하게 한 명을 고르세요.</p>' + hintLine('assassin', 'assassin');
        P.ctl = '<div class="bd-pickname" data-bd="pick">위 자리에서 한 사람을 골라 주세요</div>' +
          '<button type="button" class="ux-btn ux-btn-evil" data-act="bd-assassin" data-bd="go" disabled>' + e(W.assassinate()) + '하기</button>';
      } else if (me.team === 'evil') {
        P.head = '<h3 class="ux-action-title">' + nm(v, v.assassinId) + '님이 고르는 중</h3>' +
          '<p class="ux-action-sub">누가 ' + e(seer) + '인지' + ' 함께 의논해 보세요.<br>최종 ' + e(jo(W.assassinate(), '은', '는')) + ' ' + nm(v, v.assassinId) + '님이 해요.</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      } else {
        P.head = '<h3 class="ux-action-title">마지막 ' + e(W.assassinate()) + '을 기다리는 중</h3>' +
          '<p class="ux-action-sub">' + e(jo(K.teamName('evil'), '이', '가')) + ' 정체를 드러내고 의논하고 있어요.<br>숨을 고르고 조용히 기다려 주세요.</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      }
    }
    return P;
  }

  // ---------- local picks → classes (no re-render, so transitions play) ----------
  function applyLocal(el, v) {
    const L = K.local; const pm = L.pm || { mode: null };
    L.picks = (L.picks || []).filter(id => pm.allowed && pm.allowed.has(id));
    K.$$('.ux-seat', el).forEach(s => s.classList.toggle('selected', L.picks.indexOf(s.dataset.pid) >= 0));
    const go = K.$('[data-bd="go"]', el);
    if (pm.mode === 'multi') {
      const k = K.$('[data-bd="k"]', el);
      if (k && k.textContent !== String(L.picks.length)) { k.textContent = L.picks.length; k.classList.add('bump'); setTimeout(() => k.classList.remove('bump'), 220); }
      const c = K.$('[data-bd="count"]', el); if (c) c.classList.toggle('full', L.picks.length === pm.size);
      if (go) go.disabled = L.picks.length !== pm.size || K.busy('propose');
    } else if (pm.mode === 'single') {
      const pk = K.$('[data-bd="pick"]', el);
      if (pk) pk.innerHTML = L.picks.length ? '<b>' + nm(v, L.picks[0]) + '</b>님을 골랐어요' : '위 자리에서 한 사람을 골라 주세요';
      if (go) go.disabled = !L.picks.length || K.busy(pm.kind === 'lady' ? 'lady' : 'assassinate');
    } else if (go) {
      go.disabled = L.choice == null || K.busy(v.phase === 'vote' ? 'vote' : 'quest');
    }
    const cs = K.$$('.ux-choice', el);
    cs.forEach(c => {
      const val = c.dataset.val === '1';
      c.classList.toggle('picked', L.choice != null && L.choice === val);
      c.classList.toggle('dim', L.choice != null && L.choice !== val);
      c.setAttribute('aria-pressed', String(L.choice === val));
    });
  }

  // ---------- screen ----------
  function build(v) {
    injectCSS();
    return K.el('<div class="bd-root">' +
      '<div class="bd-veil-slot"></div>' +
      '<div class="ux-top bd-top" data-bd="top"></div>' +
      '<div class="ux-panel bd-trackp" data-bd="track"></div>' +
      '<div class="ux-table" data-bd="table"></div>' +
      '<div class="ux-panel ux-action bd-action" data-bd="action"><div class="bd-glow" aria-hidden="true"></div><div data-bd="head"></div><div data-bd="ctl"></div><div class="bd-live" data-bd="live"></div></div>' +
      '</div>');
  }

  function update(v, K_, el) {
    if (!v || !v.me) return;
    const L = K.local;
    const key = keyOf(v);
    const newKey = L.key !== key;
    if (newKey) { L.key = key; L.picks = []; L.choice = null; }
    L.pm = pickMode(v);

    // veil
    K.patch(K.$('.bd-veil-slot', el), v.phase === 'assassin' ? '<div class="ux-assassin-veil bd-veil"></div>' : '');
    K.patch(K.$('[data-bd="top"]', el), topHtml(v));
    const tr = trackHtml(v);
    K.patch(K.$('[data-bd="track"]', el), tr.html);
    tr.fresh.forEach(f => setTimeout(() => {
      const q = K.$('.ux-quest[data-q="' + f.i + '"]', el); if (!q) return;
      K.fx.burstAt(q, { n: 26, speed: 180, life: 1, size: 7, colors: f.res === 'success' ? undefined : ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,200,210,1)'] });
    }, 380));
    K.patchList(K.$('[data-bd="table"]', el), seatItems(v, L.pm));

    const P = actionParts(v);
    const act = K.$('[data-bd="action"]', el);
    act.classList.toggle('turn', P.mood === 'turn');
    act.classList.toggle('dark', P.mood === 'dark');
    const headChanged = K.patch(K.$('[data-bd="head"]', el), P.head);
    const ctlChanged = K.patch(K.$('[data-bd="ctl"]', el), P.ctl);
    K.patch(K.$('[data-bd="live"]', el), P.live);
    applyLocal(el, v);

    // my turn just started → gentle chime + bring the action into view (not for seat-pick modes: seats are above)
    const turn = isMyTurn(v) ? key + '|' + v.phase : null;
    if (turn && L.turnKey !== turn) {
      L.turnKey = turn;
      const sk = 'bd-turn-' + v.code;
      if (K.store.sget(sk, null) !== turn) { K.store.sset(sk, turn); K.fb('chime'); }
      if ((headChanged || ctlChanged) && (v.phase === 'vote' || v.phase === 'quest')) {
        setTimeout(() => { try { act.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' }); } catch (x) { } }, 650);
      }
    } else if (!turn) L.turnKey = null;
  }

  K.screens.board = { build, update };

  // ---------- actions ----------
  const scr = () => K.screenEl();
  K.actions['bd-marks'] = () => {
    const on = !showMarks(); K.store.set('showMarks', on); K.fb('tap');
    K.toast(on ? '알고 있는 정보를 표시했어요. 옆 사람이 화면을 보지 않게 조심하세요.' : '알고 있는 정보를 숨겼어요', 'info');
    K.rerender();
  };
  K.actions['bd-history'] = () => { K.fb('tap'); if (typeof K.openHistory === 'function') K.openHistory(); else K.toast('기록을 준비 중이에요', 'info'); };
  K.actions['bd-role'] = () => { K.fb('tap'); if (typeof K.openRoleSheet === 'function') K.openRoleSheet(); else K.toast('역할 카드를 준비 중이에요', 'info'); };

  K.actions['bd-seat'] = (d, node) => {
    const L = K.local; const pm = L.pm; if (!pm || !pm.mode || !pm.allowed.has(d.id)) return;
    L.picks = L.picks || [];
    const i = L.picks.indexOf(d.id);
    if (pm.mode === 'single') L.picks = i >= 0 ? [] : [d.id];
    else if (i >= 0) L.picks.splice(i, 1);
    else if (L.picks.length >= pm.size) { K.toast(pm.size + '명까지 고를 수 있어요. 먼저 한 명을 빼 주세요.', 'info'); K.shake(node); K.buzz('tick'); return; }
    else L.picks.push(d.id);
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-choice'] = (d, node) => {
    const v = K.view; const val = d.val === '1';
    if (v.phase === 'quest' && !val && v.me && v.me.team === 'good') {
      K.shake(node); K.buzz('tick');
      K.toast(jo(K.teamName('good'), '은', '는') + ' ' + W.success() + '만' + ' 낼 수 있어요', 'info');
      return;
    }
    K.local.choice = K.local.choice === val ? null : val;
    K.fb('pick');
    applyLocal(scr(), v);
  };

  async function send(btn, name, arg) {
    if (btn) btn.disabled = true;
    K.fb('tap');
    const r = await K.call(name, arg);
    if (r && r.ok !== false) {
      if (btn && (name === 'vote' || name === 'quest')) K.fx.burstAt(btn, { n: 22, speed: 160, life: .9, size: 6 });
    }
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
    return r;
  }
  K.actions['bd-propose'] = (d, btn) => {
    const L = K.local; if (!L.pm || L.pm.mode !== 'multi' || L.picks.length !== L.pm.size) return;
    const team = K.players(K.view).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0);   // seat order
    send(btn, 'propose', team);
  };
  K.actions['bd-vote'] = (d, btn) => { if (K.local.choice == null) return; send(btn, 'vote', !!K.local.choice); };
  K.actions['bd-quest'] = (d, btn) => {
    const v = K.view; const c = K.local.choice; if (c == null) return;
    if (!c && v.me && v.me.team === 'good') return;
    send(btn, 'quest', !!c);
  };
  K.actions['bd-lady'] = (d, btn) => { const id = (K.local.picks || [])[0]; if (id) send(btn, 'lady', id); };
  K.actions['bd-assassin'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id) return;
    const raw = K.pname(K.view, id); const name = K.esc(raw);
    const ok = await K.confirm(raw + '님을 ' + W.assassinate() + '할까요?', '<b>' + name + '</b>님이 ' + K.esc(jo(K.roleName('merlin') || '선지자', '이', '가')) + ' 맞다면 ' + K.esc(jo(K.teamName('evil'), '이', '가')) + ' 승리해요.<br>한 번 정하면 되돌릴 수 없어요.', { ok: W.assassinate() + '하기', danger: true });
    if (!ok) return;
    send(btn, 'assassinate', id);
  };
})();
