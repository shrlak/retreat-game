/* Language layer: Korean / English.
   K.lang ('ko' | 'en', saved per device as ux-lang), K.isEn(), K.L(ko, en) picks the string for the current language,
   K.setLang(l) swaps the theme + guide and rebuilds the current screen. Design and animation stay identical.
   English names: window.THEME_EN (if the main app provides it) merged over EN_THEME below, merged over the Korean THEME
   (so art paths, colours and keys are kept). English guide: window.GUIDE_EN (same shape as window.GUIDE); without it
   K.G() returns null in English and each part shows its own English fallback text. */
(function () {
  'use strict';
  const K = window.UI._k;

  /* Stored like the contract says: Net.getLang()/Net.setLang() (localStorage "mist.lang"); plain localStorage without Net. */
  function readLang() {
    try { if (window.Net && Net.getLang) return Net.getLang() === 'en' ? 'en' : 'ko'; } catch (e) { }
    try { return localStorage.getItem('mist.lang') === 'en' ? 'en' : 'ko'; } catch (e) { return 'ko'; }
  }
  function saveLang(l) {
    try { if (window.Net && Net.setLang) Net.setLang(l); else localStorage.setItem('mist.lang', l); } catch (e) { }
    try { if (window.GUIDE && GUIDE.setLang) GUIDE.setLang(l); } catch (e) { }
  }
  K.lang = readLang();
  K.isEn = () => K.lang === 'en';
  K.L = (ko, en) => (K.lang === 'en' && en != null ? en : ko);
  K.onLang = K.onLang || [];

  const EN_THEME = {
    title: 'Light Expedition',
    subtitle: 'A hidden-role mystery game for church retreats',
    teams: { good: { name: 'Workers of Light', short: 'Light' }, evil: { name: 'The Tempters', short: 'Tempters' } },
    roles: {
      merlin: { name: 'Prophet', short: 'Prophet', desc: 'You know who the Tempters are, except the Wolf in Sheep\'s Clothing. Don\'t let them find out who you are.' },
      percival: { name: 'Watchman', short: 'Watchman', desc: 'You see two Prophet candidates: one is the real Prophet, one is the False Prophet. Protect the real one.' },
      servant: { name: 'Worker of Light', short: 'Worker', desc: 'You have no secret information. Talk, vote and find the Tempters so the missions succeed.' },
      assassin: { name: 'Spy', short: 'Spy', desc: 'Even if the Workers of Light win three missions, the Tempters win if you name the Prophet at the end.' },
      morgana: { name: 'False Prophet', short: 'False', desc: 'You look like a Prophet to the Watchman. Act like the real Prophet and confuse them.' },
      mordred: { name: 'Wolf in Sheep\'s Clothing', short: 'Wolf', desc: 'A Tempter even the Prophet cannot see. Hide among the Workers of Light.' },
      oberon: { name: 'Wanderer', short: 'Wanderer', desc: 'You are a Tempter, but you don\'t know the others and they don\'t know you. The Prophet can see you.' },
      minion: { name: 'Tempter', short: 'Tempter', desc: 'You know your fellow Tempters. Quietly hinder the missions.' },
      lancelotGood: { name: 'Pilgrim at the Crossroads', short: 'Pilgrim', desc: 'You start with the Workers of Light, but from the 3rd mission a Crossroads card can switch your side. Always play for your current side.' },
      lancelotEvil: { name: 'Shadow at the Crossroads', short: 'Shadow', desc: 'You start with the Tempters, but from the 3rd mission a Crossroads card can switch your side. Always play for your current side.' }
    },
    terms: {
      quest: 'Mission', questTeam: 'Team', leader: 'Leader',
      success: 'Blessing', fail: 'Hindrance',
      approve: 'Approve', reject: 'Reject',
      lady: 'Lamp', ladyAction: 'Shine the Lamp',
      assassinate: 'Name the Prophet', host: 'Host',
      ready: 'Ready', notReady: 'Get ready',
      lancelot: 'Pilgrim at the Crossroads', loyalty: 'Crossroads card', loyaltyNone: 'No change', loyaltySwitch: 'Sides switch',
      lancelotVariant1: 'Variant 1: a crossroads card each round from mission 3', lancelotVariant2: 'Variant 2: cards dealt face up, Lancelots play for their side', lancelotVariant3: 'Variant 3: no switching, the Lancelots know each other', loyaltyPlan: 'Crossroads cards on the table', lancelotForced: 'You can only play for your current side',
      excalibur: 'Scroll of the Word', excaliburAction: 'Flip one card', excaliburPass: 'Don\'t flip',
      allowRejoin: 'Allow rejoin', claimHost: 'Become host'
    },
    knowledgeText: { evil: 'Tempter', merlinCandidate: 'Prophet candidate', lancelot: 'The other pilgrim' },
    winText: {
      quests: 'The Workers of Light completed three missions',
      assassinFailed: 'The Spy could not find the Prophet',
      assassinHit: 'The Spy found the Prophet',
      rejections: 'Five teams in a row were rejected',
      fails: 'Three missions were hindered'
    }
  };
  K.EN_THEME = EN_THEME;

  const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
  function merge(a, b) {
    const o = Object.assign({}, a);
    if (!isObj(b)) return o;
    Object.keys(b).forEach(k => { o[k] = isObj(a && a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]; });
    return o;
  }
  K.themeFor = l => {
    const base = K.baseTheme || window.THEME || {};
    if (l !== 'en') return base;
    return merge(merge(merge(base, EN_THEME), (base.i18n && base.i18n.en) || {}), window.THEME_EN || {});
  };
  /* Which guide object K.G() builds from. */
  K.guideSrc = () => {
    const G = window.GUIDE;
    if (!G || !G.build) return null;
    if (K.lang === 'en' && !(G.raw && G.raw.en) && !(G.langs && G.langs.indexOf('en') >= 0)) return null;   // older guide.js: Korean only
    return { build: () => G.build(K.baseTheme || window.THEME, K.lang), format: G.format };
  };
  K.fmt = (s, p) => {
    try {
      const src = K.guideSrc();
      if (src && src.format) return src.format(s, p || {});
    } catch (e) { }
    return String(s).replace(/\{(\w+)(?::[^}]*)?\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
  };

  // ---------- server / network messages (Korean strings from the engine, handler and net.js) ----------
  const MSG = {
    '같은 이름이 이미 있어요. 다른 이름을 써 주세요': 'Someone already has that name. Please use another one',
    '게임 중에는 나갈 수 없어요': 'You can\'t leave during a game',
    '게임 중에는 내보낼 수 없어요': 'You can\'t remove players during a game',
    '게임 중에는 설정을 바꿀 수 없어요': 'Settings can\'t change during a game',
    '게임이 끝난 뒤에 할 수 있어요': 'You can do this after the game ends',
    '그 사람은 지금 접속 중이에요': 'That player is still connected',
    '다른 사람을 골라 주세요': 'Please pick someone else',
    '다른 원정대원을 골라 주세요': 'Please pick another team member',
    '다른 참가자를 골라 주세요': 'Please pick another player',
    '대기실에서는 그냥 다시 참가하면 돼요': 'In the lobby, just join again',
    '두루마리를 받은 사람만 쓸 수 있어요': 'Only the player holding the Scroll can use it',
    '등불을 가진 사람만 쓸 수 있어요': 'Only the player holding the Lamp can use it',
    '말씀 두루마리는 조장이 아닌 원정대원 한 명에게 줘야 해요': 'Give the Scroll of the Word to one team member who isn\'t the leader',
    '방이 가득 찼어요': 'The room is full',
    '방장만 내보낼 수 있어요': 'Only the host can remove players',
    '방장만 넘길 수 있어요': 'Only the host can do this',
    '방장만 다시 입장을 허용할 수 있어요': 'Only the host can allow a rejoin',
    '방장만 새 게임을 열 수 있어요': 'Only the host can start a new game',
    '방장만 설정을 바꿀 수 있어요': 'Only the host can change settings',
    '방장만 시작할 수 있어요': 'Only the host can start',
    '방장이 아직 접속해 있어요': 'The host is still connected',
    '빛의 일꾼 특수 역할이 너무 많아요': 'Too many special roles for the Workers of Light',
    '빛의 일꾼은 축복 카드만 낼 수 있어요': 'Workers of Light can only play Blessing cards',
    '알 수 없는 동작이에요': 'Unknown action',
    '없는 참가자가 있어요': 'One of those players isn\'t in the room',
    '없는 참가자예요': 'That player isn\'t in the room',
    '원래 폰에서 다시 열어 주세요. 폰을 바꿨다면 방장에게 \'다시 입장 허용\'을 부탁하세요': 'Please open it again on your original phone. If you changed phones, ask the host to tap "Allow rejoin"',
    '원정대원만 카드를 낼 수 있어요': 'Only team members can play cards',
    '이 방의 참가자가 아니에요': 'You\'re not a player in this room',
    '이름을 입력해 주세요': 'Please enter your name',
    '이미 등불을 가졌던 사람은 고를 수 없어요': 'You can\'t pick someone who already held the Lamp',
    '이미 방장이에요': 'You\'re already the host',
    '이미 시작된 게임이에요. 원래 폰에서 다시 열면 이어서 할 수 있어요': 'This game has already started. Open it again on your original phone to continue',
    '이미 시작했어요': 'The game has already started',
    '이미 카드를 냈어요': 'You already played a card',
    '자기 자신은 내보낼 수 없어요': 'You can\'t remove yourself',
    '자기 자신은 지목할 수 없어요': 'You can\'t name yourself',
    '정탐꾼만 지목할 수 있어요': 'Only the Spy can name someone',
    '조장만 원정대를 고를 수 있어요': 'Only the leader can choose the team',
    '지금은 등불을 쓸 때가 아니에요': 'It\'s not time to use the Lamp',
    '지금은 말씀 두루마리를 쓸 때가 아니에요': 'It\'s not time to use the Scroll of the Word',
    '지금은 사명 카드를 낼 때가 아니에요': 'It\'s not time to play mission cards',
    '지금은 원정대를 고를 때가 아니에요': 'It\'s not time to choose a team',
    '지금은 준비를 바꿀 수 없어요': 'You can\'t change ready right now',
    '지금은 지목할 때가 아니에요': 'It\'s not time to name someone',
    '지금은 투표 시간이 아니에요': 'It\'s not time to vote',
    '지금은 확인 단계가 아니에요': 'It\'s not time to confirm',
    '찬성 또는 반대를 골라 주세요': 'Please choose Approve or Reject',
    '파수꾼은 선지자가 있어야 넣을 수 있어요': 'The Watchman needs the Prophet in the game',
    // handler.js / net.js
    '방을 만들지 못했어요. 다시 시도해 주세요': 'Couldn\'t create the room. Please try again',
    '방 코드를 입력해 주세요': 'Please enter the room code',
    '그런 방이 없어요. 코드를 확인해 주세요': 'No room with that code. Please check it',
    '방에서 나가졌어요. 다시 입장해 주세요': 'You were removed from the room. Please join again',
    '동시에 너무 많은 요청이 왔어요. 다시 눌러 주세요': 'Too many taps at once. Please try again',
    '서버 오류가 났어요. 잠시 후 다시 시도해 주세요': 'Server error. Please try again in a moment',
    '응답을 읽지 못했어요': 'Couldn\'t read the server\'s reply',
    '인터넷 연결을 확인해 주세요': 'Please check your internet connection',
    '방에 들어가 있지 않아요': 'You\'re not in a room'
  };
  const PAT = [
    [/^(\d+)명일 때 유혹의 무리는 (\d+)명이라 특수 역할을 줄여야 해요$/, m => 'With ' + m[1] + ' players there are only ' + m[2] + ' Tempters, so remove some special roles'],
    [/^아직 준비 안 된 사람: (.+)$/, m => 'Not ready yet: ' + m[1]],
    [/^이번 사명에는 (\d+)명을 골라야 해요$/, m => 'This mission needs ' + m[1] + ' players'],
    [/^최대 (\d+)명까지예요$/, m => 'Up to ' + m[1] + ' players'],
    [/^최소 (\d+)명이 필요해요 \(지금 (\d+)명\)$/, m => 'You need at least ' + m[1] + ' players (now ' + m[2] + ')']
  ];
  const norm = s => String(s).trim().replace(/[.!]+$/, '');
  K.trMsg = msg => {
    if (msg && typeof msg === 'object') return K.lang === 'en' ? (msg.errorEn || K.trMsg(msg.error)) : msg.error;
    if (K.lang !== 'en' || typeof msg !== 'string' || !/[가-힣]/.test(msg)) return msg;
    const n = norm(msg);
    if (MSG[n]) return MSG[n];
    for (const [re, f] of PAT) { const m = n.match(re); if (m) return f(m); }
    return 'Something went wrong. Please try again';
  };
  K.MSG_EN = MSG;

  // ---------- switching ----------
  function apply() {
    document.documentElement.lang = K.lang;
    document.documentElement.classList.toggle('ux-en', K.lang === 'en');
    K.setTheme(K.themeFor(K.lang));
  }
  K.setLang = l => {
    l = l === 'en' ? 'en' : 'ko';
    if (l === K.lang) return;
    K.lang = l; saveLang(l);
    apply();
    K.onLang.forEach(f => { try { f(l); } catch (e) { console.error('[UI] onLang', e); } });
    K.rebuild();
  };
  K.onInit = K.onInit || [];
  K.onInit.unshift(() => apply());
  K.actions = K.actions || {};
  K.actions['lang'] = d => { K.fb && K.fb('tap'); K.setLang(d.lang); };
})();
