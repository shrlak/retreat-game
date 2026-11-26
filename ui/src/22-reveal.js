/* Reveal: private role card flip + night knowledge + ack. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  K.screens.reveal = {
    build(v) {
      const me = v.me || {}, role = me.role, team = me.team || K.teamOf(role);
      const el = K.el('<section class="uxr">' +
        '<div class="ux-top"><div class="grow"><span class="ux-phase-tag">✦ 역할 확인</span></div><button class="ux-icon-btn" data-act="cm-guide" aria-label="설명서">📖</button>' + K.soundBtn() + '</div>' +
        '<p class="ux-p ux-center uxr-lead">' + esc(K.hint('reveal', 'all') || '화면을 손으로 가리고 카드를 눌러 확인하세요') + '</p>' +
        '<div class="ux-card-wrap"><div class="ux-card-glow ' + team + '"></div>' +
        '<div class="ux-card float ' + team + '" data-act="r-flip" role="button" aria-label="카드 뒤집기">' +
        '<div class="ux-card-face ux-card-back">' + K.backImg() + '<div class="uxr-backglow"></div></div>' +
        '<div class="ux-card-face ux-card-front">' + K.roleImg(role) + '<div class="frame"></div><div class="plate"><div class="rname">' + esc(K.roleName(role)) + '</div><div class="rteam" style="color:' + (team === 'evil' ? '#ff9db5' : 'var(--good)') + '">' + esc(K.teamName(team)) + '</div></div><div class="sheen"></div></div>' +
        '</div></div>' +
        '<p class="ux-tap-hint" data-slot="tap">카드를 눌러 뒤집기</p>' +
        '<div data-slot="info" class="uxr-info"></div>' +
        '<div class="ux-spacer"></div><div class="ux-dock" data-slot="dock"></div></section>');
      return el;
    },
    update(v, K_, el) {
      const me = v.me || {}, flipped = !!K.local.flipped;
      el.querySelector('.ux-card').classList.toggle('flipped', flipped);
      el.querySelector('.ux-card-wrap').classList.toggle('revealed', flipped);
      el.querySelector('[data-slot=tap]').style.visibility = flipped ? 'hidden' : '';
      const role = me.role, team = me.team || K.teamOf(role);
      if (flipped && !K.local.infoShown) {
        K.local.infoShown = true;
        const rig = (v.rolesInGame || []);
        K.patch(el.querySelector('[data-slot=info]'),
          '<div class="ux-panel uxr-in"><p class="ux-p ux-center">' + esc(K.roleDesc(role)) + '</p></div>' +
          '<div class="ux-panel uxr-in" style="animation-delay:.15s"><div class="ux-ornament" style="margin-bottom:10px">밤 사이 내게 보인 것</div>' + K.knowList(v) + K.roleTips(role) + '</div>' +
          (rig.length ? '<div class="ux-panel plain uxr-in" style="animation-delay:.3s"><h3 class="ux-h3" style="margin-bottom:8px">이번 게임의 역할</h3><div class="ux-roles-strip">' + rig.map(r => '<span class="ux-role-pill ' + K.teamOf(r) + '"><i>' + K.roleImg(r) + '</i>' + esc(K.roleName(r)) + '</span>').join('') + '</div></div>' : '') +
          '<p class="ux-muted ux-center">카드를 다시 누르면 가릴 수 있어요</p>');
      }
      if (!flipped && K.local.infoShown) { K.local.infoShown = false; K.patch(el.querySelector('[data-slot=info]'), ''); }
      const ps = K.players(v), acked = ps.filter(p => p.acked).length;
      let d;
      if (me.acked) {
        d = '<div class="ux-waiting"><p class="ux-p">다른 사람들이 확인하는 중 <span class="ux-dots"><i></i><i></i><i></i></span></p><div class="ux-progress"><i style="width:' + Math.round(100 * acked / Math.max(1, ps.length)) + '%"></i></div><p class="ux-muted">' + acked + ' / ' + ps.length + ' 확인</p></div>' +
          (me.isHost && typeof (K.api || {}).skipReveal === 'function' ? '<button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="r-skip" style="align-self:center">기다리지 않고 시작하기</button>' : '');
      } else {
        d = '<button class="ux-btn ux-btn-gold" data-act="r-ack"' + (K.local.everFlipped ? '' : ' disabled') + '>' + (K.local.everFlipped ? '확인했어요' : '먼저 카드를 확인하세요') + '</button><p class="ux-muted ux-center">' + acked + ' / ' + ps.length + ' 확인</p>';
      }
      K.patch(el.querySelector('[data-slot=dock]'), d);
    }
  };

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
  K.actions['r-skip'] = async () => { if (await K.confirm('모두 확인하지 않았어도 시작할까요?', '아직 카드를 못 본 사람은 게임 중에 "내 역할"에서 볼 수 있어요.', { ok: '시작하기' })) K.call('skipReveal'); };

  const css = `
.uxr-lead { animation: uxhFade .6s both; }
.uxr-backglow { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255,231,168,.35), transparent 60%); animation: breathe 2.4s ease-in-out infinite; pointer-events: none; }
.uxr-in { animation: uxhCard .7s var(--ease-out) both; }
.uxr-info { display: flex; flex-direction: column; gap: 12px; }
`;
  const st = document.createElement('style'); st.id = 'uxr-style'; st.textContent = css; document.head.appendChild(st);
})();
