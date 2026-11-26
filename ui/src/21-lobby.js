/* Lobby: room code, players + ready, host settings, start. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  K.screens.lobby = {
    build(v) {
      return K.el('<section class="uxl">' +
        '<div class="ux-top"><div class="grow"><div class="ux-top-title">' + esc(K.T().title || '빛의 원정대') + '</div><div class="ux-top-sub">대기실</div></div>' +
        '<button class="ux-icon-btn" data-act="cm-guide" aria-label="설명서">📖</button>' + K.soundBtn() +
        '<button class="ux-icon-btn" data-act="l-leave" aria-label="나가기">🚪</button></div>' +
        '<div class="ux-panel ux-code-card uxl-in" style="animation-delay:.05s"><div class="ux-label">참가 코드</div><div class="ux-code" data-slot="code"></div>' +
        '<div class="ux-row" style="justify-content:center"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-copy">📋 복사</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-share">📨 초대하기</button></div></div>' +
        '<div data-slot="hint"></div>' +
        '<div class="ux-panel uxl-in" style="animation-delay:.12s"><div class="ux-panel-head"><h3 class="ux-h3">함께하는 사람</h3><span class="ux-chip" data-slot="count"></span></div>' +
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
      K.patch(el.querySelector('[data-slot=hint]'), hint ? '<p class="ux-p ux-center uxl-hint">' + esc(hint) + '</p>' : '');

      // players
      const items = ps.map(p => ({
        key: p.id, html: '<div class="ux-player' + (K.isMe(v, p.id) ? ' is-me' : '') + (p.ready || p.isHost ? ' is-ready' : '') + '">' + K.avatar(p, true) +
          '<div class="ux-player-name">' + esc(p.name) + (K.isMe(v, p.id) ? '<small>나</small>' : '') + '</div>' +
          (p.isHost ? '<span class="ux-badge gold">👑 방장</span>' : (p.ready ? '<span class="ux-badge ok">✓ 준비 완료</span>' : '<span class="ux-badge">기다리는 중</span>')) +
          (isHost && !p.isHost ? '<button class="ux-kick" data-act="l-kick" data-id="' + esc(p.id) + '" aria-label="내보내기">✕</button>' : '') + '</div>'
      }));
      for (let i = n; i < Math.max(5, Math.min(max, n + 1)); i++) items.push({ key: 'empty' + i, html: '<div class="ux-player ux-empty-seat">' + (i < 5 ? '빈 자리 · 최소 5명' : '빈 자리') + '</div>' });
      K.patchList(el.querySelector('[data-slot=players]'), items);

      // balance
      const cnt = Math.max(5, Math.min(10, n));
      const evil = (n >= 5 && v.evilCount) || K.EVIL_COUNT[cnt];
      const sizes = (n >= 5 && v.teamSizes) || K.TEAM_SIZES[cnt];
      const rig = Array.isArray(v.rolesInGame) && v.rolesInGame.length ? '<div class="ux-roles-strip" style="margin-top:10px">' + v.rolesInGame.map(r => '<span class="ux-role-pill ' + K.teamOf(r) + '"><i>' + K.roleImg(r) + '</i>' + esc(K.roleName(r)) + '</span>').join('') + '</div>' : '';
      K.patch(el.querySelector('[data-slot=balance]'),
        '<div class="ux-balance"><div class="g"><b>' + (cnt - evil) + '</b>' + esc(K.teamName('good')) + '</div><div class="e"><b>' + evil + '</b>' + esc(K.teamName('evil')) + '</div></div>' +
        '<p class="ux-muted ux-center" style="margin-top:8px">' + (n < 5 ? cnt + '명 기준 · ' : '') + esc(K.term('quest', '사명')) + ' 인원 ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4번째는 ' + esc(K.term('fail', '방해')) + ' 2장' : '') + '</p>' + rig);

      // settings
      const val = (k) => (k in pend ? pend[k] : (k === 'lady' || k === 'balance' ? !!s[k] : !!roles[k]));
      const g = K.G(), presets = g && g.presets;
      let h = '<div class="ux-panel-head"><h3 class="ux-h3">역할과 규칙</h3>' + (isHost ? '' : '<span class="ux-muted">방장이 정해요</span>') + '</div>';
      if (isHost && presets) h += '<div class="uxl-presets">' + Object.keys(presets).map(k => '<button class="ux-chip" data-act="l-preset" data-k="' + esc(k) + '">✨ ' + esc(presets[k].label || k) + '</button>').join('') + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">최대 인원</div><div class="desc">5~10명</div></div><div class="ux-stepper">' +
        (isHost ? '<button data-act="l-max" data-d="-1"' + (max <= Math.max(5, n) ? ' disabled' : '') + '>−</button>' : '') + '<span class="val">' + max + '</span>' +
        (isHost ? '<button data-act="l-max" data-d="1"' + (max >= 10 ? ' disabled' : '') + '>+</button>' : '') + '</div></div>';
      K.OPTIONAL_ROLES.forEach(k => {
        const on = val(k), ev = K.teamOf(k) === 'evil';
        h += '<div class="ux-setting"><div class="thumb">' + K.roleImg(k) + '</div><div class="txt"><div class="name">' + esc(K.roleName(k)) + ' <span class="ux-badge ' + (ev ? 'evil' : 'gold') + '" style="padding:2px 7px">' + esc(ev ? K.teamName('evil') : K.teamName('good')) + '</span></div><div class="desc">' + esc(K.roleDesc(k)) + '</div></div>' +
          '<button class="ux-switch' + (on ? ' on' : '') + (ev ? ' evil' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + esc(K.roleName(k)) + '"></button></div>';
      });
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.tokenImg('lady') + '</div><div class="txt"><div class="name">' + esc(K.term('lady', '등불')) + '</div><div class="desc">2·3·4번째 ' + esc(K.term('quest', '사명')) + ' 뒤에 한 사람의 진영을 몰래 확인해요. 7명 이상 추천.</div></div>' +
        '<button class="ux-switch' + (val('lady') ? ' on' : '') + '" data-act="l-toggle" data-k="lady"' + (isHost ? '' : ' disabled') + '></button></div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">균형 모드</div><div class="desc">5명·7명일 때 ' + esc(K.term('quest', '사명')) + ' 인원을 바꿔 균형을 맞춰요.</div></div>' +
        '<button class="ux-switch' + (val('balance') ? ' on' : '') + '" data-act="l-toggle" data-k="balance"' + (isHost ? '' : ' disabled') + '></button></div>';
      if (v.setupError) h += '<div class="ux-warn" style="margin-top:8px">⚠️ ' + esc(v.setupError) + '</div>';
      K.patch(el.querySelector('[data-slot=settings]'), h);

      // dock
      const others = ps.filter(p => !p.isHost), readyN = others.filter(p => p.ready).length;
      const allReady = others.every(p => p.ready);
      let d;
      if (isHost) {
        const can = n >= 5 && n <= 10 && allReady && !v.setupError;
        const why = n < 5 ? (5 - n) + '명이 더 필요해요' : !allReady ? '모두 준비하면 시작할 수 있어요 (' + readyN + '/' + others.length + ')' : v.setupError ? '설정을 확인해 주세요' : '모두 준비됐어요!';
        d = '<div class="ux-progress"><i style="width:' + (others.length ? Math.round(100 * readyN / others.length) : 0) + '%"></i></div><p class="ux-muted ux-center">' + esc(why) + '</p>' +
          '<button class="ux-btn ux-btn-gold uxl-start' + (can ? ' can' : '') + '" data-act="l-start"' + (can ? '' : ' disabled') + '>✝️ 게임 시작</button>';
      } else {
        const r = !!me.ready;
        d = '<p class="ux-muted ux-center">' + (r ? '방장이 시작하기를 기다리는 중 <span class="ux-dots"><i></i><i></i><i></i></span>' : '준비되면 아래 버튼을 눌러 주세요') + ' · ' + readyN + '/' + others.length + ' 준비</p>' +
          '<button class="ux-btn ux-ready-btn ' + (r ? 'is-ready' : 'ux-btn-gold') + '" data-act="l-ready">' + (r ? '준비 완료' : '준비하기') + '</button>';
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
    try { await navigator.clipboard.writeText(c); K.toast('코드를 복사했어요', 'info'); } catch (e) { K.toast('코드: ' + c, 'info'); }
    K.fb('tap');
  };
  K.actions['l-share'] = async () => {
    const c = K.view && K.view.code; if (!c) return;
    const url = location.origin + location.pathname + '?code=' + encodeURIComponent(c);
    const text = (K.T().title || '빛의 원정대') + '에 초대해요! 코드 ' + c;
    if (navigator.share) { try { await navigator.share({ title: K.T().title || '빛의 원정대', text, url }); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(text + '\n' + url); K.toast('초대 링크를 복사했어요', 'info'); } catch (e) { K.toast(url, 'info'); } }
  };
  K.actions['l-ready'] = (d, btn) => { const r = !(K.view.me && K.view.me.ready); K.fb(r ? 'good' : 'tap'); if (r) K.fx.burstAt(btn, { n: 24, speed: 200 }); K.call('ready', r); };
  K.actions['l-start'] = (d, btn) => { K.fb('chime'); K.fx.burstAt(btn, { n: 50, speed: 320 }); K.call('start'); };
  K.actions['l-kick'] = async d => {
    const nm = K.pname(K.view, d.id);
    if (await K.confirm(nm + '님을 내보낼까요?', '', { ok: '내보내기', danger: true })) K.call('kick', d.id);
  };
  K.actions['l-leave'] = async () => {
    if (await K.confirm('대기실에서 나갈까요?', '나가면 코드를 다시 입력해 들어올 수 있어요.', { ok: '나가기', danger: true })) K.call('leave');
  };
  K.actions['l-max'] = d => { const s = K.view.settings || {}; const m = Math.max(5, Math.min(10, (s.maxPlayers || 10) + Number(d.d))); K.fb('tick'); K.call('settings', { maxPlayers: m }); };
  K.actions['l-toggle'] = (d, btn) => {
    const v = K.view, s = v.settings || {}, k = d.k;
    const cur = k === 'lady' || k === 'balance' ? !!s[k] : !!(s.roles || {})[k];
    btn.classList.toggle('on', !cur); K.fb('pick');
    K.local.pend = Object.assign({}, K.local.pend, { [k]: !cur });
    if (k === 'lady' || k === 'balance') K.call('settings', { [k]: !cur });
    else K.call('settings', { roles: Object.assign({}, s.roles || {}, { [k]: !cur }) });
  };
  K.actions['l-preset'] = d => {
    const g = K.G(), p = g && g.presets && g.presets[d.k]; if (!p) return;
    const n = Math.max(5, Math.min(10, K.players(K.view).length));
    const c = (p.byCount && (p.byCount[n] || p.byCount[String(n)])) || null; if (!c) return;
    K.fb('chime'); K.toast((p.label || '추천 구성') + ' 적용' + (c.note ? ' · ' + c.note : ''), 'info');
    K.call('settings', c);
  };

  const css = `
.uxl-in { animation: uxhCard .7s var(--ease-out) both; }
.uxl-hint { margin: -2px 6px 0; font-size: 13px; animation: uxhFade .6s both; }
.uxl-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: -2px 0 8px; } .uxl-presets .ux-chip { color: var(--gold-hi); }
.uxl-start.can { animation: uxlGlow 1.6s ease-in-out infinite; }
@keyframes uxlGlow { 0%,100% { box-shadow: 0 8px 28px rgba(244,201,107,.35); } 50% { box-shadow: 0 8px 44px rgba(244,201,107,.8), 0 0 0 6px rgba(244,201,107,.15); } }
`;
  const st = document.createElement('style'); st.id = 'uxl-style'; st.textContent = css; document.head.appendChild(st);
})();
