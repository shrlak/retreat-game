/* 빛의 원정대 — UI core. Built into ui/ui.js by ui/build.sh (plain concatenation, no transpile).
   Exposes window.UI (contract API) and UI._k (internal kit shared by the screen/cinematic parts). */
(function () {
  'use strict';

  const UI = window.UI = window.UI || {};
  const K = UI._k = UI._k || {};
  K.screens = K.screens || {};   // name -> { build(v, K) -> HTMLElement, update(v, K) }
  K.cine = K.cine || {};         // type -> async (ctx, ev, v, K)

  // ---------- constants (mirror CONTRACT rules; view values win when present) ----------
  K.GOOD_ROLES = ['merlin', 'percival', 'servant', 'lancelotGood'];
  K.EVIL_ROLES = ['assassin', 'morgana', 'mordred', 'oberon', 'minion', 'lancelotEvil'];
  K.OPTIONAL_ROLES = ['merlin', 'assassin', 'percival', 'morgana', 'mordred', 'oberon'];
  K.EVIL_COUNT = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
  K.TEAM_SIZES = { 5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4], 8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5] };

  // ---------- tiny helpers ----------
  const esc = K.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.$ = (s, el) => (el || document).querySelector(s);
  K.$$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  K.sleep = ms => new Promise(r => setTimeout(r, ms));
  K.el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  K.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  K.reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  K.store = {
    get(k, d) { try { const v = localStorage.getItem('ux-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ux-' + k, JSON.stringify(v)); } catch (e) { } },
    sget(k, d) { try { const v = sessionStorage.getItem('ux-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    sset(k, v) { try { sessionStorage.setItem('ux-' + k, JSON.stringify(v)); } catch (e) { } }
  };

  /* patch(el, html): replace innerHTML only when it changed (keeps animations from replaying on polls). */
  K.patch = (el, html) => { if (!el) return false; if (el._uxh === html) return false; el._uxh = html; el.innerHTML = html; return true; };
  /* patchList(container, [{key, html}]): keyed children; new keys get class "fresh" (entry animation). */
  K.patchList = (box, items) => {
    if (!box) return;
    const old = new Map(); Array.from(box.children).forEach(c => old.set(c.dataset.k, c));
    let prev = null;
    items.forEach(it => {
      let node = old.get(String(it.key));
      if (node && node._uxh !== it.html) { const n2 = K.el(it.html); n2.dataset.k = it.key; n2._uxh = it.html; node.replaceWith(n2); node = n2; }
      else if (!node) { node = K.el(it.html); node.dataset.k = it.key; node._uxh = it.html; node.classList.add('fresh'); }
      old.delete(String(it.key));
      const want = prev ? prev.nextSibling : box.firstChild;
      if (node !== want) box.insertBefore(node, want);
      prev = node;
    });
    old.forEach(n => n.remove());
  };

  // ---------- theme access ----------
  let T = {};
  K.T = () => T;
  K.term = (k, d) => (T.terms && T.terms[k]) || d;
  K.teamName = t => (T.teams && T.teams[t] && T.teams[t].name) || (t === 'evil' ? K.L('유혹의 무리', 'The Tempters') : K.L('빛의 일꾼들', 'Workers of Light'));
  K.teamOf = role => K.EVIL_ROLES.indexOf(role) >= 0 ? 'evil' : 'good';
  K.role = key => (T.roles && T.roles[key]) || {};
  K.roleName = key => K.role(key).name || key || '';
  K.roleDesc = key => K.role(key).desc || '';
  /* Guide text (guide/guide.js → window.GUIDE). K.G() returns the built guide or null. K.fmt fills runtime {params}. */
  let G = null;
  /* Language: K.guideSrc() (01-i18n.js) picks window.GUIDE or an English guide; null = parts use their own fallback text. */
  K.G = () => { if (G) return G; try { const src = K.guideSrc ? K.guideSrc() : window.GUIDE; if (src && src.build) G = src.build(T); } catch (e) { G = null; } return G; };
  K.setTheme = t => { T = t || {}; G = null; if (T.title) document.title = T.title; };
  K.fmt = (s, p) => { try { return window.GUIDE && GUIDE.format ? GUIDE.format(s, p || {}) : String(s).replace(/\{(\w+)(?::[^}]*)?\}/g, (m, k) => (p && p[k] != null ? p[k] : m)); } catch (e) { return s; } };
  /* K.hint(phase, key, params) -> one hint line (string) or '' */
  K.hint = (phase, key, params, idx) => { const g = K.G(); const a = g && g.phaseHints && g.phaseHints[phase] && g.phaseHints[phase][key]; if (!a) return ''; const s = Array.isArray(a) ? a[idx || 0] : a; return s ? K.fmt(s, params) : ''; };
  K.knowText = tag => (T.knowledgeText && T.knowledgeText[tag]) || (tag === 'evil' ? K.teamName('evil') : tag === 'merlinCandidate' ? K.L(K.roleName('merlin') + '일지도', 'maybe ' + K.roleName('merlin')) : tag);

  // ---------- assets (with generated placeholders when a file is missing) ----------
  let assetBase = './assets/';
  K.asset = p => assetBase + p;
  K.roleArtSrc = key => {
    const a = K.role(key).art;
    if (!a) return K.asset('roles/' + key + '.svg');
    return a.replace(/^\.?\/?assets\//, assetBase);
  };
  const failed = new Set();
  K.img = (src, ph, cls, extra) => {
    if (failed.has(src)) src = K.phURL(ph);
    return '<img class="' + (cls || '') + '" src="' + esc(src) + '" alt="" draggable="false" data-ph="' + esc(ph) + '" onerror="UI._ph(this)"' + (extra || '') + '>';
  };
  UI._ph = img => { img.onerror = null; failed.add(img.getAttribute('src')); img.src = K.phURL(img.dataset.ph); };
  const PH = {
    merlin: ['📜', 'good'], percival: ['🛡️', 'good'], servant: ['🕊️', 'good'],
    assassin: ['🔍', 'evil'], morgana: ['🎭', 'evil'], mordred: ['🐺', 'evil'], oberon: ['🌫️', 'evil'], minion: ['🍎', 'evil'], lancelotGood: ['🧭', 'good'], lancelotEvil: ['🧭', 'evil']
  };
  const phCache = {};
  K.phURL = kind => {
    if (phCache[kind]) return phCache[kind];
    let svg;
    const k = String(kind || '');
    if (k.indexOf('role:') === 0) {
      const key = k.slice(5); const d = PH[key] || ['✦', 'good']; const ev = d[1] === 'evil';
      const c1 = ev ? '#5d1230' : '#3b2a6b', c2 = ev ? '#e0486e' : '#f4c96b', c3 = ev ? '#1a0716' : '#0d1330';
      svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840"><defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="' + c2 + '" stop-opacity=".9"/><stop offset=".45" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c3 + '"/></radialGradient></defs><rect width="600" height="840" fill="url(#g)"/>' +
        Array.from({ length: 16 }, (_, i) => '<path d="M300 320 L' + (300 + 900 * Math.cos(i * Math.PI / 8)) + ' ' + (320 + 900 * Math.sin(i * Math.PI / 8)) + ' L' + (300 + 900 * Math.cos(i * Math.PI / 8 + .09)) + ' ' + (320 + 900 * Math.sin(i * Math.PI / 8 + .09)) + 'Z" fill="#fff" opacity=".05"/>').join('') +
        '<circle cx="300" cy="320" r="150" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/><text x="300" y="370" font-size="150" text-anchor="middle">' + d[0] + '</text></svg>';
    } else if (k === 'back') {
      svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3470"/><stop offset="1" stop-color="#0d1330"/></linearGradient><radialGradient id="l" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient></defs><rect width="600" height="840" fill="url(#b)"/><rect x="28" y="28" width="544" height="784" rx="26" fill="none" stroke="#f4c96b" stroke-opacity=".6" stroke-width="4"/><rect x="48" y="48" width="504" height="744" rx="18" fill="none" stroke="#f4c96b" stroke-opacity=".25" stroke-width="2"/>' +
        '<circle cx="300" cy="420" r="210" fill="url(#l)"/><path d="M300 250 C330 300 345 330 345 360 C345 392 325 412 300 412 C275 412 255 392 255 360 C255 330 270 300 300 250Z" fill="#ffe7a8"/><rect x="270" y="412" width="60" height="160" rx="8" fill="#f6f1e4"/><rect x="250" y="572" width="100" height="18" rx="9" fill="#c98d2e"/></svg>';
    } else {
      const m = { success: ['✨', '#f4c96b'], fail: ['🌑', '#e0486e'], approve: ['⭕', '#f4c96b'], reject: ['✖️', '#e0486e'], leader: ['👑', '#f4c96b'], lady: ['🪔', '#f4c96b'] }[k] || ['✦', '#f4c96b'];
      svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="' + m[1] + '" fill-opacity=".18" stroke="' + m[1] + '" stroke-width="5"/><text x="100" y="128" font-size="84" text-anchor="middle">' + m[0] + '</text></svg>';
    }
    return (phCache[kind] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };
  K.tokenImg = (name, cls) => K.img(K.asset(name + '.svg'), name, cls);
  K.roleImg = (key, cls) => K.img(K.roleArtSrc(key), 'role:' + key, cls);
  K.backImg = cls => K.img(K.asset('card-back.svg'), 'back', cls);

  // ---------- players ----------
  K.hue = s => { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  K.initial = n => Array.from(String(n || '?').trim())[0] || '?';
  K.avatar = (p, withOnline) => '<div class="ux-avatar" style="--h:' + K.hue(p && (p.id || p.name)) + '">' + esc(K.initial(p && p.name)) +
    (withOnline ? '<i class="online' + (p.online === false ? ' off' : '') + '"></i>' : '') + '</div>';
  K.players = v => (v && v.players ? v.players.slice().sort((a, b) => (a.seat || 0) - (b.seat || 0)) : []);
  K.player = (v, id) => (v && v.players || []).find(p => p.id === id) || null;
  K.pname = (v, id) => { const p = K.player(v, id); return p ? p.name : '?'; };
  K.isMe = (v, id) => !!(v && v.me && v.me.id === id);
  K.knowOf = (v, id) => ((v && v.me && v.me.knowledge) || []).filter(k => k.id === id).map(k => k.tag);
  K.ladyOf = (v, id) => { const r = ((v && v.me && v.me.ladyResults) || []).filter(x => x.targetId === id); return r.length ? r[r.length - 1].team : null; };
  K.sizes = v => (v && v.teamSizes) || K.TEAM_SIZES[v && v.playerCount] || K.TEAM_SIZES[Math.max(5, Math.min(10, (v && v.players || []).length))] || [2, 3, 2, 3, 3];
  K.teamSize = v => { const q = v && v.quests && v.quests[v.round]; return (q && q.size) || K.sizes(v)[v.round || 0]; };
  K.questFails = (v, i) => { const q = v && v.quests && v.quests[i]; if (q && q.failsNeeded) return q.failsNeeded; if (v && v.failsNeeded) return v.failsNeeded[i]; return 1; };

  // ---------- haptics ----------
  K.haptic = p => { try { if (navigator.vibrate && K.store.get('haptic', true)) navigator.vibrate(p); } catch (e) { } };
  const HP = { tap: 8, pick: 14, flip: [18, 40, 26], good: [14, 30, 14, 30, 40], evil: [70, 40, 110], tick: 6, alarm: [40, 60, 40, 60, 120] };
  K.buzz = name => K.haptic(HP[name] || 10);

  // ---------- sound (WebAudio synth, OFF by default) ----------
  const Sound = K.sound = {
    on: false, ctx: null,
    init() { this.on = !!K.store.get('sound', false); },
    set(on) { this.on = on; K.store.set('sound', on); if (on) { this.ensure(); this.play('chime'); } },
    ensure() { if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
    tone(f, d, type, g, delay, slide) {
      const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), a = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g || 0.12, t + 0.015); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(a); a.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
    },
    play(name) {
      if (!this.on || !this.ensure()) return;
      const S = {
        tap: [[660, .06, 'triangle', .05]],
        pick: [[520, .08, 'triangle', .07], [780, .1, 'triangle', .05, .05]],
        flip: [[300, .18, 'triangle', .06, 0, 900]],
        chime: [[880, .5, 'sine', .08], [1320, .6, 'sine', .05, .08], [1760, .7, 'sine', .03, .16]],
        good: [[523, .35, 'sine', .09], [659, .35, 'sine', .08, .12], [784, .5, 'sine', .08, .24], [1046, .9, 'sine', .07, .36]],
        evil: [[220, .5, 'sawtooth', .05, 0, 110], [233, .6, 'sawtooth', .04, .1, 98]],
        tick: [[1200, .03, 'square', .03]],
        drum: [[90, .25, 'sine', .2, 0, 45]],
        whoosh: [[200, .35, 'sine', .04, 0, 1200]],
        win: [[523, .3, 'triangle', .09], [659, .3, 'triangle', .09, .15], [784, .3, 'triangle', .09, .3], [1046, 1.2, 'triangle', .1, .45], [1318, 1.2, 'sine', .05, .45]],
        lose: [[392, .4, 'sine', .08], [349, .4, 'sine', .08, .3], [311, 1.2, 'sine', .08, .6]]
      }[name] || [];
      S.forEach(n => this.tone(n[0], n[1], n[2], n[3], n[4], n[5]));
    }
  };
  K.sfx = name => Sound.play(name);
  K.fb = name => { K.sfx(name); K.buzz(name); };   // sound + haptic feedback

  // ---------- particles (canvas behind the stage) ----------
  const FX = K.fx = {
    cv: null, cx: null, w: 0, h: 0, dpr: 1, motes: [], parts: [], sprites: {}, raf: 0, last: 0,
    init(canvas) {
      this.cv = canvas; this.cx = canvas.getContext('2d'); this.resize();
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
      const n = K.reduced() ? 8 : Math.round(Math.min(46, (this.w * this.h) / 9000));
      for (let i = 0; i < n; i++) this.motes.push(this.mote(true));
      this.kick();
    },
    sprite(color) {
      if (this.sprites[color]) return this.sprites[color];
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, color); r.addColorStop(.25, color); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); return (this.sprites[color] = c);
    },
    resize() { if (!this.cv) return; this.dpr = Math.min(2, window.devicePixelRatio || 1); this.w = innerWidth; this.h = innerHeight; this.cv.width = this.w * this.dpr; this.cv.height = this.h * this.dpr; this.cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); },
    mote(init) { return { x: Math.random() * this.w, y: init ? Math.random() * this.h : this.h + 20, r: 4 + Math.random() * 10, vy: -(6 + Math.random() * 16), vx: (Math.random() - .5) * 6, ph: Math.random() * 6.28, c: Math.random() < .8 ? 'rgba(255,220,150,1)' : 'rgba(180,160,255,1)' }; },
    mood: 'good',
    setMood(m) { this.mood = m; this.motes.forEach(o => { o.c = m === 'evil' ? (Math.random() < .7 ? 'rgba(255,110,140,1)' : 'rgba(170,120,255,1)') : (Math.random() < .8 ? 'rgba(255,220,150,1)' : 'rgba(180,160,255,1)'); }); },
    burst(x, y, o) {
      o = o || {}; const n = K.reduced() ? 6 : (o.n || 40); const cols = o.colors || ['rgba(255,231,168,1)', 'rgba(244,201,107,1)', 'rgba(255,255,255,1)'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = (o.speed || 260) * (.3 + Math.random() * .9);
        this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.lift || 80), g: o.gravity == null ? 220 : o.gravity, life: 0, max: (o.life || 1.3) * (.6 + Math.random() * .6), r: (o.size || 9) * (.5 + Math.random()), c: cols[i % cols.length] });
      }
      this.kick();
    },
    burstAt(el, o) { if (!el) return; const r = el.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 2, o); },
    rain(team, secs) {
      const cols = team === 'evil' ? ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,200,210,1)'] : ['rgba(255,231,168,1)', 'rgba(244,201,107,1)', 'rgba(255,255,255,1)'];
      const end = performance.now() + (secs || 2.5) * 1000;
      const step = () => { if (performance.now() > end) return; for (let i = 0; i < 3; i++) this.parts.push({ x: Math.random() * this.w, y: -10, vx: (Math.random() - .5) * 40, vy: 60 + Math.random() * 120, g: 30, life: 0, max: 3 + Math.random() * 2, r: 5 + Math.random() * 9, c: cols[i % 3] }); this.kick(); setTimeout(step, 60); };
      if (!K.reduced()) step();
    },
    kick() { if (!this.raf && this.cx) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } },
    loop(t) {
      this.raf = 0; if (document.hidden) return;
      const dt = Math.min(.05, (t - this.last) / 1000); this.last = t; const c = this.cx;
      c.clearRect(0, 0, this.w, this.h); c.globalCompositeOperation = 'lighter';
      this.motes.forEach((m, i) => {
        m.y += m.vy * dt; m.x += (m.vx + Math.sin(t / 1300 + m.ph) * 8) * dt;
        if (m.y < -30) this.motes[i] = this.mote(false);
        c.globalAlpha = .22 + .2 * Math.sin(t / 700 + m.ph); c.drawImage(this.sprite(m.c), m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
      });
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i]; p.life += dt; if (p.life > p.max) { this.parts.splice(i, 1); continue; }
        p.vy += p.g * dt; p.vx *= (1 - 1.2 * dt); p.x += p.vx * dt; p.y += p.vy * dt;
        c.globalAlpha = Math.max(0, 1 - p.life / p.max); const r = p.r * (1 - .4 * p.life / p.max);
        c.drawImage(this.sprite(p.c), p.x - r, p.y - r, r * 2, r * 2);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      this.raf = requestAnimationFrame(tt => this.loop(tt));
    }
  };
  K.flash = team => { const f = K.el('<div class="ux-flash ' + (team === 'evil' ? 'evil' : 'good') + '"></div>'); document.body.appendChild(f); setTimeout(() => f.remove(), 800); };
  K.shake = el => { if (!el) return; el.classList.remove('ux-shake'); void el.offsetWidth; el.classList.add('ux-shake'); setTimeout(() => el.classList.remove('ux-shake'), 600); };

  // ---------- toasts, sheets, confirm ----------
  let toastsEl;
  let lastToast = '', lastToastAt = 0;
  UI.toast = (msg, kind) => {
    if (K.trMsg) msg = K.trMsg(msg);
    if (!toastsEl || !msg) return;
    if (msg === lastToast && Date.now() - lastToastAt < 1500) return;   // app.js also toasts api errors
    lastToast = msg; lastToastAt = Date.now();
    const t = K.el('<div class="ux-toast ' + (kind === 'info' ? 'info' : '') + '">' + esc(msg) + '</div>');
    toastsEl.appendChild(t); if (kind !== 'info') K.buzz('tap');
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, kind === 'info' ? 1800 : 3200);
  };
  K.toast = UI.toast;

  K.sheet = (html, opts) => {
    opts = opts || {};
    const bg = K.el('<div class="ux-sheet-bg"></div>');
    const sh = K.el('<div class="ux-sheet" role="dialog"><div class="ux-grab"></div>' + html + '</div>');
    const close = () => { if (sh._closed) return; sh._closed = true; bg.classList.add('out'); sh.classList.add('out'); setTimeout(() => { bg.remove(); sh.remove(); }, 300); if (opts.onClose) opts.onClose(); };
    bg.addEventListener('click', close);
    sh.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    // drag down to close
    let y0 = null; sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 != null) { const d = e.touches[0].clientY - y0; if (d > 0) sh.style.transform = 'translateY(' + d + 'px)'; } }, { passive: true });
    sh.addEventListener('touchend', e => { if (y0 == null) return; const d = (e.changedTouches[0].clientY - y0); y0 = null; if (d > 90) close(); else sh.style.transform = ''; });
    document.body.appendChild(bg); document.body.appendChild(sh);
    sh.close = close; return sh;
  };
  /* K.confirm(title, body, {ok, cancel, danger}) -> Promise<bool> */
  K.confirm = (title, body, o) => new Promise(res => {
    o = o || {}; let done = false;
    const sh = K.sheet('<div class="ux-stack" style="padding:4px 2px 6px"><h2 class="ux-h2 ux-center">' + esc(title) + '</h2>' + (body ? '<p class="ux-p ux-center">' + body + '</p>' : '') +
      '<div class="ux-row" style="margin-top:8px"><button class="ux-btn ux-btn-ghost" data-close>' + esc(o.cancel || K.L('취소', 'Cancel')) + '</button><button class="ux-btn ' + (o.danger ? 'ux-btn-evil' : 'ux-btn-gold') + '" data-yes>' + esc(o.ok || K.L('확인', 'OK')) + '</button></div></div>',
      { onClose: () => { if (!done) { done = true; res(false); } } });
    sh.querySelector('[data-yes]').addEventListener('click', () => { done = true; res(true); sh.close(); });
  });

  // ---------- api calls ----------
  let api = {};
  const busy = new Set();
  /* K.call('vote', true) -> calls api.vote(true); shows toast on error; renders returned view. */
  K.call = async (name, ...args) => {
    if (busy.has(name)) return { ok: false, busy: true };
    if (typeof api[name] !== 'function') { UI.toast(K.L('준비 중인 기능이에요', 'Coming soon')); return { ok: false }; }
    busy.add(name); document.documentElement.classList.add('ux-busy');
    try {
      const r = await api[name](...args);
      if (r && r.offline) { netDown = Date.now(); connCheck(); }
      if (r && r.ok === false) { if (r.error && !r.toasted) UI.toast(r.errorEn || r.errorKey ? r : r.error); }
      else if (r) { netDown = 0; connCheck(); }
      else if (r && r.view) UI.render(r.view);
      return r || { ok: true };
    } catch (e) { UI.toast(K.L('연결이 불안정해요. 다시 시도해 주세요.', 'The connection is unstable. Please try again.')); return { ok: false }; }
    finally { busy.delete(name); if (!busy.size) document.documentElement.classList.remove('ux-busy'); }
  };
  K.busy = name => busy.has(name);

  // ---------- click delegation ----------
  /* Elements with data-act="name" call K.actions[name](dataset, el, event). Parts add their own actions. */
  K.actions = K.actions || {};
  function onClick(e) {
    const t = e.target.closest('[data-act]'); if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
    const fn = K.actions[t.dataset.act]; if (!fn) return;
    e.preventDefault(); fn(t.dataset, t, e);
  }

  // ---------- shared top-bar buttons ----------
  K.soundBtn = () => '<button class="ux-icon-btn" data-act="sound" aria-label="' + K.L('소리', 'Sound') + '">' + (Sound.on ? '🔔' : '🔕') + '</button>';
  K.actions.sound = (d, el) => { Sound.set(!Sound.on); el.textContent = Sound.on ? '🔔' : '🔕'; UI.toast(Sound.on ? K.L('소리를 켰어요', 'Sound on') : K.L('소리를 껐어요', 'Sound off'), 'info'); };

  // ---------- screen manager ----------
  let rootEl, appEl, stageEl, screenEl = null, screenName = null;
  K.local = {};     // per-screen local UI state; reset when the screen changes
  K.view = null;    // latest view
  K.screenFor = v => {
    if (!v) return 'home';
    if (v.phase === 'lobby') return 'lobby';
    if (v.phase === 'reveal') return 'reveal';
    if (v.phase === 'end') return 'end';
    return 'board';
  };
  /* K.rebuild(): throw away the current screen and build it again (used after a language switch). */
  K.rebuild = () => { if (!stageEl) return; const v = K.view; screenName = null; if (screenEl) { screenEl.remove(); screenEl = null; } renderScreen(v); };
  K.rerender = () => { if (screenName && K.screens[screenName] && screenEl) K.screens[screenName].update(K.view, K, screenEl); };
  function renderScreen(v) {
    const name = K.screenFor(v);
    const S = K.screens[name];
    if (!S) { return; }
    if (name !== screenName || !screenEl) {
      const old = screenEl; screenName = name; K.local = {};
      screenEl = S.build(v, K); screenEl.classList.add('ux-screen', 'enter');
      if (old) { old.classList.remove('enter'); old.classList.add('leave'); setTimeout(() => old.remove(), 360); }
      stageEl.appendChild(screenEl); window.scrollTo(0, 0);
      setTimeout(() => screenEl && screenEl.classList.remove('enter'), 600);
      S.update(v, K, screenEl);
    } else S.update(v, K, screenEl);
    const won = v && v.phase === 'end' && v.winner;
    appEl.classList.toggle('is-evil-tint', won === 'evil');
    FX.setMood(won === 'evil' ? 'evil' : 'good');
    (K.onRender || []).forEach(f => { try { f(v, name, screenEl); } catch (err) { console.error('[UI] onRender', err); } });
  }
  K.screenEl = () => screenEl;

  // ---------- server clock (for starting animations at the same moment on every phone) ----------
  /* The server sends serverNow (ms, when the view was built) and phaseStartedAt (ms, when the phase, round or
     proposal last changed — every vote/quest/lamp result changes one of them in the same action). Every phone
     starts the cinematics and scene transitions at phaseStartedAt + SYNC_LEAD on the server clock. Without the
     fields everything plays on arrival. */
  const clockS = [];
  K.clock = {
    offset: null,
    sample(serverNow) {
      if (typeof serverNow !== 'number' || !isFinite(serverNow)) return;
      clockS.push(serverNow - Date.now()); if (clockS.length > 10) clockS.shift();
      K.clock.offset = Math.max.apply(null, clockS);   // the least-delayed sample is closest to the truth
    },
    now() { try { if (window.Net && typeof Net.serverTime === 'function') { const t = Net.serverTime(); if (isFinite(t)) return t; } } catch (e) { } return Date.now() + (K.clock.offset || 0); },
    has() { return K.clock.offset !== null || !!(window.Net && typeof Net.serverTime === 'function'); },
    reset() { clockS.length = 0; K.clock.offset = null; }
  };
  K.SYNC_LEAD = 900;     // ms after the server moment that every phone starts together
  K.evAt = (e, v) => {
    const d = e && e.d; if (d && typeof d.at === 'number') return d.at;
    if (v && typeof v.phaseStartedAt === 'number') return v.phaseStartedAt;
    return null;
  };
  /* Waits until the shared start moment. Returns how late we are (ms, 0 if on time or unsynced). */
  K.syncWait = async (at) => {
    if (at == null || !K.clock.has()) return 0;
    const start = at + K.SYNC_LEAD, wait = start - K.clock.now();
    if (wait > 0) { await K.sleep(Math.min(wait, 2500)); return 0; }
    return -wait;
  };

  // ---------- event detection + cinematic queue ----------
  let seen = null, cineBusy = false;
  const seenKey = code => 'seen-' + code;
  function loadSeen(v) {
    const s = K.store.sget(seenKey(v.code), null);
    seen = s && s.code === v.code ? s : { code: v.code, vote: v.lastVote ? v.lastVote.seq : null, quest: v.lastQuest ? v.lastQuest.seq : null, lady: v.lastLady ? v.lastLady.seq : null, loyalty: (v.loyaltyRevealed || []).length, phase: v.phase, round: v.round };
  }
  function detect(v) {
    const ev = [];
    if (v.phase === 'lobby') { seen.vote = seen.quest = seen.lady = null; seen.loyalty = 0; }
    if (seen.phase === 'lobby' && v.phase === 'reveal') ev.push({ type: 'deal' });
    if (v.lastVote && v.lastVote.seq !== seen.vote) { seen.vote = v.lastVote.seq; ev.push({ type: 'vote', d: v.lastVote }); }
    if (v.lastQuest && v.lastQuest.seq !== seen.quest) {
      seen.quest = v.lastQuest.seq;
      /* Scroll of the Word: public use (lastQuest.excalibur) plays just before the mission result; the holder also gets
         their private result (me.excaliburResults entry for that round). */
      const xc = v.lastQuest.excalibur;
      if (xc && xc.holderId) {
        const mine = v.me && xc.holderId === v.me.id, rd = v.lastQuest.round;
        const res = mine && xc.targetId ? ((v.me.excaliburResults || []).filter(r => r.round === rd && r.targetId === xc.targetId).pop() || null) : null;
        ev.push({ type: 'excalibur', d: Object.assign({ round: rd }, xc), result: res });
      }
      ev.push({ type: 'quest', d: v.lastQuest });
    }
    /* Crossroads card (Lancelot module): a new entry in view.loyaltyRevealed = one card turned face up. */
    const lr = v.loyaltyRevealed || [];
    if (typeof seen.loyalty !== 'number') seen.loyalty = lr.length;
    if (lr.length > seen.loyalty) { for (let i = seen.loyalty; i < lr.length; i++) ev.push({ type: 'loyalty', d: lr[i], n: i + 1, all: lr.slice(0, i + 1) }); }
    seen.loyalty = lr.length;
    if (v.lastLady && v.lastLady.seq !== seen.lady) {
      seen.lady = v.lastLady.seq;
      const mine = v.me && v.lastLady.holderId === v.me.id;
      const res = mine ? ((v.me.ladyResults || []).filter(r => r.targetId === v.lastLady.targetId).pop() || null) : null;
      ev.push({ type: 'lady', d: v.lastLady, result: res });
    }
    if (seen.phase === 'reveal' && /^(propose|vote|quest|excalibur|lady)$/.test(v.phase)) { if (!v.round) ev.push({ type: 'begin' }); ev.push({ type: 'journey', from: -1, to: v.round || 0 }); }
    else if (typeof v.round === 'number' && typeof seen.round === 'number' && v.round !== seen.round && /^(propose|vote|quest|excalibur|lady)$/.test(v.phase) && /^(propose|vote|quest|excalibur|lady)$/.test(seen.phase || '')) ev.push({ type: 'journey', from: seen.round, to: v.round });
    if (v.phase === 'assassin' && seen.phase && seen.phase !== 'assassin') ev.push({ type: 'assassin' });
    if (v.phase === 'end' && seen.phase && seen.phase !== 'end') ev.push({ type: 'end' });
    seen.phase = v.phase; seen.round = v.round;
    // when several results land in one view (slow phone, reconnect), play them in the order they happened
    const R = v.round || 0, rank = e => e.type === 'deal' ? -100 : e.type === 'begin' ? -50 : e.type === 'vote' ? (e.d.round || 0) * 10 + 3
      : e.type === 'quest' ? (e.d.round || 0) * 10 + 5 : e.type === 'excalibur' ? (e.d.round || 0) * 10 + 4.5 : e.type === 'loyalty' ? (e.d.round != null ? e.d.round : R) * 10 + 2 : e.type === 'lady' ? R * 10 + .5 : e.type === 'journey' ? e.to * 10 + 1 : e.type === 'assassin' ? 1000 : 1001;
    return ev.map((e, i) => [rank(e), i, e]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]).filter(e => K.cine[e.type]);
  }
  function makeCtx() {
    const ov = K.el('<div class="ux-overlay" role="dialog" aria-live="polite"><div class="inner"></div></div>');
    const skip = K.el('<button class="ux-skip">' + K.L('건너뛰기', 'Skip') + ' ›</button>');
    const ctx = {
      el: ov, inner: ov.firstElementChild, skipped: false, waiters: [],
      sleep(ms) { if (ctx.skipped) return Promise.resolve(); return new Promise(r => { const t = setTimeout(done, ms); function done() { clearTimeout(t); ctx.waiters = ctx.waiters.filter(w => w !== done); r(); } ctx.waiters.push(done); }); },
      /* wait for a tap anywhere (or ms timeout) */
      tapOrWait(ms) { if (ctx.skipped) return Promise.resolve(); return new Promise(r => { let fin = false; const go = () => { if (fin) return; fin = true; ov.removeEventListener('click', go); r(); }; ov.addEventListener('click', go); ctx.sleep(ms).then(go); }); },
      set(html) { ctx.inner.innerHTML = html; },
      skip() { ctx.skipped = true; ctx.waiters.slice().forEach(w => w()); }
    };
    skip.addEventListener('click', e => { e.stopPropagation(); ctx.skip(); });
    ov.appendChild(skip); document.body.appendChild(ov);
    return ctx;
  }
  async function playAll(evs) {
    let first = true;
    for (const e of evs) {
      if (first) { first = false; e.late = await K.syncWait(K.evAt(e, K.view)); } else e.late = 0;
      const ctx = makeCtx(); ctx.late = e.late;
      try { await K.cine[e.type](ctx, e, K.view, K); } catch (err) { console.error('[UI] cinematic failed', e.type, err); }
      ctx.el.classList.add('out'); await K.sleep(ctx.skipped ? 120 : 380); ctx.el.remove();
    }
  }
  function pump() {
    const v = K.view;
    if (!v) { renderScreen(null); return; }
    if (!seen || seen.code !== v.code) loadSeen(v);
    const evs = detect(v);
    K.store.sset(seenKey(v.code), seen);
    if (evs.length) {
      cineBusy = true;
      // Render the screen underneath first only when it does not spoil the result (lobby->reveal deal).
      playAll(evs).then(() => { cineBusy = false; pump(); });
      return;
    }
    renderScreen(v);
  }
  K.cineBusy = () => cineBusy;

  // ---------- connection watchdog ----------
  let lastViewAt = 0, connEl = null, connForced = null, netDown = 0;
  function connShow(msg) {
    if (!connEl) { connEl = K.el('<div class="ux-conn" role="status"><span class="ux-dots"><i></i><i></i><i></i></span><span class="t"></span></div>'); document.body.appendChild(connEl); }
    connEl.querySelector('.t').textContent = msg;
  }
  function connHide() { if (connEl) { connEl.remove(); connEl = null; } }
  function connCheck() {
    if (connForced === 'offline' || connForced === 'reconnecting') return connShow(connForced === 'offline' ? K.L('연결이 끊겼어요. 다시 연결하는 중…', 'Disconnected. Reconnecting…') : K.L('다시 연결하는 중…', 'Reconnecting…'));
    if (navigator.onLine === false) return connShow(K.L('인터넷 연결이 끊겼어요. 다시 연결하는 중…', 'No internet connection. Reconnecting…'));
    if (netDown && Date.now() - netDown < 8000) return connShow(K.L('연결이 불안정해요. 다시 연결하는 중…', 'Unstable connection. Reconnecting…'));
    connHide();
  }
  /* Optional extra (not in contract): app.js may call UI.setConnection('online'|'offline'|'reconnecting'). */
  UI.setConnection = s => { connForced = s === 'online' ? null : s; connCheck(); };

  // ---------- public API ----------
  /* UI.init(root, api, THEME, extra?) — extra may be window.GUIDE (app.js passes it) or {assetBase, guide}. */
  UI.init = (root, apiObj, theme, extra) => {
    rootEl = root; api = apiObj || {}; T = theme || window.THEME || {}; K.baseTheme = T;
    const opts = extra && (extra.build || extra.quick || extra.phaseHints) ? { guide: extra } : (extra || {});
    if (opts.guide && !window.GUIDE) window.GUIDE = opts.guide;
    if (opts.assetBase) assetBase = opts.assetBase.replace(/\/?$/, '/');
    K.api = api;
    Sound.init();
    rootEl.innerHTML = '';
    appEl = K.el('<div class="ux-app"><div class="ux-pattern"></div><canvas class="ux-fx" aria-hidden="true"></canvas><div class="ux-stage"></div></div>');
    rootEl.appendChild(appEl);
    stageEl = appEl.querySelector('.ux-stage'); K.appEl = appEl;
    const pat = appEl.querySelector('.ux-pattern'); const pimg = new Image();
    pimg.onload = () => { pat.style.backgroundImage = 'url("' + K.asset('bg-pattern.svg') + '")'; }; pimg.src = K.asset('bg-pattern.svg');
    toastsEl = K.el('<div class="ux-toasts" aria-live="assertive"></div>'); document.body.appendChild(toastsEl);
    document.addEventListener('click', onClick);
    FX.init(appEl.querySelector('.ux-fx'));
    window.addEventListener('online', connCheck); window.addEventListener('offline', connCheck);
    setInterval(connCheck, 3000);
    if (T.title) document.title = T.title;
    if (K.onInit) K.onInit.forEach(f => f(K));
  };
  /* UI.render(view|null, homeOpts?) — homeOpts {code} prefills the join code on the home screen. */
  UI.render = (v, homeOpts) => {
    if (!v && homeOpts) K.homeOpts = homeOpts;
    if (v && K.view && v.code === K.view.code && typeof v.v === 'number' && typeof K.view.v === 'number' && v.v < K.view.v) { lastViewAt = Date.now(); connCheck(); return; }
    if (!v) { seen = null; }
    if (v && typeof v.serverNow === 'number') K.clock.sample(v.serverNow);
    K.view = v || null; lastViewAt = v ? Date.now() : 0; connCheck();
    if (cineBusy) return;   // the queue picks up the newest view when it ends
    pump();
  };
})();
