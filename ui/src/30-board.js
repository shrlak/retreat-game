/* 빛의 원정대 — board screen (phases propose / vote / quest / excalibur / lady / assassin).
   Layout: top bar · quest track + rejection track · players table · action panel.
   update() runs on every view (polls): it only patches parts whose html changed, and applies
   local picks (seat selection, chosen card, Scroll holder) as classes so nothing re-animates on polls.
   Every visible string goes through K.L(ko, en); themed words come from K.term (English in English mode). */
(function () {
  'use strict';
  const K = window.UI._k;

  // ---------- Korean particles for themed words (terms may be renamed in config.js; Korean branches only) ----------
  const lastCode = w => { const s = String(w || ''); return s.charCodeAt(s.length - 1); };
  const batchim = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const rieul = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 8; };
  const jo = (w, withB, noB) => w + (batchim(w) ? withB : noB);   // jo('사명','을','를')
  const ro = w => w + (batchim(w) && !rieul(w) ? '으로' : '로');

  // ---------- themed words ----------
  const W = {
    quest: () => K.term('quest', K.L('사명', 'Mission')),
    team: () => K.term('questTeam', K.L('원정대', 'Team')),
    leader: () => K.term('leader', K.L('조장', 'Leader')),
    success: () => K.term('success', K.L('축복', 'Blessing')),
    fail: () => K.term('fail', K.L('방해', 'Hindrance')),
    approve: () => K.term('approve', K.L('찬성', 'Approve')),
    reject: () => K.term('reject', K.L('반대', 'Reject')),
    lady: () => K.term('lady', K.L('등불', 'Lamp')),
    assassinate: () => K.term('assassinate', K.L('지목', 'Name the Prophet')),
    xc: () => K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word')),
    xcFlip: () => K.term('excaliburAction', K.L('카드 하나 뒤집기', 'Flip one card')),
    xcPass: () => K.term('excaliburPass', K.L('뒤집지 않기', 'Don\'t flip')),
    loyalty: () => K.term('loyalty', K.L('갈림길 카드', 'Crossroads card')),
    loyNone: () => K.term('loyaltyNone', K.L('그대로', 'No change')),
    loySwitch: () => K.term('loyaltySwitch', K.L('편이 바뀜', 'Sides switch')),
    seer: () => K.roleName('merlin') || K.L('선지자', 'Prophet')
  };
  const e = K.esc;
  const nm = (v, id) => e(K.pname(v, id));
  const meWord = () => K.L('나', 'you');

  // ---------- one-time CSS ----------
  function injectCSS() {
    if (document.getElementById('bd-style')) return;
    const s = document.createElement('style'); s.id = 'bd-style';
    s.textContent = `
.bd-root { position: relative; z-index: 0; }
.bd-veil-slot > .bd-veil { position: fixed; inset: 0; z-index: -1; }
.bd-top .grow { padding-right: 2px; }
.bd-top .ux-top-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-top .ux-icon-btn { width: 36px; height: 36px; border-radius: 11px; font-size: 16px; }
.bd-top .ux-icon-btn.on { border-color: var(--gold); background: rgba(244,201,107,.16); }
.bd-top .ux-role-chip { padding: 3px 10px 3px 3px; gap: 6px; font-size: 12px; color: var(--text); flex: none; white-space: nowrap; }
.bd-top .ux-role-chip .dot { width: 22px; height: 30px; border-radius: 5px; }
.bd-top .ux-role-chip .dot img { object-position: 50% 50%; }
.bd-trackp { overflow: hidden; padding: 8px 8px 12px; }
.bd-trackp > .ux-rose { width: 340px; height: 340px; margin: -170px 0 0 -170px; opacity: .10; }
.bd-trackp > *:not(.ux-rose) { position: relative; }
.bd-trackp .ux-track { padding: 12px 6px 14px; align-items: flex-start; }
.bd-qwrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; }
.bd-qwrap .ux-quest { width: 100%; }
.bd-qn { font-size: 11.5px; font-weight: 700; color: var(--text-dim); letter-spacing: .06em; }
.bd-qwrap.cur .bd-qn { color: var(--gold); }
.bd-qwrap .two + .bd-qn, .bd-qwrap.two-b .bd-qn { margin-top: 3px; }
.ux-quest.current::after { content: ''; position: absolute; inset: -7px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.55); animation: spin 14s linear infinite; }
.bd-loy { width: 22px; height: 31px; margin-top: -4px; border-radius: 4px; overflow: hidden; flex: none; box-shadow: 0 2px 8px rgba(0,0,0,.35); border: 1px solid rgba(255,227,163,.35); position: relative; }
.bd-loy img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bd-loy.sp { visibility: hidden; box-shadow: none; }
.bd-loy.down { opacity: .55; }
.bd-loy.down::after { content: '?'; position: absolute; inset: 0; display: grid; place-items: center; font-size: 12px; font-weight: 900; color: var(--gold-hi); text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.bd-loy.switch { border-color: rgba(200,182,255,.8); box-shadow: 0 0 10px rgba(143,108,240,.55); }
.bd-loy.fresh-up { animation: stamp .8s var(--ease-spring) both; }
.bd-loyl { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 8px; font-size: 11.5px; color: var(--text-mute); }
.bd-loyl b { color: var(--text-dim); font-variant-numeric: tabular-nums; }
.bd-rejl { margin-right: 4px; }
.ux-rej.last.on { animation: bd-throb 1.4s ease-in-out infinite; }
@keyframes bd-throb { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }
.bd-warn { margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px; background: rgba(224,72,110,.13); border: 1px solid rgba(224,72,110,.45); color: #ffc6d3; font-size: 13px; line-height: 1.45; text-align: center; animation: popIn .45s var(--ease-spring) both; }
.bd-warn b { color: #fff; }
.ux-seat { color: inherit; font: inherit; width: 100%; }
.ux-seat .check { color: transparent; }
.ux-seat.fresh { animation: popIn .45s var(--ease-spring) both; animation-delay: calc(var(--i, 0) * 35ms); }
.ux-seat .icons span img { width: 100%; height: 100%; border: 0; background: none; border-radius: 50%; }
.ux-seat .icons .lamp img, .ux-seat .icons .xc img { padding: 1px; }
.ux-seat .icons .xc { background: #2a2350; border-color: rgba(255,215,122,.5); }
.ux-seat .sub { flex-wrap: wrap; min-height: 14px; margin-top: 2px; }
.ux-seat .sub .off { color: var(--text-mute); }
.ux-seat .sub .tm { color: var(--gold); }
.ux-seat .knowtag.bd-kt-xc { background: rgba(255,255,255,.1); color: var(--text-dim); }
.ux-seat .done { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(111,227,166,.16); animation: popIn .4s var(--ease-spring) both; }
.ux-seat.on-team { background: rgba(244,201,107,.07); }
.ux-seat.selectable { cursor: pointer; }
.ux-seat.disabled { pointer-events: none; }
.ux-seat .bd-xc-seat { position: absolute; bottom: -8px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(20,24,52,.92); border: 1px solid var(--gold); box-shadow: 0 0 12px rgba(244,201,107,.5); display: none; padding: 2px; }
.ux-seat .bd-xc-seat img { width: 100%; height: 100%; }
.ux-seat.bd-xc-on .bd-xc-seat { display: block; animation: popIn .4s var(--ease-spring) both; }
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
.bd-xnote { text-align: center; font-size: 12px; color: var(--text-dim); margin: -6px 0 12px; }
.bd-xnote img, .bd-ti { width: 16px; height: 16px; vertical-align: -3px; }
.bd-count { text-align: center; font-size: 14px; color: var(--text-dim); margin: 2px 0 12px; }
.bd-count b { font-size: 24px; font-weight: 900; color: var(--gold-hi); font-variant-numeric: tabular-nums; display: inline-block; transition: transform .25s var(--ease-spring); }
.bd-count b.bump { transform: scale(1.3); }
.bd-count.full b { color: var(--ok); }
.bd-pickname { text-align: center; font-size: 15px; margin: 2px 0 12px; color: var(--text-dim); min-height: 22px; }
.bd-pickname b { color: var(--gold-hi); }
.bd-action.dark .bd-pickname b { color: #ff9db5; }
.bd-xc { margin: -2px 0 14px; padding: 10px 10px 12px; border-radius: 14px; border: 1px dashed rgba(244,201,107,.35); background: rgba(244,201,107,.05); text-align: center; transition: opacity .3s; }
.bd-xc:empty { display: none; }
.bd-xc.wait { opacity: .55; }
.bd-xc .h { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--gold-hi); }
.bd-xc .h img { width: 22px; height: 22px; }
.bd-xc .s { font-size: 12px; color: var(--text-dim); margin: 4px 0 0; line-height: 1.4; }
.bd-xc-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; margin-top: 10px; }
.bd-xc-chip { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 5px 30px 5px 5px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid var(--line-strong); color: var(--text); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: border-color .25s, background .25s, transform .2s var(--ease-out), box-shadow .3s; }
.bd-xc-chip:active { transform: scale(.95); }
.bd-xc-chip .ux-avatar { width: 24px; height: 24px; font-size: 11px; }
.bd-xc-chip .slot { position: absolute; right: 4px; top: 50%; width: 22px; height: 22px; margin-top: -11px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.45); }
.bd-xc-chip .slot img { width: 100%; height: 100%; display: block; animation: popIn .45s var(--ease-spring) both; }
.bd-xc-chip.on { border-color: var(--gold); background: rgba(244,201,107,.16); box-shadow: 0 0 16px rgba(244,201,107,.35); }
.bd-xc-chip.on .slot { border-color: transparent; }
.ux-team-chip.has-xc { padding-right: 6px; }
.ux-team-chip .xc { width: 18px; height: 18px; }
.bd-root .ux-choices { margin: 4px 0 14px; }
.bd-root .ux-choice { max-width: 148px; aspect-ratio: 4 / 5; font-size: 21px; }
.bd-root .ux-choice img { width: 58%; }
.bd-done { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0 2px; }
.bd-done .seal { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; font-weight: 900; color: #2a1a02;
  background: radial-gradient(circle at 40% 35%, #fff4cf, var(--gold) 55%, var(--gold-deep)); box-shadow: 0 0 22px var(--good-glow); animation: stamp .7s var(--ease-spring) both; }
.bd-done .t { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--gold-hi); }
.bd-btn2 { margin-top: 10px; min-height: 46px; font-size: 15px; }
.bd-live { margin-top: 14px; }
.bd-live:empty { display: none; }
.bd-pvs:empty { display: none; }
.bd-pv { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 14px; padding: 9px 12px; border-radius: 12px; border: 1px dashed rgba(244,201,107,.35); background: rgba(255,255,255,.04); color: var(--text-dim); font: inherit; font-size: 12.5px; line-height: 1.4; text-align: left; cursor: pointer; }
.bd-pv img { width: 22px; height: 22px; flex: none; }
.bd-pv b { color: var(--gold-hi); }
.bd-pv.open { border-style: solid; color: var(--text); background: rgba(244,201,107,.08); animation: popIn .35s var(--ease-spring) both; }
.bd-prog-l { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
.bd-prog-l b { color: var(--text); font-variant-numeric: tabular-nums; }
.bd-next { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; margin-top: 14px; font-size: 12px; color: var(--text-mute); }
.bd-next .ux-chip { padding: 3px 9px; font-size: 12px; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.bd-next .arr { opacity: .5; }
.bd-wait-ic { width: 54px; height: 54px; }
.bd-wait-ic img { width: 100%; height: 100%; animation: breathe 2.6s ease-in-out infinite; }
.ux-en .bd-top .ux-role-chip { padding-right: 8px; }
.ux-en .bd-root .ux-choice { font-size: 19px; }
`;
    document.head.appendChild(s);
  }

  // ---------- state helpers ----------
  const showMarks = () => !!K.store.get('showMarks', false);
  const meId = v => (v.me && v.me.id) || null;
  const keyOf = v => v.phase + '|' + v.round + '|' + v.proposalNo;
  const onTeamIds = v => (v.proposal && v.proposal.team) || [];
  const xcOn = v => !!(v && v.excalibur);
  const xcHolder = v => (xcOn(v) && v.proposal && v.proposal.excaliburTo) || null;
  const cardWord = ok => ok ? W.success() : W.fail();

  /* What the current action needs from me: mode multi (propose), single (lady/assassin/excalibur) or none. */
  function pickMode(v) {
    const me = meId(v); const ps = K.players(v);
    if (v.phase === 'propose' && v.leaderId === me) return { mode: 'multi', size: K.teamSize(v), allowed: new Set(ps.map(p => p.id)), kind: 'team' };
    if (v.phase === 'lady' && v.ladyHolderId === me) {
      const used = new Set(v.ladyUsedBy || []);
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && !used.has(p.id)).map(p => p.id)), kind: 'lady' };
    }
    if (v.phase === 'excalibur' && xcHolder(v) === me) {
      return { mode: 'single', size: 1, allowed: new Set(onTeamIds(v).filter(id => id !== me)), kind: 'excalibur' };
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
    if (v.phase === 'excalibur') return xcHolder(v) === me.id;
    if (v.phase === 'lady') return v.ladyHolderId === me.id;
    if (v.phase === 'assassin') return v.assassinId === me.id;
    return false;
  }

  // ---------- top bar ----------
  function topHtml(v) {
    const n = (v.round || 0) + 1, pn = v.proposalNo || 1;
    let title = e(W.quest()) + ' ' + n, sub = '';
    if (v.phase === 'propose') sub = K.L(pn + '번째 제안', 'Proposal ' + pn) + ' · ' + e(W.leader()) + ' ' + nm(v, v.leaderId);
    else if (v.phase === 'vote') sub = K.L(pn + '번째 제안 · 투표 중', 'Proposal ' + pn + ' · Voting');
    else if (v.phase === 'quest') sub = K.L(e(W.quest()) + ' 수행 중', 'On the ' + e(W.quest()));
    else if (v.phase === 'excalibur') sub = e(W.xc()) + ' · ' + nm(v, xcHolder(v));
    else if (v.phase === 'lady') sub = e(W.lady()) + ' · ' + nm(v, v.ladyHolderId);
    else if (v.phase === 'assassin') { title = K.L('마지막 ' + e(W.assassinate()), 'The final choice'); sub = K.L('모든 것이 이 한 번에 달렸어요', 'Everything rides on this one choice'); }
    const marks = showMarks();
    return '<div class="grow"><div class="ux-top-title">' + title + '</div><div class="ux-top-sub">' + sub + '</div></div>' +
      '<button class="ux-icon-btn' + (marks ? ' on' : '') + '" data-act="bd-marks" aria-label="' + e(K.L('알고 있는 정보 표시', 'Show what I know')) + '" aria-pressed="' + marks + '">' + (marks ? '👁' : '🙈') + '</button>' +
      '<button class="ux-icon-btn" data-act="bd-history" aria-label="' + e(K.L('지난 기록', 'History')) + '">📜</button>' +
      '<button class="ux-chip ux-role-chip" data-act="bd-role" aria-label="' + e(K.L('내 역할 보기', 'See my role')) + '"><span class="dot">' + K.backImg() + '</span>' + e(K.L('내 역할', 'My role')) + '</button>' +
      K.soundBtn();
  }

  // ---------- quest track + rejection track (+ Crossroads cards at missions 3–5) ----------
  function loyaltyHtml(v, i, fresh) {
    if (!(v.lancelot > 0)) return '';
    if (i < 2) return '<span class="bd-loy sp" aria-hidden="true"></span>';
    const r = (v.loyaltyRevealed || []).filter(x => x.round === i).pop();
    if (!r) return '<span class="bd-loy down" role="img" aria-label="' + e(W.loyalty() + ' · ' + K.L('아직 덮여 있어요', 'still face down')) + '">' + K.backImg() + '</span>';
    const sw = r.card === 'switch';
    const label = W.loyalty() + ': ' + (sw ? W.loySwitch() : W.loyNone());
    return '<span class="bd-loy ' + (sw ? 'switch' : 'none') + (fresh ? ' fresh-up' : '') + '" role="img" aria-label="' + e(label) + '" title="' + e(label) + '">' +
      K.img(K.asset('loyalty/' + (sw ? 'switch' : 'none') + '.svg'), 'loyalty-' + (sw ? 'switch' : 'none'), '') + '</span>';
  }

  function trackHtml(v) {
    const qs = v.quests || [];
    const sizes = K.sizes(v);
    const prev = K.local.prevResults; const now = Date.now();
    K.local.justAt = K.local.justAt || {};
    const prevLoy = K.local.prevLoy;
    const nLoy = (v.loyaltyRevealed || []).length;
    if (prevLoy != null && nLoy > prevLoy) K.local.loyAt = now;
    const loyFresh = K.local.loyAt && now - K.local.loyAt < 1500;
    K.local.prevLoy = nLoy;
    const fresh = [];
    let out = '<div class="ux-rose" aria-hidden="true"></div><div class="ux-track">';
    for (let i = 0; i < 5; i++) {
      const q = qs[i] || { size: sizes[i], failsNeeded: K.questFails(v, i), result: null };
      const res = q.result;
      if (prev && res && !prev[i]) { K.local.justAt[i] = now; fresh.push({ i, res }); }
      const just = res && K.local.justAt[i] && now - K.local.justAt[i] < 1500;
      const cur = !res && i === v.round && v.phase !== 'assassin';
      const two = (q.failsNeeded || K.questFails(v, i)) >= 2;
      const lastLoy = (v.loyaltyRevealed || []).slice(-1)[0];
      out += '<div class="bd-qwrap' + (cur ? ' cur' : '') + '"><div class="ux-quest' + (cur ? ' current' : '') + (res ? ' ' + res : '') + (just ? ' just' : '') + '" data-q="' + i + '">' +
        (res ? K.tokenImg(res === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || sizes[i] || '') + '</span>') +
        (two && !res ? '<span class="two">' + K.L(e(W.fail()) + ' 2', '2 needed') + '</span>' : '') +
        '</div><span class="bd-qn">' + (i + 1) + '</span>' + loyaltyHtml(v, i, loyFresh && lastLoy && lastLoy.round === i) + '</div>';
    }
    out += '</div>';
    K.local.prevResults = qs.map(q => q && q.result);
    const filled = Math.max(0, Math.min(5, (v.proposalNo || 1) - 1));
    const showRej = v.phase === 'propose' || v.phase === 'vote';
    out += '<div class="ux-rejects"><span class="bd-rejl">' + K.L(e(W.reject()) + ' 누적', 'Rejected') + '</span>';
    for (let i = 1; i <= 5; i++) out += '<span class="ux-rej' + (showRej && i <= filled ? ' on' : '') + (i === 5 ? ' last' : '') + '">' + (i === 5 ? '!' : '') + '</span>';
    out += '</div>';
    if (v.lancelot > 0) {
      const left = typeof v.loyaltyLeft === 'number' ? v.loyaltyLeft : null;
      if (left != null) {
        const h = typeof K.hint === 'function' ? K.hint('loyalty', 'left', { count: left }) : '';
        out += '<div class="bd-loyl">🧭 ' + (h ? e(h) : '<span>' + e(K.L('남은 ' + W.loyalty(), W.loyalty() + 's left')) + '</span><b>' + K.L(left + '장', String(left)) + '</b>') + '</div>';
      }
    }
    if (showRej && v.proposalNo >= 5) {
      out += '<div class="bd-warn">⚠ ' + K.L(
        '<b>마지막 제안</b>이에요. 이번 ' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.reject(), '으로', '로')) + ' 무산되면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.',
        'This is the <b>last proposal</b>. If this team is rejected, <b>' + e(K.teamName('evil')) + ' win</b>.') + '</div>';
    }
    return { html: out, fresh };
  }

  // ---------- players table ----------
  function seatItems(v, pm) {
    const me = meId(v); const marks = showMarks();
    const team = new Set(onTeamIds(v));
    const holder = xcHolder(v);
    const teamPhase = v.phase === 'vote' || v.phase === 'quest' || v.phase === 'excalibur';
    const done = new Set(v.phase === 'vote' ? (v.votedIds || []) : v.phase === 'quest' ? (v.questPlayedIds || []) : []);
    const proposing = pm.kind === 'team' && xcOn(v);
    return K.players(v).map((p, i) => {
      const sel = pm.mode && pm.allowed.has(p.id);
      const dis = pm.mode && !sel;
      const cls = ['ux-seat'];
      if (sel) cls.push('selectable');
      if (dis) cls.push('disabled');
      if (pm.kind === 'assassin' && sel) cls.push('evil-pick', 'ux-target-ring');
      if (team.size && team.has(p.id) && teamPhase) cls.push('on-team');
      if (p.id === me) cls.push('is-me');
      let icons = '';
      if (p.id === v.leaderId && v.phase !== 'assassin') icons += '<span class="leader" title="' + e(W.leader()) + '">' + K.tokenImg('leader') + '</span>';
      if (holder && p.id === holder && teamPhase) icons += '<span class="xc" title="' + e(W.xc()) + '">' + K.tokenImg('excalibur') + '</span>';
      if (v.ladyHolderId && p.id === v.ladyHolderId && v.phase !== 'assassin') icons += '<span class="lamp" title="' + e(W.lady()) + '">' + K.tokenImg('lady') + '</span>';
      let sub = '';
      if (p.online === false) sub += '<span class="off">' + e(K.L('연결 끊김', 'Offline')) + '</span>';
      if (cls.indexOf('on-team') >= 0) sub += '<span class="tm">' + e(W.team()) + '</span>';
      if (marks && p.id !== me) {
        K.knowOf(v, p.id).forEach(t => { sub += '<span class="knowtag ' + (t === 'merlinCandidate' ? 'merlinCandidate' : 'evil') + '">' + e(K.knowText(t)) + '</span>'; });
        const lt = K.ladyOf(v, p.id);
        if (lt) sub += '<span class="knowtag ' + (lt === 'evil' ? 'evil' : 'good') + '">🪔 ' + e(K.teamName(lt)) + '</span>';
        // Scroll of the Word results I learned (private, behind the eye toggle like the other marks)
        ((v.me && v.me.excaliburResults) || []).filter(r => r.targetId === p.id).forEach(r => {
          sub += '<span class="knowtag ' + (r.original ? 'bd-kt-xc' : 'evil') + '">📜 ' + e((r.round + 1) + ' · ' + cardWord(r.original)) + '</span>';
        });
      }
      const tag = sel ? 'button' : 'div';
      const html = '<' + tag + ' class="' + cls.join(' ') + '" style="--i:' + i + '"' + (sel ? ' type="button" data-act="bd-seat" data-id="' + e(p.id) + '"' : '') + ' data-pid="' + e(p.id) + '">' +
        K.avatar(p, true) +
        '<div class="meta"><div class="ux-player-name">' + e(p.name) + (p.id === me ? '<small>' + e(meWord()) + '</small>' : '') + '</div><div class="sub">' + sub + '</div></div>' +
        (done.has(p.id) ? '<span class="done" aria-label="' + e(K.L('완료', 'Done')) + '">✓</span>' : '') +
        (sel ? '<span class="check">✓</span>' : '') +
        (icons ? '<div class="icons">' + icons + '</div>' : '') +
        (proposing ? '<span class="bd-xc-seat" aria-hidden="true">' + K.tokenImg('excalibur') + '</span>' : '') +
        '</' + tag + '>';
      return { key: p.id, html };
    });
  }

  // ---------- action panel ----------
  const teamChips = v => {
    const holder = xcHolder(v);
    return '<div class="ux-team-row">' + onTeamIds(v).map(id => {
      const p = K.player(v, id) || { id, name: '?' };
      const hx = holder && id === holder;
      return '<span class="ux-team-chip' + (hx ? ' has-xc' : '') + '">' + K.avatar(p, false) + e(p.name) + (K.isMe(v, id) ? ' <small style="opacity:.6">' + e(meWord()) + '</small>' : '') +
        (hx ? '<span class="xc" role="img" aria-label="' + e(W.xc()) + '" title="' + e(W.xc()) + '">' + K.tokenImg('excalibur', 'xc') + '</span>' : '') + '</span>';
    }).join('') + '</div>' + (holder && (v.phase === 'vote' || v.phase === 'quest') ? xcLine(v, holder) : '');
  };
  const xcLine = (v, holder) => '<p class="bd-xnote">' + K.tokenImg('excalibur') + ' ' + K.L(
    e(W.xc()) + ': <b>' + nm(v, holder) + '</b>' + (v.phase === 'quest' ? ' · 카드가 모이면 한 장을 뒤집을 수 있어요' : ''),
    e(W.xc()) + ': <b>' + nm(v, holder) + '</b>' + (v.phase === 'quest' ? ' · may flip one card once all are in' : '')) + '</p>';
  const hintLine = (phase, key, params) => { const h = typeof K.hint === 'function' ? K.hint(phase, key, params) : ''; return h ? '<p class="ux-muted bd-hint">' + e(h) + '</p>' : ''; };
  const twoNote = v => K.questFails(v, v.round) >= 2 ? '<p class="bd-note">' + K.L('이번 ' + e(jo(W.quest(), '은', '는')) + ' ' + e(W.fail()) + ' 카드가 2장 나와야 실패해요', 'This ' + e(W.quest()) + ' fails only if 2 ' + e(W.fail()) + ' cards come up') + '</p>' : '';
  const waiting = (iconHtml) => '<div class="ux-waiting">' + (iconHtml ? '<div class="bd-wait-ic">' + iconHtml + '</div>' : '') + '<span class="ux-dots"><i></i><i></i><i></i></span></div>';
  const progress = (label, k, n) => '<div class="bd-prog-l"><span>' + label + '</span><b>' + k + ' / ' + n + '</b></div><div class="ux-progress"><i style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></i></div>';
  const doneSeal = t => '<div class="bd-done"><div class="seal">✓</div><div class="t">' + t + '</div></div>';
  const pickPrompt = kind => kind === 'excalibur' ? K.L('위 자리에서 원정대원 한 명을 골라 주세요', 'Pick one team member above') : K.L('위 자리에서 한 사람을 골라 주세요', 'Pick one person above');

  function nextLeaders(v) {
    const ps = K.players(v); const i = ps.findIndex(p => p.id === v.leaderId);
    if (i < 0 || ps.length < 2) return '';
    const names = [];
    for (let k = 1; k <= Math.min(3, ps.length - 1); k++) names.push(ps[(i + k) % ps.length]);
    return '<div class="bd-next"><span>' + K.L('다음 ' + e(W.leader()), 'Next ' + e(W.leader())) + '</span>' + names.map((p, j) => (j ? '<span class="arr">›</span>' : '') + '<span class="ux-chip">' + e(p.name) + (K.isMe(v, p.id) ? ' (' + e(meWord()) + ')' : '') + '</span>').join('') + '</div>';
  }

  function choiceCards(a, b) {
    return '<div class="ux-choices">' +
      '<button type="button" class="ux-choice ' + a.cls + '" data-act="bd-choice" data-val="1">' + K.tokenImg(a.tok) + e(a.label) + (a.small ? '<small>' + e(a.small) + '</small>' : '') + '</button>' +
      '<button type="button" class="ux-choice ' + b.cls + '" data-act="bd-choice" data-val="0">' + K.tokenImg(b.tok) + e(b.label) + (b.small ? '<small>' + e(b.small) + '</small>' : '') + '</button></div>';
  }

  /* Leader, Scroll module: after the team is full, give the Scroll to one member who isn't me. Rendered from applyLocal. */
  function xcPickerHtml(v, L, pm) {
    const me = meId(v);
    const full = L.picks.length === pm.size;
    const head = '<div class="h">' + K.tokenImg('excalibur') + e(K.L(W.xc() + ' 맡기기', 'Give the ' + W.xc())) + '</div>';
    if (!full) return '<div class="bd-xc wait">' + head + '<p class="s">' + e(K.L(W.team() + '을 다 고르면, 나 말고 한 명에게 두루마리를 맡겨요', 'Once the team is full, hand the Scroll to one member (not you)')) + '</p></div>';
    const ids = K.players(v).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0 && id !== me);
    const hint = (typeof K.hint === 'function' && K.hint('propose', 'leaderExcalibur')) ||
      K.L('두루마리를 받은 사람은 카드가 모두 모인 뒤 다른 원정대원 한 명의 카드를 뒤집을 수 있어요', 'After all cards are in, the holder may flip one other team member\'s card');
    return '<div class="bd-xc">' + head + '<p class="s">' + e(hint) + '</p><div class="bd-xc-row">' + ids.map(id => {
      const p = K.player(v, id) || { id, name: '?' }; const on = L.xc === id;
      return '<button type="button" class="bd-xc-chip' + (on ? ' on' : '') + '" data-act="bd-xc" data-id="' + e(id) + '" aria-pressed="' + on + '">' + K.avatar(p, false) + e(p.name) +
        '<span class="slot">' + (on ? K.tokenImg('excalibur') : '') + '</span></button>';
    }).join('') + '</div></div>';
  }

  /* returns { head, ctl, live, mood } — head/ctl only change with the phase key or my own progress. */
  function actionParts(v) {
    const me = v.me || {}; const ph = v.phase;
    const n = (v.players || []).length;
    const P = { head: '', ctl: '', live: '', mood: '' };
    const qn = (v.round || 0) + 1;
    if (ph === 'propose') {
      const size = K.teamSize(v);
      if (v.leaderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('leader', 'bd-ti') + ' ' + K.L('이번 ' + e(W.leader()), 'You\'re the ' + e(W.leader())) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L(e(jo(W.team(), '을', '를')) + ' 꾸려 주세요', 'Choose the ' + e(W.team())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(W.quest()) + ' ' + qn + '에 함께 갈 <b>' + size + '명</b>을 위 자리에서 골라요.<br>나도 포함할 수 있어요.',
            'Pick <b>' + size + ' players</b> above for ' + e(W.quest()) + ' ' + qn + '.<br>You can include yourself.') + '</p>' +
          twoNote(v);
        P.ctl = '<div class="bd-count" data-bd="count"><b data-bd="k">0</b> / ' + size + K.L('명 선택', ' chosen') + '</div>' +
          (xcOn(v) ? '<div data-bd="xc"></div>' : '') +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-propose" data-bd="go" disabled>' + K.L('이 ' + e(ro(W.team())) + ' 제안하기', 'Propose this ' + e(W.team())) + '</button>' + nextLeaders(v);
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.leader()) + ' ' + nm(v, v.leaderId) + '님이 고르는 중', e(W.leader()) + ' ' + nm(v, v.leaderId) + ' is choosing') + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(W.quest()) + ' ' + qn + '에 갈 ' + e(W.team()) + ' <b>' + size + '명</b>을 정하고 있어요.<br>누구를 보내면 좋을지 함께 이야기해 보세요.',
            'Picking <b>' + size + ' players</b> for ' + e(W.quest()) + ' ' + qn + '.<br>Talk together about who should go.') + '</p>' +
          (xcOn(v) ? '<p class="bd-xnote">' + K.tokenImg('excalibur') + ' ' + K.L(e(jo(W.leader(), '이', '가')) + ' ' + e(W.team()) + ' 한 명에게 ' + e(W.xc()) + '도 맡겨요', 'The ' + e(W.leader()) + ' also hands the ' + e(W.xc()) + ' to one member') + '</p>' : '') +
          twoNote(v);
        P.ctl = waiting(K.tokenImg('leader')) + nextLeaders(v);
      }
    } else if (ph === 'vote') {
      const last = v.proposalNo >= 5;
      P.head = '<h3 class="ux-action-title">' + K.L('이 ' + e(W.team()) + '에 ' + e(W.approve()) + '하시나요?', 'Do you approve this ' + e(W.team()) + '?') + '</h3>' +
        '<p class="ux-action-sub">' + K.L(e(W.leader()) + ' ' + nm(v, v.leaderId) + '님의 제안', e(W.leader()) + ' ' + nm(v, v.leaderId) + '\'s proposal') + ' · ' + e(W.quest()) + ' ' + qn + '</p>' + teamChips(v);
      if (me.myVote == null) {
        P.mood = 'turn';
        P.ctl = (last ? '<div class="bd-warn" style="margin:0 0 12px">' + K.L('이번에 ' + e(jo(W.reject(), '이', '가')) + ' 많으면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 바로 승리</b>해요',
          'If this is rejected, <b>' + e(K.teamName('evil')) + ' win right away</b>') + '</div>' : '') +
          choiceCards({ cls: 'approve', tok: 'approve', label: W.approve(), small: K.L('이대로 출발', 'Send them') }, { cls: 'reject', tok: 'reject', label: W.reject(), small: K.L('다시 꾸리기', 'Try another team') }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-vote" data-bd="go" disabled>' + K.L('투표하기', 'Vote') + '</button>';
      } else {
        P.ctl = doneSeal(K.L('투표 완료', 'Vote in')) + '<p class="ux-muted ux-center">' + K.L('모두 투표하면 결과가 함께 공개돼요', 'All votes are shown together once everyone has voted') + '</p>';
      }
      P.live = progress(K.L('투표한 사람', 'Voted'), (v.votedIds || []).length, n);
    } else if (ph === 'quest') {
      const team = onTeamIds(v); const mine = team.indexOf(me.id) >= 0;
      if (mine && !me.myQuestPlayed) {
        P.mood = 'turn';
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.quest()) + ' 카드를 내 주세요', 'Play your ' + e(W.quest()) + ' card') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('몰래 한 장을 골라요. 누가 무엇을 냈는지는 아무도 몰라요.', 'Secretly choose one. No one will know who played what.') + '</p>' + teamChips(v) + twoNote(v);
        // Both cards look identical for everyone (a neighbour must not learn my team). Good players get a toast on fail.
        P.ctl = choiceCards({ cls: 'success', tok: 'success', label: W.success() }, { cls: 'fail', tok: 'fail', label: W.fail() }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-quest" data-bd="go" disabled>' + K.L('제출하기', 'Submit') + '</button>';
      } else if (mine) {
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.team()) + ' 카드를 기다리는 중', 'Waiting for the ' + e(W.team()) + '\'s cards') + '</h3>' + teamChips(v);
        P.ctl = doneSeal(K.L('제출 완료', 'Card played')) + hintLine('quest', 'played');
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.quest(), '을', '를')) + ' 수행 중이에요', 'The ' + e(W.team()) + ' is on the ' + e(W.quest())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('카드가 모두 모이면 섞어서 공개돼요.', 'Once all cards are in, they\'re shuffled and revealed.') + '</p>' + teamChips(v) + twoNote(v);
        P.ctl = waiting(K.tokenImg('success'));
      }
      P.live = progress(K.L('카드를 낸 사람', 'Cards played'), (v.questPlayedIds || []).length, team.length || K.teamSize(v));
    } else if (ph === 'excalibur') {
      const holder = xcHolder(v);
      if (holder && holder === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('excalibur', 'bd-ti') + ' ' + e(W.xc()) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L('카드 한 장을 뒤집을까요?', 'Flip one card?') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('다른 원정대원 한 명의 카드를 반대로 바꿀 수 있어요.<br>원래 무엇이었는지는 <b>나만</b> 알게 돼요.',
            'You may turn one other team member\'s card to the opposite.<br><b>Only you</b> learn what it was.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('excalibur') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-xc-flip" data-bd="go" disabled>' + e(W.xcFlip()) + '</button>' +
          '<button type="button" class="ux-btn ux-btn-ghost bd-btn2" data-act="bd-xc-pass" data-bd="pass">' + e(W.xcPass()) + '</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, holder) + '님이 ' + e(jo(W.xc(), '을', '를')) + ' 펼치는 중', nm(v, holder) + ' holds the ' + e(W.xc())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('원정대원 한 명의 카드를 뒤집을지 고민하고 있어요.<br>누구의 카드를 뒤집었는지는 모두에게 공개돼요.',
            'They\'re deciding whether to flip one team member\'s card.<br>Everyone will see whose card gets flipped.') + '</p>' + teamChips(v);
        P.ctl = waiting(K.tokenImg('excalibur'));
      }
    } else if (ph === 'lady') {
      if (v.ladyHolderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">🪔 ' + e(W.lady()) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L(e(ro(W.lady())) + ' 한 사람을 비춰 보세요', 'Shine the ' + e(W.lady()) + ' on one person') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('고른 사람이 어느 편인지 <b>나만</b> 알게 돼요.<br>' + e(jo(W.lady(), '을', '를')) + ' 가졌던 사람은 고를 수 없어요.',
            '<b>Only you</b> will learn which side they\'re on.<br>You can\'t pick anyone who already held the ' + e(W.lady()) + '.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('lady') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-lady" data-bd="go" disabled>' + K.L(e(ro(W.lady())) + ' 비춰보기', 'Shine the ' + e(W.lady())) + '</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, v.ladyHolderId) + '님이 ' + e(jo(W.lady(), '을', '를')) + ' 비추는 중', nm(v, v.ladyHolderId) + ' is shining the ' + e(W.lady())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('비춘 사람의 편은 ' + e(jo(W.lady(), '을', '를')) + ' 든 사람만 알게 돼요.', 'Only the one holding the ' + e(W.lady()) + ' learns that person\'s side.') + '</p>';
        P.ctl = waiting(K.tokenImg('lady'));
      }
    } else if (ph === 'assassin') {
      P.mood = 'dark';
      const seer = W.seer();
      if (v.assassinId && v.assassinId === me.id) {
        P.head = '<h3 class="ux-action-title">' + K.L(e(jo(seer, '을', '를')) + ' 찾아내세요', 'Find the ' + e(seer)) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('맞히면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.<br>동료들과 의논한 뒤 신중하게 한 명을 고르세요.',
            'If you\'re right, <b>' + e(K.teamName('evil')) + ' win</b>.<br>Talk with your partners, then choose one person carefully.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('assassin') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-evil" data-act="bd-assassin" data-bd="go" disabled>' + K.L(e(W.assassinate()) + '하기', e(W.assassinate())) + '</button>';
      } else if (me.team === 'evil') {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, v.assassinId) + '님이 고르는 중', nm(v, v.assassinId) + ' is choosing') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('누가 ' + e(seer) + '인지 함께 의논해 보세요.<br>최종 ' + e(jo(W.assassinate(), '은', '는')) + ' ' + nm(v, v.assassinId) + '님이 해요.',
            'Talk together about who the ' + e(seer) + ' is.<br>' + nm(v, v.assassinId) + ' makes the final call.') + '</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L('마지막 ' + e(jo(W.assassinate(), '을', '를')) + ' 기다리는 중', 'Waiting for the final choice') + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(jo(K.teamName('evil'), '이', '가')) + ' 정체를 드러내고 의논하고 있어요.<br>숨을 고르고 조용히 기다려 주세요.',
            e(K.teamName('evil')) + ' have revealed themselves and are talking it over.<br>Take a breath and wait quietly.') + '</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      }
    }
    return P;
  }

  /* Holder's private Scroll result: a folded note (tap to open, closes by itself) shown only on the holder's phone,
     for the mission just played. Nothing readable at a glance. */
  function privateNoteHtml(v) {
    const rs = (v.me && v.me.excaliburResults) || [];
    const r = rs.length ? rs[rs.length - 1] : null;
    if (!r || r.round < (v.round || 0) - 1) return '';
    const k = r.round + '|' + r.targetId;
    const open = K.local.pvOpen === k;
    if (!open) return '<button type="button" class="bd-pv" data-act="bd-pv" data-k="' + e(k) + '" aria-expanded="false">' + K.tokenImg('excalibur') +
      '<span>' + e(K.L('나만 보는 두루마리 결과 · 눌러서 확인', 'Your private Scroll result · tap to see')) + '</span></button>';
    const name = K.pname(v, r.targetId), card = cardWord(r.original);
    const h = typeof K.hint === 'function' ? K.hint('excalibur', 'result', { targetName: name, card }) : '';
    const txt = h ? e(h) : K.L(e(name) + '님의 원래 카드는 <b>' + e(card) + '</b>였어요. 지금은 반대로 뒤집혔어요.', e(name) + '\'s card was originally <b>' + e(card) + '</b>. It has now been flipped.');
    return '<button type="button" class="bd-pv open" data-act="bd-pv" data-k="' + e(k) + '" aria-expanded="true">' + K.tokenImg('excalibur') + '<span>' + txt + '</span></button>';
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
      let needXc = false;
      if (xcOn(v)) {
        const me = meId(v); const full = L.picks.length === pm.size;
        const elig = L.picks.filter(id => id !== me);
        if (!full || elig.indexOf(L.xc) < 0) L.xc = null;
        if (full && !L.xc && elig.length === 1) L.xc = elig[0];   // only one choice: hand it over already
        needXc = !L.xc;
        K.patch(K.$('[data-bd="xc"]', el), xcPickerHtml(v, L, pm));
        K.$$('.ux-seat', el).forEach(s => s.classList.toggle('bd-xc-on', !!L.xc && s.dataset.pid === L.xc));
      }
      if (go) go.disabled = L.picks.length !== pm.size || needXc || K.busy('propose');
    } else if (pm.mode === 'single') {
      const pk = K.$('[data-bd="pick"]', el);
      if (pk) pk.innerHTML = L.picks.length ? K.L('<b>' + nm(v, L.picks[0]) + '</b>님을 골랐어요', 'You picked <b>' + nm(v, L.picks[0]) + '</b>') : pickPrompt(pm.kind);
      if (go) go.disabled = !L.picks.length || K.busy(pm.kind === 'lady' ? 'lady' : pm.kind === 'excalibur' ? 'excalibur' : 'assassinate');
      const ps = K.$('[data-bd="pass"]', el); if (ps) ps.disabled = K.busy('excalibur');
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
    K.patch(K.$('[data-bd="pv"]', el), v.phase === 'excalibur' ? '' : privateNoteHtml(v));
  }

  // ---------- screen ----------
  function build(v) {
    injectCSS();
    return K.el('<div class="bd-root">' +
      '<div class="bd-veil-slot"></div>' +
      '<div class="ux-top bd-top" data-bd="top"></div>' +
      '<div class="ux-panel bd-trackp" data-bd="track"></div>' +
      '<div class="ux-table" data-bd="table"></div>' +
      '<div class="ux-panel ux-action bd-action" data-bd="action"><div class="bd-glow" aria-hidden="true"></div><div data-bd="head"></div><div data-bd="ctl"></div><div class="bd-live" data-bd="live"></div><div class="bd-pvs" data-bd="pv"></div></div>' +
      '</div>');
  }

  function update(v, K_, el) {
    if (!v || !v.me) return;
    const L = K.local;
    const key = keyOf(v);
    const newKey = L.key !== key;
    if (newKey) { L.key = key; L.picks = []; L.choice = null; L.xc = null; }
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
  /* Phase 'excalibur' is drawn by this board screen too (core's K.screenFor maps every in-game phase to 'board'). */

  // ---------- actions ----------
  const scr = () => K.screenEl();
  K.actions['bd-marks'] = () => {
    const on = !showMarks(); K.store.set('showMarks', on); K.fb('tap');
    K.toast(on ? K.L('알고 있는 정보를 표시했어요. 옆 사람이 화면을 보지 않게 조심하세요.', 'Showing what you know. Make sure no one can see your screen.') : K.L('알고 있는 정보를 숨겼어요', 'Hid what you know'), 'info');
    K.rerender();
  };
  K.actions['bd-history'] = () => { K.fb('tap'); if (typeof K.openHistory === 'function') K.openHistory(); else K.toast(K.L('기록을 준비 중이에요', 'History is coming soon'), 'info'); };
  K.actions['bd-role'] = () => { K.fb('tap'); if (typeof K.openRoleSheet === 'function') K.openRoleSheet(); else K.toast(K.L('역할 카드를 준비 중이에요', 'Role card is coming soon'), 'info'); };

  K.actions['bd-seat'] = (d, node) => {
    const L = K.local; const pm = L.pm; if (!pm || !pm.mode || !pm.allowed.has(d.id)) return;
    L.picks = L.picks || [];
    const i = L.picks.indexOf(d.id);
    if (pm.mode === 'single') L.picks = i >= 0 ? [] : [d.id];
    else if (i >= 0) L.picks.splice(i, 1);
    else if (L.picks.length >= pm.size) { K.toast(K.L(pm.size + '명까지 고를 수 있어요. 먼저 한 명을 빼 주세요.', 'You can pick up to ' + pm.size + '. Remove someone first.'), 'info'); K.shake(node); K.buzz('tick'); return; }
    else L.picks.push(d.id);
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-xc'] = (d, node) => {
    const L = K.local; if (!L.pm || L.pm.mode !== 'multi') return;
    L.xc = L.xc === d.id ? null : d.id;
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-pv'] = (d) => {
    const L = K.local;
    L.pvOpen = L.pvOpen === d.k ? null : d.k;
    K.fb('tap');
    clearTimeout(L.pvT);
    if (L.pvOpen) L.pvT = setTimeout(() => { if (K.local === L && L.pvOpen) { L.pvOpen = null; const s = scr(); if (s && K.view) applyLocal(s, K.view); } }, 6000);
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
  };

  K.actions['bd-choice'] = (d, node) => {
    const v = K.view; const val = d.val === '1';
    if (v.phase === 'quest' && !val && v.me && v.me.team === 'good') {
      K.shake(node); K.buzz('tick');
      K.toast(K.L(jo(K.teamName('good'), '은', '는') + ' ' + W.success() + '만 낼 수 있어요', K.teamName('good') + ' can only play ' + W.success()), 'info');
      return;
    }
    K.local.choice = K.local.choice === val ? null : val;
    K.fb('pick');
    applyLocal(scr(), v);
  };

  async function send(btn, name, ...args) {
    if (btn) btn.disabled = true;
    K.fb('tap');
    const r = await K.call(name, ...args);
    if (r && r.ok !== false) {
      if (btn && (name === 'vote' || name === 'quest')) K.fx.burstAt(btn, { n: 22, speed: 160, life: .9, size: 6 });
    }
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
    return r;
  }
  K.actions['bd-propose'] = (d, btn) => {
    const L = K.local; const v = K.view;
    if (!L.pm || L.pm.mode !== 'multi' || L.picks.length !== L.pm.size) return;
    const team = K.players(v).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0);   // seat order
    if (xcOn(v)) {
      if (!L.xc || team.indexOf(L.xc) < 0 || L.xc === meId(v)) { K.toast(K.L(W.xc() + '을 맡길 사람을 골라 주세요', 'Choose who gets the ' + W.xc()), 'info'); return; }
      send(btn, 'propose', team, L.xc);
    } else send(btn, 'propose', team);
  };
  K.actions['bd-vote'] = (d, btn) => { if (K.local.choice == null) return; send(btn, 'vote', !!K.local.choice); };
  K.actions['bd-quest'] = (d, btn) => {
    const v = K.view; const c = K.local.choice; if (c == null) return;
    if (!c && v.me && v.me.team === 'good') return;
    send(btn, 'quest', !!c);
  };
  K.actions['bd-lady'] = (d, btn) => { const id = (K.local.picks || [])[0]; if (id) send(btn, 'lady', id); };
  K.actions['bd-xc-flip'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id || K.view.phase !== 'excalibur') return;
    const raw = K.pname(K.view, id), name = K.esc(raw);
    const ok = await K.confirm(K.L(raw + '님의 카드를 뒤집을까요?', 'Flip ' + raw + '\'s card?'),
      K.L('<b>' + name + '</b>님의 카드가 반대로 바뀌어요.<br>원래 무엇이었는지는 나만 알게 되고, 누구의 카드를 뒤집었는지는 모두에게 공개돼요.',
        '<b>' + name + '</b>\'s card turns to the opposite.<br>Only you learn what it was; everyone sees whose card you flipped.'),
      { ok: W.xcFlip(), cancel: K.L('취소', 'Cancel') });
    if (!ok) return;
    send(btn, 'excalibur', id);
  };
  K.actions['bd-xc-pass'] = async (d, btn) => {
    if (K.view.phase !== 'excalibur') return;
    const ok = await K.confirm(K.L('카드를 그대로 둘까요?', 'Leave every card as it is?'),
      K.L('아무 카드도 뒤집지 않고 결과를 공개해요.', 'No card is flipped and the result is revealed.'),
      { ok: W.xcPass(), cancel: K.L('취소', 'Cancel') });
    if (!ok) return;
    send(btn, 'excalibur');
  };
  K.actions['bd-assassin'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id) return;
    const raw = K.pname(K.view, id); const name = K.esc(raw);
    const seer = W.seer(), evil = K.teamName('evil');
    const ok = await K.confirm(K.L(raw + '님을 ' + W.assassinate() + '할까요?', 'Name ' + raw + '?'),
      K.L('<b>' + name + '</b>님이 ' + K.esc(jo(seer, '이', '가')) + ' 맞다면 ' + K.esc(jo(evil, '이', '가')) + ' 승리해요.<br>한 번 정하면 되돌릴 수 없어요.',
        'If <b>' + name + '</b> is the ' + K.esc(seer) + ', ' + K.esc(evil) + ' win.<br>This can\'t be undone.'),
      { ok: K.L(W.assassinate() + '하기', W.assassinate()), cancel: K.L('취소', 'Cancel'), danger: true });
    if (!ok) return;
    send(btn, 'assassinate', id);
  };
})();
