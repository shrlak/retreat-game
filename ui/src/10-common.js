/* Shared sheets: my role, vote history, guide (quick guide / full rules / tutorial). */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  // ---------- emblem (candle inside a stained-glass rose window) ----------
  K.emblem = (size) => '<div class="ux-emblem" style="width:' + (size || 148) + 'px;height:' + (size || 148) + 'px"><div class="ux-rose"></div>' +
    '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="uxe-g" cx="50%" cy="42%" r="50%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffd77a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="uxe-c" x1="0" x2="1"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9c8a4"/></linearGradient></defs>' +
    '<circle cx="60" cy="44" r="44" fill="url(#uxe-g)"/>' +
    '<g class="ux-flame"><path d="M60 18 C68 30 72 37 72 45 C72 53 66 58 60 58 C54 58 48 53 48 45 C48 37 52 30 60 18Z" fill="#ffcf6b"/><path d="M60 30 C64 37 66 41 66 46 C66 51 63 54 60 54 C57 54 54 51 54 46 C54 41 56 37 60 30Z" fill="#fff7dc"/></g>' +
    '<rect x="51" y="58" width="18" height="40" rx="3" fill="url(#uxe-c)"/><path d="M51 64 q9 4 18 0" stroke="#cdb98f" stroke-width="1.5" fill="none"/>' +
    '<rect x="40" y="97" width="40" height="7" rx="3.5" fill="#c98d2e"/><rect x="46" y="104" width="28" height="4" rx="2" fill="#8a5a18"/></svg></div>';

  // ---------- verses (short, for flavour) ----------
  K.VERSES = {
    home: ['너희는 세상의 빛이라', '마태복음 5:14'],
    lobby: ['두세 사람이 내 이름으로 모인 곳에는', '마태복음 18:20'],
    reveal: ['빛이 어둠에 비치되', '요한복음 1:5'],
    good: ['빛이 있으라', '창세기 1:3'],
    evil: ['깨어 있으라', '마태복음 26:41'],
    end: ['선한 싸움을 싸우고', '디모데후서 4:7']
  };
  K.verse = key => { const v = K.VERSES[key]; return v ? '<p class="ux-verse">“' + esc(v[0]) + '”<cite>' + esc(v[1]) + '</cite></p>' : ''; };

  // ---------- my role sheet ----------
  K.knowList = v => {
    const me = v.me || {}, list = me.knowledge || [];
    const g = K.G(), kl = (g && g.knowledgeLabels) || {};
    if (!list.length) {
      const empty = me.role === 'oberon' ? (kl.emptyOberon || '보이는 동료가 없어요.') : (kl.emptyGood || '보이는 사람이 없어요. 대화와 투표로 추리해 보세요.');
      return '<p class="ux-p ux-center" style="padding:6px 0">' + esc(empty) + '</p>';
    }
    return '<div class="ux-know-list">' + list.map((k, i) => {
      const p = K.player(v, k.id) || { id: k.id, name: '?' };
      return '<div class="ux-know ' + esc(k.tag) + '" style="animation-delay:' + (i * 90) + 'ms">' + K.avatar(p) +
        '<span class="nm">' + esc(p.name) + '</span><span class="tag">' + esc(K.knowText(k.tag)) + '</span></div>';
    }).join('') + '</div>';
  };
  K.ladyList = v => {
    const r = (v.me && v.me.ladyResults) || []; if (!r.length) return '';
    return '<h3 class="ux-h3" style="margin:14px 0 8px">' + esc(K.term('lady', '등불')) + '으로 알게 된 것</h3><div class="ux-know-list">' + r.map(x => {
      const p = K.player(v, x.targetId) || { name: '?' };
      return '<div class="ux-know ' + (x.team === 'evil' ? 'evil' : '') + '">' + K.avatar(p) + '<span class="nm">' + esc(p.name) + '</span><span class="tag">' + esc(K.teamName(x.team)) + '</span></div>';
    }).join('') + '</div>';
  };
  K.roleTips = role => {
    const g = K.G(), r = g && g.roles && g.roles[role]; if (!r) return '';
    const li = a => (a || []).map(x => '<li>' + esc(x) + '</li>').join('');
    return '<details class="uxc-tips"><summary>' + esc((g.ui && g.ui.myRoleTipsButton) || '내 역할 팁') + '</summary>' +
      (r.tagline ? '<p class="ux-verse" style="margin:8px 0">' + esc(r.tagline) + '</p>' : '') +
      (r.goal ? '<b>목표</b><ul>' + li(r.goal) + '</ul>' : '') + (r.tips ? '<b>팁</b><ul>' + li(r.tips) + '</ul>' : '') +
      (r.seenBy ? '<p class="ux-muted">' + esc(r.seenBy) + '</p>' : '') + '</details>';
  };
  K.openRoleSheet = () => {
    const v = K.view; if (!v || !v.me || !v.me.role) return;
    const me = v.me, team = me.team || K.teamOf(me.role);
    K.fb('flip');
    K.sheet('<div class="uxc-role">' +
      '<div class="uxc-mini ' + team + '">' + K.roleImg(me.role) + '<div class="plate"><div class="rname">' + esc(K.roleName(me.role)) + '</div><div class="rteam">' + esc(K.teamName(team)) + '</div></div></div>' +
      '<p class="ux-p ux-center" style="margin:12px 4px">' + esc(K.roleDesc(me.role)) + '</p>' +
      '<div class="ux-ornament">내 눈에 보이는 사람</div><div style="margin-top:10px">' + K.knowList(v) + '</div>' + K.ladyList(v) +
      K.roleTips(me.role) +
      '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:14px">닫기</button></div>');
  };

  // ---------- history sheet ----------
  K.openHistory = () => {
    const v = K.view; if (!v) return;
    const hist = (v.voteHistory || []).slice().reverse();
    const qs = (v.quests || []).map((q, i) => q.result ? '<span class="ux-badge ' + (q.result === 'success' ? 'gold' : 'evil') + '">' + esc(K.term('quest', '사명')) + ' ' + (i + 1) + ' ' + (q.result === 'success' ? esc(K.term('success', '축복')) : esc(K.term('fail', '방해')) + (q.fails != null ? ' ' + q.fails + '장' : '')) + '</span>' : '').join(' ');
    const items = hist.map(h => {
      const team = h.team || [];
      const votes = K.players(v).map(p => {
        const y = h.votes ? h.votes[p.id] : null; if (y == null) return '';
        return '<span class="' + (y ? 'y' : 'n') + (team.indexOf(p.id) >= 0 ? ' t' : '') + '">' + esc(p.name) + ' ' + (y ? '○' : '✕') + '</span>';
      }).join('');
      return '<div class="ux-hist-item"><div class="hd"><span><b>' + esc(K.term('quest', '사명')) + ' ' + ((h.round || 0) + 1) + '</b> · ' + (h.proposalNo || 1) + '번째 · ' + esc(K.term('leader', '조장')) + ' ' + esc(K.pname(v, h.leaderId)) + '</span>' +
        '<span class="ux-badge ' + (h.approved ? 'ok' : 'evil') + '">' + (h.approved ? '통과' : '부결') + '</span></div>' +
        '<div class="ux-muted" style="margin-bottom:6px">' + esc(K.term('questTeam', '원정대')) + ': ' + team.map(id => esc(K.pname(v, id))).join(', ') + '</div><div class="votes">' + votes + '</div></div>';
    }).join('');
    K.sheet('<h2 class="ux-h2 ux-center" style="margin-bottom:6px">기록</h2>' + (qs ? '<div class="ux-center" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + qs + '</div>' : '') +
      '<div class="ux-hist">' + (items || '<p class="ux-p ux-center">아직 투표 기록이 없어요.</p>') + '</div>' +
      '<p class="ux-muted ux-center" style="margin-top:10px">테두리가 있는 이름은 그 제안의 ' + esc(K.term('questTeam', '원정대')) + '예요.</p>' +
      '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:12px">닫기</button>');
  };

  // ---------- guide (quick pages, full rules, tutorial) ----------
  function fallbackPages() {
    const t = K.term;
    return [
      { heading: '어떤 게임인가요?', lines: ['우리 중에 몰래 숨어 있는 ' + K.teamName('evil') + '가 있어요.', K.teamName('good') + '은 ' + t('quest', '사명') + ' 5번 중 3번을 성공하면 이기고, ' + K.teamName('evil') + '는 3번을 방해하면 이겨요.', '대화와 투표로 누가 누군지 알아맞혀요. 5~10명이 함께해요.'] },
      { heading: '한 라운드는 이렇게', steps: [t('leader', '조장') + '이 ' + t('quest', '사명') + ' 팀을 골라요.', '모두 동시에 ' + t('approve', '찬성') + ' 또는 ' + t('reject', '반대') + ' 투표해요. 절반보다 많아야 통과예요.', '통과하면 팀원만 몰래 ' + t('success', '축복') + ' 또는 ' + t('fail', '방해') + ' 카드를 내요.', t('fail', '방해') + '가 한 장이라도 있으면 실패예요.', '한 ' + t('quest', '사명') + '에서 5번 연속 부결되면 ' + K.teamName('evil') + '가 이겨요.'] },
      { heading: '역할', roles: K.OPTIONAL_ROLES.concat(['servant', 'minion']).map(k => ({ key: k, line: K.roleDesc(k) })) }
    ];
  }
  const guidePages = () => { const g = K.G(); return (g && g.quick && g.quick.pages) || fallbackPages(); };
  function pageHtml(p) {
    let h = '<h2 class="ux-h2 ux-center" style="margin:4px 0 12px">' + esc(p.heading || p.title || '') + '</h2>';
    if (p.lines) h += p.lines.map(l => '<p class="ux-p" style="margin:0 0 10px">' + esc(l) + '</p>').join('');
    if (p.body) h += (Array.isArray(p.body) ? p.body : String(p.body).split('\n')).map(l => '<p class="ux-p" style="margin:0 0 10px">' + esc(l) + '</p>').join('');
    if (p.steps) h += '<ol class="uxc-steps">' + p.steps.map(s => '<li>' + (typeof s === 'string' ? esc(s) : '<b>' + esc(s.title) + '</b> ' + esc(s.text)) + '</li>').join('') + '</ol>';
    if (p.bullets) h += '<ul class="uxc-steps">' + p.bullets.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
    if (p.roles) h += '<div class="uxc-roles">' + p.roles.map(r => '<div class="uxc-r ' + K.teamOf(r.key) + '"><i>' + K.roleImg(r.key) + '</i><div><b>' + esc(K.roleName(r.key)) + '</b><span>' + esc(r.line) + '</span></div></div>').join('') + '</div>';
    if (p.text) h += '<p class="ux-p">' + esc(p.text) + '</p>';
    if (p.after) h += '<p class="ux-p">' + esc(p.after) + '</p>';
    return h;
  }
  function pager(title, pages, extraBtns) {
    let i = 0;
    const sh = K.sheet('<div class="uxc-guide"><div class="ux-ornament">' + esc(title) + '</div><div class="uxc-page"></div>' +
      '<div class="uxc-dots"></div><div class="ux-row" style="margin-top:12px"><button class="ux-btn ux-btn-ghost" data-g="prev">이전</button><button class="ux-btn ux-btn-gold" data-g="next">다음</button></div>' + (extraBtns || '') + '</div>');
    const pg = sh.querySelector('.uxc-page'), dots = sh.querySelector('.uxc-dots');
    const show = (dir) => {
      pg.innerHTML = pageHtml(pages[i]); pg.classList.remove('in-l', 'in-r'); void pg.offsetWidth; pg.classList.add(dir < 0 ? 'in-l' : 'in-r');
      dots.innerHTML = pages.map((_, j) => '<i class="' + (j === i ? 'on' : '') + '"></i>').join('');
      sh.querySelector('[data-g=prev]').disabled = i === 0;
      sh.querySelector('[data-g=next]').textContent = i === pages.length - 1 ? '알겠어요' : '다음';
    };
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      if (b.dataset.g === 'prev' && i > 0) { i--; show(-1); K.fb('tap'); }
      else if (b.dataset.g === 'next') { if (i < pages.length - 1) { i++; show(1); K.fb('tap'); } else sh.close(); }
      else if (b.dataset.g === 'rules') { sh.close(); setTimeout(K.openRules, 320); }
      else if (b.dataset.g === 'tutorial') { sh.close(); setTimeout(K.openTutorial, 320); }
    });
    let x0 = null; pg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    pg.addEventListener('touchend', e => { if (x0 == null) return; const d = e.changedTouches[0].clientX - x0; x0 = null; if (d < -50 && i < pages.length - 1) { i++; show(1); } else if (d > 50 && i > 0) { i--; show(-1); } });
    show(1); return sh;
  }
  K.openGuide = () => {
    const g = K.G();
    pager((g && g.quick && g.quick.title) || '1분 설명서', guidePages(),
      '<div class="ux-row" style="margin-top:8px"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-g="tutorial">' + esc((g && g.ui && g.ui.tutorialButton) || '처음이에요') + '</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-g="rules">' + esc((g && g.ui && g.ui.fullRulesButton) || '전체 규칙') + '</button></div>');
  };
  K.openRules = () => {
    const g = K.G(), o = g && g.overview;
    if (!o) return K.openGuide();
    let h = '<h2 class="ux-h2 ux-center">' + esc(o.title || '전체 규칙') + '</h2>' + (o.intro ? '<p class="ux-p ux-center" style="margin:6px 0 12px">' + esc(o.intro) + '</p>' : '');
    (o.sections || []).forEach(s => { h += '<div class="ux-ornament" style="margin:16px 0 8px">' + esc(s.heading) + '</div>' + pageHtml(Object.assign({}, s, { heading: '' })).replace(/^<h2[^>]*><\/h2>/, ''); });
    const t = o.table; if (t) h += '<div class="ux-ornament" style="margin:16px 0 8px">' + esc(t.heading) + '</div><div class="uxc-table"><table><tr>' + t.columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr>' + t.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table></div>' + (t.note ? '<p class="ux-muted">' + esc(t.note) + '</p>' : '');
    K.sheet(h + '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:14px">닫기</button>');
  };
  K.openTutorial = () => {
    const g = K.G(), t = g && g.tutorial;
    if (!t || !t.steps) return K.openGuide();
    pager(t.title || '처음 해 보기', t.steps.map(s => ({ heading: s.title, text: s.text })));
  };
  K.actions['cm-guide'] = () => { K.fb('tap'); K.openGuide(); };
  K.actions['cm-rules'] = () => { K.fb('tap'); K.openRules(); };
  K.actions['cm-history'] = () => { K.fb('tap'); K.openHistory(); };
  K.actions['cm-role'] = () => K.openRoleSheet();

  // ---------- styles for this part ----------
  const css = `
.uxc-mini { position: relative; width: 150px; aspect-ratio: 600/840; margin: 4px auto 0; border-radius: 14px; overflow: hidden; background: var(--bg2); }
.uxc-mini img { width: 100%; height: 100%; object-fit: cover; display: block; }
.uxc-mini.good { box-shadow: 0 0 0 1.5px var(--good), 0 0 30px var(--good-glow); }
.uxc-mini.evil { box-shadow: 0 0 0 1.5px var(--evil), 0 0 30px var(--evil-glow); }
.uxc-mini .plate { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 6px 8px; text-align: center; background: linear-gradient(180deg, transparent, rgba(7,10,28,.92) 50%); }
.uxc-mini .rname { font-family: var(--font-display); font-weight: 700; font-size: 17px; color: var(--gold-hi); }
.uxc-mini .rteam { font-size: 11px; color: var(--text-dim); }
.uxc-tips { margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--line); font-size: 13px; color: var(--text-dim); line-height: 1.55; }
.uxc-tips summary { color: var(--gold-hi); font-weight: 700; cursor: pointer; }
.uxc-tips ul { margin: 4px 0 8px; padding-left: 18px; }
.uxc-guide .uxc-page { min-height: 260px; }
.uxc-page.in-r { animation: uxcInR .35s var(--ease-out) both; } .uxc-page.in-l { animation: uxcInL .35s var(--ease-out) both; }
@keyframes uxcInR { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes uxcInL { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
.uxc-steps { margin: 0; padding-left: 20px; color: var(--text-dim); font-size: 14px; line-height: 1.6; } .uxc-steps li { margin-bottom: 8px; } .uxc-steps b { color: var(--text); }
.uxc-roles { display: flex; flex-direction: column; gap: 8px; }
.uxc-r { display: flex; gap: 10px; align-items: center; padding: 8px; border-radius: 12px; background: rgba(255,255,255,.04); }
.uxc-r i { width: 40px; height: 54px; border-radius: 8px; overflow: hidden; flex: none; background: var(--bg2); } .uxc-r i img { width: 100%; height: 100%; object-fit: cover; }
.uxc-r.good i { box-shadow: 0 0 0 1.5px var(--good); } .uxc-r.evil i { box-shadow: 0 0 0 1.5px var(--evil); }
.uxc-r b { display: block; font-size: 14px; } .uxc-r span { font-size: 12px; color: var(--text-dim); line-height: 1.45; }
.uxc-dots { display: flex; justify-content: center; gap: 6px; margin-top: 10px; } .uxc-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.2); transition: all .3s; } .uxc-dots i.on { width: 18px; border-radius: 3px; background: var(--gold); }
.uxc-table { overflow-x: auto; } .uxc-table table { width: 100%; border-collapse: collapse; font-size: 12px; } .uxc-table th, .uxc-table td { padding: 6px 4px; text-align: center; border-bottom: 1px solid var(--line); } .uxc-table th { color: var(--gold-hi); }
`;
  const st = document.createElement('style'); st.id = 'uxc-style'; st.textContent = css; document.head.appendChild(st);
})();
