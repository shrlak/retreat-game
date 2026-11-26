/* End: winner, reason, every role revealed, restart. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  const REASON = {
    quests: '세 번의 사명을 모두 이뤘어요', assassinFailed: '정탐꾼이 선지자를 찾지 못했어요', assassinHit: '정탐꾼이 선지자를 찾아냈어요',
    rejections: '한 사명에서 다섯 번 연속 부결됐어요', fails: '사명이 세 번 방해받았어요'
  };
  K.winLine = v => {
    const T = K.T(), r = v.winReason;
    if (T.winText && T.winText[r]) return T.winText[r];
    const g = K.G(), e = g && g.phaseHints && g.phaseHints.end; const t = e && e[v.winner] && e[v.winner][r];
    return t || REASON[r] || '';
  };

  K.screens.end = {
    build(v) {
      return K.el('<section class="uxe">' +
        '<div class="ux-top"><div class="grow"><span class="ux-phase-tag">✦ 게임 끝</span></div><button class="ux-icon-btn" data-act="cm-history" aria-label="기록">📜</button>' + K.soundBtn() + '</div>' +
        '<div data-slot="hero"></div><div class="ux-panel plain" data-slot="track"></div>' +
        '<div class="ux-panel"><div class="ux-ornament" style="margin-bottom:12px">모든 역할 공개</div><div class="ux-reveal-grid" data-slot="grid"></div></div>' +
        '<div data-slot="after"></div><div class="ux-spacer"></div><div class="ux-dock" data-slot="dock"></div></section>');
    },
    update(v, K_, el) {
      const w = v.winner || 'good', me = v.me || {}, mine = me.team && me.team === w;
      K.patch(el.querySelector('[data-slot=hero]'),
        '<div class="ux-end-hero ' + w + '"><div class="uxe-crest ' + w + '"><div class="ux-rose"></div><span class="crest">' + (w === 'evil' ? '🌒' : '🕊️') + '</span></div>' +
        '<div class="ux-banner ' + w + '">' + esc(K.teamName(w)) + ' 승리!</div>' +
        '<p class="ux-p ux-center">' + esc(K.winLine(v)) + '</p>' +
        (me.team ? '<span class="ux-badge ' + (mine ? 'gold' : '') + '" style="margin-top:4px">' + (mine ? '🎉 우리 팀이 이겼어요' : '아쉽지만 다음 판에서!') + '</span>' : '') +
        K.verse(w === 'evil' ? 'evil' : 'end') + '</div>');
      K.patch(el.querySelector('[data-slot=track]'), '<div class="ux-track">' + (v.quests || []).map((q, i) => '<div class="ux-quest ' + (q.result || '') + '">' +
        (q.result ? K.tokenImg(q.result === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || '') + '</span>') + '</div>').join('') + '</div>');
      const rev = v.revealed || {};
      K.patch(el.querySelector('[data-slot=grid]'), K.players(v).map((p, i) => {
        const r = rev[p.id], t = r ? K.teamOf(r) : 'good', hit = v.assassinTargetId === p.id, ass = v.assassinId === p.id;
        return '<div class="ux-rv ' + t + (K.isMe(v, p.id) ? ' me' : '') + '" style="animation-delay:' + (300 + i * 110) + 'ms"><div class="art">' + (r ? K.roleImg(r) : K.backImg()) + (hit ? '<div class="x">🎯</div>' : '') + '</div>' +
          '<div class="pn">' + esc(p.name) + '</div><div class="rn">' + esc(r ? K.roleName(r) : '?') + (ass ? ' · 지목한 사람' : '') + (hit ? ' · 지목됨' : '') + '</div></div>';
      }).join(''));
      const g = K.G(), after = g && g.phaseHints && g.phaseHints.end && g.phaseHints.end.after;
      K.patch(el.querySelector('[data-slot=after]'), after ? '<div class="ux-stack">' + after.map(a => '<p class="ux-p ux-center">' + esc(a) + '</p>').join('') + '</div>' : '');
      const hasHome = typeof (K.api || {}).home === 'function';
      K.patch(el.querySelector('[data-slot=dock]'), (me.isHost ? '<button class="ux-btn ux-btn-gold" data-act="e-restart">🔁 같은 멤버로 다시 하기</button>' : '<p class="ux-muted ux-center">방장이 다시 시작하면 대기실로 이동해요 <span class="ux-dots"><i></i><i></i><i></i></span></p>') +
        (hasHome ? '<button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="e-home" style="align-self:center">처음 화면으로</button>' : ''));
      if (!K.local.celebrated) {
        K.local.celebrated = true;
        setTimeout(() => { K.fx.rain(w, mine ? 3.5 : 2); const c = el.querySelector('.crest'); if (c) K.fx.burstAt(c, { n: 70, speed: 380, colors: w === 'evil' ? ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,220,230,1)'] : undefined }); }, 350);
      }
    }
  };
  K.actions['e-restart'] = () => { K.fb('chime'); K.call('restart'); };
  K.actions['e-home'] = async () => { if (await K.confirm('처음 화면으로 갈까요?', '이 방에서 나가요.', { ok: '나가기' })) { await K.call('home'); window.UI.render(null); } };

  const css = `
.uxe-crest { position: relative; width: 140px; height: 140px; display: grid; place-items: center; }
.uxe-crest .ux-rose { transform: scale(.62); }
.uxe-crest .crest { position: relative; font-size: 64px; animation: bannerIn 1.2s var(--ease-spring) both, uxeBob 3s 1.2s ease-in-out infinite; }
@keyframes uxeBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.uxe-crest.good::before { content: ''; position: absolute; inset: -30px; border-radius: 50%; background: radial-gradient(circle, rgba(255,215,122,.55), transparent 62%); animation: breathe 2.6s ease-in-out infinite; }
.uxe-crest.evil::before { content: ''; position: absolute; inset: -30px; border-radius: 50%; background: radial-gradient(circle, rgba(224,72,110,.5), transparent 62%); animation: breathe 2.6s ease-in-out infinite; }
`;
  const st = document.createElement('style'); st.id = 'uxe-style'; st.textContent = css; document.head.appendChild(st);
})();
