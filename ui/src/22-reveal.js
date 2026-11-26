/* Reveal: private role card flip + night knowledge + ack. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;
  const ui = (k, ko, en) => { const g = K.G(), u = g && g.ui; return (u && u[k]) || K.L(ko, en); };

  K.screens.reveal = {
    build(v) {
      const me = v.me || {}, role = me.role, team = me.team || K.teamOf(role);
      const el = K.el('<section class="uxr">' +
        '<div class="ux-top"><div class="grow"><span class="ux-phase-tag">✦ ' + esc(K.L('역할 확인', 'Your role')) + '</span></div><button class="ux-icon-btn" data-act="cm-seats" aria-label="' + esc(K.L('함께하는 사람', 'Players')) + '">👥</button><button class="ux-icon-btn" data-act="cm-guide" aria-label="' + esc(ui('helpButton', '설명서', 'Guide')) + '">📖</button>' + K.soundBtn() + '</div>' +
        '<div data-slot="seat"></div>' +
        '<p class="ux-p ux-center uxr-lead">' + esc(K.hint('reveal', 'all') || K.L('화면을 손으로 가리고 카드를 눌러 확인하세요', 'Cover the screen with your hand and tap the card')) + '</p>' +
        '<div class="ux-card-wrap"><div class="ux-card-glow ' + team + '"></div>' +
        '<div class="ux-card float ' + team + '" data-act="r-flip" role="button" aria-label="' + esc(K.L('카드 뒤집기', 'Flip the card')) + '">' +
        '<div class="ux-card-face ux-card-back">' + K.backImg() + '<div class="uxr-backglow"></div></div>' +
        '<div class="ux-card-face ux-card-front">' + K.roleImg(role) + '<div class="frame"></div><div class="plate"><div class="rname">' + K.roleNameStack(role) + '</div><div class="rteam" style="color:' + (team === 'evil' ? '#ff9db5' : 'var(--good)') + '">' + esc(K.teamName(team)) + '</div></div><div class="sheen"></div></div>' +
        '</div></div>' +
        '<p class="ux-tap-hint" data-slot="tap">' + esc(K.L('카드를 눌러 뒤집기', 'Tap the card to flip it')) + '</p>' +
        '<div data-slot="info" class="uxr-info"></div>' +
        '<div class="ux-spacer"></div><div class="ux-dock" data-slot="dock"></div></section>');
      return el;
    },
    update(v, K_, el) {
      const me = v.me || {}, flipped = !!K.local.flipped;
      K.patch(el.querySelector('[data-slot=seat]'), K.seatNotice ? K.seatNotice(v) : '');
      el.querySelector('.ux-card').classList.toggle('flipped', flipped);
      el.querySelector('.ux-card-wrap').classList.toggle('revealed', flipped);
      el.querySelector('[data-slot=tap]').style.visibility = flipped ? 'hidden' : '';
      const role = me.role, team = me.team || K.teamOf(role);
      if (flipped && !K.local.infoShown) {
        K.local.infoShown = true;
        const rig = (v.rolesInGame || []);
        K.patch(el.querySelector('[data-slot=info]'),
          '<div class="ux-panel uxr-in"><p class="ux-p ux-center">' + esc(K.roleDesc(role)) + '</p></div>' +
          (K.lancelotNote && K.lancelotNote(v) ? '<div class="ux-panel uxr-in" style="animation-delay:.08s">' + K.lancelotNote(v) + '</div>' : '') +
          '<div class="ux-panel uxr-in" style="animation-delay:.15s"><div class="ux-ornament" style="margin-bottom:10px">' + esc(K.L('밤 사이 내게 보인 것', 'What I saw in the night')) + '</div>' + K.knowList(v) + K.roleTips(role) + '</div>' +
          (rig.length ? '<div class="ux-panel plain uxr-in" style="animation-delay:.3s"><h3 class="ux-h3" style="margin-bottom:8px">' + esc(K.L('이번 게임의 역할', 'Roles in this game')) + '</h3><div class="ux-roles-strip">' + rig.map(K.rolePill).join('') + '</div>' + extras(v) + '</div>' : '') +
          '<p class="ux-muted ux-center">' + esc(K.L('카드를 다시 누르면 가릴 수 있어요', 'Tap the card again to hide it')) + '</p>');
      }
      if (!flipped && K.local.infoShown) { K.local.infoShown = false; K.patch(el.querySelector('[data-slot=info]'), ''); }
      const ps = K.players(v), acked = ps.filter(p => p.acked).length;
      let d;
      if (me.acked) {
        d = '<div class="ux-waiting"><p class="ux-p">' + esc(K.L('다른 사람들이 확인하는 중', 'Others are checking their cards')) + ' <span class="ux-dots"><i></i><i></i><i></i></span></p><div class="ux-progress"><i style="width:' + Math.round(100 * acked / Math.max(1, ps.length)) + '%"></i></div><p class="ux-muted">' + acked + ' / ' + ps.length + ' ' + esc(K.L('확인', 'checked')) + '</p></div>' +
          (me.isHost && typeof (K.api || {}).skipReveal === 'function' ? '<button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="r-skip" style="align-self:center">' + esc(K.L('기다리지 않고 시작하기', 'Start without waiting')) + '</button>' : '');
      } else {
        d = '<button class="ux-btn ux-btn-gold" data-act="r-ack"' + (K.local.everFlipped ? '' : ' disabled') + '>' + esc(K.local.everFlipped ? K.L('확인했어요', 'I\'ve seen it') : K.L('먼저 카드를 확인하세요', 'Check your card first')) + '</button><p class="ux-muted ux-center">' + acked + ' / ' + ps.length + ' ' + esc(K.L('확인', 'checked')) + '</p>';
      }
      K.patch(el.querySelector('[data-slot=dock]'), d);
    }
  };

  /* Which extra rules are on in this game (public). */
  function extras(v) {
    const s = v.settings || {}, a = [];
    if (s.lady) a.push(K.term('lady', K.L('등불', 'Lamp')));
    if (v.excalibur || s.excalibur) a.push(K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word')));
    if (v.lancelot || s.lancelot) a.push(K.term('loyalty', K.L('갈림길 카드', 'Crossroads card')) + ' (' + String(K.term('lancelotVariant' + ((v.lancelot || s.lancelot) === 2 ? 2 : 1), '')).split(' (')[0] + ')');
    return a.length ? '<p class="ux-muted" style="margin-top:8px">' + esc(K.L('함께 쓰는 규칙: ', 'Also in this game: ') + a.join(' · ')) + '</p>' : '';
  }
  K.actions['r-flip'] = (d, card) => {
    const v = K.view; if (!v || !v.me) return;
    K.local.flipped = !K.local.flipped;
    if (K.local.flipped) {
      const team = v.me.team || K.teamOf(v.me.role);
      const first = !K.local.everFlipped; K.local.everFlipped = true;
      K.fb('flip');
      setTimeout(() => {
        if (!K.local.flipped) return;
        K.fb(team === 'evil' ? 'evil' : 'good');
        if (first) { K.flash(team); K.fx.burstAt(card, { n: 60, speed: 340, colors: team === 'evil' ? ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,220,230,1)'] : undefined }); }
      }, 480);
    } else K.fb('tap');
    K.rerender();
  };
  K.actions['r-ack'] = (d, btn) => {
    K.local.flipped = false; K.fb('chime'); K.fx.burstAt(btn, { n: 26, speed: 200 });
    K.rerender(); K.call('ack');
  };
  K.actions['r-skip'] = async () => { if (await K.confirm(K.L('모두 확인하지 않았어도 시작할까요?', 'Start before everyone has checked?'), esc(K.L('아직 카드를 못 본 사람은 게임 중에 "내 역할"에서 볼 수 있어요.', 'Anyone who hasn\'t seen their card yet can open "My role" during the game.')), { ok: K.L('시작하기', 'Start'), cancel: K.L('취소', 'Cancel') })) K.call('skipReveal'); };

  const css = `
.uxr-lead { animation: uxhFade .6s both; }
.uxr-backglow { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255,231,168,.35), transparent 60%); animation: breathe 2.4s ease-in-out infinite; pointer-events: none; }
.uxr-in { animation: uxhCard .7s var(--ease-out) both; }
.uxr-info { display: flex; flex-direction: column; gap: 12px; }
`;
  const st = document.createElement('style'); st.id = 'uxr-style'; st.textContent = css; document.head.appendChild(st);
})();
