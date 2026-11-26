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

  // ---------- verses (short, for flavour). Korean unchanged; English: World English Bible (public domain). ----------
  const VERSES_KO = {
    home: ['너희는 세상의 빛이라', '마태복음 5:14'],
    lobby: ['두세 사람이 내 이름으로 모인 곳에는', '마태복음 18:20'],
    reveal: ['빛이 어둠에 비치되', '요한복음 1:5'],
    good: ['빛이 있으라', '창세기 1:3'],
    evil: ['깨어 있으라', '마태복음 26:41'],
    end: ['선한 싸움을 싸우고', '디모데후서 4:7']
  };
  const VERSES_EN = {
    home: ['You are the light of the world.', 'Matthew 5:14'],
    lobby: ['Where two or three are gathered together in my name, there I am in the middle of them.', 'Matthew 18:20'],
    reveal: ['The light shines in the darkness.', 'John 1:5'],
    good: ['Let there be light.', 'Genesis 1:3'],
    evil: ['Watch and pray.', 'Matthew 26:41'],
    end: ['I have fought the good fight.', '2 Timothy 4:7']
  };
  // K.VERSES follows the current language at read time (Korean object unchanged in Korean mode).
  try { Object.defineProperty(K, 'VERSES', { configurable: true, enumerable: true, get: () => (K.isEn && K.isEn() ? VERSES_EN : VERSES_KO) }); } catch (e) { K.VERSES = VERSES_KO; }
  K.VERSES_KO = VERSES_KO; K.VERSES_EN = VERSES_EN;
  K.verse = key => {
    const en = K.isEn && K.isEn(), v = (en ? VERSES_EN : VERSES_KO)[key];
    if (!v) return '';
    return '<p class="ux-verse">“' + esc(v[0]) + '”<cite>' + esc(v[1]) + '</cite></p>';
  };

  const ui = (k, ko, en) => { const g = K.G(), u = g && g.ui; return (u && u[k]) || K.L(ko, en); };
  /* G.system texts (offline / rejoin / host away) with a K.L fallback. */
  const sys = (k, p, ko, en) => { const g = K.G(), t = g && g.system && g.system[k]; return t ? K.fmt(t, p || {}) : K.L(ko, en); };
  /* Guide items marked module:"lancelot"|"excalibur"|"balance" are shown only when that module is on (outside a room: always). */
  const modOn = m => { const v = K.view, s = v && v.settings; if (!m || !v || !s) return true; return m === 'lancelot' ? !!(v.lancelot || s.lancelot) : m === 'excalibur' ? !!(v.excalibur || s.excalibur) : m === 'balance' ? !!s.balance : true; };
  K.guideModOn = modOn;
  /* Role name for tight spots: baseName large, subtitle small underneath (only when non-empty). Falls back to K.roleName. */
  const HAN = /[\uac00-\ud7a3]/;
  K.roleBase = key => { const r = K.role(key), b = r.baseName; return b && !(K.isEn() && HAN.test(b)) ? b : K.roleName(key); };
  K.roleSub = key => {
    const s = K.role(key).subtitle; if (!s || (K.isEn() && HAN.test(s))) return '';
    return K.roleBase(key) === K.roleName(key) && K.roleName(key).indexOf(s) >= 0 ? '' : s;   // name already carries it
  };
  K.roleNameStack = key => esc(K.roleBase(key)) + (K.roleSub(key) ? '<small class="uxc-rsub">' + esc(K.roleSub(key)) + '</small>' : '');
  K.rolePill = r => '<span class="ux-role-pill ' + K.teamOf(r) + '"><i>' + K.roleImg(r) + '</i><span class="uxc-pn">' + K.roleNameStack(r) + '</span></span>';
  const isLan = r => r === 'lancelotGood' || r === 'lancelotEvil';
  K.isLancelot = isLan;

  // ---------- my role sheet ----------
  K.knowList = v => {
    const me = v.me || {}, list = (me.knowledge || []).slice().sort((x, y) => (x.tag === 'lancelot') - (y.tag === 'lancelot'));
    const g = K.G(), kl = (g && g.knowledgeLabels) || {};
    if (!list.length) {
      const empty = me.role === 'oberon' ? (kl.emptyOberon || K.L('보이는 동료가 없어요.', 'You can\'t see any teammates.'))
        : isLan(me.role) ? (K.lanVariant(v) === 2 ? K.L('보이는 사람이 없어요. 펼쳐 둔 갈림길 카드로 언제 편이 바뀌는지 확인하세요.', 'You can\'t see anyone. Check the Crossroads cards on the table to see when your side changes.')
          : K.L('보이는 사람이 없어요. 갈림길 카드가 뒤집힐 때마다 지금 내 편을 다시 확인하세요.', 'You can\'t see anyone. Each time a Crossroads card turns over, check which side you\'re on now.'))
        : (kl.emptyGood || K.L('보이는 사람이 없어요. 대화와 투표로 추리해 보세요.', 'You can\'t see anyone. Use conversation and votes to work it out.'));
      return '<p class="ux-p ux-center" style="padding:6px 0">' + esc(empty) + '</p>';
    }
    return '<div class="ux-know-list">' + list.map((k, i) => {
      const p = K.player(v, k.id) || { id: k.id, name: '?' };
      return '<div class="ux-know ' + esc(k.tag) + (k.tag === 'lancelot' ? ' uxc-lan' : '') + '" style="animation-delay:' + (i * 90) + 'ms">' + K.avatar(p) +
        '<span class="nm">' + esc(p.name) + '</span><span class="tag">' + (k.tag === 'lancelot' ? '🧭 ' : '') + esc(K.knowText(k.tag)) + '</span></div>';
    }).join('') + (list.some(k => k.tag === 'lancelot') ? '<p class="ux-muted ux-center" style="margin-top:2px">' + esc(K.L('두 랜슬롯은 늘 서로 반대편이에요.', 'The two Lancelots are always on opposite sides.')) + '</p>' : '') + '</div>';
  };
  K.ladyList = v => {
    const r = (v.me && v.me.ladyResults) || []; if (!r.length) return '';
    const lamp = K.term('lady', K.L('등불', 'Lamp'));
    return '<h3 class="ux-h3" style="margin:14px 0 8px">' + esc(K.L((K.josa ? K.josa(lamp, '으로') : lamp + '으로') + ' 알게 된 것', 'What the ' + lamp + ' showed me')) + '</h3><div class="ux-know-list">' + r.map(x => {
      const p = K.player(v, x.targetId) || { name: '?' };
      return '<div class="ux-know ' + (x.team === 'evil' ? 'evil' : '') + '">' + K.avatar(p) + '<span class="nm">' + esc(p.name) + '</span><span class="tag">' + esc(K.teamName(x.team)) + '</span></div>';
    }).join('') + '</div>';
  };
  /* Lancelot: what my side is now, and the Crossroads cards turned so far. */
  /* Lancelot variants (settings.lancelot 1|2|3, official rules). Short label ("Variant 1") and one-line rule. */
  K.lanVariant = v => Number((v && (v.lancelot || (v.settings && v.settings.lancelot))) || 0);
  K.lanVarFull = n => String(K.term('lancelotVariant' + n, K.L('변형 ' + n, 'Variant ' + n)));
  K.lanVarShort = n => K.lanVarFull(n).split(/[:：(]/)[0].trim() || K.L('변형 ' + n, 'Variant ' + n);
  K.lanVarRule = n => {
    const q = K.term('quest', K.L('사명', 'Mission')), loy = K.term('loyalty', K.L('갈림길 카드', 'Crossroads card')), sw = K.term('loyaltySwitch', K.L('편이 바뀜', 'Sides switch'));
    if (n === 1) return K.L('3·4·5번째 ' + q + '을 시작할 때 ' + loy + '를 한 장씩 뒤집어요. "' + sw + '"이면 두 랜슬롯의 편이 서로 바뀌어요.',
      'At the start of ' + q + 's 3, 4 and 5 one ' + loy + ' turns over. On "' + sw + '", the two Lancelots swap sides.');
    if (n === 2) return K.L(loy + ' 5장을 처음부터 ' + q + '마다 한 장씩 펼쳐 둬요. "' + sw + '"은 그 ' + q + ' 시작에 적용되고, 랜슬롯은 지금 편대로만 카드를 내요.',
      'Five ' + loy + 's are laid face up at the start, one per ' + q + '. A "' + sw + '" takes effect at the start of its ' + q + ', and Lancelots must play for their current side.');
    if (n === 3) return K.L(loy + ' 없이 편이 바뀌지 않아요. 두 랜슬롯은 서로 알아봐요.', 'No ' + loy + 's and no switching. The two Lancelots know each other.');
    return '';
  };
  const loyCard = (card, round, cls) => '<span class="uxc-loy-c ' + (card === 'switch' ? 'sw ' : '') + (cls || '') + '">' + K.img(K.asset('loyalty/' + (card === 'switch' ? 'switch' : 'none') + '.svg'), 'loyalty', '') +
    '<small>' + esc(K.term('quest', K.L('사명', 'Mission'))) + ' ' + (round + 1) + '</small></span>';
  /* The face-up plan (variant 2): card i belongs to mission i; past/current ones are marked done. */
  K.loyaltyPlanHtml = v => {
    const plan = v && v.loyaltyPlan; if (!Array.isArray(plan) || !plan.length) return '';
    const cur = v.phase === 'lobby' || v.phase === 'reveal' ? -1 : (v.round || 0);
    return '<div class="uxc-loy">' + plan.map((c, i) => loyCard(c, i, i <= cur ? 'done' : '')).join('') + '</div>';
  };
  /* Lancelot: what my side is now, and the Crossroads cards (by variant). */
  K.lancelotNote = v => {
    const me = (v && v.me) || {}; if (!isLan(me.role)) return '';
    const n = K.lanVariant(v) || 1;
    const start = me.startTeam || K.teamOf(me.role), now = me.team || start, moved = start !== now;
    const revealed = (v.loyaltyRevealed || []);
    let cards = '';
    if (n === 2) cards = v.loyaltyPlan ? '<div class="uxc-loy-t">' + esc(K.term('loyaltyPlan', K.L('펼쳐 둔 갈림길 카드', 'Crossroads cards on the table'))) + '</div>' + K.loyaltyPlanHtml(v) : '';
    else if (n === 1 && revealed.length) cards = '<div class="uxc-loy">' + revealed.map(x => loyCard(x.card, x.round || 0)).join('') + '</div>';
    const g = K.G(), sec = g && g.phaseHints && g.phaseHints.loyalty && g.phaseHints.loyalty.mySwitchSecret;
    const line = moved
      ? (sec ? K.fmt(sec, { team: K.isEn() ? K.teamName(now).replace(/^The /, '') : K.teamName(now) }) : K.L(K.teamName(start) + ' 편으로 시작했지만, 지금은 ' + K.teamName(now) + ' 편이에요.', 'You started with ' + K.teamName(start) + ', but now you\'re with ' + K.teamName(now) + '.'))
      : K.L('지금 내 편: ' + K.teamName(now), 'Your side now: ' + K.teamName(now));
    const how = n === 3 ? K.L('이번 게임은 ' + K.term('loyalty', '갈림길 카드') + '가 없어서 편이 바뀌지 않아요.', 'There are no ' + K.term('loyalty', 'Crossroads card') + 's this game, so your side won\'t change.')
      : K.lanVarRule(n) + ' ' + (n === 2 ? '' : K.L('늘 지금 내 편으로 카드를 내세요.', 'Always play for your current side.'));
    return '<div class="uxc-lnote ' + now + '"><b>🧭 ' + esc(line) + '</b><span class="uxc-lvar">' + esc(K.lanVarFull(n)) + '</span><span>' + esc(how.trim()) + '</span>' + cards + '</div>';
  };
  K.roleTips = role => {
    const g = K.G(), r = g && g.roles && g.roles[role]; if (!r) return '';
    const li = a => (a || []).map(x => '<li>' + esc(x) + '</li>').join('');
    return '<details class="uxc-tips"><summary>' + esc(ui('myRoleTipsButton', '내 역할 팁', 'My role tips')) + '</summary>' +
      (r.tagline ? '<p class="ux-verse" style="margin:8px 0">' + esc(r.tagline) + '</p>' : '') +
      (r.goal ? '<b>' + esc(K.L('목표', 'Goal')) + '</b><ul>' + li(r.goal) + '</ul>' : '') + (r.tips ? '<b>' + esc(K.L('팁', 'Tips')) + '</b><ul>' + li(r.tips) + '</ul>' : '') +
      (r.seenBy ? '<p class="ux-muted">' + esc(r.seenBy) + '</p>' : '') + '</details>';
  };
  K.openRoleSheet = () => {
    const v = K.view; if (!v || !v.me || !v.me.role) return;
    const me = v.me, team = me.team || K.teamOf(me.role);
    K.fb('flip');
    K.sheet('<div class="uxc-role">' +
      '<div class="uxc-mini ' + team + '">' + K.roleImg(me.role) + '<div class="plate"><div class="rname">' + K.roleNameStack(me.role) + '</div><div class="rteam">' + esc(K.teamName(team)) + '</div></div></div>' +
      '<p class="ux-p ux-center" style="margin:12px 4px">' + esc(K.roleDesc(me.role)) + '</p>' + K.lancelotNote(v) +
      '<div class="ux-ornament">' + esc(K.L('내 눈에 보이는 사람', 'Who I can see')) + '</div><div style="margin-top:10px">' + K.knowList(v) + '</div>' + K.ladyList(v) +
      K.roleTips(me.role) +
      '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:14px">' + esc(ui('close', '닫기', 'Close')) + '</button></div>');
  };

  // ---------- history sheet ----------
  K.openHistory = () => {
    const v = K.view; if (!v) return;
    const hist = (v.voteHistory || []).slice().reverse();
    const qn = K.term('quest', K.L('사명', 'Mission'));
    const qs = (v.quests || []).map((q, i) => q.result ? '<span class="ux-badge ' + (q.result === 'success' ? 'gold' : 'evil') + '">' + esc(qn) + ' ' + (i + 1) + ' ' + (q.result === 'success' ? esc(K.term('success', K.L('축복', 'Blessing'))) : esc(K.term('fail', K.L('방해', 'Hindrance'))) + (q.fails != null ? ' ' + esc(K.L(q.fails + '장', '×' + q.fails)) : '')) + '</span>' : '').join(' ');
    const items = hist.map(h => {
      const team = h.team || [];
      const votes = K.players(v).map(p => {
        const y = h.votes ? h.votes[p.id] : null; if (y == null) return '';
        return '<span class="' + (y ? 'y' : 'n') + (team.indexOf(p.id) >= 0 ? ' t' : '') + '">' + esc(p.name) + ' ' + (y ? '○' : '✕') + '</span>';
      }).join('');
      const no = h.proposalNo || 1;
      return '<div class="ux-hist-item"><div class="hd"><span><b>' + esc(qn) + ' ' + ((h.round || 0) + 1) + '</b> · ' + esc(K.L(no + '번째', 'Try ' + no)) + ' · ' + esc(K.term('leader', K.L('조장', 'Leader'))) + ' ' + esc(K.pname(v, h.leaderId)) + '</span>' +
        '<span class="ux-badge ' + (h.approved ? 'ok' : 'evil') + '">' + esc(h.approved ? K.L('통과', 'Approved') : K.L('부결', 'Rejected')) + '</span></div>' +
        '<div class="ux-muted" style="margin-bottom:6px">' + esc(K.term('questTeam', K.L('원정대', 'Expedition'))) + ': ' + team.map(id => esc(K.pname(v, id))).join(', ') + '</div><div class="votes">' + votes + '</div></div>';
    }).join('');
    const qt = K.term('questTeam', K.L('원정대', 'Expedition'));
    K.sheet('<h2 class="ux-h2 ux-center" style="margin-bottom:6px">' + esc(K.L('기록', 'History')) + '</h2>' + (qs ? '<div class="ux-center" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + qs + '</div>' : '') +
      '<div class="ux-hist">' + (items || '<p class="ux-p ux-center">' + esc(K.L('아직 투표 기록이 없어요.', 'No votes yet.')) + '</p>') + '</div>' +
      '<p class="ux-muted ux-center" style="margin-top:10px">' + esc(K.L('테두리가 있는 이름은 그 제안의 ' + qt + '예요.', 'Names with a border were on that ' + qt + '.')) + '</p>' +
      '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:12px">' + esc(ui('close', '닫기', 'Close')) + '</button>');
  };

  // ---------- seats: who is connected, rejoin from a new phone, take over as host ----------
  /* K.seatNotice(v) → small banner HTML (or ''): non-host sees "become host" when the host is away; in game the host sees
     offline players with "allow rejoin" and the seat that is open now. Board/other screens can embed it; cm-seats opens the sheet. */
  K.seatNotice = v => {
    if (!v || !v.me) return '';
    const me = v.me, inGame = v.phase && v.phase !== 'lobby', ps = K.players(v);
    const host = ps.find(p => p.isHost);
    let h = '';
    if (v.hostAway && !me.isHost) {
      h += '<div class="uxc-seatnote"><span>' + esc(sys('hostAway', { targetName: host ? host.name : '' }, '방장이 1분 넘게 자리를 비웠어요. 누구든 \'방장 맡기\'를 누르면 이어서 진행할 수 있어요.', 'The Host has been away for over a minute. Anyone can tap \'Become host\' to keep the game going.')) + '</span>' +
        '<button class="ux-btn ux-btn-sm ux-btn-gold" data-act="cm-claim">' + esc(K.term('claimHost', K.L('방장 맡기', 'Become host'))) + '</button></div>';
    }
    if (inGame && me.isHost) {
      const open = v.rejoinOpenFor && K.player(v, v.rejoinOpenFor);
      if (open) h += '<div class="uxc-seatnote ok"><span>' + esc(sys('rejoinOpen', { targetName: open.name }, open.name + '님 자리가 2분 동안 열렸어요. 새 폰에서 같은 방 코드와 같은 이름으로 들어오면 돼요.',
        open.name + '\'s seat is open for 2 minutes. Join from the new phone with the same room code and the same name.') + ' (' + v.code + ')') + '</span></div>';
      const off = ps.filter(p => p.online === false && !K.isMe(v, p.id) && p.id !== v.rejoinOpenFor);
      if (off.length) h += '<div class="uxc-seatnote"><span>' + esc(sys('offline', { targetName: off.map(p => p.name).join(', ') }, off.map(p => p.name).join(', ') + '님의 연결이 끊겼어요. 같은 폰으로 다시 열면 돌아올 수 있어요.', off.map(p => p.name).join(', ') + ' lost connection. Reopening on the same phone brings them back.') + ' ' +
        sys('rejoinHostTip', {}, '새 폰으로 들어와야 한다면 방장이 \'다시 입장 허용\'을 눌러 주세요.', 'If they need to use a new phone, the Host can tap \'Allow rejoin\'.')) + '</span>' +
        '<button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="cm-seats">' + esc(K.L('자리 관리', 'Seats')) + '</button></div>';
    }
    return h;
  };
  function seatsHtml(v) {
    const me = v.me || {}, inGame = v.phase && v.phase !== 'lobby';
    const rows = K.players(v).map(p => {
      const mine = K.isMe(v, p.id), open = v.rejoinOpenFor === p.id;
      let right = '';
      if (open) right = '<span class="ux-badge ok">' + esc(K.L('자리 열림', 'Seat open')) + '</span>';
      else if (me.isHost && inGame && !mine && p.online === false) right = '<button class="ux-btn ux-btn-sm ux-btn-gold" data-act="cm-rejoin" data-id="' + esc(p.id) + '">' + esc(K.term('allowRejoin', K.L('다시 입장 허용', 'Allow rejoin'))) + '</button>';
      else if (p.online === false) right = '<span class="ux-badge">' + esc(K.L('연결 끊김', 'Offline')) + '</span>';
      return '<div class="ux-player' + (mine ? ' is-me' : '') + '">' + K.avatar(p, true) + '<div class="ux-player-name">' + esc(p.name) + (mine ? '<small>' + esc(K.L('나', 'me')) + '</small>' : '') + '</div>' +
        (p.isHost ? '<span class="ux-badge gold">👑 ' + esc(K.term('host', K.L('방장', 'Host'))) + '</span>' : '') + right + '</div>';
    }).join('');
    const tip = me.isHost
      ? (inGame ? K.L('15초 넘게 연결이 끊긴 사람은 새 폰에서 같은 이름으로 다시 들어올 수 있게 2분 동안 자리를 열어 줄 수 있어요.', 'For someone offline for over 15 seconds, you can open their seat for 2 minutes so they can rejoin from a new phone with the same name.')
        : K.L('게임 중에 누가 폰을 바꾸면 여기서 다시 입장을 허용할 수 있어요.', 'If someone changes phones during the game, you can let them rejoin here.'))
      : sys('rejoinHostTip', {}, '원래 폰을 잃었거나 바꿨다면 방장에게 "' + K.term('allowRejoin', '다시 입장 허용') + '"을 부탁하세요.', 'If you lost or changed your phone, ask the host to tap "' + K.term('allowRejoin', 'Allow rejoin') + '".');
    return '<h2 class="ux-h2 ux-center" style="margin-bottom:6px">' + esc(K.L('함께하는 사람', 'Players')) + '</h2>' + K.seatNotice(Object.assign({}, v, { me: Object.assign({}, me), phase: 'lobby' })) +
      '<div class="ux-players" style="margin-top:8px">' + rows + '</div><p class="ux-muted ux-center" style="margin-top:10px">' + esc(tip) + '</p>' +
      '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:12px">' + esc(ui('close', '닫기', 'Close')) + '</button>';
  }
  let seatSheet = null, seatTimer = null;
  K.openSeats = () => {
    const v = K.view; if (!v) return;
    const sh = seatSheet = K.sheet('<div class="uxc-seats"></div>', { onClose: () => { clearInterval(seatTimer); seatSheet = null; } });
    const box = sh.querySelector('.uxc-seats');
    const draw = () => { if (K.view) K.patch(box, seatsHtml(K.view)); };
    draw(); clearInterval(seatTimer); seatTimer = setInterval(draw, 1000);
  };
  K.actions['cm-seats'] = () => { K.fb('tap'); K.openSeats(); };
  K.actions['cm-rejoin'] = async d => {
    const nm = K.pname(K.view, d.id);
    if (!(await K.confirm(K.L(nm + '님 자리를 열까요?', 'Open ' + nm + '\'s seat?'),
      esc(K.L('2분 동안 새 폰에서 같은 이름 "' + nm + '"으로 이 방에 다시 들어올 수 있어요.', 'For 2 minutes, a new phone can rejoin this room with the same name "' + nm + '".')),
      { ok: K.term('allowRejoin', K.L('다시 입장 허용', 'Allow rejoin')), cancel: K.L('취소', 'Cancel') }))) return;
    const r = await K.call('allowRejoin', d.id);
    if (r && r.ok !== false) { K.fb('chime'); K.toast(K.L(nm + '님 자리를 열었어요', nm + '\'s seat is open'), 'info'); }
  };
  K.actions['cm-claim'] = async () => {
    if (!(await K.confirm(K.L('방장을 맡을까요?', 'Become the host?'), esc(K.L('방장은 게임을 다시 시작하고, 끊긴 사람의 자리를 열어 줄 수 있어요.', 'The host can restart the game and reopen seats for people who got disconnected.')),
      { ok: K.term('claimHost', K.L('방장 맡기', 'Become host')), cancel: K.L('취소', 'Cancel') }))) return;
    const r = await K.call('claimHost');
    if (r && r.ok !== false) { K.fb('chime'); K.toast(sys('newHost', { targetName: (K.view && K.view.me && K.view.me.name) || '' }, '이제 내가 방장이에요', 'You\'re the host now'), 'info'); }
  };

  // ---------- guide (quick pages, full rules, tutorial) ----------
  function fallbackPages() {
    const t = (k, ko, en) => K.term(k, K.L(ko, en)), ev = K.teamName('evil'), gd = K.teamName('good');
    return [
      {
        heading: K.L('어떤 게임인가요?', 'What kind of game is this?'), lines: [
          K.L('우리 중에 몰래 숨어 있는 ' + ev + '가 있어요.', ev + ' are hiding among us.'),
          K.L(gd + '은 ' + t('quest', '사명') + ' 5번 중 3번을 성공하면 이기고, ' + ev + '는 3번을 방해하면 이겨요.', gd + ' win by completing 3 of 5 ' + t('quest', '', 'Missions') + 's; ' + ev + ' win by hindering 3.'),
          K.L('대화와 투표로 누가 누군지 알아맞혀요. 5~10명이 함께해요.', 'Talk and vote to work out who is who. For 5–10 players.')]
      },
      {
        heading: K.L('한 라운드는 이렇게', 'How a round works'), steps: [
          K.L(t('leader', '조장') + '이 ' + t('quest', '사명') + ' 팀을 골라요.', 'The ' + t('leader', '', 'Leader') + ' picks a team for the ' + t('quest', '', 'Mission') + '.'),
          K.L('모두 동시에 ' + t('approve', '찬성') + ' 또는 ' + t('reject', '반대') + ' 투표해요. 절반보다 많아야 통과예요.', 'Everyone votes ' + t('approve', '', 'Approve') + ' or ' + t('reject', '', 'Reject') + ' at once. More than half must approve.'),
          K.L('통과하면 팀원만 몰래 ' + t('success', '축복') + ' 또는 ' + t('fail', '방해') + ' 카드를 내요.', 'If approved, only team members secretly play a ' + t('success', '', 'Blessing') + ' or ' + t('fail', '', 'Hindrance') + ' card.'),
          K.L(t('fail', '방해') + '가 한 장이라도 있으면 실패예요.', 'One ' + t('fail', '', 'Hindrance') + ' card is enough to fail it.'),
          K.L('한 ' + t('quest', '사명') + '에서 5번 연속 부결되면 ' + ev + '가 이겨요.', 'If 5 teams in a row are rejected in one ' + t('quest', '', 'Mission') + ', ' + ev + ' win.')]
      },
      { heading: K.L('역할', 'Roles'), roles: K.OPTIONAL_ROLES.concat(['servant', 'minion']).map(k => ({ key: k, line: K.roleDesc(k) })) }
    ];
  }
  const guidePages = () => { const g = K.G(); return (g && g.quick && g.quick.pages) || fallbackPages(); };
  function pageHtml(p) {
    let h = '<h2 class="ux-h2 ux-center" style="margin:4px 0 12px">' + esc(p.heading || p.title || '') + '</h2>';
    if (p.lines) h += p.lines.map(l => '<p class="ux-p" style="margin:0 0 10px">' + esc(l) + '</p>').join('');
    if (p.body) h += (Array.isArray(p.body) ? p.body : String(p.body).split('\n')).map(l => '<p class="ux-p" style="margin:0 0 10px">' + esc(l) + '</p>').join('');
    if (p.steps) h += '<ol class="uxc-steps">' + p.steps.map(s => '<li>' + (typeof s === 'string' ? esc(s) : '<b>' + esc(s.title) + '</b> ' + esc(s.text)) + '</li>').join('') + '</ol>';
    if (p.bullets) h += '<ul class="uxc-steps">' + p.bullets.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
    if (p.roles) h += '<div class="uxc-roles">' + p.roles.filter(r => modOn(r.module)).map(r => '<div class="uxc-r ' + K.teamOf(r.key) + '"><i>' + K.roleImg(r.key) + '</i><div><b>' + esc(K.roleName(r.key)) + '</b><span>' + esc(r.line) + '</span></div></div>').join('') + '</div>';
    if (p.text) h += '<p class="ux-p">' + esc(p.text) + '</p>';
    if (p.after) h += '<p class="ux-p">' + esc(p.after) + '</p>';
    return h;
  }
  function pager(title, pages, extraBtns) {
    let i = 0;
    const sh = K.sheet('<div class="uxc-guide"><div class="ux-ornament">' + esc(title) + '</div><div class="uxc-page"></div>' +
      '<div class="uxc-dots"></div><div class="ux-row" style="margin-top:12px"><button class="ux-btn ux-btn-ghost" data-g="prev">' + esc(ui('prev', '이전', 'Back')) + '</button><button class="ux-btn ux-btn-gold" data-g="next">' + esc(ui('next', '다음', 'Next')) + '</button></div>' + (extraBtns || '') + '</div>');
    const pg = sh.querySelector('.uxc-page'), dots = sh.querySelector('.uxc-dots');
    const show = (dir) => {
      pg.innerHTML = pageHtml(pages[i]); pg.classList.remove('in-l', 'in-r'); void pg.offsetWidth; pg.classList.add(dir < 0 ? 'in-l' : 'in-r');
      dots.innerHTML = pages.map((_, j) => '<i class="' + (j === i ? 'on' : '') + '"></i>').join('');
      sh.querySelector('[data-g=prev]').disabled = i === 0;
      sh.querySelector('[data-g=next]').textContent = i === pages.length - 1 ? ui('done', '알겠어요', 'Got it') : ui('next', '다음', 'Next');
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
    pager((g && g.quick && g.quick.title) || ui('quickButton', '1분 설명서', '1-Minute Guide'), guidePages(),
      '<div class="ux-row" style="margin-top:8px"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-g="tutorial">' + esc(ui('tutorialButton', '처음이에요', 'I\'m new')) + '</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-g="rules">' + esc(ui('fullRulesButton', '전체 규칙', 'Full rules')) + '</button></div>');
  };
  K.openRules = () => {
    const g = K.G(), o = g && g.overview;
    if (!o) return K.openGuide();
    let h = '<h2 class="ux-h2 ux-center">' + esc(o.title || ui('fullRulesButton', '전체 규칙', 'Full rules')) + '</h2>' + (o.intro ? '<p class="ux-p ux-center" style="margin:6px 0 12px">' + esc(o.intro) + '</p>' : '');
    (o.sections || []).filter(s => modOn(s.module)).forEach(s => { h += '<div class="ux-ornament" style="margin:16px 0 8px">' + esc(s.heading) + '</div>' + pageHtml(Object.assign({}, s, { heading: '' })).replace(/^<h2[^>]*><\/h2>/, ''); });
    const t = o.table; if (t) h += '<div class="ux-ornament" style="margin:16px 0 8px">' + esc(t.heading) + '</div><div class="uxc-table"><table><tr>' + t.columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr>' + t.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table></div>' + (t.note ? '<p class="ux-muted">' + esc(t.note) + '</p>' : '');
    K.sheet(h + '<button class="ux-btn ux-btn-ghost" data-close style="margin-top:14px">' + esc(ui('close', '닫기', 'Close')) + '</button>');
  };
  K.openTutorial = () => {
    const g = K.G(), t = g && g.tutorial;
    if (!t || !t.steps) return K.openGuide();
    pager(t.title || K.L('처음 해 보기', 'First game walkthrough'), t.steps.map(s => ({ heading: s.title, text: s.text })));
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
.uxc-rsub { display: block; font-size: .68em; font-weight: 400; opacity: .8; line-height: 1.2; margin-top: 1px; font-family: inherit; }
.uxc-pn { display: inline-flex; flex-direction: column; line-height: 1.15; } .uxc-pn .uxc-rsub { font-size: 10px; }
.uxc-mini .rteam { font-size: 12px; color: var(--text-dim); }
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
.uxc-know-lan, .ux-know.uxc-lan { background: rgba(94,200,190,.1); border: 1px solid rgba(94,200,190,.35); }
.uxc-lnote { margin: 2px 0 14px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--line); font-size: 13px; color: var(--text-dim); line-height: 1.5; display: flex; flex-direction: column; gap: 4px; }
.uxc-lnote b { color: var(--text); font-size: 14px; } .uxc-lnote.good b { color: var(--gold-hi); } .uxc-lnote.evil b { color: #ff9db5; }
.uxc-loy { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.uxc-loy-c { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; color: var(--text-mute); }
.uxc-loy-t { margin-top: 6px; font-size: 12px; color: var(--gold-hi); font-weight: 700; } .uxc-lvar { font-size: 12px; color: var(--text-mute); }
.uxc-loy-c.done { opacity: .5; }
.uxc-loy-c img { width: 34px; height: 48px; object-fit: cover; border-radius: 6px; box-shadow: 0 0 0 1px var(--line); } .uxc-loy-c.sw img { box-shadow: 0 0 0 1.5px var(--gold); }
.uxc-seatnote { display: flex; align-items: center; gap: 10px; margin: 8px 0; padding: 10px 12px; border-radius: 12px; font-size: 13px; line-height: 1.45; color: #ffcf8a; background: rgba(255,170,60,.1); border: 1px solid rgba(255,170,60,.25); }
.uxc-seatnote.ok { color: var(--ok); background: rgba(111,227,166,.08); border-color: rgba(111,227,166,.3); }
.uxc-seatnote span { flex: 1; min-width: 0; } .uxc-seatnote .ux-btn { flex: none; width: auto; padding-left: 12px; padding-right: 12px; }
.uxc-seats .ux-players { display: flex; flex-direction: column; gap: 6px; } .uxc-seats .ux-player .ux-btn { flex: none; width: auto; padding: 6px 10px; }
`;
  const st = document.createElement('style'); st.id = 'uxc-style'; st.textContent = css; document.head.appendChild(st);
})();
