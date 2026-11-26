/* Lobby: room code, players + ready, host settings, start. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;
  const TOPK = ['lady', 'balance', 'excalibur'];   // top-level boolean settings (the rest are settings.roles)
  const ui = (k, ko, en) => { const g = K.G(), u = g && g.ui; return (u && u[k]) || K.L(ko, en); };

  K.screens.lobby = {
    build(v) {
      return K.el('<section class="uxl">' +
        '<div class="ux-top"><div class="grow"><div class="ux-top-title">' + esc(K.T().title || K.L('빛의 원정대', 'Light Expedition')) + '</div><div class="ux-top-sub">' + esc(K.L('대기실', 'Lobby')) + '</div></div>' +
        '<button class="ux-icon-btn" data-act="cm-guide" aria-label="' + esc(ui('helpButton', '설명서', 'Guide')) + '">📖</button>' + K.soundBtn() +
        '<button class="ux-icon-btn" data-act="l-leave" aria-label="' + esc(K.L('나가기', 'Leave')) + '">🚪</button></div>' +
        '<div class="ux-panel ux-code-card uxl-in" style="animation-delay:.05s"><div class="ux-label">' + esc(K.L('참가 코드', 'Room code')) + '</div><div class="ux-code" data-slot="code"></div>' +
        '<div class="ux-row" style="justify-content:center"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-copy">📋 ' + esc(K.L('복사', 'Copy')) + '</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-share">📨 ' + esc(K.L('초대하기', 'Invite')) + '</button></div></div>' +
        '<div data-slot="seat"></div><div data-slot="hint"></div>' +
        '<div class="ux-panel uxl-in" style="animation-delay:.12s"><div class="ux-panel-head"><h3 class="ux-h3">' + esc(K.L('함께하는 사람', 'Players')) + '</h3><span class="ux-chip" data-slot="count"></span></div>' +
        '<div class="ux-players" data-slot="players"></div><div data-slot="balance" style="margin-top:12px"></div></div>' +
        '<div class="ux-panel uxl-in" style="animation-delay:.2s" data-slot="settings"></div>' +
        K.verse('lobby') +
        '<div class="ux-spacer"></div><div class="ux-dock" data-slot="dock"></div></section>');
    },
    update(v, K_, el) {
      const me = v.me || {}, isHost = !!me.isHost, s = v.settings || {}, roles = s.roles || {};
      const ps = K.players(v), n = ps.length, max = s.maxPlayers || 10;
      const pend = K.local.pend || {};   // optimistic toggles
      K.patch(el.querySelector('[data-slot=code]'), esc(v.code || ''));
      K.patch(el.querySelector('[data-slot=count]'), '<b>' + n + '</b> / ' + max);
      const hint = K.hint('lobby', isHost ? 'host' : 'guest', {}, n < 5 ? 0 : (isHost ? 2 : 2));
      K.patch(el.querySelector('[data-slot=seat]'), K.seatNotice ? K.seatNotice(v) : '');
      K.patch(el.querySelector('[data-slot=hint]'), hint ? '<p class="ux-p ux-center uxl-hint">' + esc(hint) + '</p>' : '');

      // players
      const items = ps.map(p => ({
        key: p.id, html: '<div class="ux-player' + (K.isMe(v, p.id) ? ' is-me' : '') + (p.ready || p.isHost ? ' is-ready' : '') + '">' + K.avatar(p, true) +
          '<div class="ux-player-name">' + esc(p.name) + (K.isMe(v, p.id) ? '<small>' + esc(K.L('나', 'me')) + '</small>' : '') + '</div>' +
          (p.isHost ? '<span class="ux-badge gold">👑 ' + esc(K.term('host', K.L('방장', 'Host'))) + '</span>' : (p.ready ? '<span class="ux-badge ok">✓ ' + esc(K.term('ready', K.L('준비 완료', 'Ready'))) + '</span>' : '<span class="ux-badge">' + esc(K.L('기다리는 중', 'Waiting')) + '</span>')) +
          (isHost && !p.isHost ? '<button class="ux-kick" data-act="l-kick" data-id="' + esc(p.id) + '" aria-label="' + esc(K.L('내보내기', 'Remove') + ' ' + p.name) + '">✕</button>' : '') + '</div>'
      }));
      for (let i = n; i < Math.max(5, Math.min(max, n + 1)); i++) items.push({ key: 'empty' + i, html: '<div class="ux-player ux-empty-seat">' + esc(i < 5 ? K.L('빈 자리 · 최소 5명', 'Empty seat · min. 5') : K.L('빈 자리', 'Empty seat')) + '</div>' });
      K.patchList(el.querySelector('[data-slot=players]'), items);

      // balance
      const cnt = Math.max(5, Math.min(10, n));
      const evil = (n >= 5 && v.evilCount) || K.EVIL_COUNT[cnt];
      const sizes = (n >= 5 && v.teamSizes) || K.TEAM_SIZES[cnt];
      const rig = Array.isArray(v.rolesInGame) && v.rolesInGame.length ? '<div class="ux-roles-strip" style="margin-top:10px">' + v.rolesInGame.map(K.rolePill).join('') + '</div>' : '';
      K.patch(el.querySelector('[data-slot=balance]'),
        '<div class="ux-balance"><div class="g"><b>' + (cnt - evil) + '</b>' + esc(K.teamName('good')) + '</div><div class="e"><b>' + evil + '</b>' + esc(K.teamName('evil')) + '</div></div>' +
        '<p class="ux-muted ux-center" style="margin-top:8px">' + esc(K.L((n < 5 ? cnt + '명 기준 · ' : '') + K.term('quest', '사명') + ' 인원 ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4번째는 ' + K.term('fail', '방해') + ' 2장' : ''),
          (n < 5 ? 'For ' + cnt + ' players · ' : '') + K.term('quest', 'Mission') + ' sizes ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4th needs 2 ' + K.term('fail', 'Hindrance') + ' cards' : ''))) + '</p>' + rig);

      // settings
      const sw = (k, label) => '<button class="ux-switch' + (val(k) ? ' on' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + val(k) + '" aria-label="' + esc(label) + '"></button>';
      const val = (k) => (k in pend ? pend[k] : (TOPK.indexOf(k) >= 0 ? !!s[k] : !!roles[k]));
      const g = K.G(), presets = g && g.presets;
      let h = '<div class="ux-panel-head"><h3 class="ux-h3">' + esc(K.L('역할과 규칙', 'Roles & rules')) + '</h3>' + (isHost ? '' : '<span class="ux-muted">' + esc(K.L('방장이 정해요', 'The host decides')) + '</span>') + '</div>';
      if (isHost && presets) h += '<div class="uxl-presets">' + Object.keys(presets).map(k => '<button class="ux-chip" data-act="l-preset" data-k="' + esc(k) + '">✨ ' + esc(presets[k].label || k) + '</button>').join('') + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">' + esc(K.L('최대 인원', 'Max players')) + '</div><div class="desc">' + esc(K.L('5~10명', '5–10 players')) + '</div></div><div class="ux-stepper">' +
        (isHost ? '<button data-act="l-max" data-d="-1" aria-label="' + esc(K.L('줄이기', 'Fewer')) + '"' + (max <= Math.max(5, n) ? ' disabled' : '') + '>−</button>' : '') + '<span class="val">' + max + '</span>' +
        (isHost ? '<button data-act="l-max" data-d="1" aria-label="' + esc(K.L('늘리기', 'More')) + '"' + (max >= 10 ? ' disabled' : '') + '>+</button>' : '') + '</div></div>';
      K.OPTIONAL_ROLES.forEach(k => {
        const on = val(k), ev = K.teamOf(k) === 'evil';
        h += '<div class="ux-setting"><div class="thumb">' + K.roleImg(k) + '</div><div class="txt"><div class="name">' + esc(K.roleName(k)) + ' <span class="ux-badge ' + (ev ? 'evil' : 'gold') + '" style="padding:2px 7px">' + esc(ev ? K.teamName('evil') : K.teamName('good')) + '</span></div><div class="desc">' + esc(K.roleDesc(k)) + '</div></div>' +
          '<button class="ux-switch' + (on ? ' on' : '') + (ev ? ' evil' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + esc(K.roleName(k)) + '"></button></div>';
      });
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.tokenImg('lady') + '</div><div class="txt"><div class="name">' + esc(K.term('lady', K.L('등불', 'Lamp'))) + '</div><div class="desc">' + esc(K.L('2·3·4번째 ' + K.term('quest', '사명') + ' 뒤에 한 사람의 진영을 몰래 확인해요. 7명 이상 추천.', 'After the 2nd, 3rd and 4th ' + K.term('quest', 'Mission') + 's, secretly check one player\'s side. Best with 7+.')) + '</div></div>' +
        sw('lady', K.term('lady', K.L('등불', 'Lamp'))) + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">' + esc(K.L('균형 모드', 'Balance mode')) + '</div><div class="desc">' + esc(K.L('5명·7명일 때 ' + K.term('quest', '사명') + ' 인원을 바꿔 균형을 맞춰요.', 'With 5 or 7 players, ' + K.term('quest', 'Mission') + ' sizes change for a fairer game.')) + '</div></div>' +
        sw('balance', K.L('균형 모드', 'Balance mode')) + '</div>';
      // expansions
      const modTag = '<span class="ux-badge" style="padding:2px 7px">' + esc(ui('moduleTag', '확장', 'Expansion')) + '</span>';
      const lan = 'lancelot' in pend ? pend.lancelot : (Number(s.lancelot) || 0);
      const lanDesc = lan ? K.lanVarRule(lan) + ' ' + K.L(K.teamName('evil') + '는 ' + K.roleBase('lancelotEvil') + '를 알지만, ' + K.roleBase('lancelotEvil') + '는 아무도 몰라요.', K.teamName('evil') + ' see the ' + K.roleBase('lancelotEvil') + ', who sees no one.')
        : K.L('선한 랜슬롯과 악한 랜슬롯이 함께해요. 아래에서 공식 변형 1·2·3 중 하나를 골라요.', 'Adds a Good and an Evil Lancelot. Pick one of the official variants 1, 2 or 3 below.');
      h += '<div class="ux-setting uxl-mod"><div class="thumb">' + K.roleImg(lan ? 'lancelotEvil' : 'lancelotGood') + '</div><div class="txt"><div class="name">' + esc(K.term('lancelot', K.L('갈림길의 순례자 (랜슬롯)', 'Lancelot'))) + ' ' + modTag + '</div><div class="desc">' + esc(lanDesc) + '</div></div>' +
        '<div class="uxl-seg" role="group" aria-label="' + esc(K.term('lancelot', K.L('갈림길의 순례자 (랜슬롯)', 'Lancelot'))) + '">' + [0, 1, 2, 3].map(i => '<button class="' + (lan === i ? 'on' : '') + '" data-act="l-lan" data-n="' + i + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + (lan === i) + '">' + esc(i ? K.lanVarShort(i) : K.L('끔', 'Off')) + '</button>').join('') + '</div></div>';
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.img(K.asset('excalibur.svg'), 'excalibur', '') + '</div><div class="txt"><div class="name">' + esc(K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word'))) + ' ' + modTag + '</div><div class="desc">' +
        esc(K.L(K.term('leader', '조장') + '이 원정대원 한 명에게 주면, 카드를 다 낸 뒤 다른 대원 한 명의 카드를 뒤집을 수 있어요.', 'The ' + K.term('leader', 'Leader') + ' gives it to one team member, who may flip one other member\'s card after all cards are in.')) + '</div></div>' +
        sw('excalibur', K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word'))) + '</div>';
      const se = v.setupError ? (K.isEn() ? (v.setupErrorEn || K.trMsg(v.setupError)) : v.setupError) : '';
      if (se) h += '<div class="ux-warn" style="margin-top:8px">⚠️ ' + esc(se) + '</div>';
      K.patch(el.querySelector('[data-slot=settings]'), h);

      // dock
      const others = ps.filter(p => !p.isHost), readyN = others.filter(p => p.ready).length;
      const allReady = others.every(p => p.ready);
      let d;
      if (isHost) {
        const can = n >= 5 && n <= 10 && allReady && !v.setupError;
        const why = n < 5 ? K.L((5 - n) + '명이 더 필요해요', (5 - n) + ' more needed') : !allReady ? K.L('모두 준비하면 시작할 수 있어요 (' + readyN + '/' + others.length + ')', 'You can start when everyone is ready (' + readyN + '/' + others.length + ')') : v.setupError ? K.L('설정을 확인해 주세요', 'Please check the settings') : K.L('모두 준비됐어요!', 'Everyone is ready!');
        d = '<div class="ux-progress"><i style="width:' + (others.length ? Math.round(100 * readyN / others.length) : 0) + '%"></i></div><p class="ux-muted ux-center">' + esc(why) + '</p>' +
          '<button class="ux-btn ux-btn-gold uxl-start' + (can ? ' can' : '') + '" data-act="l-start"' + (can ? '' : ' disabled') + '>✝️ ' + esc(K.L('게임 시작', 'Start game')) + '</button>';
      } else {
        const r = !!me.ready;
        d = '<p class="ux-muted ux-center">' + (r ? esc(K.L('방장이 시작하기를 기다리는 중', 'Waiting for the host to start')) + ' <span class="ux-dots"><i></i><i></i><i></i></span>' : esc(K.L('준비되면 아래 버튼을 눌러 주세요', 'Tap the button below when you\'re ready'))) + ' · ' + readyN + '/' + others.length + ' ' + esc(K.L('준비', 'ready')) + '</p>' +
          '<button class="ux-btn ux-ready-btn ' + (r ? 'is-ready' : 'ux-btn-gold') + '" data-act="l-ready">' + esc(r ? K.term('ready', K.L('준비 완료', 'Ready')) : K.term('notReady', K.L('준비하기', 'Get ready'))) + '</button>';
      }
      K.patch(el.querySelector('[data-slot=dock]'), d);

      // celebrate when the room becomes startable
      const can2 = n >= 5 && allReady;
      if (can2 && K.local.couldStart === false) { K.fb('chime'); const b = el.querySelector('.uxl-start'); if (b) K.fx.burstAt(b, { n: 30 }); }
      K.local.couldStart = can2;
      K.local.pend = {};
    }
  };

  K.actions['l-copy'] = async () => {
    const c = K.view && K.view.code; if (!c) return;
    try { await navigator.clipboard.writeText(c); K.toast(K.L('코드를 복사했어요', 'Code copied'), 'info'); } catch (e) { K.toast(K.L('코드: ', 'Code: ') + c, 'info'); }
    K.fb('tap');
  };
  K.actions['l-share'] = async () => {
    const c = K.view && K.view.code; if (!c) return;
    const url = location.origin + location.pathname + '?code=' + encodeURIComponent(c);
    const title = K.T().title || K.L('빛의 원정대', 'Light Expedition');
    const text = K.L(title + '에 초대해요! 코드 ' + c, 'Join me for ' + title + '! Code ' + c);
    if (navigator.share) { try { await navigator.share({ title, text, url }); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(text + '\n' + url); K.toast(K.L('초대 링크를 복사했어요', 'Invite link copied'), 'info'); } catch (e) { K.toast(url, 'info'); } }
  };
  K.actions['l-ready'] = (d, btn) => { const r = !(K.view.me && K.view.me.ready); K.fb(r ? 'good' : 'tap'); if (r) K.fx.burstAt(btn, { n: 24, speed: 200 }); K.call('ready', r); };
  K.actions['l-start'] = (d, btn) => { K.fb('chime'); K.fx.burstAt(btn, { n: 50, speed: 320 }); K.call('start'); };
  K.actions['l-kick'] = async d => {
    const nm = K.pname(K.view, d.id);
    if (await K.confirm(K.L(nm + '님을 내보낼까요?', 'Remove ' + nm + ' from the room?'), '', { ok: K.L('내보내기', 'Remove'), cancel: K.L('취소', 'Cancel'), danger: true })) K.call('kick', d.id);
  };
  K.actions['l-leave'] = async () => {
    if (await K.confirm(K.L('대기실에서 나갈까요?', 'Leave the lobby?'), esc(K.L('나가면 코드를 다시 입력해 들어올 수 있어요.', 'You can come back by entering the code again.')), { ok: K.L('나가기', 'Leave'), cancel: K.L('취소', 'Cancel'), danger: true })) K.call('leave');
  };
  K.actions['l-max'] = d => { const s = K.view.settings || {}; const m = Math.max(5, Math.min(10, (s.maxPlayers || 10) + Number(d.d))); K.fb('tick'); K.call('settings', { maxPlayers: m }); };
  K.actions['l-toggle'] = (d, btn) => {
    const v = K.view, s = v.settings || {}, k = d.k;
    const cur = TOPK.indexOf(k) >= 0 ? !!s[k] : !!(s.roles || {})[k];
    btn.classList.toggle('on', !cur); K.fb('pick');
    K.local.pend = Object.assign({}, K.local.pend, { [k]: !cur });
    if (TOPK.indexOf(k) >= 0) K.call('settings', { [k]: !cur });
    else K.call('settings', { roles: Object.assign({}, s.roles || {}, { [k]: !cur }) });
  };
  K.actions['l-lan'] = (d, btn) => {
    const n = Number(d.n) || 0, cur = Number((K.view.settings || {}).lancelot) || 0; if (n === cur) return;
    const seg = btn.parentNode; Array.prototype.forEach.call(seg.children, b => b.classList.toggle('on', b === btn));
    K.fb('pick'); K.local.pend = Object.assign({}, K.local.pend, { lancelot: n });
    K.call('settings', { lancelot: n });
  };
  K.actions['l-preset'] = d => {
    const g = K.G(), p = g && g.presets && g.presets[d.k]; if (!p) return;
    const n = Math.max(5, Math.min(10, K.players(K.view).length));
    const c = (p.byCount && (p.byCount[n] || p.byCount[String(n)])) || null; if (!c) return;
    K.fb('chime'); K.toast(K.L((p.label || '추천 구성') + ' 적용', (p.label || 'Recommended setup') + ' applied') + (c.note ? ' · ' + c.note : ''), 'info');
    K.call('settings', c);
  };

  const css = `
.uxl-in { animation: uxhCard .7s var(--ease-out) both; }
.uxl-hint { margin: -2px 6px 0; font-size: 13px; animation: uxhFade .6s both; }
.uxl-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: -2px 0 8px; } .uxl-presets .ux-chip { color: var(--gold-hi); }
.uxl-mod { flex-wrap: wrap; }
.uxl-seg { flex: 1 1 100%; display: flex; gap: 4px; margin-top: 2px; padding: 3px; border-radius: 12px; background: rgba(255,255,255,.06); border: 1px solid var(--line); }
.uxl-seg button { flex: 1; min-width: 0; min-height: 34px; padding: 4px 6px; border-radius: 9px; font-size: 13px; font-weight: 700; color: var(--text-dim); line-height: 1.2; transition: background .25s, color .25s; }
.uxl-seg button.on { color: #2a1a02; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); }
.uxl-seg button:disabled:not(.on) { opacity: .55; }
.ux-en .uxl-seg button { font-size: 12px; }
.uxl-start.can { animation: uxlGlow 1.6s ease-in-out infinite; }
@keyframes uxlGlow { 0%,100% { box-shadow: 0 8px 28px rgba(244,201,107,.35); } 50% { box-shadow: 0 8px 44px rgba(244,201,107,.8), 0 0 0 6px rgba(244,201,107,.15); } }
`;
  const st = document.createElement('style'); st.id = 'uxl-style'; st.textContent = css; document.head.appendChild(st);
})();
