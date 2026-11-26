/* Scenes and journey: a background for every phase (cross-faded), a screen-change light wipe, a phase banner,
   animated waiting states, and the pilgrim-map cinematic that travels to the next 사명 whenever the round changes.
   Everything that marks a shared moment starts on the server clock (K.syncWait), so all phones move together. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  // ---------- phase scenes ----------
  /* img: files tried in order under assets/backgrounds/ (the first that loads wins); cls: CSS look + decorations. */
  const SCENES = {
    home: { img: ['home'], cls: 'dawn' },
    lobby: { img: ['home'], cls: 'camp' },
    reveal: { img: ['reveal'], cls: 'night' },
    wait: { img: ['phase-wait', 'game'], cls: 'night' },
    propose: { img: ['phase-propose', 'game'], cls: 'road' },
    vote: { img: ['phase-vote', 'game'], cls: 'chapel' },
    quest: { img: ['phase-mission', 'game'], cls: 'wild' },
    excalibur: { img: ['phase-mission', 'game'], cls: 'wild' },
    lady: { img: ['phase-lady', 'game'], cls: 'lamp' },
    assassin: { img: ['phase-assassin', 'victory-evil'], cls: 'storm' },
    'end-good': { img: ['victory-good'], cls: 'glory' },
    'end-evil': { img: ['victory-evil'], cls: 'dusk' }
  };
  const DECO = {
    dawn: '<i class="rays"></i><i class="sun"></i>',
    camp: '<i class="fire"></i><i class="fly f1"></i><i class="fly f2"></i><i class="fly f3"></i><i class="fly f4"></i>',
    night: '<i class="stars s1"></i><i class="stars s2"></i><i class="moon"></i>',
    road: '<i class="cloud c1"></i><i class="cloud c2"></i><i class="sun low"></i>',
    chapel: '<i class="shaft a"></i><i class="shaft b"></i><i class="shaft c"></i>',
    wild: '<i class="wind w1"></i><i class="wind w2"></i><i class="wind w3"></i><i class="haze"></i>',
    lamp: '<i class="glow"></i><i class="fly f1"></i><i class="fly f3"></i>',
    storm: '<i class="cloud dark c1"></i><i class="cloud dark c2"></i><i class="bolt"></i>',
    glory: '<i class="rays gold"></i><i class="sun"></i>',
    dusk: '<i class="cloud dark c1"></i><i class="haze evil"></i>'
  };
  const resolved = {};   // scene key -> url | false
  function findImg(key, list, cb) {
    if (key in resolved) return cb(resolved[key]);
    const tryAt = i => {
      if (i >= list.length) { resolved[key] = false; return cb(false); }
      const url = K.asset('backgrounds/' + list[i] + '.svg'), im = new Image();
      im.onload = () => { resolved[key] = url; cb(url); };
      im.onerror = () => tryAt(i + 1);
      im.src = url;
    };
    tryAt(0);
  }
  K.sceneKey = v => {
    if (!v) return 'home';
    if (v.phase === 'end') return 'end-' + (v.winner === 'evil' ? 'evil' : 'good');
    if (v.phase === 'reveal' && v.me && v.me.acked) return 'wait';
    return SCENES[v.phase] ? v.phase : 'propose';
  };

  let sceneBox = null, sceneCur = null, sceneEl = null;
  function setScene(key) {
    if (!K.appEl) return;
    if (!sceneBox) { sceneBox = K.el('<div class="ux-scene" aria-hidden="true"></div>'); K.appEl.insertBefore(sceneBox, K.appEl.firstChild); }
    if (key === sceneCur) return;
    sceneCur = key;
    const S = SCENES[key] || SCENES.propose;
    const layer = K.el('<div class="ux-scene-l s-' + S.cls + '"><div class="img"></div><div class="deco">' + (DECO[S.cls] || '') + '</div><div class="veil"></div></div>');
    sceneBox.appendChild(layer);
    findImg(key, S.img, url => { if (url) { const im = layer.querySelector('.img'); im.style.backgroundImage = 'url("' + url + '")'; im.classList.add('on'); } });
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('in')));
    const old = sceneEl; sceneEl = layer;
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 1600); }
  }
  K.setScene = setScene;

  // ---------- screen wipe + phase banner (on render) ----------
  const BANNER = {
    propose: v => ({ ic: '🕯️', t: K.L(K.term('questTeam', '원정대') + ' 제안', 'Choose the ' + K.term('questTeam', 'Expedition')),
      s: K.term('quest', K.L('사명', 'Mission')) + ' ' + ((v.round || 0) + 1) + ' · ' + K.L((v.proposalNo || 1) + '번째 제안', 'Proposal ' + (v.proposalNo || 1)) }),
    vote: () => ({ ic: '🗳️', t: K.term('approve', K.L('찬성', 'Approve')) + K.L(' 또는 ', ' or ') + K.term('reject', K.L('반대', 'Reject')), s: K.L('모두가 한 표씩 던져요', 'Everyone casts one vote') }),
    quest: () => ({ ic: '⛰️', t: K.L(K.term('quest', '사명') + ' 수행', 'On the ' + K.term('quest', 'Mission')), s: K.L('떠난 사람들이 카드를 내요', 'The team plays their cards') }),
    excalibur: () => ({ ic: '📜', t: K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word')), s: K.L('두루마리를 받은 사람이 고르는 중', 'The Scroll holder is deciding') }),
    lady: () => ({ ic: '🪔', t: K.L(K.term('lady', '등불') + ' 비추기', K.term('ladyAction', 'Shine the Lamp')), s: K.L('한 사람의 마음을 비춰 봐요', 'Shine on one person\'s heart') }),
    assassin: () => ({ ic: '🎯', t: K.term('assassinate', K.L('선지자 지목', 'Name the Prophet')), s: K.L('마지막 기회가 남았어요', 'One last chance') })
  };
  let lastName = null, lastPhaseKey = null, wipeTok = 0, lastJourney = 0;
  function wipe() {
    if (K.reduced()) return;
    const w = K.el('<div class="ux-wipe" aria-hidden="true"><i class="iris"></i><i class="ring"></i></div>');
    document.body.appendChild(w); setTimeout(() => w.remove(), 1300);
  }
  /* The phase banner is the shared scene transition: every phone runs it for view.transitionMs from the synced start.
     A phone that gets there late jumps into it (negative delay); once the moment has passed it is skipped. */
  async function banner(v, tok) {
    const f = BANNER[v.phase]; if (!f) return;
    const late = await K.syncWait(K.evAt(null, v));
    const dur = v.transitionMs > 0 ? v.transitionMs : 2200;
    if (late > dur - 400) return;
    if (tok !== wipeTok || !K.view || K.view.phase !== v.phase || K.cineBusy()) return;
    const b = f(v);
    const el = K.el('<div class="ux-sweep" aria-hidden="true"><div class="bar"><span class="ic">' + b.ic + '</span><span class="tx"><b>' + esc(b.t) + '</b><small>' + esc(b.s) + '</small></span></div></div>');
    const bar = el.firstElementChild; bar.style.animationDuration = dur + 'ms'; if (late > 0) bar.style.animationDelay = (-late) + 'ms';
    document.body.appendChild(el); setTimeout(() => el.remove(), dur - late + 100);
  }
  (K.onRender = K.onRender || []).push((v, name) => {
    setScene(K.sceneKey(v));
    if (lastName && name !== lastName) wipe();
    const pk = v ? v.phase + ':' + v.round + ':' + v.proposalNo : 'home';
    if (v && lastPhaseKey && pk !== lastPhaseKey && name === 'board' && lastName === 'board' && Date.now() - lastJourney > 2500) banner(v, ++wipeTok);
    lastName = name; lastPhaseKey = pk;
  });

  // ---------- animated waiting states ----------
  /* Any .ux-waiting that appears (from any screen) gets a halo, an orbiting light and a gentle rotating line. */
  const WAIT_KO = ['잠시 숨을 고르며 기다려요', '서두르지 않아도 괜찮아요', '옆 사람의 표정도 살짝 살펴보세요', '빛은 어둠 속에서 더 밝게 빛나요', '모두의 선택을 기다리는 중이에요', '조용히 마음을 모아 봐요'];
  const WAIT_EN = ['Take a breath while you wait', 'No need to hurry', 'Take a quiet look at the faces around you', 'Light shines brighter in the dark', 'Waiting for everyone to choose', 'Quiet your heart for a moment'];
  const WAIT_LINES = { get length() { return WAIT_KO.length; } };
  [0, 1, 2, 3, 4, 5].forEach(i => Object.defineProperty(WAIT_LINES, i, { get: () => (K.isEn() ? WAIT_EN : WAIT_KO)[i] }));
  let wl = 0;
  function decorate(node) {
    const list = node.matches && node.matches('.ux-waiting') ? [node] : (node.querySelectorAll ? Array.from(node.querySelectorAll('.ux-waiting')) : []);
    list.forEach(w => {
      if (w.querySelector(':scope > .ux-wfx')) return;
      w.classList.add('ux-wait-live');
      w.insertBefore(K.el('<div class="ux-wfx" aria-hidden="true"><i class="halo"></i><i class="ring"></i><i class="orb"><b></b></i><i class="orb o2"><b></b></i></div>'), w.firstChild);
      if (!w.querySelector('.ux-wline')) w.appendChild(K.el('<p class="ux-wline">' + esc(WAIT_LINES[wl % WAIT_LINES.length]) + '</p>'));
    });
  }
  (K.onInit = K.onInit || []).push(() => {
    const stage = K.appEl && K.appEl.querySelector('.ux-stage'); if (!stage || !window.MutationObserver) return;
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && decorate(n)))).observe(stage, { childList: true, subtree: true });
    setInterval(() => {
      const ls = document.querySelectorAll('.ux-wline'); if (!ls.length) return;
      wl++; ls.forEach(p => { p.classList.add('swap'); setTimeout(() => { p.textContent = WAIT_LINES[wl % WAIT_LINES.length]; p.classList.remove('swap'); }, 380); });
    }, 4800);
  });

  // ---------- journey map cinematic ----------
  /* Art: assets/map/journey.svg (600×1300) with route data from assets/manifest.json (map.data). Point 0 = the
     start camp, 1..5 = the five 사명 stops. The route is sampled here (no getPointAtLength needed). */
  const ROUTE = 'M300,1222 C300,1121.9 185,1140.1 185,1040 C185,932.8 420,952.2 420,845 C420,732.2 195,752.8 195,640 C195,525.6 415,546.4 415,432 C415,324.2 300,343.8 300,236';
  const PLACES_KO = ['우물가', '목자의 들', '강 건너기', '빛의 산', '거룩한 성문'];
  const PLACES_EN = ['The Well', 'Shepherds\' Field', 'River Crossing', 'Mountain of Light', 'Holy Gate'];
  const PLACES = { get length() { return 5; } };
  [0, 1, 2, 3, 4].forEach(i => Object.defineProperty(PLACES, i, { get: () => (K.isEn() ? PLACES_EN : PLACES_KO)[i] }));
  const MW = 600, MH = 1300, MARK = 90, BADGE = 84, CUR = 140;
  const SAMP = [], IDX = [0];
  (function build() {
    const n = ROUTE.match(/-?\d+(\.\d+)?/g).map(Number);
    let x = n[0], y = n[1]; SAMP.push([x, y]);
    for (let i = 2; i + 5 < n.length; i += 6) {
      const c1x = n[i], c1y = n[i + 1], c2x = n[i + 2], c2y = n[i + 3], ex = n[i + 4], ey = n[i + 5];
      for (let s = 1; s <= 40; s++) {
        const t = s / 40, u = 1 - t;
        SAMP.push([u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex, u * u * u * y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]);
      }
      IDX.push(SAMP.length - 1); x = ex; y = ey;
    }
  })();
  const PTS = IDX.map(i => SAMP[i]);
  const LEN = [0]; for (let i = 1; i < SAMP.length; i++) LEN.push(LEN[i - 1] + Math.hypot(SAMP[i][0] - SAMP[i - 1][0], SAMP[i][1] - SAMP[i - 1][1]));
  const TOTAL = LEN[LEN.length - 1];
  function atLen(l) {
    let i = 1; while (i < LEN.length - 1 && LEN[i] < l) i++;
    const k = (l - LEN[i - 1]) / Math.max(1e-6, LEN[i] - LEN[i - 1]), a = SAMP[i - 1], b = SAMP[i];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mk = (x, y) => 'translate(' + (x - MARK * .5).toFixed(1) + ' ' + (y - MARK * .92).toFixed(1) + ')';
  const img = (f, x, y, sz, cls) => '<image href="' + K.asset('map/' + f) + '" x="' + (x - sz / 2) + '" y="' + (y - sz / 2) + '" width="' + sz + '" height="' + sz + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';

  function mapSVG(v, from, to) {
    const qs = v.quests || [], start = PTS[Math.max(0, from + 1)];
    let s = '<svg class="jr-svg" viewBox="0 0 ' + MW + ' ' + MH + '" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + ROUTE + '" class="jr-road"/>' +
      '<path d="' + ROUTE + '" class="jr-go" style="stroke-dasharray:' + TOTAL.toFixed(1) + ';stroke-dashoffset:' + (TOTAL - LEN[IDX[Math.max(0, from + 1)]]).toFixed(1) + '"/>';
    for (let i = 0; i < 5; i++) {
      const [x, y] = PTS[i + 1], r = (qs[i] || {}).result, q = qs[i] || {};
      s += '<g class="jr-st' + (i === to ? ' here' : '') + '" data-st="' + i + '">' +
        '<circle cx="' + x + '" cy="' + y + '" r="46" class="jr-dot"/>' +
        (r ? img(r === 'success' ? 'stop-done-good.svg' : 'stop-done-evil.svg', x, y, BADGE, 'jr-seal') : '<text x="' + x + '" y="' + (y + 14) + '" class="jr-n">' + (i + 1) + '</text>') +
        (i === to ? img('stop-current.svg', x, y, CUR, 'jr-cur') : '') +
        '<text x="' + x + '" y="' + (y - 58) + '" class="jr-name">' + esc(PLACES[i]) + '</text>' +
        (q.size ? '<text x="' + x + '" y="' + (y + 76) + '" class="jr-sz">' + esc(K.L(q.size + '명', q.size + ' players') + ((q.failsNeeded || 1) >= 2 ? K.L(' · 방해 2', ' · 2 ' + K.term('fail', 'Hindrance')) : '')) + '</text>' : '') +
        '</g>';
    }
    s += '<g class="jr-tok" transform="' + mk(start[0], start[1]) + '"><circle cx="45" cy="70" r="52" class="jr-tglow"/>' +
      '<image href="' + K.asset('map/marker.svg') + '" width="' + MARK + '" height="' + MARK + '"/></g>';
    return s + '</svg>';
  }

  K.cine.journey = async (ctx, ev, v, K_) => {
    v = K.view || v; if (!v || !(v.quests || []).length) return;
    const to = Math.max(0, Math.min(4, typeof ev.to === 'number' ? ev.to : (v.round || 0)));
    const from = Math.max(-1, Math.min(to - 1, typeof ev.from === 'number' ? ev.from : to - 1));
    lastJourney = Date.now();
    const q = (v.quests || [])[to] || {}, leader = (v.players || []).find(p => p.id === v.leaderId);
    const quick = (ctx.late || 0) > 2500 || K.reduced();
    ctx.el.classList.add('jr-ov');
    ctx.set('<div class="jr-wrap">' +
      '<div class="ux-ornament jr-kicker">' + esc(K.term('quest', K.L('사명', 'Mission'))) + ' ' + (to + 1) + '</div>' +
      '<div class="ux-cine-title">' + esc(K.isEn() ? (to === 0 && from < 0 ? 'Setting out for ' : 'On to ') + PLACES[to]
        : (K.josa ? K.josa(PLACES[to], '으로') : PLACES[to] + '(으)로') + (to === 0 && from < 0 ? ' 떠나요' : ' 이동해요')) + '</div>' +
      '<div class="jr-view"><div class="jr-pan"><div class="jr-map"></div>' + mapSVG(v, from, to) + '</div></div>' +
      '<div class="jr-info ux-cine-sub">' + (q.size ? esc(K.L(q.size + '명의 ' + K.term('questTeam', '원정대'), K.term('questTeam', 'Expedition') + ' of ' + q.size)) : '') +
      ((q.failsNeeded || 1) >= 2 ? (K.isEn() ? ' · fails only with <b>2 ' + esc(K.term('fail', 'Hindrance')) + ' cards</b>' : ' · <b>' + esc(K.term('fail', '방해')) + ' 2장</b>이 나와야 실패') : '') +
      (leader ? '<br>' + esc(K.term('leader', K.L('조장', 'Leader'))) + ': ' + esc(leader.name) : '') + '</div></div>');
    const view = ctx.inner.querySelector('.jr-view'), pan = ctx.inner.querySelector('.jr-pan'), svg = ctx.inner.querySelector('.jr-svg');
    const map = ctx.inner.querySelector('.jr-map'), mi = new Image();
    mi.onload = () => { map.style.backgroundImage = 'url("' + mi.src + '")'; view.classList.add('has-art'); }; mi.src = K.asset('map/journey.svg');
    const tok = svg.querySelector('.jr-tok'), go = svg.querySelector('.jr-go');
    const vw = view.clientWidth || 320, vh = view.clientHeight || 400, sc = vw / MW, mh = MH * sc;
    const panTo = y => { const ty = Math.max(vh - mh, Math.min(0, vh * .55 - y * sc)); pan.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)'; };
    const a = LEN[IDX[Math.max(0, from + 1)]], b = LEN[IDX[to + 1]];
    const place = l => { const p = atLen(l); tok.setAttribute('transform', mk(p[0], p[1])); go.style.strokeDashoffset = (TOTAL - l).toFixed(1); return p; };
    panTo(atLen(a)[1]);
    K.fb('tap');
    if (!quick) {
      await ctx.sleep(750);
      if (!ctx.skipped) {
        const D = 2500;
        tok.classList.add('walk');
        const ahead = ctx.takeDebt ? ctx.takeDebt(D) : 0;   // a late phone starts the walk part-way along
        await new Promise(res => {
          const t0 = performance.now() - ahead;
          const step = now => {
            const t = ctx.skipped ? 1 : Math.min(1, (now - t0) / D), p = place(a + (b - a) * ease(t));
            panTo(p[1]);
            if (t < 1) requestAnimationFrame(step); else res();
          };
          requestAnimationFrame(step);
        });
        tok.classList.remove('walk');
      }
    }
    const p = place(b); panTo(p[1]);
    const st = svg.querySelector('[data-st="' + to + '"]'); if (st) st.classList.add('arrived');
    K.fb('chime');
    if (!ctx.skipped) K.fx.burstAt(tok, { n: 46, speed: 260 });
    ctx.inner.querySelector('.jr-info').classList.add('on');
    await ctx.tapOrWait(quick ? 1400 : 1900);
  };

  // ---------- styles ----------
  const css = `
.ux-scene { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.ux-scene-l { position: absolute; inset: 0; opacity: 0; transition: opacity 1.4s ease; }
.ux-scene-l.in { opacity: 1; }
.ux-scene-l.out { opacity: 0; transition-duration: 1.4s; }
.ux-scene-l .img { position: absolute; inset: -4%; background-size: cover; background-position: center; opacity: 0; transition: opacity 1.2s ease; transform: scale(1.04); animation: scnDrift 30s ease-in-out infinite alternate; }
.ux-scene-l .img.on { opacity: .55; }
.ux-scene-l .veil { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,10,28,.45), rgba(7,10,28,.32) 35%, rgba(7,10,28,.62)); }
.ux-scene-l .deco { position: absolute; inset: 0; }
.ux-scene-l .deco i { position: absolute; display: block; }
@keyframes scnDrift { from { transform: scale(1.04) translate3d(0,0,0); } to { transform: scale(1.1) translate3d(-1.5%,-1%,0); } }
/* palettes (shown even before or without the picture) */
.s-dawn { background: radial-gradient(120% 60% at 50% 0%, rgba(255,190,110,.35), transparent 60%), linear-gradient(180deg, #2b1d48, #0b0d24); }
.s-camp { background: radial-gradient(90% 50% at 50% 100%, rgba(255,140,60,.28), transparent 65%), linear-gradient(180deg, #121a3e, #0a0b1d); }
.s-night { background: radial-gradient(80% 50% at 70% 10%, rgba(160,170,255,.22), transparent 60%), linear-gradient(180deg, #060a22, #03040f); }
.s-road { background: radial-gradient(120% 60% at 50% 90%, rgba(255,205,120,.25), transparent 60%), linear-gradient(180deg, #1d2a5a, #0c1230); }
.s-chapel { background: radial-gradient(70% 60% at 50% 0%, rgba(255,230,170,.3), transparent 60%), linear-gradient(180deg, #1c1640, #0a0a1e); }
.s-wild { background: radial-gradient(100% 50% at 50% 100%, rgba(230,140,80,.28), transparent 65%), linear-gradient(180deg, #2a1c3c, #0e0a1a); }
.s-lamp { background: radial-gradient(70% 45% at 50% 70%, rgba(255,200,110,.32), transparent 65%), linear-gradient(180deg, #161230, #08081a); }
.s-storm { background: radial-gradient(90% 50% at 50% 0%, rgba(200,60,110,.22), transparent 60%), linear-gradient(180deg, #1e0f2c, #07040e); }
.s-glory { background: radial-gradient(120% 70% at 50% 10%, rgba(255,220,140,.45), transparent 60%), linear-gradient(180deg, #3a2a50, #120f28); }
.s-dusk { background: radial-gradient(120% 70% at 50% 10%, rgba(224,72,110,.3), transparent 60%), linear-gradient(180deg, #2a1236, #0a0512); }
/* decorations: transform/opacity only */
.deco .rays { left: 50%; top: -60vh; width: 160vh; height: 160vh; margin-left: -80vh; border-radius: 50%; opacity: .35;
  background: repeating-conic-gradient(from 0deg, rgba(255,226,160,.22) 0 6deg, transparent 6deg 18deg);
  -webkit-mask-image: radial-gradient(circle, #000 20%, transparent 62%); mask-image: radial-gradient(circle, #000 20%, transparent 62%); animation: scnSpin 90s linear infinite; }
.deco .rays.gold { opacity: .55; }
.deco .sun { left: 50%; top: 6vh; width: 220px; height: 220px; margin-left: -110px; border-radius: 50%; background: radial-gradient(circle, rgba(255,236,190,.55), rgba(255,200,120,.12) 45%, transparent 70%); animation: breathe 5s ease-in-out infinite; }
.deco .sun.low { top: auto; bottom: 14vh; opacity: .7; }
.deco .fire { left: 50%; bottom: -60px; width: 360px; height: 220px; margin-left: -180px; border-radius: 50%; background: radial-gradient(ellipse at 50% 70%, rgba(255,150,70,.45), transparent 65%); animation: scnFlicker 2.2s ease-in-out infinite; }
.deco .fly { width: 5px; height: 5px; border-radius: 50%; background: #ffe7a8; box-shadow: 0 0 10px 3px rgba(255,210,120,.6); opacity: 0; animation: scnFly 9s ease-in-out infinite; }
.deco .f1 { left: 18%; bottom: 22%; } .deco .f2 { left: 70%; bottom: 30%; animation-delay: 2.2s; } .deco .f3 { left: 40%; bottom: 12%; animation-delay: 4.4s; } .deco .f4 { left: 84%; bottom: 52%; animation-delay: 6.1s; }
.deco .stars { inset: 0; background-image: radial-gradient(1.4px 1.4px at 12% 18%, #fff, transparent), radial-gradient(1.2px 1.2px at 32% 8%, #fff, transparent), radial-gradient(1.6px 1.6px at 56% 22%, #fff, transparent), radial-gradient(1.1px 1.1px at 74% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 88% 30%, #fff, transparent), radial-gradient(1.2px 1.2px at 22% 40%, #fff, transparent), radial-gradient(1.3px 1.3px at 64% 46%, #fff, transparent); animation: scnTw 4s ease-in-out infinite; }
.deco .stars.s2 { transform: translate(6%, 9%); animation-delay: 2s; }
.deco .moon { right: 12%; top: 8vh; width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(circle at 38% 38%, #fff8e0, #e9dcb0 60%, transparent 62%); box-shadow: 0 0 60px 20px rgba(220,220,255,.15); animation: breathe 6s ease-in-out infinite; }
.deco .cloud { width: 70vw; height: 22vh; border-radius: 50%; background: radial-gradient(ellipse, rgba(255,240,220,.14), transparent 65%); animation: scnCloud 38s linear infinite; }
.deco .cloud.c1 { top: 10vh; left: -70vw; } .deco .cloud.c2 { top: 32vh; left: -70vw; animation-duration: 55s; animation-delay: -20s; }
.deco .cloud.dark { background: radial-gradient(ellipse, rgba(120,60,140,.3), transparent 65%); }
.deco .shaft { top: -10vh; width: 26vw; height: 120vh; background: linear-gradient(180deg, rgba(255,236,190,.22), transparent 80%); transform-origin: 50% 0; animation: scnShaft 7s ease-in-out infinite; }
.deco .shaft.a { left: 12%; transform: rotate(14deg); } .deco .shaft.b { left: 40%; transform: rotate(4deg); animation-delay: 2.3s; } .deco .shaft.c { left: 66%; transform: rotate(-10deg); animation-delay: 4.6s; }
.deco .wind { left: -40vw; height: 2px; width: 40vw; border-radius: 2px; background: linear-gradient(90deg, transparent, rgba(255,230,190,.25), transparent); animation: scnWind 6s linear infinite; }
.deco .w1 { top: 30%; } .deco .w2 { top: 52%; animation-delay: 2s; } .deco .w3 { top: 72%; animation-delay: 4s; }
.deco .haze { left: 0; right: 0; bottom: 0; height: 40vh; background: linear-gradient(0deg, rgba(240,150,90,.18), transparent); animation: breathe 7s ease-in-out infinite; }
.deco .haze.evil { background: linear-gradient(0deg, rgba(224,72,110,.2), transparent); }
.deco .glow { left: 50%; bottom: 14vh; width: 300px; height: 300px; margin-left: -150px; border-radius: 50%; background: radial-gradient(circle, rgba(255,210,130,.4), transparent 65%); animation: scnFlicker 3s ease-in-out infinite; }
.deco .bolt { inset: 0; background: radial-gradient(60% 40% at 60% 10%, rgba(230,200,255,.35), transparent 60%); opacity: 0; animation: scnBolt 9s linear infinite; }
@keyframes scnSpin { to { transform: rotate(360deg); } }
@keyframes scnFlicker { 0%,100% { opacity: .8; transform: scale(1); } 30% { opacity: 1; transform: scale(1.05); } 60% { opacity: .7; transform: scale(.97); } }
@keyframes scnFly { 0% { opacity: 0; transform: translate3d(0,0,0); } 20% { opacity: 1; } 60% { opacity: .8; transform: translate3d(30px,-70px,0); } 100% { opacity: 0; transform: translate3d(-20px,-140px,0); } }
@keyframes scnTw { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
@keyframes scnCloud { to { transform: translate3d(180vw,0,0); } }
@keyframes scnShaft { 0%,100% { opacity: .35; } 50% { opacity: .9; } }
@keyframes scnWind { 0% { transform: translate3d(0,0,0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate3d(180vw,0,0); opacity: 0; } }
@keyframes scnBolt { 0%,88%,100% { opacity: 0; } 90% { opacity: 1; } 92% { opacity: .2; } 94% { opacity: .8; } }

/* screen change: a light iris + spinning rose ring, never blocks taps */
.ux-wipe { position: fixed; inset: 0; z-index: 40; pointer-events: none; display: grid; place-items: center; overflow: hidden; }
.ux-wipe .iris { width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle, rgba(255,246,214,.95), rgba(255,215,122,.55) 40%, rgba(255,215,122,0) 70%); animation: wpIris 1.1s var(--ease-out) both; }
.ux-wipe .ring { position: absolute; width: 140px; height: 140px; border-radius: 50%; border: 2px dashed rgba(255,231,168,.7); animation: wpRing 1.1s var(--ease-out) both; }
@keyframes wpIris { 0% { transform: scale(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(22); opacity: 0; } }
@keyframes wpRing { 0% { transform: scale(.2) rotate(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(5) rotate(180deg); opacity: 0; } }

/* phase banner */
.ux-sweep { position: fixed; left: 0; right: 0; top: 34%; z-index: 45; pointer-events: none; display: flex; justify-content: center; }
.ux-sweep .bar { display: flex; align-items: center; gap: 12px; padding: 12px 26px; min-width: 70%; max-width: 440px; justify-content: center;
  background: linear-gradient(90deg, transparent, rgba(24,30,70,.96) 18%, rgba(24,30,70,.96) 82%, transparent); border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong);
  animation: swIn 2.2s var(--ease-out) both; }
.ux-sweep .ic { font-size: 30px; animation: bannerIn .8s var(--ease-spring) both; }
.ux-sweep .tx { display: flex; flex-direction: column; }
.ux-sweep b { font-family: var(--font-display); font-size: 21px; color: var(--gold-hi); }
.ux-sweep small { font-size: 12.5px; color: var(--text-dim); }
@keyframes swIn { 0% { transform: translate3d(-110%,0,0); opacity: 0; } 18% { transform: translate3d(0,0,0); opacity: 1; } 78% { transform: translate3d(0,0,0); opacity: 1; } 100% { transform: translate3d(110%,0,0); opacity: 0; } }

/* waiting */
.ux-wait-live { position: relative; isolation: isolate; padding-top: 14px; min-height: 96px; }
.ux-wfx { position: absolute; left: 50%; top: 4px; width: 92px; height: 92px; margin-left: -46px; z-index: -1; pointer-events: none; }
.ux-wfx i { position: absolute; inset: 0; border-radius: 50%; display: block; }
.ux-wfx .halo { background: radial-gradient(circle, rgba(255,215,122,.32), transparent 66%); animation: breathe 2.8s ease-in-out infinite; }
.ux-wfx .ring { inset: 8px; border: 1.5px dashed rgba(255,231,168,.45); animation: scnSpin 14s linear infinite; }
.ux-wfx .orb { animation: scnSpin 4.2s linear infinite; }
.ux-wfx .orb.o2 { inset: 14px; animation-duration: 6.5s; animation-direction: reverse; }
.ux-wfx .orb b { position: absolute; left: 50%; top: -3px; width: 7px; height: 7px; margin-left: -3.5px; border-radius: 50%; background: #fff3c8; box-shadow: 0 0 10px 3px rgba(255,215,122,.7); }
.ux-wfx .orb.o2 b { background: #d9c9ff; box-shadow: 0 0 10px 3px rgba(143,108,240,.6); }
.ux-wait-live .bd-wait-ic { animation: uxeBob 3s ease-in-out infinite; }
.ux-wline { margin: 2px 0 0; font-size: 12.5px; color: var(--text-mute); letter-spacing: .02em; text-align: center; transition: opacity .35s ease, transform .35s ease; }
.ux-wline.swap { opacity: 0; transform: translateY(4px); }

/* journey */
.jr-ov { background: radial-gradient(circle at 50% 35%, rgba(26,30,72,.94), rgba(5,7,20,.98)); }
.jr-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.jr-kicker { animation: titleIn .6s both; }
.jr-view { position: relative; width: 100%; max-width: 360px; height: min(54vh, 440px); overflow: hidden; border-radius: 22px; background: radial-gradient(circle at 50% 40%, #3a3166, #121233);
  box-shadow: 0 0 0 1px var(--line-strong), 0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(244,201,107,.15); animation: jrUnroll .8s var(--ease-out) both; transform-origin: 50% 0; }
.jr-pan { position: relative; will-change: transform; }
.jr-map { position: absolute; inset: 0; background-size: 100% 100%; }
.jr-svg { position: relative; display: block; width: 100%; height: auto; }
@keyframes jrUnroll { from { transform: scaleY(.2); opacity: 0; } to { transform: none; opacity: 1; } }
.jr-road { fill: none; stroke: rgba(255,231,168,.3); stroke-width: 10; stroke-linecap: round; stroke-dasharray: 3 18; }
.has-art .jr-road { opacity: 0; }
.jr-go { fill: none; stroke: #e9b949; stroke-width: 11; stroke-linecap: round; opacity: .9; }
.jr-dot { fill: rgba(26,32,80,.55); stroke: rgba(255,227,163,.6); stroke-width: 3; }
.has-art .jr-dot { fill: transparent; stroke: transparent; }
.jr-n, .jr-name, .jr-sz { text-anchor: middle; font-family: var(--font-display); paint-order: stroke; stroke: rgba(10,10,30,.75); stroke-width: 6px; stroke-linejoin: round; }
.jr-n { fill: var(--gold-hi); font-size: 40px; font-weight: 700; }
.jr-name { fill: #fff6dc; font-size: 30px; font-weight: 700; }
.ux-en .jr-name { font-size: 26px; }
.jr-sz { fill: rgba(255,246,220,.8); font-size: 24px; }
.jr-cur { transform-box: fill-box; transform-origin: center; animation: breathe 1.8s ease-in-out infinite; }
.jr-seal { transform-box: fill-box; transform-origin: center; }
.jr-st.arrived .jr-cur { animation: jrPing 1.1s var(--ease-out) both, breathe 1.8s 1.1s ease-in-out infinite; }
@keyframes jrPing { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.25); opacity: .9; } }
.jr-tglow { fill: rgba(255,215,122,.28); transform-box: fill-box; transform-origin: center; animation: breathe 1.4s ease-in-out infinite; }
.jr-tok.walk image { transform-box: fill-box; transform-origin: 50% 92%; animation: jrStep .42s ease-in-out infinite alternate; }
@keyframes jrStep { from { transform: rotate(-4deg) translateY(0); } to { transform: rotate(4deg) translateY(-4px); } }
.jr-info { opacity: 0; transform: translateY(8px); transition: opacity .5s ease, transform .5s ease; animation: none; line-height: 1.6; }
.jr-info.on { opacity: 1; transform: none; }
.jr-info b { color: #ff9db5; font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  .ux-scene-l .img, .ux-scene-l .deco i, .ux-wfx i, .jr-cur, .jr-tglow, .jr-tok image { animation: none !important; }
  .ux-wipe, .ux-sweep { display: none; }
}
`;
  const st = document.createElement('style'); st.id = 'uxj-style'; st.textContent = css; document.head.appendChild(st);
})();
