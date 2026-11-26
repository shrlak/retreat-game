/* End: winner, reason, every role revealed, restart. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  const REASON = () => ({
    quests: K.L('세 번의 사명을 모두 이뤘어요', 'Three missions were completed'),
    assassinFailed: K.L('정탐꾼이 선지자를 찾지 못했어요', 'The Spy couldn\'t find the Prophet'),
    assassinHit: K.L('정탐꾼이 선지자를 찾아냈어요', 'The Spy found the Prophet'),
    rejections: K.L('한 사명에서 다섯 번 연속 부결됐어요', 'Five teams in a row were rejected on one mission'),
    fails: K.L('사명이 세 번 방해받았어요', 'Three missions were hindered')
  });
  /* One line on why the game ended, in the current language (THEME winText → guide end hints → fallback). */
  K.winLine = v => {
    const T = K.T(), r = v && v.winReason;
    if (!r) return '';
    if (T.winText && T.winText[r]) return T.winText[r];
    const g = K.G(), e = g && g.phaseHints && g.phaseHints.end; const t = e && e[v.winner] && e[v.winner][r];
    return t || REASON()[r] || '';
  };
  const short = t => { const tm = K.T().teams && K.T().teams[t]; return (tm && tm.short) || K.teamName(t); };
  const teamWord = t => (K.isEn() ? K.teamName(t).replace(/^The /, '') : K.teamName(t));   // for "…with the {team}"
  /* Each player's start side (from the role) and final side (view.finalTeams, which moves for a switched Lancelot). */
  const sides = (v, id) => {
    const r = (v.revealed || {})[id], start = r ? K.teamOf(r) : null;
    const fin = (v.finalTeams && v.finalTeams[id]) || start || 'good';
    return { role: r, start: start || fin, fin, lan: r === 'lancelotGood' || r === 'lancelotEvil' };
  };

  K.screens.end = {
    build(v) {
      return K.el('<section class="uxe">' +
        '<div class="ux-top"><div class="grow"><span class="ux-phase-tag">✦ ' + esc(K.L('게임 끝', 'Game over')) + '</span></div>' +
        '<button class="ux-icon-btn" data-act="cm-seats" aria-label="' + esc(K.L('함께하는 사람', 'Players')) + '">👥</button>' +
        '<button class="ux-icon-btn" data-act="cm-history" aria-label="' + esc(K.L('기록', 'History')) + '">📜</button>' + K.soundBtn() + '</div>' +
        '<div data-slot="seat"></div>' +
        '<div data-slot="hero"></div><div class="ux-panel plain" data-slot="track"></div>' +
        '<div class="ux-panel"><div class="ux-ornament" style="margin-bottom:12px">' + esc(K.L('모든 역할 공개', 'All roles revealed')) + '</div><div class="ux-reveal-grid" data-slot="grid"></div></div>' +
        '<div data-slot="after"></div><div class="ux-spacer"></div><div class="ux-dock" data-slot="dock"></div></section>');
    },
    update(v, K_, el) {
      const w = v.winner || 'good', me = v.me || {};
      const myFin = (v.finalTeams && me.id && v.finalTeams[me.id]) || me.team, mine = myFin && myFin === w;
      K.patch(el.querySelector('[data-slot=seat]'), K.seatNotice ? K.seatNotice(v) : '');
      K.patch(el.querySelector('[data-slot=hero]'),
        '<div class="ux-end-hero ' + w + '"><div class="uxe-crest ' + w + '"><div class="ux-rose"></div><span class="crest">' + (w === 'evil' ? '🌒' : '🕊️') + '</span></div>' +
        '<div class="ux-banner ' + w + '">' + esc(K.L(K.teamName(w) + ' 승리!', K.teamName(w) + ' win!')) + '</div>' +
        '<p class="ux-p ux-center">' + esc(K.winLine(v)) + '</p>' +
        (myFin ? '<span class="ux-badge ' + (mine ? 'gold' : '') + '" style="margin-top:4px">' + esc(mine ? K.L('🎉 우리 팀이 이겼어요', '🎉 Your side won!') : K.L('아쉽지만 다음 판에서!', 'So close. Next time!')) + '</span>' : '') +
        K.verse(w === 'evil' ? 'evil' : 'end') + '</div>');
      K.patch(el.querySelector('[data-slot=track]'), '<div class="ux-track">' + (v.quests || []).map((q, i) => '<div class="ux-quest ' + (q.result || '') + '">' +
        (q.result ? K.tokenImg(q.result === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || '') + '</span>') + '</div>').join('') + '</div>');
      K.patch(el.querySelector('[data-slot=grid]'), K.players(v).map((p, i) => {
        const sd = sides(v, p.id), r = sd.role, aRes = /^assassin/.test(v.winReason || ''), hit = aRes && v.assassinTargetId === p.id, ass = aRes && v.assassinId === p.id;
        const moved = sd.lan && sd.start !== sd.fin;
        return '<div class="ux-rv ' + sd.fin + (K.isMe(v, p.id) ? ' me' : '') + '" style="animation-delay:' + (300 + i * 110) + 'ms"><div class="art">' + (r ? K.roleImg(r) : K.backImg()) + (hit ? '<div class="x">🎯</div>' : '') + '</div>' +
          '<div class="pn">' + esc(p.name) + '</div><div class="rn">' + (r ? K.roleNameStack(r) : '?') + esc(ass ? K.L(' · 지목한 사람', ' · made the call') : '') + esc(hit ? K.L(' · 지목됨', ' · was named') : '') + '</div>' +
          (sd.lan ? '<div class="uxe-sw ' + (moved ? 'moved ' : '') + sd.fin + '" title="' + esc(moved ? K.L(K.teamName(sd.start) + ' → ' + K.teamName(sd.fin), K.teamName(sd.start) + ' → ' + K.teamName(sd.fin)) : K.teamName(sd.fin)) + '">🧭 ' +
            (moved ? '<s>' + esc(short(sd.start)) + '</s> → <b>' + esc(short(sd.fin)) + '</b>' : '<b>' + esc(short(sd.fin)) + '</b>') + '</div>' : '') + '</div>';
      }).join(''));
      const g = K.G(), eh = g && g.phaseHints && g.phaseHints.end, after = (eh && eh.after) || [];
      const sw = K.players(v).map(p => ({ p, sd: sides(v, p.id) })).filter(x => x.sd.lan && x.sd.start !== x.sd.fin).map(x =>
        eh && eh.switchedNote ? K.fmt(eh.switchedNote, { name: x.p.name, team: teamWord(x.sd.fin) })
          : K.L(x.p.name + '님은 갈림길에서 편이 바뀌어 ' + K.teamName(x.sd.fin) + ' 편으로 끝났어요.', x.p.name + ' switched sides at the crossroads and finished with ' + K.teamName(x.sd.fin) + '.'));
      const lines = sw.concat(after);
      K.patch(el.querySelector('[data-slot=after]'), lines.length ? '<div class="ux-stack">' + lines.map(a => '<p class="ux-p ux-center">' + esc(a) + '</p>').join('') + '</div>' : '');
      const hasHome = typeof (K.api || {}).home === 'function';
      K.patch(el.querySelector('[data-slot=dock]'), (me.isHost ? '<button class="ux-btn ux-btn-gold" data-act="e-restart">🔁 ' + esc(K.L('같은 멤버로 다시 하기', 'Play again with the same group')) + '</button>' : '<p class="ux-muted ux-center">' + esc(K.L('방장이 다시 시작하면 대기실로 이동해요', 'When the host starts again, everyone moves to the lobby')) + ' <span class="ux-dots"><i></i><i></i><i></i></span></p>') +
        (hasHome ? '<button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="e-home" style="align-self:center">' + esc(K.L('처음 화면으로', 'Back to home')) + '</button>' : ''));
      if (!K.local.celebrated) {
        K.local.celebrated = true;
        setTimeout(() => { K.fx.rain(w, mine ? 3.5 : 2); const c = el.querySelector('.crest'); if (c) K.fx.burstAt(c, { n: 70, speed: 380, colors: w === 'evil' ? ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,220,230,1)'] : undefined }); }, 350);
      }
    }
  };
  K.actions['e-restart'] = () => { K.fb('chime'); K.call('restart'); };
  K.actions['e-home'] = async () => { if (await K.confirm(K.L('처음 화면으로 갈까요?', 'Go back to the home screen?'), esc(K.L('이 방에서 나가요.', 'You\'ll leave this room.')), { ok: K.L('나가기', 'Leave'), cancel: K.L('취소', 'Cancel') })) { await K.call('home'); window.UI.render(null); } };

  const css = `
.uxe > .ux-dock { position: relative; }   /* in the flow under the roles (only the lobby dock sticks) */
.uxe-crest { position: relative; width: 140px; height: 140px; display: grid; place-items: center; }
.uxe-crest .ux-rose { transform: scale(.62); }
.uxe-crest .crest { position: relative; font-size: 64px; animation: bannerIn 1.2s var(--ease-spring) both, uxeBob 3s 1.2s ease-in-out infinite; }
.uxe-sw { font-size: 11.5px; color: var(--text-mute); text-align: center; line-height: 1.3; } .uxe-sw b { color: var(--text-dim); } .uxe-sw.good b { color: var(--gold-hi); } .uxe-sw.evil b { color: #ff9db5; } .uxe-sw s { opacity: .7; }
@keyframes uxeBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.uxe-crest.good::before { content: ''; position: absolute; inset: -30px; border-radius: 50%; background: radial-gradient(circle, rgba(255,215,122,.55), transparent 62%); animation: breathe 2.6s ease-in-out infinite; }
.uxe-crest.evil::before { content: ''; position: absolute; inset: -30px; border-radius: 50%; background: radial-gradient(circle, rgba(224,72,110,.5), transparent 62%); animation: breathe 2.6s ease-in-out infinite; }
`;
  const st = document.createElement('style'); st.id = 'uxe-style'; st.textContent = css; document.head.appendChild(st);
})();
