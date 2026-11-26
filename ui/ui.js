/* 빛의 원정대 UI — generated from ui/src by build.js. Edit ui/src/*.js, then run: node ui/build.js */

/* ---- src/00-core.js ---- */
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
  /* token names -> art files (CONTRACT asset list); other names map to <name>.svg */
  const TOKEN_FILE = { success: 'token-success', fail: 'token-fail', approve: 'vote-approve', reject: 'vote-reject' };
  K.tokenImg = (name, cls) => K.img(K.asset((TOKEN_FILE[name] || name) + '.svg'), name, cls);
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
     starts the cinematics and scene transitions at phaseStartedAt + SYNC_LEAD on the server clock. A phone whose
     view arrives after that moment catches up (ctx.debt in playAll); one that was busy with an earlier cinematic
     plays from the start. The phase banner (45-journey.js) runs for view.transitionMs and is skipped once that
     window has passed. A reload or a new device never replays: `seen` is kept per tab and starts from the
     current view. Without the fields everything plays on arrival. */
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
    if (lr.length > seen.loyalty) { for (let i = seen.loyalty; i < lr.length; i++) {
      /* Variant 2: every card is face up from the start, so only a real switch after mission 1 gets a cinematic (the reveal and board already show the plan). */
      if (v.lancelot === 2 && (!lr[i] || lr[i].card !== 'switch' || !lr[i].round)) continue;
      ev.push({ type: 'loyalty', d: lr[i], n: i + 1, all: lr.slice(0, i + 1) });
    } }
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
    const wait = ms => new Promise(r => { const t = setTimeout(done, ms); function done() { clearTimeout(t); ctx.waiters = ctx.waiters.filter(w => w !== done); r(); } ctx.waiters.push(done); });
    const ctx = {
      el: ov, inner: ov.firstElementChild, skipped: false, waiters: [],
      /* debt (ms): how far behind the other phones this one started (its view arrived late). Timed steps eat it
         first, so the beats (countdown, flips, result) land at the same moment as on the other phones. */
      debt: 0,
      takeDebt(max) { const d = Math.max(0, Math.min(ctx.debt, max == null ? ctx.debt : max)); ctx.debt -= d; return d; },
      sleep(ms) { if (ctx.skipped) return Promise.resolve(); ms -= ctx.takeDebt(ms); return ms > 0 ? wait(ms) : Promise.resolve(); },
      /* wait for a tap anywhere (or ms timeout); the closing hold is never shortened by debt */
      tapOrWait(ms) { if (ctx.skipped) return Promise.resolve(); return new Promise(r => { let fin = false; const go = () => { if (fin) return; fin = true; ov.removeEventListener('click', go); r(); }; ov.addEventListener('click', go); wait(ms).then(go); }); },
      set(html) { ctx.inner.innerHTML = html; },
      skip() { ctx.skipped = true; ctx.waiters.slice().forEach(w => w()); }
    };
    skip.addEventListener('click', e => { e.stopPropagation(); ctx.skip(); });
    ov.appendChild(skip); document.body.appendChild(ov);
    return ctx;
  }
  /* queued: these events waited behind an earlier cinematic on this phone, so start them from the beginning.
     Otherwise a phone whose view arrived late (slow network, reload) catches up: its first cinematic starts with
     debt = how late it is, so the beats line up with the phones that started on time. */
  async function playAll(evs, queued) {
    let debt = 0, first = true;
    for (const e of evs) {
      if (first) { first = false; e.late = await K.syncWait(K.evAt(e, K.view)); if (!queued) debt = e.late; } else e.late = 0;
      const ctx = makeCtx(); ctx.late = e.late; ctx.debt = debt;
      try { await K.cine[e.type](ctx, e, K.view, K); } catch (err) { console.error('[UI] cinematic failed', e.type, err); }
      debt = ctx.debt;   // whatever this one could not absorb carries over to the next in the batch
      ctx.el.classList.add('out'); await K.sleep(ctx.skipped ? 120 : 380); ctx.el.remove();
    }
  }
  function pump(queued) {
    const v = K.view;
    if (!v) { renderScreen(null); return; }
    if (!seen || seen.code !== v.code) loadSeen(v);
    const evs = detect(v);
    K.store.sset(seenKey(v.code), seen);
    if (evs.length) {
      cineBusy = true;
      // Render the screen underneath first only when it does not spoil the result (lobby->reveal deal).
      playAll(evs, queued).then(() => { cineBusy = false; pump(true); });
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


/* ---- src/01-i18n.js ---- */
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
      lancelotGood: { name: 'Pilgrim at the Crossroads', short: 'Pilgrim', desc: 'You start with the Workers of Light. In Variants 1 and 2 a Crossroads card can switch your side. Always play for your current side.' },
      lancelotEvil: { name: 'Shadow at the Crossroads', short: 'Shadow', desc: 'You start with the Tempters. In Variants 1 and 2 a Crossroads card can switch your side. Always play for your current side.' }
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
    knowledgeText: { evil: 'Tempter', merlinCandidate: 'Prophet candidate', lancelot: 'The other Lancelot' },
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


/* ---- src/10-common.js ---- */
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
    const done = new Set((v.loyaltyRevealed || []).map(x => x.round));   // cards already in effect (mission 1's applies at the deal)
    return '<div class="uxc-loy">' + plan.map((c, i) => loyCard(c, i, done.has(i) ? 'done' : '')).join('') + '</div>';
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


/* ---- src/20-home.js ---- */
/* Home: create room, join by code, short guide. Nothing else. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;

  function codeFromUrl() {
    try { const p = new URLSearchParams(location.search); return (p.get('code') || location.hash.replace(/^#/, '') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); } catch (e) { return ''; }
  }

  K.screens.home = {
    build() {
      const T = K.T();
      const name = K.store.get('name', '');
      const code = (K.homeOpts && K.homeOpts.code) || codeFromUrl();
      const title = T.title || K.L('빛의 원정대', 'Expedition of Light');
      // title letters drop in one by one; words stay whole so a long English title wraps between words
      let li = 0;
      const step = K.isEn() ? 45 : 70;
      const letters = title.split(' ').map(w => '<span class="w">' + Array.from(w).map(ch => '<span style="animation-delay:' + (220 + (li++) * step) + 'ms">' + esc(ch) + '</span>').join('') + '</span>').join(' ');
      const lang = K.lang, G = K.G(), gui = (G && G.ui) || {};
      const el = K.el('<section class="uxh">' +
        '<div class="uxh-lang uxh-fade" role="group" aria-label="' + esc(gui.language || K.L('언어', 'Language')) + '" style="animation-delay:.2s">' +
        '<button data-act="lang" data-lang="ko" class="' + (lang === 'ko' ? 'on' : '') + '" aria-pressed="' + (lang === 'ko') + '">한국어</button>' +
        '<button data-act="lang" data-lang="en" class="' + (lang === 'en' ? 'on' : '') + '" aria-pressed="' + (lang === 'en') + '">English</button></div>' +
        '<div class="uxh-rays" aria-hidden="true"></div>' +
        '<div class="ux-home-hero">' + K.emblem(156) +
        '<h1 class="ux-h1 uxh-title">' + letters + '</h1>' +
        '<p class="ux-subtitle uxh-sub uxh-fade" style="animation-delay:.9s">' + esc(T.subtitle || K.L('수련회 숨은 역할 추리 게임', 'A hidden-role mystery game for church retreats')) + '</p>' +
        '<div class="uxh-fade" style="animation-delay:1.1s">' + K.verse('home') + '</div></div>' +
        '<div class="ux-panel uxh-card" style="animation-delay:.5s"><div class="ux-stack">' +
        '<label class="ux-field"><span class="ux-label">' + K.L('내 이름', 'My name') + '</span><input class="ux-input" id="uxh-name" maxlength="10" autocomplete="nickname" enterkeyhint="done" placeholder="' + K.L('예) 은혜', 'e.g. Grace') + '" value="' + esc(name) + '"></label>' +
        '<button class="ux-btn ux-btn-gold" data-act="h-create">🕯️ ' + K.L('방 만들기', 'Create a room') + '</button>' +
        '<div class="ux-divider">' + K.L('또는 코드로 참가', 'or join with a code') + '</div>' +
        '<div class="ux-row" style="align-items:stretch"><input class="ux-input ux-code-input" id="uxh-code" maxlength="6" inputmode="text" autocapitalize="characters" autocomplete="off" placeholder="' + K.L('코드', 'Code') + '" value="' + esc(code) + '" style="flex:1.3">' +
        '<button class="ux-btn ux-btn-ghost" data-act="h-join" style="flex:1">' + K.L('참가하기', 'Join') + '</button></div>' +
        '</div></div>' +
        '<button class="uxh-guide uxh-fade" data-act="cm-guide" style="animation-delay:.8s"><span class="bk">📖</span><span><b>' + esc(gui.quickButton || K.L('1분 설명서', '1-Minute Guide')) + '</b><small>' + K.L('처음이라면 여기부터', 'New here? Start here') + '</small></span><span class="ar">›</span></button>' +
        '</section>');
      const nameIn = el.querySelector('#uxh-name'), codeIn = el.querySelector('#uxh-code');
      nameIn.addEventListener('input', () => K.store.set('name', nameIn.value.trim()));
      codeIn.addEventListener('input', () => { const c = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c !== codeIn.value) codeIn.value = c; });
      codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') K.actions['h-join'](); });
      nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') { if (codeIn.value) K.actions['h-join'](); else nameIn.blur(); } });
      return el;
    },
    update() { }
  };

  function getName() {
    const i = document.getElementById('uxh-name'); const n = i ? i.value.trim() : '';
    if (!n) { K.toast(K.L('이름을 먼저 적어 주세요', 'Please enter your name first')); if (i) { K.shake(i); i.focus(); } return null; }
    K.store.set('name', n); return n;
  }
  async function go(btn, fn) {
    if (!btn || btn.classList.contains('is-loading')) return;
    const label = btn.innerHTML; btn.classList.add('is-loading'); btn.innerHTML = '<span class="ux-dots"><i></i><i></i><i></i></span>';
    const r = await fn();
    if (document.body.contains(btn)) { btn.classList.remove('is-loading'); btn.innerHTML = label; }
    return r;
  }
  K.actions['h-create'] = async (d, btn) => {
    const n = getName(); if (!n) return;
    K.fb('pick'); K.fx.burstAt(btn, { n: 26, speed: 180 });
    await go(btn, () => K.call('create', n));
  };
  K.actions['h-join'] = async (d, btn) => {
    btn = btn || document.querySelector('[data-act="h-join"]');
    const n = getName(); if (!n) return;
    const ci = document.getElementById('uxh-code'); const c = ci ? ci.value.trim().toUpperCase() : '';
    if (c.length < 4) { K.toast(K.L('방 코드를 입력해 주세요', 'Please enter the room code')); if (ci) { K.shake(ci); ci.focus(); } return; }
    K.fb('pick');
    await go(btn, () => K.call('join', c, n));
  };

  const css = `
.uxh { position: relative; gap: 16px; }
.uxh-rays { position: absolute; left: 50%; top: -120px; width: 700px; height: 700px; margin-left: -350px; pointer-events: none; opacity: .5;
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,220,150,.13) 0 4deg, transparent 4deg 16deg);
  -webkit-mask: radial-gradient(circle, #000 10%, transparent 62%); mask: radial-gradient(circle, #000 10%, transparent 62%);
  animation: spin 90s linear infinite; will-change: transform; }
.uxh-title { font-size: 48px; letter-spacing: .04em; margin-top: -6px; white-space: nowrap; }
.uxh-title .w { display: inline-block; white-space: nowrap; }
.uxh-title .w span { display: inline-block; animation: uxhDrop .7s var(--ease-spring) both; }
.ux-en .uxh-title { font-size: 40px; white-space: normal; line-height: 1.08; letter-spacing: .01em; max-width: 340px; }
.ux-en .uxh-sub { font-size: 15px; }
.uxh-lang { align-self: flex-end; display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(7,10,28,.72); border: 1px solid var(--line-strong); position: relative; z-index: 2; margin-bottom: -8px; }
.uxh-lang button { min-height: 34px; padding: 0 14px; border-radius: 999px; font-size: 14px; font-weight: 700; color: var(--text-dim); transition: background .25s, color .25s; }
.uxh-lang button.on { background: linear-gradient(180deg, #ffe08a, #e9b949); color: #2a1d08; box-shadow: 0 0 14px rgba(244,201,107,.45); }
.uxh-sub { display: inline-block; padding: 6px 16px; border-radius: 999px; background: rgba(7,10,28,.72); border: 1px solid var(--line-strong); }
@keyframes uxhDrop { from { opacity: 0; transform: translateY(-26px) scale(1.3); } to { opacity: 1; transform: none; } }
.uxh-fade { animation: uxhFade .9s var(--ease-out) both; }
@keyframes uxhFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.uxh-card { animation: uxhCard .8s var(--ease-out) both; }
@keyframes uxhCard { from { opacity: 0; transform: translateY(30px) scale(.97); } to { opacity: 1; transform: none; } }
.uxh-guide { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border-radius: 16px; text-align: left;
  background: linear-gradient(100deg, rgba(244,201,107,.14), rgba(143,108,240,.10)); border: 1px solid var(--line-strong); }
.uxh-guide:active { transform: scale(.98); }
.uxh-guide .bk { font-size: 26px; display: inline-block; animation: uxhBook 3s ease-in-out infinite; }
@keyframes uxhBook { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg) translateY(-2px); } }
.uxh-guide b { display: block; font-size: 16px; color: var(--gold-hi); } .uxh-guide small { color: var(--text-mute); font-size: 12px; }
.uxh-guide .ar { margin-left: auto; font-size: 22px; color: var(--gold); }
.ux-btn.is-loading { pointer-events: none; }
`;
  const st = document.createElement('style'); st.id = 'uxh-style'; st.textContent = css; document.head.appendChild(st);
})();


/* ---- src/21-lobby.js ---- */
/* Lobby: room code, players + ready, host settings, start. */
(function () {
  'use strict';
  const K = window.UI._k, esc = K.esc;
  const TOPK = ['lady', 'balance', 'excalibur'];   // top-level boolean settings (the rest are settings.roles)
  const ui = (k, ko, en) => { const g = K.G(), u = g && g.ui; return (u && u[k]) || K.L(ko, en); };

  K.screens.lobby = {
    build(v) {
      return K.el('<section class="uxl">' +
        '<div class="ux-top"><div class="grow"><div class="ux-top-title">' + esc(K.T().title || K.L('빛의 원정대', 'Light Expedition')) + '</div><div class="ux-top-sub">' + esc(K.L('대기실', 'Lobby')) + '</div></div>' +
        '<button class="ux-icon-btn" data-act="cm-guide" aria-label="' + esc(ui('helpButton', '설명서', 'Guide')) + '">📖</button>' + K.soundBtn() +
        '<button class="ux-icon-btn" data-act="l-leave" aria-label="' + esc(K.L('나가기', 'Leave')) + '">🚪</button></div>' +
        '<div class="ux-panel ux-code-card uxl-in" style="animation-delay:.05s"><div class="ux-label">' + esc(K.L('참가 코드', 'Room code')) + '</div><div class="ux-code" data-slot="code"></div>' +
        '<div class="ux-row" style="justify-content:center"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-copy">📋 ' + esc(K.L('복사', 'Copy')) + '</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-share">📨 ' + esc(K.L('초대하기', 'Invite')) + '</button></div></div>' +
        '<div data-slot="seat"></div><div data-slot="hint"></div>' +
        '<div class="ux-panel uxl-in" style="animation-delay:.12s"><div class="ux-panel-head"><h3 class="ux-h3">' + esc(K.L('함께하는 사람', 'Players')) + '</h3><span class="ux-chip" data-slot="count"></span></div>' +
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
      K.patch(el.querySelector('[data-slot=seat]'), K.seatNotice ? K.seatNotice(v) : '');
      K.patch(el.querySelector('[data-slot=hint]'), hint ? '<p class="ux-p ux-center uxl-hint">' + esc(hint) + '</p>' : '');

      // players
      const items = ps.map(p => ({
        key: p.id, html: '<div class="ux-player' + (K.isMe(v, p.id) ? ' is-me' : '') + (p.ready || p.isHost ? ' is-ready' : '') + '">' + K.avatar(p, true) +
          '<div class="ux-player-name">' + esc(p.name) + (K.isMe(v, p.id) ? '<small>' + esc(K.L('나', 'me')) + '</small>' : '') + '</div>' +
          (p.isHost ? '<span class="ux-badge gold">👑 ' + esc(K.term('host', K.L('방장', 'Host'))) + '</span>' : (p.ready ? '<span class="ux-badge ok">✓ ' + esc(K.term('ready', K.L('준비 완료', 'Ready'))) + '</span>' : '<span class="ux-badge">' + esc(K.L('기다리는 중', 'Waiting')) + '</span>')) +
          (isHost && !p.isHost ? '<button class="ux-kick" data-act="l-kick" data-id="' + esc(p.id) + '" aria-label="' + esc(K.L('내보내기', 'Remove') + ' ' + p.name) + '">✕</button>' : '') + '</div>'
      }));
      for (let i = n; i < Math.max(5, Math.min(max, n + 1)); i++) items.push({ key: 'empty' + i, html: '<div class="ux-player ux-empty-seat">' + esc(i < 5 ? K.L('빈 자리 · 최소 5명', 'Empty seat · min. 5') : K.L('빈 자리', 'Empty seat')) + '</div>' });
      K.patchList(el.querySelector('[data-slot=players]'), items);

      // balance
      const cnt = Math.max(5, Math.min(10, n));
      const evil = (n >= 5 && v.evilCount) || K.EVIL_COUNT[cnt];
      const sizes = (n >= 5 && v.teamSizes) || K.TEAM_SIZES[cnt];
      const rig = Array.isArray(v.rolesInGame) && v.rolesInGame.length ? '<div class="ux-roles-strip" style="margin-top:10px">' + v.rolesInGame.map(K.rolePill).join('') + '</div>' : '';
      K.patch(el.querySelector('[data-slot=balance]'),
        '<div class="ux-balance"><div class="g"><b>' + (cnt - evil) + '</b>' + esc(K.teamName('good')) + '</div><div class="e"><b>' + evil + '</b>' + esc(K.teamName('evil')) + '</div></div>' +
        '<p class="ux-muted ux-center" style="margin-top:8px">' + esc(K.L((n < 5 ? cnt + '명 기준 · ' : '') + K.term('quest', '사명') + ' 인원 ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4번째는 ' + K.term('fail', '방해') + ' 2장' : ''),
          (n < 5 ? 'For ' + cnt + ' players · ' : '') + K.term('quest', 'Mission') + ' sizes ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4th needs 2 ' + K.term('fail', 'Hindrance') + ' cards' : ''))) + '</p>' + rig);

      // settings
      const sw = (k, label) => '<button class="ux-switch' + (val(k) ? ' on' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + val(k) + '" aria-label="' + esc(label) + '"></button>';
      const val = (k) => (k in pend ? pend[k] : (TOPK.indexOf(k) >= 0 ? !!s[k] : !!roles[k]));
      const g = K.G(), presets = g && g.presets;
      let h = '<div class="ux-panel-head"><h3 class="ux-h3">' + esc(K.L('역할과 규칙', 'Roles & rules')) + '</h3>' + (isHost ? '' : '<span class="ux-muted">' + esc(K.L('방장이 정해요', 'The host decides')) + '</span>') + '</div>';
      if (isHost && presets) h += '<div class="uxl-presets">' + Object.keys(presets).map(k => '<button class="ux-chip" data-act="l-preset" data-k="' + esc(k) + '">✨ ' + esc(presets[k].label || k) + '</button>').join('') + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">' + esc(K.L('최대 인원', 'Max players')) + '</div><div class="desc">' + esc(K.L('5~10명', '5–10 players')) + '</div></div><div class="ux-stepper">' +
        (isHost ? '<button data-act="l-max" data-d="-1" aria-label="' + esc(K.L('줄이기', 'Fewer')) + '"' + (max <= Math.max(5, n) ? ' disabled' : '') + '>−</button>' : '') + '<span class="val">' + max + '</span>' +
        (isHost ? '<button data-act="l-max" data-d="1" aria-label="' + esc(K.L('늘리기', 'More')) + '"' + (max >= 10 ? ' disabled' : '') + '>+</button>' : '') + '</div></div>';
      K.OPTIONAL_ROLES.forEach(k => {
        const on = val(k), ev = K.teamOf(k) === 'evil';
        h += '<div class="ux-setting"><div class="thumb">' + K.roleImg(k) + '</div><div class="txt"><div class="name">' + esc(K.roleName(k)) + ' <span class="ux-badge ' + (ev ? 'evil' : 'gold') + '" style="padding:2px 7px">' + esc(ev ? K.teamName('evil') : K.teamName('good')) + '</span></div><div class="desc">' + esc(K.roleDesc(k)) + '</div></div>' +
          '<button class="ux-switch' + (on ? ' on' : '') + (ev ? ' evil' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + esc(K.roleName(k)) + '"></button></div>';
      });
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.tokenImg('lady') + '</div><div class="txt"><div class="name">' + esc(K.term('lady', K.L('등불', 'Lamp'))) + '</div><div class="desc">' + esc(K.L('2·3·4번째 ' + K.term('quest', '사명') + ' 뒤에 한 사람의 진영을 몰래 확인해요. 7명 이상 추천.', 'After the 2nd, 3rd and 4th ' + K.term('quest', 'Mission') + 's, secretly check one player\'s side. Best with 7+.')) + '</div></div>' +
        sw('lady', K.term('lady', K.L('등불', 'Lamp'))) + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">' + esc(K.L('균형 모드', 'Balance mode')) + '</div><div class="desc">' + esc(K.L('5명·7명일 때 ' + K.term('quest', '사명') + ' 인원을 바꿔 균형을 맞춰요.', 'With 5 or 7 players, ' + K.term('quest', 'Mission') + ' sizes change for a fairer game.')) + '</div></div>' +
        sw('balance', K.L('균형 모드', 'Balance mode')) + '</div>';
      // expansions
      const modTag = '<span class="ux-badge" style="padding:2px 7px">' + esc(ui('moduleTag', '확장', 'Expansion')) + '</span>';
      const lan = 'lancelot' in pend ? pend.lancelot : (Number(s.lancelot) || 0);
      const lanDesc = lan ? K.lanVarRule(lan) + ' ' + K.L(K.teamName('evil') + '는 ' + K.roleBase('lancelotEvil') + '를 알지만, ' + K.roleBase('lancelotEvil') + '는 아무도 몰라요.', K.teamName('evil') + ' see the ' + K.roleBase('lancelotEvil') + ', who sees no one.')
        : K.L('선한 랜슬롯과 악한 랜슬롯이 함께해요. 아래에서 공식 변형 1·2·3 중 하나를 골라요.', 'Adds a Good and an Evil Lancelot. Pick one of the official variants 1, 2 or 3 below.');
      h += '<div class="ux-setting uxl-mod"><div class="thumb">' + K.roleImg(lan ? 'lancelotEvil' : 'lancelotGood') + '</div><div class="txt"><div class="name">' + esc(K.term('lancelot', K.L('갈림길의 순례자 (랜슬롯)', 'Lancelot'))) + ' ' + modTag + '</div><div class="desc">' + esc(lanDesc) + '</div></div>' +
        '<div class="uxl-seg" role="group" aria-label="' + esc(K.term('lancelot', K.L('갈림길의 순례자 (랜슬롯)', 'Lancelot'))) + '">' + [0, 1, 2, 3].map(i => '<button class="' + (lan === i ? 'on' : '') + '" data-act="l-lan" data-n="' + i + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + (lan === i) + '">' + esc(i ? K.lanVarShort(i) : K.L('끔', 'Off')) + '</button>').join('') + '</div></div>';
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.img(K.asset('excalibur.svg'), 'excalibur', '') + '</div><div class="txt"><div class="name">' + esc(K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word'))) + ' ' + modTag + '</div><div class="desc">' +
        esc(K.L(K.term('leader', '조장') + '이 원정대원 한 명에게 주면, 카드를 다 낸 뒤 다른 대원 한 명의 카드를 뒤집을 수 있어요.', 'The ' + K.term('leader', 'Leader') + ' gives it to one team member, who may flip one other member\'s card after all cards are in.')) + '</div></div>' +
        sw('excalibur', K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word'))) + '</div>';
      const se = v.setupError ? (K.isEn() ? (v.setupErrorEn || K.trMsg(v.setupError)) : v.setupError) : '';
      if (se) h += '<div class="ux-warn" style="margin-top:8px">⚠️ ' + esc(se) + '</div>';
      K.patch(el.querySelector('[data-slot=settings]'), h);

      // dock
      const others = ps.filter(p => !p.isHost), readyN = others.filter(p => p.ready).length;
      const allReady = others.every(p => p.ready);
      let d;
      if (isHost) {
        const can = n >= 5 && n <= 10 && allReady && !v.setupError;
        const why = n < 5 ? K.L((5 - n) + '명이 더 필요해요', (5 - n) + ' more needed') : !allReady ? K.L('모두 준비하면 시작할 수 있어요 (' + readyN + '/' + others.length + ')', 'You can start when everyone is ready (' + readyN + '/' + others.length + ')') : v.setupError ? K.L('설정을 확인해 주세요', 'Please check the settings') : K.L('모두 준비됐어요!', 'Everyone is ready!');
        d = '<div class="ux-progress"><i style="width:' + (others.length ? Math.round(100 * readyN / others.length) : 0) + '%"></i></div><p class="ux-muted ux-center">' + esc(why) + '</p>' +
          '<button class="ux-btn ux-btn-gold uxl-start' + (can ? ' can' : '') + '" data-act="l-start"' + (can ? '' : ' disabled') + '>✝️ ' + esc(K.L('게임 시작', 'Start game')) + '</button>';
      } else {
        const r = !!me.ready;
        d = '<p class="ux-muted ux-center">' + (r ? esc(K.L('방장이 시작하기를 기다리는 중', 'Waiting for the host to start')) + ' <span class="ux-dots"><i></i><i></i><i></i></span>' : esc(K.L('준비되면 아래 버튼을 눌러 주세요', 'Tap the button below when you\'re ready'))) + ' · ' + readyN + '/' + others.length + ' ' + esc(K.L('준비', 'ready')) + '</p>' +
          '<button class="ux-btn ux-ready-btn ' + (r ? 'is-ready' : 'ux-btn-gold') + '" data-act="l-ready">' + esc(r ? K.term('ready', K.L('준비 완료', 'Ready')) : K.term('notReady', K.L('준비하기', 'Get ready'))) + '</button>';
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
    try { await navigator.clipboard.writeText(c); K.toast(K.L('코드를 복사했어요', 'Code copied'), 'info'); } catch (e) { K.toast(K.L('코드: ', 'Code: ') + c, 'info'); }
    K.fb('tap');
  };
  K.actions['l-share'] = async () => {
    const c = K.view && K.view.code; if (!c) return;
    const url = location.origin + location.pathname + '?code=' + encodeURIComponent(c);
    const title = K.T().title || K.L('빛의 원정대', 'Light Expedition');
    const text = K.L(title + '에 초대해요! 코드 ' + c, 'Join me for ' + title + '! Code ' + c);
    if (navigator.share) { try { await navigator.share({ title, text, url }); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(text + '\n' + url); K.toast(K.L('초대 링크를 복사했어요', 'Invite link copied'), 'info'); } catch (e) { K.toast(url, 'info'); } }
  };
  K.actions['l-ready'] = (d, btn) => { const r = !(K.view.me && K.view.me.ready); K.fb(r ? 'good' : 'tap'); if (r) K.fx.burstAt(btn, { n: 24, speed: 200 }); K.call('ready', r); };
  K.actions['l-start'] = (d, btn) => { K.fb('chime'); K.fx.burstAt(btn, { n: 50, speed: 320 }); K.call('start'); };
  K.actions['l-kick'] = async d => {
    const nm = K.pname(K.view, d.id);
    if (await K.confirm(K.L(nm + '님을 내보낼까요?', 'Remove ' + nm + ' from the room?'), '', { ok: K.L('내보내기', 'Remove'), cancel: K.L('취소', 'Cancel'), danger: true })) K.call('kick', d.id);
  };
  K.actions['l-leave'] = async () => {
    if (await K.confirm(K.L('대기실에서 나갈까요?', 'Leave the lobby?'), esc(K.L('나가면 코드를 다시 입력해 들어올 수 있어요.', 'You can come back by entering the code again.')), { ok: K.L('나가기', 'Leave'), cancel: K.L('취소', 'Cancel'), danger: true })) K.call('leave');
  };
  K.actions['l-max'] = d => { const s = K.view.settings || {}; const m = Math.max(5, Math.min(10, (s.maxPlayers || 10) + Number(d.d))); K.fb('tick'); K.call('settings', { maxPlayers: m }); };
  K.actions['l-toggle'] = (d, btn) => {
    const v = K.view, s = v.settings || {}, k = d.k;
    const cur = TOPK.indexOf(k) >= 0 ? !!s[k] : !!(s.roles || {})[k];
    btn.classList.toggle('on', !cur); K.fb('pick');
    K.local.pend = Object.assign({}, K.local.pend, { [k]: !cur });
    if (TOPK.indexOf(k) >= 0) K.call('settings', { [k]: !cur });
    else K.call('settings', { roles: Object.assign({}, s.roles || {}, { [k]: !cur }) });
  };
  K.actions['l-lan'] = (d, btn) => {
    const n = Number(d.n) || 0, cur = Number((K.view.settings || {}).lancelot) || 0; if (n === cur) return;
    const seg = btn.parentNode; Array.prototype.forEach.call(seg.children, b => b.classList.toggle('on', b === btn));
    K.fb('pick'); K.local.pend = Object.assign({}, K.local.pend, { lancelot: n });
    K.call('settings', { lancelot: n });
  };
  K.actions['l-preset'] = d => {
    const g = K.G(), p = g && g.presets && g.presets[d.k]; if (!p) return;
    const n = Math.max(5, Math.min(10, K.players(K.view).length));
    const c = (p.byCount && (p.byCount[n] || p.byCount[String(n)])) || null; if (!c) return;
    K.fb('chime'); K.toast(K.L((p.label || '추천 구성') + ' 적용', (p.label || 'Recommended setup') + ' applied') + (c.note ? ' · ' + c.note : ''), 'info');
    K.call('settings', c);
  };

  const css = `
.uxl-in { animation: uxhCard .7s var(--ease-out) both; }
.uxl-hint { margin: -2px 6px 0; font-size: 13px; animation: uxhFade .6s both; }
.uxl-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: -2px 0 8px; } .uxl-presets .ux-chip { color: var(--gold-hi); }
.uxl-mod { flex-wrap: wrap; }
.uxl-seg { flex: 1 1 100%; display: flex; gap: 4px; margin-top: 2px; padding: 3px; border-radius: 12px; background: rgba(255,255,255,.06); border: 1px solid var(--line); }
.uxl-seg button { flex: 1; min-width: 0; min-height: 34px; padding: 4px 6px; border-radius: 9px; font-size: 13px; font-weight: 700; color: var(--text-dim); line-height: 1.2; transition: background .25s, color .25s; }
.uxl-seg button.on { color: #2a1a02; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); }
.uxl-seg button:disabled:not(.on) { opacity: .55; }
.ux-en .uxl-seg button { font-size: 12px; }
.uxl-start.can { animation: uxlGlow 1.6s ease-in-out infinite; }
@keyframes uxlGlow { 0%,100% { box-shadow: 0 8px 28px rgba(244,201,107,.35); } 50% { box-shadow: 0 8px 44px rgba(244,201,107,.8), 0 0 0 6px rgba(244,201,107,.15); } }
`;
  const st = document.createElement('style'); st.id = 'uxl-style'; st.textContent = css; document.head.appendChild(st);
})();


/* ---- src/22-reveal.js ---- */
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
    if (v.lancelot || s.lancelot) a.push(K.term('lancelot', K.L('갈림길의 순례자 (랜슬롯)', 'Lancelot')) + ' · ' + K.lanVarShort(K.lanVariant(v)));
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


/* ---- src/30-board.js ---- */
/* 빛의 원정대 — board screen (phases propose / vote / quest / excalibur / lady / assassin).
   Layout: top bar · quest track + rejection track · players table · action panel.
   update() runs on every view (polls): it only patches parts whose html changed, and applies
   local picks (seat selection, chosen card, Scroll holder) as classes so nothing re-animates on polls.
   Every visible string goes through K.L(ko, en); themed words come from K.term (English in English mode). */
(function () {
  'use strict';
  const K = window.UI._k;

  // ---------- Korean particles for themed words (terms may be renamed in config.js; Korean branches only) ----------
  const lastCode = w => { const s = String(w || ''); return s.charCodeAt(s.length - 1); };
  const batchim = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const rieul = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 8; };
  const jo = (w, withB, noB) => w + (batchim(w) ? withB : noB);   // jo('사명','을','를')
  const ro = w => w + (batchim(w) && !rieul(w) ? '으로' : '로');

  // ---------- themed words ----------
  const W = {
    quest: () => K.term('quest', K.L('사명', 'Mission')),
    team: () => K.term('questTeam', K.L('원정대', 'Team')),
    leader: () => K.term('leader', K.L('조장', 'Leader')),
    success: () => K.term('success', K.L('축복', 'Blessing')),
    fail: () => K.term('fail', K.L('방해', 'Hindrance')),
    approve: () => K.term('approve', K.L('찬성', 'Approve')),
    reject: () => K.term('reject', K.L('반대', 'Reject')),
    lady: () => K.term('lady', K.L('등불', 'Lamp')),
    assassinate: () => K.term('assassinate', K.L('지목', 'Name the Prophet')),
    xc: () => K.term('excalibur', K.L('말씀 두루마리', 'Scroll of the Word')),
    xcFlip: () => K.term('excaliburAction', K.L('카드 하나 뒤집기', 'Flip one card')),
    xcPass: () => K.term('excaliburPass', K.L('뒤집지 않기', 'Don\'t flip')),
    loyalty: () => K.term('loyalty', K.L('갈림길 카드', 'Crossroads card')),
    loyNone: () => K.term('loyaltyNone', K.L('그대로', 'No change')),
    loySwitch: () => K.term('loyaltySwitch', K.L('편이 바뀜', 'Sides switch')),
    seer: () => K.roleName('merlin') || K.L('선지자', 'Prophet')
  };
  const e = K.esc;
  const nm = (v, id) => e(K.pname(v, id));
  const meWord = () => K.L('나', 'you');

  // ---------- one-time CSS ----------
  function injectCSS() {
    if (document.getElementById('bd-style')) return;
    const s = document.createElement('style'); s.id = 'bd-style';
    s.textContent = `
.bd-root { position: relative; z-index: 0; }
.bd-veil-slot > .bd-veil { position: fixed; inset: 0; z-index: -1; }
.bd-top .grow { padding-right: 2px; }
.bd-top .ux-top-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-top .ux-icon-btn { width: 36px; height: 36px; border-radius: 11px; font-size: 16px; }
.bd-top .ux-icon-btn.on { border-color: var(--gold); background: rgba(244,201,107,.16); }
.bd-top .ux-role-chip { padding: 3px 10px 3px 3px; gap: 6px; font-size: 12px; color: var(--text); flex: none; white-space: nowrap; }
.bd-top .ux-role-chip .dot { width: 22px; height: 30px; border-radius: 5px; }
.bd-top .ux-role-chip .dot img { object-position: 50% 50%; }
.bd-trackp { overflow: hidden; padding: 8px 8px 12px; }
.bd-trackp > .ux-rose { width: 340px; height: 340px; margin: -170px 0 0 -170px; opacity: .10; }
.bd-trackp > *:not(.ux-rose) { position: relative; }
.bd-trackp .ux-track { padding: 12px 6px 14px; align-items: flex-start; }
.bd-qwrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; }
.bd-qwrap .ux-quest { width: 100%; }
.bd-qn { font-size: 11.5px; font-weight: 700; color: var(--text-dim); letter-spacing: .06em; }
.bd-qwrap.cur .bd-qn { color: var(--gold); }
.bd-qwrap .two + .bd-qn, .bd-qwrap.two-b .bd-qn { margin-top: 3px; }
.ux-quest.current::after { content: ''; position: absolute; inset: -7px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.55); animation: spin 14s linear infinite; }
.bd-loy { width: 22px; height: 31px; margin-top: -4px; border-radius: 4px; overflow: hidden; flex: none; box-shadow: 0 2px 8px rgba(0,0,0,.35); border: 1px solid rgba(255,227,163,.35); position: relative; }
.bd-loy img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bd-loy.sp { visibility: hidden; box-shadow: none; }
.bd-loy.down { opacity: .55; }
.bd-loy.down::after { content: '?'; position: absolute; inset: 0; display: grid; place-items: center; font-size: 12px; font-weight: 900; color: var(--gold-hi); text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.bd-loy.switch { border-color: rgba(200,182,255,.8); box-shadow: 0 0 10px rgba(143,108,240,.55); }
.bd-loy.fresh-up { animation: stamp .8s var(--ease-spring) both; }
.bd-loy.played { opacity: .5; filter: saturate(.6); }
.bd-loy.played::after { content: '✓'; position: absolute; right: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 50%; display: grid; place-items: center; font-size: 8px; font-weight: 900; color: #2a1a02; background: var(--gold); }
.bd-qwrap.cur .bd-loy.played { opacity: 1; filter: none; }
.bd-loyl { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 8px; font-size: 11.5px; color: var(--text-mute); }
.bd-loyl b { color: var(--text-dim); font-variant-numeric: tabular-nums; }
.bd-rejl { margin-right: 4px; }
.ux-rej.last.on { animation: bd-throb 1.4s ease-in-out infinite; }
@keyframes bd-throb { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }
.bd-warn { margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px; background: rgba(224,72,110,.13); border: 1px solid rgba(224,72,110,.45); color: #ffc6d3; font-size: 13px; line-height: 1.45; text-align: center; animation: popIn .45s var(--ease-spring) both; }
.bd-warn b { color: #fff; }
.ux-seat { color: inherit; font: inherit; width: 100%; }
.ux-seat .check { color: transparent; }
.ux-seat.fresh { animation: popIn .45s var(--ease-spring) both; animation-delay: calc(var(--i, 0) * 35ms); }
.ux-seat .icons span img { width: 100%; height: 100%; border: 0; background: none; border-radius: 50%; }
.ux-seat .icons .lamp img, .ux-seat .icons .xc img { padding: 1px; }
.ux-seat .icons .xc { background: #2a2350; border-color: rgba(255,215,122,.5); }
.ux-seat .sub { flex-wrap: wrap; min-height: 14px; margin-top: 2px; }
.ux-seat .sub .off { color: var(--text-mute); }
.ux-seat .sub .tm { color: var(--gold); }
.ux-seat .knowtag.bd-kt-xc { background: rgba(255,255,255,.1); color: var(--text-dim); }
.ux-seat .knowtag.bd-kt-lan { background: rgba(94,200,190,.16); color: #a8ebe2; }
.bd-pvs .bd-xlast { margin: 14px 0 0; }
.ux-seat .done { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(111,227,166,.16); animation: popIn .4s var(--ease-spring) both; }
.ux-seat.on-team { background: rgba(244,201,107,.07); }
.ux-seat.selectable { cursor: pointer; }
.ux-seat.disabled { pointer-events: none; }
.ux-seat .bd-xc-seat { position: absolute; bottom: -8px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(20,24,52,.92); border: 1px solid var(--gold); box-shadow: 0 0 12px rgba(244,201,107,.5); display: none; padding: 2px; }
.ux-seat .bd-xc-seat img { width: 100%; height: 100%; }
.ux-seat.bd-xc-on .bd-xc-seat { display: block; animation: popIn .4s var(--ease-spring) both; }
.bd-action { overflow: hidden; }
.bd-action.turn { border-color: rgba(244,201,107,.5); box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 0 1px rgba(244,201,107,.25), 0 0 26px rgba(244,201,107,.18); }
.bd-action.dark { border-color: rgba(224,72,110,.45); box-shadow: 0 10px 30px rgba(0,0,0,.4), 0 0 26px rgba(224,72,110,.2); }
.bd-action.dark .ux-action-title { color: #ffc2d1; }
.bd-glow { position: absolute; left: 50%; top: -60px; width: 260px; height: 160px; margin-left: -130px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(255,215,122,.22), transparent); animation: breathe 3.6s ease-in-out infinite; }
.bd-action.dark .bd-glow { background: radial-gradient(closest-side, rgba(224,72,110,.22), transparent); }
.bd-action > div { position: relative; }
.bd-tag { display: flex; justify-content: center; margin-bottom: 8px; }
.bd-hint { text-align: center; margin: -4px 0 12px; }
.bd-note { text-align: center; font-size: 12px; color: #ffb3c4; margin: -6px 0 12px; }
.bd-xnote { text-align: center; font-size: 12px; color: var(--text-dim); margin: -6px 0 12px; }
.bd-xnote img, .bd-ti { width: 16px; height: 16px; vertical-align: -3px; }
.bd-count { text-align: center; font-size: 14px; color: var(--text-dim); margin: 2px 0 12px; }
.bd-count b { font-size: 24px; font-weight: 900; color: var(--gold-hi); font-variant-numeric: tabular-nums; display: inline-block; transition: transform .25s var(--ease-spring); }
.bd-count b.bump { transform: scale(1.3); }
.bd-count.full b { color: var(--ok); }
.bd-pickname { text-align: center; font-size: 15px; margin: 2px 0 12px; color: var(--text-dim); min-height: 22px; }
.bd-pickname b { color: var(--gold-hi); }
.bd-action.dark .bd-pickname b { color: #ff9db5; }
.bd-xc { margin: -2px 0 14px; padding: 10px 10px 12px; border-radius: 14px; border: 1px dashed rgba(244,201,107,.35); background: rgba(244,201,107,.05); text-align: center; transition: opacity .3s; }
.bd-xc:empty { display: none; }
.bd-xc.wait { opacity: .55; }
.bd-xc .h { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--gold-hi); }
.bd-xc .h img { width: 22px; height: 22px; }
.bd-xc .s { font-size: 12px; color: var(--text-dim); margin: 4px 0 0; line-height: 1.4; }
.bd-xc-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; margin-top: 10px; }
.bd-xc-chip { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 5px 30px 5px 5px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid var(--line-strong); color: var(--text); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: border-color .25s, background .25s, transform .2s var(--ease-out), box-shadow .3s; }
.bd-xc-chip:active { transform: scale(.95); }
.bd-xc-chip .ux-avatar { width: 24px; height: 24px; font-size: 11px; }
.bd-xc-chip .slot { position: absolute; right: 4px; top: 50%; width: 22px; height: 22px; margin-top: -11px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.45); }
.bd-xc-chip .slot img { width: 100%; height: 100%; display: block; animation: popIn .45s var(--ease-spring) both; }
.bd-xc-chip.on { border-color: var(--gold); background: rgba(244,201,107,.16); box-shadow: 0 0 16px rgba(244,201,107,.35); }
.bd-xc-chip.on .slot { border-color: transparent; }
.ux-team-chip.has-xc { padding-right: 6px; }
.ux-team-chip .xc { width: 18px; height: 18px; }
.bd-root .ux-choices { margin: 4px 0 14px; }
.bd-root .ux-choice { max-width: 148px; aspect-ratio: 4 / 5; font-size: 21px; }
.bd-root .ux-choice img { width: 58%; }
.bd-done { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0 2px; }
.bd-done .seal { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; font-weight: 900; color: #2a1a02;
  background: radial-gradient(circle at 40% 35%, #fff4cf, var(--gold) 55%, var(--gold-deep)); box-shadow: 0 0 22px var(--good-glow); animation: stamp .7s var(--ease-spring) both; }
.bd-done .t { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--gold-hi); }
.bd-btn2 { margin-top: 10px; min-height: 46px; font-size: 15px; }
.bd-live { margin-top: 14px; }
.bd-live:empty { display: none; }
.bd-pvs:empty { display: none; }
.bd-pv { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 14px; padding: 9px 12px; border-radius: 12px; border: 1px dashed rgba(244,201,107,.35); background: rgba(255,255,255,.04); color: var(--text-dim); font: inherit; font-size: 12.5px; line-height: 1.4; text-align: left; cursor: pointer; }
.bd-pv img { width: 22px; height: 22px; flex: none; }
.bd-pv b { color: var(--gold-hi); }
.bd-pv.open { border-style: solid; color: var(--text); background: rgba(244,201,107,.08); animation: popIn .35s var(--ease-spring) both; }
.bd-prog-l { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
.bd-prog-l b { color: var(--text); font-variant-numeric: tabular-nums; }
.bd-next { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; margin-top: 14px; font-size: 12px; color: var(--text-mute); }
.bd-next .ux-chip { padding: 3px 9px; font-size: 12px; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.bd-next .arr { opacity: .5; }
.bd-wait-ic { width: 54px; height: 54px; }
.bd-wait-ic img { width: 100%; height: 100%; animation: breathe 2.6s ease-in-out infinite; }
.ux-en .bd-top .ux-role-chip { padding-right: 8px; }
.ux-en .bd-root .ux-choice { font-size: 19px; }
`;
    document.head.appendChild(s);
  }

  // ---------- state helpers ----------
  const showMarks = () => !!K.store.get('showMarks', false);
  const meId = v => (v.me && v.me.id) || null;
  const keyOf = v => v.phase + '|' + v.round + '|' + v.proposalNo;
  const onTeamIds = v => (v.proposal && v.proposal.team) || [];
  const xcOn = v => !!(v && v.excalibur);
  const xcHolder = v => (xcOn(v) && v.proposal && v.proposal.excaliburTo) || null;
  const cardWord = ok => ok ? W.success() : W.fail();

  /* What the current action needs from me: mode multi (propose), single (lady/assassin/excalibur) or none. */
  function pickMode(v) {
    const me = meId(v); const ps = K.players(v);
    if (v.phase === 'propose' && v.leaderId === me) return { mode: 'multi', size: K.teamSize(v), allowed: new Set(ps.map(p => p.id)), kind: 'team' };
    if (v.phase === 'lady' && v.ladyHolderId === me) {
      const used = new Set(v.ladyUsedBy || []);
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && !used.has(p.id)).map(p => p.id)), kind: 'lady' };
    }
    if (v.phase === 'excalibur' && xcHolder(v) === me) {
      return { mode: 'single', size: 1, allowed: new Set(onTeamIds(v).filter(id => id !== me)), kind: 'excalibur' };
    }
    if (v.phase === 'assassin' && v.assassinId === me) {
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && K.knowOf(v, p.id).indexOf('evil') < 0).map(p => p.id)), kind: 'assassin' };
    }
    return { mode: null, size: 0, allowed: new Set(), kind: null };
  }

  function isMyTurn(v) {
    const me = v.me || {};
    if (v.phase === 'propose') return v.leaderId === me.id;
    if (v.phase === 'vote') return me.myVote == null;
    if (v.phase === 'quest') return onTeamIds(v).indexOf(me.id) >= 0 && !me.myQuestPlayed;
    if (v.phase === 'excalibur') return xcHolder(v) === me.id;
    if (v.phase === 'lady') return v.ladyHolderId === me.id;
    if (v.phase === 'assassin') return v.assassinId === me.id;
    return false;
  }

  // ---------- top bar ----------
  function topHtml(v) {
    const n = (v.round || 0) + 1, pn = v.proposalNo || 1;
    let title = e(W.quest()) + ' ' + n, sub = '';
    if (v.phase === 'propose') sub = K.L(pn + '번째 제안', 'Proposal ' + pn) + ' · ' + e(W.leader()) + ' ' + nm(v, v.leaderId);
    else if (v.phase === 'vote') sub = K.L(pn + '번째 제안 · 투표 중', 'Proposal ' + pn + ' · Voting');
    else if (v.phase === 'quest') sub = K.L(e(W.quest()) + ' 수행 중', 'On the ' + e(W.quest()));
    else if (v.phase === 'excalibur') sub = e(W.xc()) + ' · ' + nm(v, xcHolder(v));
    else if (v.phase === 'lady') sub = e(W.lady()) + ' · ' + nm(v, v.ladyHolderId);
    else if (v.phase === 'assassin') { title = K.L('마지막 ' + e(W.assassinate()), 'The final choice'); sub = K.L('모든 것이 이 한 번에 달렸어요', 'Everything rides on this one choice'); }
    const marks = showMarks();
    return '<div class="grow"><div class="ux-top-title">' + title + '</div><div class="ux-top-sub">' + sub + '</div></div>' +
      '<button class="ux-icon-btn' + (marks ? ' on' : '') + '" data-act="bd-marks" aria-label="' + e(K.L('알고 있는 정보 표시', 'Show what I know')) + '" aria-pressed="' + marks + '">' + (marks ? '👁' : '🙈') + '</button>' +
      '<button class="ux-icon-btn" data-act="bd-history" aria-label="' + e(K.L('지난 기록', 'History')) + '">📜</button>' +
      '<button class="ux-chip ux-role-chip" data-act="bd-role" aria-label="' + e(K.L('내 역할 보기', 'See my role')) + '"><span class="dot">' + K.backImg() + '</span>' + e(K.L('내 역할', 'My role')) + '</button>' +
      K.soundBtn();
  }

  // ---------- quest track + rejection track (+ Crossroads cards at missions 3–5) ----------
  /* Crossroads cards on the track. Variant 1: one card flipped at the start of missions 3–5 (face down until then).
     Variant 2: all five dealt face up at the start (view.loyaltyPlan, card i = mission i); played ones are marked.
     Variant 3 (no cards) and Lancelot off: no row. */
  const loyMode = v => v.lancelot === 1 ? 1 : (v.lancelot === 2 && Array.isArray(v.loyaltyPlan) && v.loyaltyPlan.length) ? 2 : 0;
  const loyCard = (card, cls, extraLabel, fresh) => {
    const sw = card === 'switch';
    const label = W.loyalty() + ': ' + (sw ? W.loySwitch() : W.loyNone()) + (extraLabel ? ' · ' + extraLabel : '');
    return '<span class="bd-loy ' + (sw ? 'switch' : 'none') + (cls ? ' ' + cls : '') + (fresh ? ' fresh-up' : '') + '" role="img" aria-label="' + e(label) + '" title="' + e(label) + '">' +
      K.img(K.asset('loyalty/' + (sw ? 'switch' : 'none') + '.svg'), 'loyalty-' + (sw ? 'switch' : 'none'), '') + '</span>';
  };
  function loyaltyHtml(v, i, fresh) {
    const mode = loyMode(v);
    if (!mode) return '';
    const r = (v.loyaltyRevealed || []).filter(x => x.round === i).pop();
    if (mode === 2) {
      const card = (r && r.card) || v.loyaltyPlan[i];
      if (!card) return '<span class="bd-loy sp" aria-hidden="true"></span>';
      return loyCard(card, r ? 'played' : '', r ? K.L('적용됨', 'in effect') : K.L('앞으로', 'coming up'), fresh);
    }
    if (i < 2) return '<span class="bd-loy sp" aria-hidden="true"></span>';
    if (!r) return '<span class="bd-loy down" role="img" aria-label="' + e(W.loyalty() + ' · ' + K.L('아직 덮여 있어요', 'still face down')) + '">' + K.backImg() + '</span>';
    return loyCard(r.card, '', '', fresh);
  }

  function trackHtml(v) {
    const qs = v.quests || [];
    const sizes = K.sizes(v);
    const prev = K.local.prevResults; const now = Date.now();
    K.local.justAt = K.local.justAt || {};
    const prevLoy = K.local.prevLoy;
    const nLoy = (v.loyaltyRevealed || []).length;
    if (prevLoy != null && nLoy > prevLoy) K.local.loyAt = now;
    const loyFresh = K.local.loyAt && now - K.local.loyAt < 1500;
    K.local.prevLoy = nLoy;
    const fresh = [];
    let out = '<div class="ux-rose" aria-hidden="true"></div><div class="ux-track">';
    for (let i = 0; i < 5; i++) {
      const q = qs[i] || { size: sizes[i], failsNeeded: K.questFails(v, i), result: null };
      const res = q.result;
      if (prev && res && !prev[i]) { K.local.justAt[i] = now; fresh.push({ i, res }); }
      const just = res && K.local.justAt[i] && now - K.local.justAt[i] < 1500;
      const cur = !res && i === v.round && v.phase !== 'assassin';
      const two = (q.failsNeeded || K.questFails(v, i)) >= 2;
      const lastLoy = (v.loyaltyRevealed || []).slice(-1)[0];
      out += '<div class="bd-qwrap' + (cur ? ' cur' : '') + '"><div class="ux-quest' + (cur ? ' current' : '') + (res ? ' ' + res : '') + (just ? ' just' : '') + '" data-q="' + i + '">' +
        (res ? K.tokenImg(res === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || sizes[i] || '') + '</span>') +
        (two && !res ? '<span class="two">' + K.L(e(W.fail()) + ' 2', '2 needed') + '</span>' : '') +
        '</div><span class="bd-qn">' + (i + 1) + '</span>' + loyaltyHtml(v, i, loyFresh && lastLoy && lastLoy.round === i) + '</div>';
    }
    out += '</div>';
    K.local.prevResults = qs.map(q => q && q.result);
    const filled = Math.max(0, Math.min(5, (v.proposalNo || 1) - 1));
    const showRej = v.phase === 'propose' || v.phase === 'vote';
    out += '<div class="ux-rejects"><span class="bd-rejl">' + K.L(e(W.reject()) + ' 누적', 'Rejected') + '</span>';
    for (let i = 1; i <= 5; i++) out += '<span class="ux-rej' + (showRej && i <= filled ? ' on' : '') + (i === 5 ? ' last' : '') + '">' + (i === 5 ? '!' : '') + '</span>';
    out += '</div>';
    if (loyMode(v) === 2) {
      out += '<div class="bd-loyl">🧭 <span>' + e(K.term('loyaltyPlan', K.L('펼쳐 둔 갈림길 카드', 'Crossroads cards on the table'))) + '</span></div>';
    } else if (loyMode(v) === 1) {
      const left = typeof v.loyaltyLeft === 'number' ? v.loyaltyLeft : null;
      if (left != null) {
        const h = typeof K.hint === 'function' ? K.hint('loyalty', 'left', { count: left }) : '';
        out += '<div class="bd-loyl">🧭 ' + (h ? e(h) : '<span>' + e(K.L('남은 ' + W.loyalty(), W.loyalty() + 's left')) + '</span><b>' + K.L(left + '장', String(left)) + '</b>') + '</div>';
      }
    }
    if (showRej && v.proposalNo >= 5) {
      out += '<div class="bd-warn">⚠ ' + K.L(
        '<b>마지막 제안</b>이에요. 이번 ' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.reject(), '으로', '로')) + ' 무산되면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.',
        'This is the <b>last proposal</b>. If this team is rejected, <b>' + e(K.teamName('evil')) + ' win</b>.') + '</div>';
    }
    return { html: out, fresh };
  }

  // ---------- players table ----------
  function seatItems(v, pm) {
    const me = meId(v); const marks = showMarks();
    const team = new Set(onTeamIds(v));
    const holder = xcHolder(v);
    const teamPhase = v.phase === 'vote' || v.phase === 'quest' || v.phase === 'excalibur';
    const done = new Set(v.phase === 'vote' ? (v.votedIds || []) : v.phase === 'quest' ? (v.questPlayedIds || []) : []);
    const proposing = pm.kind === 'team' && xcOn(v);
    return K.players(v).map((p, i) => {
      const sel = pm.mode && pm.allowed.has(p.id);
      const dis = pm.mode && !sel;
      const cls = ['ux-seat'];
      if (sel) cls.push('selectable');
      if (dis) cls.push('disabled');
      if (pm.kind === 'assassin' && sel) cls.push('evil-pick', 'ux-target-ring');
      if (team.size && team.has(p.id) && teamPhase) cls.push('on-team');
      if (p.id === me) cls.push('is-me');
      let icons = '';
      if (p.id === v.leaderId && v.phase !== 'assassin') icons += '<span class="leader" title="' + e(W.leader()) + '">' + K.tokenImg('leader') + '</span>';
      if (holder && p.id === holder && teamPhase) icons += '<span class="xc" title="' + e(W.xc()) + '">' + K.tokenImg('excalibur') + '</span>';
      if (v.ladyHolderId && p.id === v.ladyHolderId && v.phase !== 'assassin') icons += '<span class="lamp" title="' + e(W.lady()) + '">' + K.tokenImg('lady') + '</span>';
      let sub = '';
      if (p.online === false) sub += '<span class="off">' + e(K.L('연결 끊김', 'Offline')) + '</span>';
      if (cls.indexOf('on-team') >= 0) sub += '<span class="tm">' + e(W.team()) + '</span>';
      if (marks && p.id !== me) {
        K.knowOf(v, p.id).forEach(t => { sub += '<span class="knowtag ' + (t === 'merlinCandidate' ? 'merlinCandidate' : t === 'lancelot' ? 'bd-kt-lan' : 'evil') + '">' + (t === 'lancelot' ? '🧭 ' : '') + e(K.knowText(t)) + '</span>'; });
        const lt = K.ladyOf(v, p.id);
        if (lt) sub += '<span class="knowtag ' + (lt === 'evil' ? 'evil' : 'good') + '">🪔 ' + e(K.teamName(lt)) + '</span>';
        // Scroll of the Word results I learned (private, behind the eye toggle like the other marks)
        ((v.me && v.me.excaliburResults) || []).filter(r => r.targetId === p.id).forEach(r => {
          sub += '<span class="knowtag ' + (r.original ? 'bd-kt-xc' : 'evil') + '">📜 ' + e((r.round + 1) + ' · ' + cardWord(r.original)) + '</span>';
        });
      }
      const tag = sel ? 'button' : 'div';
      const html = '<' + tag + ' class="' + cls.join(' ') + '" style="--i:' + i + '"' + (sel ? ' type="button" data-act="bd-seat" data-id="' + e(p.id) + '"' : '') + ' data-pid="' + e(p.id) + '">' +
        K.avatar(p, true) +
        '<div class="meta"><div class="ux-player-name">' + e(p.name) + (p.id === me ? '<small>' + e(meWord()) + '</small>' : '') + '</div><div class="sub">' + sub + '</div></div>' +
        (done.has(p.id) ? '<span class="done" aria-label="' + e(K.L('완료', 'Done')) + '">✓</span>' : '') +
        (sel ? '<span class="check">✓</span>' : '') +
        (icons ? '<div class="icons">' + icons + '</div>' : '') +
        (proposing ? '<span class="bd-xc-seat" aria-hidden="true">' + K.tokenImg('excalibur') + '</span>' : '') +
        '</' + tag + '>';
      return { key: p.id, html };
    });
  }

  // ---------- action panel ----------
  const teamChips = v => {
    const holder = xcHolder(v);
    return '<div class="ux-team-row">' + onTeamIds(v).map(id => {
      const p = K.player(v, id) || { id, name: '?' };
      const hx = holder && id === holder;
      return '<span class="ux-team-chip' + (hx ? ' has-xc' : '') + '">' + K.avatar(p, false) + e(p.name) + (K.isMe(v, id) ? ' <small style="opacity:.6">' + e(meWord()) + '</small>' : '') +
        (hx ? '<span class="xc" role="img" aria-label="' + e(W.xc()) + '" title="' + e(W.xc()) + '">' + K.tokenImg('excalibur', 'xc') + '</span>' : '') + '</span>';
    }).join('') + '</div>' + (holder && (v.phase === 'vote' || v.phase === 'quest') ? xcLine(v, holder) : '');
  };
  const xcLine = (v, holder) => '<p class="bd-xnote">' + K.tokenImg('excalibur') + ' ' + K.L(
    e(W.xc()) + ': <b>' + nm(v, holder) + '</b>' + (v.phase === 'quest' ? ' · 카드가 모이면 한 장을 뒤집을 수 있어요' : ''),
    e(W.xc()) + ': <b>' + nm(v, holder) + '</b>' + (v.phase === 'quest' ? ' · may flip one card once all are in' : '')) + '</p>';
  const hintLine = (phase, key, params) => { const h = typeof K.hint === 'function' ? K.hint(phase, key, params) : ''; return h ? '<p class="ux-muted bd-hint">' + e(h) + '</p>' : ''; };
  /* Lancelot variant 2: shown to every team member (same text on every phone, so it reveals nothing). */
  const lanForcedNote = v => v.lancelot === 2 ? '<p class="bd-xnote">🧭 ' + e((K.lanVarShort ? K.lanVarShort(2) + ' · ' : '') + K.L('랜슬롯은 지금 편대로만 카드를 내요', 'Lancelots must play for their current side')) + '</p>' : '';
  const twoNote = v => K.questFails(v, v.round) >= 2 ? '<p class="bd-note">' + K.L('이번 ' + e(jo(W.quest(), '은', '는')) + ' ' + e(W.fail()) + ' 카드가 2장 나와야 실패해요', 'This ' + e(W.quest()) + ' fails only if 2 ' + e(W.fail()) + ' cards come up') + '</p>' : '';
  const waiting = (iconHtml) => '<div class="ux-waiting">' + (iconHtml ? '<div class="bd-wait-ic">' + iconHtml + '</div>' : '') + '<span class="ux-dots"><i></i><i></i><i></i></span></div>';
  const progress = (label, k, n) => '<div class="bd-prog-l"><span>' + label + '</span><b>' + k + ' / ' + n + '</b></div><div class="ux-progress"><i style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></i></div>';
  const doneSeal = t => '<div class="bd-done"><div class="seal">✓</div><div class="t">' + t + '</div></div>';
  const pickPrompt = kind => kind === 'excalibur' ? K.L('위 자리에서 원정대원 한 명을 골라 주세요', 'Pick one team member above') : K.L('위 자리에서 한 사람을 골라 주세요', 'Pick one person above');

  function nextLeaders(v) {
    const ps = K.players(v); const i = ps.findIndex(p => p.id === v.leaderId);
    if (i < 0 || ps.length < 2) return '';
    const names = [];
    for (let k = 1; k <= Math.min(3, ps.length - 1); k++) names.push(ps[(i + k) % ps.length]);
    return '<div class="bd-next"><span>' + K.L('다음 ' + e(W.leader()), 'Next ' + e(W.leader())) + '</span>' + names.map((p, j) => (j ? '<span class="arr">›</span>' : '') + '<span class="ux-chip">' + e(p.name) + (K.isMe(v, p.id) ? ' (' + e(meWord()) + ')' : '') + '</span>').join('') + '</div>';
  }

  function choiceCards(a, b) {
    return '<div class="ux-choices">' +
      '<button type="button" class="ux-choice ' + a.cls + '" data-act="bd-choice" data-val="1">' + K.tokenImg(a.tok) + e(a.label) + (a.small ? '<small>' + e(a.small) + '</small>' : '') + '</button>' +
      '<button type="button" class="ux-choice ' + b.cls + '" data-act="bd-choice" data-val="0">' + K.tokenImg(b.tok) + e(b.label) + (b.small ? '<small>' + e(b.small) + '</small>' : '') + '</button></div>';
  }

  /* Leader, Scroll module: after the team is full, give the Scroll to one member who isn't me. Rendered from applyLocal. */
  function xcPickerHtml(v, L, pm) {
    const me = meId(v);
    const full = L.picks.length === pm.size;
    const head = '<div class="h">' + K.tokenImg('excalibur') + e(K.L(W.xc() + ' 맡기기', 'Give the ' + W.xc())) + '</div>';
    if (!full) return '<div class="bd-xc wait">' + head + '<p class="s">' + e(K.L(W.team() + '을 다 고르면, 나 말고 한 명에게 두루마리를 맡겨요', 'Once the team is full, hand the Scroll to one member (not you)')) + '</p></div>';
    const ids = K.players(v).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0 && id !== me);
    const hint = (typeof K.hint === 'function' && K.hint('propose', 'leaderExcalibur')) ||
      K.L('두루마리를 받은 사람은 카드가 모두 모인 뒤 다른 원정대원 한 명의 카드를 뒤집을 수 있어요', 'After all cards are in, the holder may flip one other team member\'s card');
    return '<div class="bd-xc">' + head + '<p class="s">' + e(hint) + '</p><div class="bd-xc-row">' + ids.map(id => {
      const p = K.player(v, id) || { id, name: '?' }; const on = L.xc === id;
      return '<button type="button" class="bd-xc-chip' + (on ? ' on' : '') + '" data-act="bd-xc" data-id="' + e(id) + '" aria-pressed="' + on + '">' + K.avatar(p, false) + e(p.name) +
        '<span class="slot">' + (on ? K.tokenImg('excalibur') : '') + '</span></button>';
    }).join('') + '</div></div>';
  }

  /* returns { head, ctl, live, mood } — head/ctl only change with the phase key or my own progress. */
  function actionParts(v) {
    const me = v.me || {}; const ph = v.phase;
    const n = (v.players || []).length;
    const P = { head: '', ctl: '', live: '', mood: '' };
    const qn = (v.round || 0) + 1;
    if (ph === 'propose') {
      const size = K.teamSize(v);
      if (v.leaderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('leader', 'bd-ti') + ' ' + K.L('이번 ' + e(W.leader()), 'You\'re the ' + e(W.leader())) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L(e(jo(W.team(), '을', '를')) + ' 꾸려 주세요', 'Choose the ' + e(W.team())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(W.quest()) + ' ' + qn + '에 함께 갈 <b>' + size + '명</b>을 위 자리에서 골라요.<br>나도 포함할 수 있어요.',
            'Pick <b>' + size + ' players</b> above for ' + e(W.quest()) + ' ' + qn + '.<br>You can include yourself.') + '</p>' +
          twoNote(v);
        P.ctl = '<div class="bd-count" data-bd="count"><b data-bd="k">0</b> / ' + size + K.L('명 선택', ' chosen') + '</div>' +
          (xcOn(v) ? '<div data-bd="xc"></div>' : '') +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-propose" data-bd="go" disabled>' + K.L('이 ' + e(ro(W.team())) + ' 제안하기', 'Propose this ' + e(W.team())) + '</button>' + nextLeaders(v);
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.leader()) + ' ' + nm(v, v.leaderId) + '님이 고르는 중', e(W.leader()) + ' ' + nm(v, v.leaderId) + ' is choosing') + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(W.quest()) + ' ' + qn + '에 갈 ' + e(W.team()) + ' <b>' + size + '명</b>을 정하고 있어요.<br>누구를 보내면 좋을지 함께 이야기해 보세요.',
            'Picking <b>' + size + ' players</b> for ' + e(W.quest()) + ' ' + qn + '.<br>Talk together about who should go.') + '</p>' +
          (xcOn(v) ? '<p class="bd-xnote">' + K.tokenImg('excalibur') + ' ' + K.L(e(jo(W.leader(), '이', '가')) + ' ' + e(W.team()) + ' 한 명에게 ' + e(W.xc()) + '도 맡겨요', 'The ' + e(W.leader()) + ' also hands the ' + e(W.xc()) + ' to one member') + '</p>' : '') +
          twoNote(v);
        P.ctl = waiting(K.tokenImg('leader')) + nextLeaders(v);
      }
    } else if (ph === 'vote') {
      const last = v.proposalNo >= 5;
      P.head = '<h3 class="ux-action-title">' + K.L('이 ' + e(W.team()) + '에 ' + e(W.approve()) + '하시나요?', 'Do you approve this ' + e(W.team()) + '?') + '</h3>' +
        '<p class="ux-action-sub">' + K.L(e(W.leader()) + ' ' + nm(v, v.leaderId) + '님의 제안', e(W.leader()) + ' ' + nm(v, v.leaderId) + '\'s proposal') + ' · ' + e(W.quest()) + ' ' + qn + '</p>' + teamChips(v);
      if (me.myVote == null) {
        P.mood = 'turn';
        P.ctl = (last ? '<div class="bd-warn" style="margin:0 0 12px">' + K.L('이번에 ' + e(jo(W.reject(), '이', '가')) + ' 많으면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 바로 승리</b>해요',
          'If this is rejected, <b>' + e(K.teamName('evil')) + ' win right away</b>') + '</div>' : '') +
          choiceCards({ cls: 'approve', tok: 'approve', label: W.approve(), small: K.L('이대로 출발', 'Send them') }, { cls: 'reject', tok: 'reject', label: W.reject(), small: K.L('다시 꾸리기', 'Try another team') }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-vote" data-bd="go" disabled>' + K.L('투표하기', 'Vote') + '</button>';
      } else {
        P.ctl = doneSeal(K.L('투표 완료', 'Vote in')) + '<p class="ux-muted ux-center">' + K.L('모두 투표하면 결과가 함께 공개돼요', 'All votes are shown together once everyone has voted') + '</p>';
      }
      P.live = progress(K.L('투표한 사람', 'Voted'), (v.votedIds || []).length, n);
    } else if (ph === 'quest') {
      const team = onTeamIds(v); const mine = team.indexOf(me.id) >= 0;
      if (mine && !me.myQuestPlayed) {
        P.mood = 'turn';
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.quest()) + ' 카드를 내 주세요', 'Play your ' + e(W.quest()) + ' card') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('몰래 한 장을 골라요. 누가 무엇을 냈는지는 아무도 몰라요.', 'Secretly choose one. No one will know who played what.') + '</p>' + teamChips(v) + twoNote(v) + lanForcedNote(v);
        // Both cards look identical for everyone (a neighbour must not learn my team). Good players get a toast on fail.
        P.ctl = choiceCards({ cls: 'success', tok: 'success', label: W.success() }, { cls: 'fail', tok: 'fail', label: W.fail() }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-quest" data-bd="go" disabled>' + K.L('제출하기', 'Submit') + '</button>';
      } else if (mine) {
        P.head = '<h3 class="ux-action-title">' + K.L(e(W.team()) + ' 카드를 기다리는 중', 'Waiting for the ' + e(W.team()) + '\'s cards') + '</h3>' + teamChips(v);
        P.ctl = doneSeal(K.L('제출 완료', 'Card played')) + hintLine('quest', 'played');
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.quest(), '을', '를')) + ' 수행 중이에요', 'The ' + e(W.team()) + ' is on the ' + e(W.quest())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('카드가 모두 모이면 섞어서 공개돼요.', 'Once all cards are in, they\'re shuffled and revealed.') + '</p>' + teamChips(v) + twoNote(v);
        P.ctl = waiting(K.tokenImg('success'));
      }
      P.live = progress(K.L('카드를 낸 사람', 'Cards played'), (v.questPlayedIds || []).length, team.length || K.teamSize(v));
    } else if (ph === 'excalibur') {
      const holder = xcHolder(v);
      if (holder && holder === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('excalibur', 'bd-ti') + ' ' + e(W.xc()) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L('카드 한 장을 뒤집을까요?', 'Flip one card?') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('다른 원정대원 한 명의 카드를 반대로 바꿀 수 있어요.<br>원래 무엇이었는지는 <b>나만</b> 알게 돼요.',
            'You may turn one other team member\'s card to the opposite.<br><b>Only you</b> learn what it was.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('excalibur') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-xc-flip" data-bd="go" disabled>' + e(W.xcFlip()) + '</button>' +
          '<button type="button" class="ux-btn ux-btn-ghost bd-btn2" data-act="bd-xc-pass" data-bd="pass">' + e(W.xcPass()) + '</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, holder) + '님이 ' + e(jo(W.xc(), '을', '를')) + ' 펼치는 중', nm(v, holder) + ' holds the ' + e(W.xc())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('원정대원 한 명의 카드를 뒤집을지 고민하고 있어요.<br>누구의 카드를 뒤집었는지는 모두에게 공개돼요.',
            'They\'re deciding whether to flip one team member\'s card.<br>Everyone will see whose card gets flipped.') + '</p>' + teamChips(v);
        P.ctl = waiting(K.tokenImg('excalibur'));
      }
    } else if (ph === 'lady') {
      if (v.ladyHolderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">🪔 ' + e(W.lady()) + '</span></div>' +
          '<h3 class="ux-action-title">' + K.L(e(ro(W.lady())) + ' 한 사람을 비춰 보세요', 'Shine the ' + e(W.lady()) + ' on one person') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('고른 사람이 어느 편인지 <b>나만</b> 알게 돼요.<br>' + e(jo(W.lady(), '을', '를')) + ' 가졌던 사람은 고를 수 없어요.',
            '<b>Only you</b> will learn which side they\'re on.<br>You can\'t pick anyone who already held the ' + e(W.lady()) + '.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('lady') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-lady" data-bd="go" disabled>' + K.L(e(ro(W.lady())) + ' 비춰보기', 'Shine the ' + e(W.lady())) + '</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, v.ladyHolderId) + '님이 ' + e(jo(W.lady(), '을', '를')) + ' 비추는 중', nm(v, v.ladyHolderId) + ' is shining the ' + e(W.lady())) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('비춘 사람의 편은 ' + e(jo(W.lady(), '을', '를')) + ' 든 사람만 알게 돼요.', 'Only the one holding the ' + e(W.lady()) + ' learns that person\'s side.') + '</p>';
        P.ctl = waiting(K.tokenImg('lady'));
      }
    } else if (ph === 'assassin') {
      P.mood = 'dark';
      const seer = W.seer();
      if (v.assassinId && v.assassinId === me.id) {
        P.head = '<h3 class="ux-action-title">' + K.L(e(jo(seer, '을', '를')) + ' 찾아내세요', 'Find the ' + e(seer)) + '</h3>' +
          '<p class="ux-action-sub">' + K.L('맞히면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.<br>동료들과 의논한 뒤 신중하게 한 명을 고르세요.',
            'If you\'re right, <b>' + e(K.teamName('evil')) + ' win</b>.<br>Talk with your partners, then choose one person carefully.') + '</p>';
        P.ctl = '<div class="bd-pickname" data-bd="pick">' + pickPrompt('assassin') + '</div>' +
          '<button type="button" class="ux-btn ux-btn-evil" data-act="bd-assassin" data-bd="go" disabled>' + K.L(e(W.assassinate()) + '하기', e(W.assassinate())) + '</button>';
      } else if (me.team === 'evil') {
        P.head = '<h3 class="ux-action-title">' + K.L(nm(v, v.assassinId) + '님이 고르는 중', nm(v, v.assassinId) + ' is choosing') + '</h3>' +
          '<p class="ux-action-sub">' + K.L('누가 ' + e(seer) + '인지 함께 의논해 보세요.<br>최종 ' + e(jo(W.assassinate(), '은', '는')) + ' ' + nm(v, v.assassinId) + '님이 해요.',
            'Talk together about who the ' + e(seer) + ' is.<br>' + nm(v, v.assassinId) + ' makes the final call.') + '</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      } else {
        P.head = '<h3 class="ux-action-title">' + K.L('마지막 ' + e(jo(W.assassinate(), '을', '를')) + ' 기다리는 중', 'Waiting for the final choice') + '</h3>' +
          '<p class="ux-action-sub">' + K.L(e(jo(K.teamName('evil'), '이', '가')) + ' 정체를 드러내고 의논하고 있어요.<br>숨을 고르고 조용히 기다려 주세요.',
            e(K.teamName('evil')) + ' have revealed themselves and are talking it over.<br>Take a breath and wait quietly.') + '</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      }
    }
    return P;
  }

  /* Public: how the Scroll was used on the mission just played (view.lastExcalibur), shown to everyone during the next
     mission so it isn't only in the cinematic. Never says what the card was. */
  function xcLastHtml(v) {
    const x = v.lastExcalibur;
    if (!xcOn(v) || !x || !x.holderId || x.round !== (v.round || 0) - 1 || !/^(propose|vote|quest|lady)$/.test(v.phase)) return '';
    const p = { holderName: K.pname(v, x.holderId), targetName: x.targetId ? K.pname(v, x.targetId) : '' };
    const h = typeof K.hint === 'function' ? K.hint('excalibur', x.targetId ? 'used' : 'passed', p) : '';
    const t = h || (x.targetId ? K.L(p.holderName + '님이 ' + p.targetName + '님의 카드를 뒤집었어요', p.holderName + ' flipped ' + p.targetName + '\'s card')
      : K.L(p.holderName + '님은 카드를 뒤집지 않았어요', p.holderName + ' chose not to flip any card'));
    return '<p class="bd-xnote bd-xlast">' + K.tokenImg('excalibur') + ' ' + e(W.quest() + ' ' + (x.round + 1) + ' · ' + t) + '</p>';
  }

  /* Holder's private Scroll result: a folded note (tap to open, closes by itself) shown only on the holder's phone,
     for the mission just played. Nothing readable at a glance. */
  function privateNoteHtml(v) {
    const rs = (v.me && v.me.excaliburResults) || [];
    const r = rs.length ? rs[rs.length - 1] : null;
    if (!r || r.round < (v.round || 0) - 1) return '';
    const k = r.round + '|' + r.targetId;
    const open = K.local.pvOpen === k;
    if (!open) return '<button type="button" class="bd-pv" data-act="bd-pv" data-k="' + e(k) + '" aria-expanded="false">' + K.tokenImg('excalibur') +
      '<span>' + e(K.L('나만 보는 두루마리 결과 · 눌러서 확인', 'Your private Scroll result · tap to see')) + '</span></button>';
    const name = K.pname(v, r.targetId), card = cardWord(r.original);
    const h = typeof K.hint === 'function' ? K.hint('excalibur', 'result', { targetName: name, card }) : '';
    const txt = h ? e(h) : K.L(e(name) + '님의 원래 카드는 <b>' + e(card) + '</b>였어요. 지금은 반대로 뒤집혔어요.', e(name) + '\'s card was originally <b>' + e(card) + '</b>. It has now been flipped.');
    return '<button type="button" class="bd-pv open" data-act="bd-pv" data-k="' + e(k) + '" aria-expanded="true">' + K.tokenImg('excalibur') + '<span>' + txt + '</span></button>';
  }

  // ---------- local picks → classes (no re-render, so transitions play) ----------
  function applyLocal(el, v) {
    const L = K.local; const pm = L.pm || { mode: null };
    L.picks = (L.picks || []).filter(id => pm.allowed && pm.allowed.has(id));
    K.$$('.ux-seat', el).forEach(s => s.classList.toggle('selected', L.picks.indexOf(s.dataset.pid) >= 0));
    const go = K.$('[data-bd="go"]', el);
    if (pm.mode === 'multi') {
      const k = K.$('[data-bd="k"]', el);
      if (k && k.textContent !== String(L.picks.length)) { k.textContent = L.picks.length; k.classList.add('bump'); setTimeout(() => k.classList.remove('bump'), 220); }
      const c = K.$('[data-bd="count"]', el); if (c) c.classList.toggle('full', L.picks.length === pm.size);
      let needXc = false;
      if (xcOn(v)) {
        const me = meId(v); const full = L.picks.length === pm.size;
        const elig = L.picks.filter(id => id !== me);
        if (!full || elig.indexOf(L.xc) < 0) L.xc = null;
        if (full && !L.xc && elig.length === 1) L.xc = elig[0];   // only one choice: hand it over already
        needXc = !L.xc;
        K.patch(K.$('[data-bd="xc"]', el), xcPickerHtml(v, L, pm));
        K.$$('.ux-seat', el).forEach(s => s.classList.toggle('bd-xc-on', !!L.xc && s.dataset.pid === L.xc));
      }
      if (go) go.disabled = L.picks.length !== pm.size || needXc || K.busy('propose');
    } else if (pm.mode === 'single') {
      const pk = K.$('[data-bd="pick"]', el);
      if (pk) pk.innerHTML = L.picks.length ? K.L('<b>' + nm(v, L.picks[0]) + '</b>님을 골랐어요', 'You picked <b>' + nm(v, L.picks[0]) + '</b>') : pickPrompt(pm.kind);
      if (go) go.disabled = !L.picks.length || K.busy(pm.kind === 'lady' ? 'lady' : pm.kind === 'excalibur' ? 'excalibur' : 'assassinate');
      const ps = K.$('[data-bd="pass"]', el); if (ps) ps.disabled = K.busy('excalibur');
    } else if (go) {
      go.disabled = L.choice == null || K.busy(v.phase === 'vote' ? 'vote' : 'quest');
    }
    const cs = K.$$('.ux-choice', el);
    cs.forEach(c => {
      const val = c.dataset.val === '1';
      c.classList.toggle('picked', L.choice != null && L.choice === val);
      c.classList.toggle('dim', L.choice != null && L.choice !== val);
      c.setAttribute('aria-pressed', String(L.choice === val));
    });
    K.patch(K.$('[data-bd="pv"]', el), v.phase === 'excalibur' ? '' : xcLastHtml(v) + privateNoteHtml(v));
  }

  // ---------- screen ----------
  function build(v) {
    injectCSS();
    return K.el('<div class="bd-root">' +
      '<div class="bd-veil-slot"></div>' +
      '<div class="ux-top bd-top" data-bd="top"></div>' +
      '<div data-bd="seat"></div>' +
      '<div class="ux-panel bd-trackp" data-bd="track"></div>' +
      '<div class="ux-table" data-bd="table"></div>' +
      '<div class="ux-panel ux-action bd-action" data-bd="action"><div class="bd-glow" aria-hidden="true"></div><div data-bd="head"></div><div data-bd="ctl"></div><div class="bd-live" data-bd="live"></div><div class="bd-pvs" data-bd="pv"></div></div>' +
      '</div>');
  }

  function update(v, K_, el) {
    if (!v || !v.me) return;
    const L = K.local;
    const key = keyOf(v);
    const newKey = L.key !== key;
    if (newKey) { L.key = key; L.picks = []; L.choice = null; L.xc = null; }
    L.pm = pickMode(v);

    // veil
    K.patch(K.$('.bd-veil-slot', el), v.phase === 'assassin' ? '<div class="ux-assassin-veil bd-veil"></div>' : '');
    K.patch(K.$('[data-bd="top"]', el), topHtml(v));
    K.patch(K.$('[data-bd="seat"]', el), K.seatNotice ? K.seatNotice(v) : '');
    const tr = trackHtml(v);
    K.patch(K.$('[data-bd="track"]', el), tr.html);
    tr.fresh.forEach(f => setTimeout(() => {
      const q = K.$('.ux-quest[data-q="' + f.i + '"]', el); if (!q) return;
      K.fx.burstAt(q, { n: 26, speed: 180, life: 1, size: 7, colors: f.res === 'success' ? undefined : ['rgba(255,110,140,1)', 'rgba(170,120,255,1)', 'rgba(255,200,210,1)'] });
    }, 380));
    K.patchList(K.$('[data-bd="table"]', el), seatItems(v, L.pm));

    const P = actionParts(v);
    const act = K.$('[data-bd="action"]', el);
    act.classList.toggle('turn', P.mood === 'turn');
    act.classList.toggle('dark', P.mood === 'dark');
    const headChanged = K.patch(K.$('[data-bd="head"]', el), P.head);
    const ctlChanged = K.patch(K.$('[data-bd="ctl"]', el), P.ctl);
    K.patch(K.$('[data-bd="live"]', el), P.live);
    applyLocal(el, v);

    // my turn just started → gentle chime + bring the action into view (not for seat-pick modes: seats are above)
    const turn = isMyTurn(v) ? key + '|' + v.phase : null;
    if (turn && L.turnKey !== turn) {
      L.turnKey = turn;
      const sk = 'bd-turn-' + v.code;
      if (K.store.sget(sk, null) !== turn) { K.store.sset(sk, turn); K.fb('chime'); }
      if ((headChanged || ctlChanged) && (v.phase === 'vote' || v.phase === 'quest')) {
        setTimeout(() => { try { act.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' }); } catch (x) { } }, 650);
      }
    } else if (!turn) L.turnKey = null;
  }

  K.screens.board = { build, update };
  /* Phase 'excalibur' is drawn by this board screen too (core's K.screenFor maps every in-game phase to 'board'). */

  // ---------- actions ----------
  const scr = () => K.screenEl();
  K.actions['bd-marks'] = () => {
    const on = !showMarks(); K.store.set('showMarks', on); K.fb('tap');
    K.toast(on ? K.L('알고 있는 정보를 표시했어요. 옆 사람이 화면을 보지 않게 조심하세요.', 'Showing what you know. Make sure no one can see your screen.') : K.L('알고 있는 정보를 숨겼어요', 'Hid what you know'), 'info');
    K.rerender();
  };
  K.actions['bd-history'] = () => { K.fb('tap'); if (typeof K.openHistory === 'function') K.openHistory(); else K.toast(K.L('기록을 준비 중이에요', 'History is coming soon'), 'info'); };
  K.actions['bd-role'] = () => { K.fb('tap'); if (typeof K.openRoleSheet === 'function') K.openRoleSheet(); else K.toast(K.L('역할 카드를 준비 중이에요', 'Role card is coming soon'), 'info'); };

  K.actions['bd-seat'] = (d, node) => {
    const L = K.local; const pm = L.pm; if (!pm || !pm.mode || !pm.allowed.has(d.id)) return;
    L.picks = L.picks || [];
    const i = L.picks.indexOf(d.id);
    if (pm.mode === 'single') L.picks = i >= 0 ? [] : [d.id];
    else if (i >= 0) L.picks.splice(i, 1);
    else if (L.picks.length >= pm.size) { K.toast(K.L(pm.size + '명까지 고를 수 있어요. 먼저 한 명을 빼 주세요.', 'You can pick up to ' + pm.size + '. Remove someone first.'), 'info'); K.shake(node); K.buzz('tick'); return; }
    else L.picks.push(d.id);
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-xc'] = (d, node) => {
    const L = K.local; if (!L.pm || L.pm.mode !== 'multi') return;
    L.xc = L.xc === d.id ? null : d.id;
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-pv'] = (d) => {
    const L = K.local;
    L.pvOpen = L.pvOpen === d.k ? null : d.k;
    K.fb('tap');
    clearTimeout(L.pvT);
    if (L.pvOpen) L.pvT = setTimeout(() => { if (K.local === L && L.pvOpen) { L.pvOpen = null; const s = scr(); if (s && K.view) applyLocal(s, K.view); } }, 6000);
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
  };

  /* Lancelot variant 2: a Lancelot must play for their current side, so a current-Tempter Lancelot can't play Blessing.
     Handled exactly like a good player's Hindrance: same buttons for everyone, a tap on the wrong one only shakes and
     shows a short note on that phone. */
  const lancelotMustFail = v => !!(v && v.lancelot === 2 && v.me && /^lancelot(Good|Evil)$/.test(v.me.role || '') && v.me.team === 'evil');
  K.actions['bd-choice'] = (d, node) => {
    const v = K.view; const val = d.val === '1';
    if (v.phase === 'quest' && val && lancelotMustFail(v)) {
      K.shake(node); K.buzz('tick');
      K.toast(K.term('lancelotForced', K.L('지금 편대로만 낼 수 있어요', 'You can only play for your current side')), 'info');
      return;
    }
    if (v.phase === 'quest' && !val && v.me && v.me.team === 'good') {
      K.shake(node); K.buzz('tick');
      K.toast(K.L(jo(K.teamName('good'), '은', '는') + ' ' + W.success() + '만 낼 수 있어요', K.teamName('good') + ' can only play ' + W.success()), 'info');
      return;
    }
    K.local.choice = K.local.choice === val ? null : val;
    K.fb('pick');
    applyLocal(scr(), v);
  };

  async function send(btn, name, ...args) {
    if (btn) btn.disabled = true;
    K.fb('tap');
    const r = await K.call(name, ...args);
    if (r && r.ok !== false) {
      if (btn && (name === 'vote' || name === 'quest')) K.fx.burstAt(btn, { n: 22, speed: 160, life: .9, size: 6 });
    }
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
    return r;
  }
  K.actions['bd-propose'] = (d, btn) => {
    const L = K.local; const v = K.view;
    if (!L.pm || L.pm.mode !== 'multi' || L.picks.length !== L.pm.size) return;
    const team = K.players(v).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0);   // seat order
    if (xcOn(v)) {
      if (!L.xc || team.indexOf(L.xc) < 0 || L.xc === meId(v)) { K.toast(K.L(W.xc() + '을 맡길 사람을 골라 주세요', 'Choose who gets the ' + W.xc()), 'info'); return; }
      send(btn, 'propose', team, L.xc);
    } else send(btn, 'propose', team);
  };
  K.actions['bd-vote'] = (d, btn) => { if (K.local.choice == null) return; send(btn, 'vote', !!K.local.choice); };
  K.actions['bd-quest'] = (d, btn) => {
    const v = K.view; const c = K.local.choice; if (c == null) return;
    if (!c && v.me && v.me.team === 'good') return;
    if (c && lancelotMustFail(v)) return;
    send(btn, 'quest', !!c);
  };
  K.actions['bd-lady'] = (d, btn) => { const id = (K.local.picks || [])[0]; if (id) send(btn, 'lady', id); };
  K.actions['bd-xc-flip'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id || K.view.phase !== 'excalibur') return;
    const raw = K.pname(K.view, id), name = K.esc(raw);
    const ok = await K.confirm(K.L(raw + '님의 카드를 뒤집을까요?', 'Flip ' + raw + '\'s card?'),
      K.L('<b>' + name + '</b>님의 카드가 반대로 바뀌어요.<br>원래 무엇이었는지는 나만 알게 되고, 누구의 카드를 뒤집었는지는 모두에게 공개돼요.',
        '<b>' + name + '</b>\'s card turns to the opposite.<br>Only you learn what it was; everyone sees whose card you flipped.'),
      { ok: W.xcFlip(), cancel: K.L('취소', 'Cancel') });
    if (!ok) return;
    send(btn, 'excalibur', id);
  };
  K.actions['bd-xc-pass'] = async (d, btn) => {
    if (K.view.phase !== 'excalibur') return;
    const ok = await K.confirm(K.L('카드를 그대로 둘까요?', 'Leave every card as it is?'),
      K.L('아무 카드도 뒤집지 않고 결과를 공개해요.', 'No card is flipped and the result is revealed.'),
      { ok: W.xcPass(), cancel: K.L('취소', 'Cancel') });
    if (!ok) return;
    send(btn, 'excalibur');
  };
  K.actions['bd-assassin'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id) return;
    const raw = K.pname(K.view, id); const name = K.esc(raw);
    const seer = W.seer(), evil = K.teamName('evil');
    const ok = await K.confirm(K.L(raw + '님을 ' + W.assassinate() + '할까요?', 'Name ' + raw + '?'),
      K.L('<b>' + name + '</b>님이 ' + K.esc(jo(seer, '이', '가')) + ' 맞다면 ' + K.esc(jo(evil, '이', '가')) + ' 승리해요.<br>한 번 정하면 되돌릴 수 없어요.',
        'If <b>' + name + '</b> is the ' + K.esc(seer) + ', ' + K.esc(evil) + ' win.<br>This can\'t be undone.'),
      { ok: K.L(W.assassinate() + '하기', W.assassinate()), cancel: K.L('취소', 'Cancel'), danger: true });
    if (!ok) return;
    send(btn, 'assassinate', id);
  };
})();


/* ---- src/40-cine.js ---- */
/* 빛의 원정대 — full-screen cinematics (deal, begin, vote, excalibur, quest, loyalty, lady, assassin, end); Korean + English via K.L.
   Registered as K.cine.<type> = async (ctx, ev, v, K). Core plays them in order, then fades the overlay.
   Style: biblical manuscript (gold leaf, stained glass, scroll, candle light). Light from above for good,
   purple dusk for evil. Only transform/opacity animate. Every effect is skipped once ctx.skipped. */
(function () {
  'use strict';
  const K = window.UI && window.UI._k; if (!K) return;
  const C = K.cine;

  // ---------- palette for particles ----------
  const GOLD = ['rgba(255,231,168,1)', 'rgba(244,201,107,1)', 'rgba(255,255,255,1)'];
  const DUSK = ['rgba(180,140,224,1)', 'rgba(142,108,200,1)', 'rgba(255,140,170,1)'];
  const colOf = t => (t === 'evil' ? DUSK : GOLD);

  // ---------- CSS (injected once) ----------
  const CSS = `
.cn-ov > .inner { position: relative; z-index: 1; }
.cn-bgl, .cn-fxl { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.cn-bgl { z-index: 0; }
.cn-fxl { z-index: 2; }
.cn-scn { position: absolute; inset: 0; animation: cnFade .9s ease both; }
.cn-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 13px; text-align: center; word-break: keep-all; overflow-wrap: anywhere; }
.cn-wrap .ux-cine-sub { max-width: 100%; }
.cn-me { font-size: .82em; color: var(--text-mute); font-weight: 400; }
.cn-tap { height: 18px; font-size: 12px; letter-spacing: .14em; color: var(--text-mute); opacity: 0; }
.cn-tap.cn-on { animation: cnTapIn .5s both, cnPulse 1.8s .5s ease-in-out infinite; }
.cn-pre { opacity: 0; transform: translateY(10px) scale(.97); transition: opacity .45s ease, transform .6s var(--ease-spring); }
.cn-pre.cn-on { opacity: 1; transform: none; }
.cn-dim { opacity: .3 !important; transform: scale(.94); transition: opacity .6s ease, transform .6s ease; }
.cn-note { font-size: 14px; color: var(--text-dim); line-height: 1.5; }
.cn-note.evil { color: #d9c2ff; }
.cn-note b { color: var(--text); }
.cn-res { width: 100%; min-height: 118px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 4px; }
.cn-res .ux-banner { font-size: min(32px, 8vw); padding: 2px 12px; line-height: 1.25; }
.cn-res .cn-note, .cn-res .ux-verse, .cn-res .cn-pips { animation: cnRise .7s .35s var(--ease-out) both; }
.cn-res .ux-verse { animation-delay: .7s; margin-top: 4px; }
.ux-banner.cn-long { font-size: min(25px, 6.6vw); line-height: 1.32; padding: 2px 6px; }
.ux-banner.evil.cn-dusky { color: #e4d6f5; text-shadow: 0 0 26px rgba(142,108,200,.75), 0 0 54px rgba(224,72,110,.35); }
@keyframes cnFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cnRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes cnTapIn { from { opacity: 0; transform: translateY(6px); } to { opacity: .8; transform: none; } }
@keyframes cnPulse { 0%, 100% { opacity: .35; } 50% { opacity: .9; } }
@keyframes cnFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes cnSpin { to { rotate: 360deg; } }

/* background scenes: light from above, stained glass, candle, dusk */
.cn-at { position: absolute; left: 50%; width: 0; height: 0; }
.cn-glow { position: absolute; left: -210px; top: -210px; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, rgba(255,215,122,.34), rgba(255,215,122,.08) 45%, transparent 68%); animation: cnGlow 3.2s ease-in-out infinite; }
.cn-glow.evil { background: radial-gradient(circle, rgba(142,108,200,.42), rgba(224,72,110,.10) 45%, transparent 68%); }
.cn-glow.candle { background: radial-gradient(circle, rgba(255,190,110,.30), rgba(255,170,80,.07) 45%, transparent 68%); animation-duration: 2.1s; }
@keyframes cnGlow { 0%, 100% { opacity: .65; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.08); } }
.cn-rose { position: absolute; left: 0; top: 0; width: 0; height: 0; animation: cnRoseIn 1.4s var(--ease-out) both; }
.cn-rose .ux-rose { opacity: .32; }
@keyframes cnRoseIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1.45); } }
.cn-rays { position: absolute; left: -380px; top: -380px; width: 760px; height: 760px; border-radius: 50%;
  background: repeating-conic-gradient(rgba(255,231,168,.12) 0deg 6deg, transparent 6deg 18deg);
  -webkit-mask-image: radial-gradient(circle, #000 6%, transparent 62%); mask-image: radial-gradient(circle, #000 6%, transparent 62%);
  animation: cnRaysIn 1.3s var(--ease-out) both, cnSpin 30s linear infinite; will-change: transform; }
.cn-rays.evil { background: repeating-conic-gradient(rgba(180,140,224,.14) 0deg 6deg, transparent 6deg 18deg); }
@keyframes cnRaysIn { from { opacity: 0; transform: scale(.35); } to { opacity: 1; transform: none; } }
.cn-beams { position: absolute; left: 50%; top: -30px; width: 0; height: 0; }
.cn-beams.soft { opacity: .45; }
.cn-beams i { position: absolute; left: -48px; top: 0; width: 96px; height: 130vh; transform-origin: 50% 0; transform: rotate(var(--r));
  background: linear-gradient(90deg, transparent, rgba(255,238,190,.24) 50%, transparent);
  -webkit-mask-image: linear-gradient(#000, rgba(0,0,0,.55) 45%, transparent 88%); mask-image: linear-gradient(#000, rgba(0,0,0,.55) 45%, transparent 88%);
  animation: cnBeam 7s ease-in-out infinite; will-change: transform, opacity; }
@keyframes cnBeam { 0%, 100% { transform: rotate(var(--r)) scaleX(1); opacity: .5; } 50% { transform: rotate(calc(var(--r) + 4deg)) scaleX(1.3); opacity: 1; } }
.cn-dusk { position: absolute; inset: 0; background: linear-gradient(to top, rgba(58,37,80,.92), rgba(30,16,46,.85) 50%, rgba(12,6,20,.8)); }
.cn-dusk i { position: absolute; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(126,87,166,.42), transparent 65%); animation: cnWisp 9s ease-in-out infinite alternate; will-change: transform; }
.cn-dusk i:nth-child(1) { left: -130px; bottom: -80px; }
.cn-dusk i:nth-child(2) { right: -150px; bottom: 18%; animation-duration: 11s; animation-delay: -4s; background: radial-gradient(circle, rgba(224,72,110,.22), transparent 65%); }
.cn-dusk i:nth-child(3) { left: 12%; top: -190px; animation-duration: 13s; animation-delay: -2s; }
.cn-dusk b { position: absolute; left: 50%; top: 9%; width: 70px; height: 70px; margin-left: 80px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #f4ecff, #b48ce0 60%, transparent 62%); opacity: .55; animation: cnFloat 6s ease-in-out infinite; }
@keyframes cnWisp { from { transform: translate(0, 0) scale(1); } to { transform: translate(60px, -46px) scale(1.22); } }

/* scroll unrolling (parchment) */
.cn-scroll { position: relative; width: 280px; max-width: 100%; height: 56px; flex: none; }
.cn-scroll .sh { position: absolute; left: 9px; right: 9px; top: 6px; bottom: 6px; border-radius: 3px; display: grid; place-items: center; padding: 0 14px;
  background: linear-gradient(180deg, #fbf0d6, #efdcb2 55%, #dcc08a); color: #4a3426; font-family: var(--font-display); font-weight: 700; font-size: 17px;
  box-shadow: inset 0 0 0 1px rgba(150,100,40,.35), inset 0 0 16px rgba(140,90,30,.32), 0 8px 18px rgba(0,0,0,.45);
  transform: scaleX(.02); animation: cnUnroll .9s .2s var(--ease-out) forwards; }
.cn-scroll .sh span { display: block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; animation: cnFade .5s .85s forwards; }
.cn-scroll .sh b { color: #7a4c1a; }
.cn-scroll i { position: absolute; top: 0; bottom: 0; width: 14px; border-radius: 7px; background: linear-gradient(90deg, #7a4c1a, #e8bb62 45%, #6e4416); box-shadow: 0 4px 10px rgba(0,0,0,.45); }
.cn-scroll i::before, .cn-scroll i::after { content: ''; position: absolute; left: 2px; width: 10px; height: 7px; border-radius: 4px; background: #c98d2e; }
.cn-scroll i::before { top: -4px; } .cn-scroll i::after { bottom: -4px; }
.cn-scroll .rl { left: 0; transform: translateX(133px); animation: cnRod .9s .2s var(--ease-out) forwards; }
.cn-scroll .rr { right: 0; transform: translateX(-133px); animation: cnRod .9s .2s var(--ease-out) forwards; }
@keyframes cnUnroll { to { transform: scaleX(1); } }
@keyframes cnRod { to { transform: none; } }

/* sparks (DOM particles inside the overlay) */
.cn-sp { position: absolute; border-radius: 50%; background: radial-gradient(circle, #fff 0 16%, var(--c) 36%, transparent 70%); animation: cnSpark 1s cubic-bezier(.12,.75,.3,1) forwards; will-change: transform, opacity; }
@keyframes cnSpark { 0% { transform: translate(0, 0) scale(1.25); opacity: 1; } 70% { opacity: .9; } 100% { transform: translate(var(--dx), var(--dy)) scale(.2); opacity: 0; } }
.cn-sp.cn-drop { top: -24px; animation-name: cnFall; animation-timing-function: linear; }
@keyframes cnFall { 0% { transform: translate(0, 0); opacity: 0; } 8% { opacity: 1; } 85% { opacity: .9; } 100% { transform: translate(var(--dx), 112vh); opacity: 0; } }

/* deal */
.cn-table { position: relative; flex: none; }
.cn-seat { position: absolute; left: 50%; top: 50%; width: 66px; margin: -27px 0 0 -33px; display: flex; flex-direction: column; align-items: center; gap: 3px; animation: cnFade .5s both; }
.cn-seat span { font-size: 12px; max-width: 66px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-dim); }
.cn-seat .ux-avatar { transition: transform .4s var(--ease-spring); }
.cn-seat.got .ux-avatar { transform: scale(1.12); box-shadow: 0 0 0 2px rgba(244,201,107,.7), 0 0 16px rgba(244,201,107,.5); }
.cn-seat.me span { color: var(--gold-hi); font-weight: 700; }
.cn-dcard { position: absolute; left: 50%; top: 50%; width: 44px; height: 62px; margin: -31px 0 0 -22px; border-radius: 6px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,.5); transition: transform .6s var(--ease-out); animation: cnFade .35s both; will-change: transform; }
.cn-dcard img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cn-candle { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px; border-radius: 50%; background: radial-gradient(circle, rgba(255,200,120,.45), transparent 68%); animation: cnGlow 2.2s ease-in-out infinite; }

/* begin */
.cn-emblem { width: 86px; height: 86px; position: relative; animation: cnFloat 3.2s ease-in-out infinite; }
.cn-emblem img { width: 100%; height: 100%; object-fit: contain; position: relative; }

/* vote */
.cn-chips { margin-bottom: 0; }
.cn-vgw { position: relative; width: 100%; }
.cn-vg { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 8px; }
.cn-vg .ux-vcard { width: calc((100% - (var(--cols) - 1) * 8px) / var(--cols)); max-width: 84px; animation: cnCardIn .55s var(--ease-spring) both; }
.cn-vg .ux-vcard .b { background: linear-gradient(160deg, #2c3a78, #121842); }
.cn-vg .ux-vcard .f { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-size: 12px; }
.cn-vg .ux-vcard .f img { width: 58%; height: auto; }
.cn-vg.sm .ux-vcard .c { width: 54px; height: 72px; }
.cn-vg.sm .ux-vcard .f { font-size: 11px; }
.cn-vg .ux-vcard.cn-onteam .n { color: var(--gold-hi); font-weight: 700; }
.cn-vg .ux-vcard .n { max-width: 100%; }
@keyframes cnCardIn { from { opacity: 0; transform: translateY(26px) scale(.8) rotate(-7deg); } to { opacity: 1; transform: none; } }
.cn-count { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.cn-count b { font-family: var(--font-display); font-size: 88px; font-weight: 700; line-height: 1; color: var(--gold-hi); text-shadow: 0 0 28px rgba(244,201,107,.85), 0 4px 22px rgba(0,0,0,.9); animation: cnBeat .58s var(--ease-out) both; }
@keyframes cnBeat { 0% { opacity: 0; transform: scale(2.3); } 35% { opacity: 1; transform: scale(.95); } 75% { opacity: 1; } 100% { opacity: 0; transform: scale(1); } }
.cn-pips { display: flex; gap: 7px; justify-content: center; margin: 4px 0 2px; }
.cn-pips i { width: 13px; height: 13px; border-radius: 50%; border: 1.5px solid rgba(180,140,224,.55); }
.cn-pips i.on { background: radial-gradient(circle at 40% 35%, #f0d8ff, #8e6cc8 60%); border-color: #b48ce0; }
.cn-pips i.last { animation: cnPip .7s .5s var(--ease-spring) both; }
@keyframes cnPip { from { transform: scale(2.2); opacity: 0; } to { transform: none; opacity: 1; } }

/* quest */
.cn-qp { height: 168px; }
.cn-qp .ux-qcard { transition: transform .62s var(--ease-out); will-change: transform; }
.cn-qp .ux-qcard.shuffle:nth-child(even) { animation-direction: alternate-reverse; }
.cn-qp .ux-qcard.shuffle:nth-child(3n) { animation-duration: .38s; }
.cn-qp .ux-qcard .f { font-size: 16px; }
.cn-qp .ux-qcard .f span { font-size: 15px; }
.cn-qt { display: flex; gap: 8px; justify-content: center; }
.cn-qt .ux-chip b { font-size: 15px; }
.cn-qt .ux-chip.s b { color: var(--good); } .cn-qt .ux-chip.x b { color: #d9c2ff; }

/* lady */
.cn-lady .ux-lamp-big { animation: cnFloat 3s ease-in-out infinite; }
.cn-lady .ux-lamp-big.sm { width: 96px; height: 96px; }
.cn-ask { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--text); }
.cn-ask .ux-dots { margin-left: 4px; vertical-align: middle; }
.cn-lres { min-height: 150px; }
.cn-emb { width: 76px; height: 76px; animation: bannerIn .9s var(--ease-spring) both; }
.cn-emb img { width: 100%; height: 100%; object-fit: contain; }
.ux-lady-result.cn-good { color: var(--gold-hi); text-shadow: 0 0 22px var(--good-glow); }
.ux-lady-result.cn-evil { color: #e4d6f5; text-shadow: 0 0 22px rgba(142,108,200,.8); }
.cn-secret { font-size: 13px; color: var(--text-dim); padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,.05); border: 1px solid var(--line); line-height: 1.5; }
.cn-t2 { font-size: 22px; line-height: 1.4; }

/* assassin */
.cn-toks { display: flex; gap: 12px; justify-content: center; }
.cn-tok { width: 54px; height: 54px; animation: cnTok .7s var(--ease-spring) both; }
.cn-tok img { width: 100%; height: 100%; object-fit: contain; }
@keyframes cnTok { from { opacity: 0; transform: translateY(-30px) scale(.4); } to { opacity: 1; transform: none; } }
.cn-turn { min-height: 196px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.cn-but { font-family: var(--font-display); font-size: 20px; color: #d9c2ff; animation: cnRise .7s both; }
.cn-turn .ux-banner { animation-delay: .35s; }
.cn-who { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px 8px 8px; border-radius: 999px; background: rgba(91,58,122,.35); border: 1px solid rgba(180,140,224,.45); animation: cnRise .7s .8s both; text-align: left; }
.cn-who small { display: block; font-size: 12.5px; color: #d9c2ff; }
.cn-who b { font-size: 16px; }
.cn-turn .cn-note { animation: cnRise .7s 1.1s both; }

/* end: target card */
.cn-tcard { position: relative; width: 128px; height: 179px; flex: none; border-radius: 14px; perspective: 900px; }
.cn-beat { position: absolute; inset: 0; }
.cn-tcard .c { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .9s var(--ease-spring); }
.cn-tcard.flip .c { transform: rotateY(180deg); }
.cn-tcard .b, .cn-tcard .f { position: absolute; inset: 0; border-radius: 14px; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--bg2); }
.cn-tcard .b { box-shadow: 0 12px 30px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,227,163,.45); }
.cn-tcard .f { transform: rotateY(180deg); }
.cn-tcard img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cn-tcard.good .f { box-shadow: 0 0 0 2px var(--good), 0 0 30px var(--good-glow); }
.cn-tcard.evil .f { box-shadow: 0 0 0 2px #b48ce0, 0 0 30px rgba(142,108,200,.75); }
.cn-tname { min-height: 46px; }
.cn-zoom { display: inline-flex; align-items: center; gap: 10px; animation: cnZoom .9s var(--ease-out) both; }
.cn-zoom b { font-family: var(--font-display); font-size: 26px; }
@keyframes cnZoom { 0% { opacity: 0; transform: scale(2.8); } 55% { opacity: 1; } 100% { opacity: 1; transform: none; } }

/* end: winner */
.cn-crest { width: 128px; height: 128px; position: relative; animation: bannerIn 1.1s var(--ease-spring) both; }
.cn-crest img { width: 100%; height: 100%; object-fit: contain; animation: cnFloat 4s 1.1s ease-in-out infinite; }
.cn-mine { font-weight: 900; font-size: 17px; padding: 8px 18px; border-radius: 999px; animation: cnRise .7s 1.2s both; }
.cn-mine.w { color: #2a1a02; background: linear-gradient(180deg, #fff0c4, #f4c96b 60%, #c98d2e); box-shadow: 0 6px 22px rgba(244,201,107,.45); }
.cn-mine.l { color: var(--text-dim); background: rgba(255,255,255,.06); border: 1px solid var(--line); }
.cn-win .ux-verse { animation: cnRise .7s 1.5s both; }
.cn-win .ux-banner { font-size: min(34px, 8.4vw); }

/* loyalty (Crossroads card) */
.cn-lo .cn-tcard .f { background: var(--bg2); }
.cn-lo .cn-tcard.none .f { box-shadow: 0 0 0 2px var(--good), 0 0 30px var(--good-glow); }
.cn-lo .cn-tcard.switch .f { box-shadow: 0 0 0 2px #b48ce0, 0 0 26px rgba(180,140,224,.7), 0 0 44px rgba(244,201,107,.35); }
.cn-lo .cn-tcard.cn-swap .cn-beat { animation: cnSwap 1.1s var(--ease-out) both; }
@keyframes cnSwap { 0% { transform: rotate(0); } 30% { transform: rotate(-9deg) scale(1.05); } 60% { transform: rotate(7deg) scale(1.05); } 100% { transform: none; } }
.cn-lohist { display: flex; gap: 8px; justify-content: center; align-items: center; }
.cn-lohist i { width: 24px; height: 34px; border-radius: 4px; overflow: hidden; opacity: .55; box-shadow: 0 2px 6px rgba(0,0,0,.45); }
.cn-lohist i.cur { opacity: 1; box-shadow: 0 0 0 1.5px var(--gold-hi), 0 2px 8px rgba(0,0,0,.5); }
.cn-lohist img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cn-loplan { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cn-loplan > small { font-size: 12px; color: var(--text-mute); letter-spacing: .04em; }
.cn-loplan > div { display: flex; gap: 7px; justify-content: center; }
.cn-loplan .pc { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 11px; color: var(--text-mute); }
.cn-loplan .pc i { display: block; width: 40px; height: 56px; border-radius: 5px; overflow: hidden; opacity: .6; box-shadow: 0 2px 6px rgba(0,0,0,.45); transition: transform .5s var(--ease-spring), opacity .4s ease, box-shadow .4s ease; }
.cn-loplan .pc i img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cn-loplan .pc.past i { opacity: .3; }
.cn-loplan .pc.cur b { color: var(--gold-hi); }
.cn-loplan.cn-hl .pc.cur i { opacity: 1; transform: translateY(-5px) scale(1.12); box-shadow: 0 0 0 2px var(--gold-hi), 0 0 18px rgba(244,201,107,.6), 0 4px 10px rgba(0,0,0,.5); }
.ux-banner.cn-sw { color: #eadcff; text-shadow: 0 0 24px rgba(180,140,224,.85), 0 0 50px rgba(244,201,107,.35); }

/* excalibur (Scroll of the Word) */
.cn-xc .cn-emblem { width: 92px; height: 92px; }
.cn-xpair { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
.cn-xpair .ux-team-chip { animation: cnRise .6s both; max-width: calc(50% - 62px); min-width: 0; flex: 0 1 auto; }
.cn-xpair .ux-team-chip > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cn-xarrow { font-size: 22px; color: var(--gold-hi); animation: cnRise .6s .25s both; }
.cn-xcard { position: relative; width: 64px; height: 90px; flex: none; perspective: 700px; }
.cn-xcard .c { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .9s var(--ease-spring); }
.cn-xcard.flip .c { transform: rotateY(180deg); }
.cn-xcard .b, .cn-xcard .f { position: absolute; inset: 0; border-radius: 8px; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; box-shadow: 0 8px 18px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,227,163,.45); }
.cn-xcard .f { transform: rotateY(180deg); }
.cn-xcard img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cn-xcard.kept .c { animation: cnFloat 2.6s ease-in-out infinite; }

/* English is longer: size tweaks only */
.ux-en .cn-res .ux-banner { font-size: min(28px, 7.2vw); }
.ux-en .ux-banner.cn-long { font-size: min(23px, 6.2vw); }
.ux-en .cn-win .ux-banner { font-size: min(30px, 7.6vw); }
.ux-en .cn-scroll .sh { font-size: 14px; }
.ux-en .cn-t2 { font-size: 20px; }
.ux-en .cn-ask { font-size: 19px; }
.ux-en .cn-tap { letter-spacing: .08em; }

@media (max-height: 700px) {
  .cn-wrap { gap: 9px; }
  .cn-wrap > .ux-ornament, .cn-vote .cn-res .ux-verse, .cn-quest .cn-res .ux-verse { display: none; }
  .cn-res { min-height: 92px; }
  .cn-qp { height: 150px; }
  .cn-crest { width: 100px; height: 100px; }
}
@media (prefers-reduced-motion: reduce) {
  .cn-beams i, .cn-rays, .cn-dusk i, .cn-glow { animation: none !important; }
}
`;
  function injectCSS() {
    if (document.getElementById('cn-style')) return;
    const s = document.createElement('style'); s.id = 'cn-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- Korean particles (josa) ----------
  function jong(w) {
    const s = String(w == null ? '' : w).replace(/[\s)\]"'!?.…~]+$/, '');
    if (!s) return -1;
    const c = s.charCodeAt(s.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28;
    const d = '0123456789'.indexOf(s[s.length - 1]);
    return d >= 0 ? [21, 8, 0, 16, 0, 0, 1, 8, 8, 0][d] : -1;
  }
  const PJ = { '이': ['이', '가'], '을': ['을', '를'], '은': ['은', '는'], '과': ['과', '와'], '이에요': ['이에요', '예요'], '이었어요': ['이었어요', '였어요'] };
  /* P(word, '이'|'을'|'은'|'과'|'으로'|'이에요'|'이었어요') -> word + correct particle (plain text, escape afterwards) */
  function P(w, t) {
    w = String(w == null ? '' : w); const j = jong(w);
    if (t === '으로') return w + (j < 0 ? '(으)로' : (j === 0 || j === 8) ? '로' : '으로');
    const p = PJ[t]; if (!p) return w + t;
    if (j < 0) return w + (t === '이에요' || t === '이었어요' ? p[0] : p[0] + '(' + p[1] + ')');
    return w + (j === 0 ? p[1] : p[0]);
  }
  const E = s => K.esc(s);
  const EP = (w, t) => K.esc(P(w, t));

  // ---------- shared bits ----------
  /* Every user-visible string goes through L(ko, en) at render time (never at file load), so a language switch
     shows the other language on the next cinematic. Korean particles (P/EP) only inside Korean branches. */
  const L = (ko, en) => K.L(ko, en);
  const EN = () => !!(K.isEn && K.isEn());
  const term = (k, d) => K.term(k, d);
  const Q = () => term('quest', L('사명', 'Mission'));
  const LEADER = () => term('leader', L('조장', 'Leader'));
  const TEAMW = () => term('questTeam', term('team', L('원정대', 'Expedition')));
  const XC = () => term('excalibur', L('말씀 두루마리', 'Scroll of the Word'));
  const LOY = () => term('loyalty', L('갈림길 카드', 'Crossroads card'));
  const LANC = () => term('lancelot', L('갈림길의 순례자 (랜슬롯)', 'Lancelot'));
  const ROLE = (key, ko, en) => K.roleName(key) || L(ko, en);
  const SPY = () => ROLE('assassin', '정탐꾼', 'Spy');
  const PROPHET = () => ROLE('merlin', '선지자', 'Prophet');
  const TEAMN = t => K.teamName(t) || (t === 'evil' ? L('유혹의 무리', 'The Tempters') : L('빛의 일꾼들', 'Workers of Light'));
  /* English: "the Workers of Light" / "the Tempters" mid-sentence, "The …" at the start */
  const theTeam = t => { const n = TEAMN(t); return /^the\s/i.test(n) ? 'the' + n.slice(3) : 'the ' + n; };
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const pl1 = (n, one, many) => (n === 1 ? one : many);
  const nm = (v, id) => E(K.pname(v, id));
  const ME = () => L('(나)', '(you)');
  const who = (v, id) => nm(v, id) + (K.isMe(v, id) ? ' <span class="cn-me">' + ME() + '</span>' : '');
  /* English subject / object for a player: "You" / "you" for me, the name otherwise (escaped) */
  const enSubj = (v, id) => (K.isMe(v, id) ? 'You' : nm(v, id));
  const enObj = (v, id) => (K.isMe(v, id) ? 'you' : nm(v, id));
  const TAP = () => '<div class="cn-tap" aria-hidden="true">' + L('탭하여 계속', 'Tap to continue') + '</div>';
  const verse = (t, c, pre) => '<div class="ux-verse' + (pre ? ' cn-pre' : '') + '">' + E(t) + (c ? '<cite>' + E(c) + '</cite>' : '') + '</div>';
  /* bilingual verse: Korean phrase + short ref, English = World English Bible wording */
  const V = (ko, kc, en, ec, pre) => (EN() ? verse(en, ec, pre) : verse(ko, kc, pre));
  const scroll = html => '<div class="cn-scroll"><i class="rl"></i><div class="sh"><span>' + html + '</span></div><i class="rr"></i></div>';
  const pl = (v, id) => K.player(v, id) || { id: id, name: '?' };
  function chips(v, ids) {
    if (!ids || !ids.length) return '';
    return '<div class="ux-team-row cn-chips">' + ids.map((id, i) => '<span class="ux-team-chip" style="animation-delay:' + (200 + i * 70) + 'ms">' + K.avatar(pl(v, id)) + '<span>' + nm(v, id) + '</span></span>').join('') + '</div>';
  }
  function seatOrder(v, ids) {
    const set = new Set(ids); const out = K.players(v).map(p => p.id).filter(id => set.has(id));
    ids.forEach(id => { if (out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  /* stage(ctx): per-cinematic helpers. Background scene layer + particle layer live inside the overlay. */
  function stage(ctx) {
    injectCSS();
    const ov = ctx.el; ov.classList.add('cn-ov');
    const R = K.reduced();
    const bg = K.el('<div class="cn-bgl" aria-hidden="true"></div>'); ov.insertBefore(bg, ov.firstChild);
    const fl = K.el('<div class="cn-fxl" aria-hidden="true"></div>'); ov.appendChild(fl);
    const live = () => !ctx.skipped && !(ctx.debt > 0);   // no bursts or sounds while a late phone catches up
    // K.fx draws on a canvas under the overlays; use it only if the integrator raised it above them.
    const canvasOnTop = () => { const c = document.querySelector('.ux-fx'); if (!c) return false; const z = parseInt(getComputedStyle(c).zIndex, 10); const oz = parseInt(getComputedStyle(ov).zIndex, 10) || 50; return z > oz; };
    const S = {
      R, live,
      M: ms => (R ? Math.round(ms * 0.35) : ms),       // motion-only waits shrink with reduced motion
      q: s => ctx.inner.querySelector(s),
      qa: s => Array.from(ctx.inner.querySelectorAll(s)),
      on(el, yes) { if (el) el.classList.toggle('cn-on', yes !== false); },
      fb(n) { if (live()) K.fb(n); },
      sfx(n) { if (live()) K.sfx(n); },
      buzz(n) { if (live()) K.buzz(n); },
      flash(t) { if (live()) K.flash(t); },
      shake(el) { if (live() && !R) K.shake(el || ctx.inner); },
      y(el) { if (!el) return innerHeight * 0.4; const r = el.getBoundingClientRect(); return r.top + r.height / 2; },
      /* scene('light'|'candle'|'dusk'|'none', centerY, {rays, rose}) */
      scene(kind, y, o) {
        o = o || {}; y = Math.round(y == null ? innerHeight * 0.4 : y);
        let h = '<div class="cn-scn">';
        if (kind === 'dusk') h += '<div class="cn-dusk"><i></i><i></i><i></i><b></b></div>';
        if (kind === 'light' || kind === 'candle') h += '<div class="cn-beams' + (kind === 'candle' ? ' soft' : '') + '">' + [-36, -20, -7, 7, 20, 36].map((r, i) => '<i style="--r:' + r + 'deg;animation-delay:' + (-i * 1.1).toFixed(1) + 's"></i>').join('') + '</div>';
        h += '<div class="cn-at" style="top:' + y + 'px">';
        if (o.rose || kind === 'light') h += '<div class="cn-rose"><div class="ux-rose"></div></div>';
        h += '<div class="cn-glow ' + (kind === 'dusk' ? 'evil' : kind === 'candle' ? 'candle' : '') + '"></div>';
        if (o.rays) h += '<div class="cn-rays ' + (kind === 'dusk' ? 'evil' : '') + '"></div>';
        h += '</div></div>';
        bg.innerHTML = h;
      },
      burst(el, o) {
        if (!live() || !el) return; o = o || {};
        if (canvasOnTop()) { K.fx.burstAt(el, o); return; }
        const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const n = R ? 6 : Math.min(48, o.n || 28), cols = o.colors || GOLD, sp = o.speed || 160, life = o.life || 1.1, sz = o.size || 10;
        let h = '';
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.283, s = sp * (0.35 + Math.random() * 0.8);
          const dx = Math.cos(a) * s, dy = Math.sin(a) * s + 30 - (o.lift || 20);
          const z = sz * (0.5 + Math.random()), t = life * (0.6 + Math.random() * 0.6);
          h += '<i class="cn-sp" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + (z | 0) + 'px;height:' + (z | 0) + 'px;margin:' + (-(z / 2) | 0) + 'px;--c:' + cols[i % cols.length] + ';--dx:' + (dx | 0) + 'px;--dy:' + (dy | 0) + 'px;animation-duration:' + t.toFixed(2) + 's"></i>';
        }
        const box = document.createElement('div'); box.innerHTML = h; fl.appendChild(box);
        setTimeout(() => box.remove(), life * 1250 + 200);
      },
      rain(team, secs) {
        if (!live() || R || canvasOnTop()) return;
        const cols = colOf(team), end = performance.now() + (secs || 3) * 1000;
        const step = () => {
          if (!fl.isConnected || performance.now() > end) return;
          let h = '';
          for (let i = 0; i < 3; i++) {
            const z = 6 + Math.random() * 9, t = 2.4 + Math.random() * 1.8;
            h += '<i class="cn-sp cn-drop" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + (z | 0) + 'px;height:' + (z | 0) + 'px;--c:' + cols[i % 3] + ';--dx:' + (((Math.random() - 0.5) * 90) | 0) + 'px;animation-duration:' + t.toFixed(2) + 's"></i>';
          }
          const b = document.createElement('div'); b.innerHTML = h; fl.appendChild(b);
          setTimeout(() => b.remove(), 4400); setTimeout(step, 90);
        };
        step();
      },
      tap() { S.on(S.q('.cn-tap')); }
    };
    return S;
  }

  // =====================================================================
  // deal: lobby -> reveal
  // =====================================================================
  C.deal = async (ctx, ev, v) => {
    const S = stage(ctx);
    let ps = K.players(v); if (!ps.length) ps = [0, 1, 2, 3, 4].map(i => ({ id: 'x' + i, name: '' }));
    const n = ps.length; const meIdx = Math.max(0, ps.findIndex(p => K.isMe(v, p.id)));
    ctx.set('<div class="cn-wrap cn-deal">' +
      '<div class="ux-ornament">✦</div>' +
      '<div class="ux-cine-title">' + L('역할 카드를 나눠드려요', 'Dealing the role cards') + '</div>' +
      '<div class="cn-table"></div>' +
      '<div class="ux-cine-sub">' + L('아무도 보지 않게 화면을 가리고 확인하세요', 'Cover your screen so no one else can see it') + '</div>' +
      V('각 사람에게 나누어 주시는 은사', '고전 12:11', 'Distributing to each one separately as he desires', '1 Corinthians 12:11', true) + TAP() + '</div>');
    const tb = S.q('.cn-table');
    const W = Math.max(250, Math.min(330, ctx.inner.clientWidth)), H = Math.round(W * 0.9);
    tb.style.width = W + 'px'; tb.style.height = H + 'px';
    const rx = W / 2 - 36, ry = H / 2 - 30;
    let seats = '<div class="cn-candle"></div>', cards = '';
    for (let i = 0; i < 3; i++) cards += '<div class="cn-dcard" style="transform:translate(' + (i * 1.5) + 'px,' + (6 - i * 2) + 'px)">' + K.backImg() + '</div>';
    ps.forEach((p, i) => {
      const a = Math.PI / 2 + (i - meIdx) * 2 * Math.PI / n;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      seats += '<div class="cn-seat' + (i === meIdx && K.isMe(v, p.id) ? ' me' : '') + '" style="transform:translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px);animation-delay:' + (i * 50) + 'ms">' + K.avatar(p) + '<span>' + E(p.name) + '</span></div>';
      const off = i - (n - 1) / 2;
      const tx = Math.cos(a) * rx * 0.56, ty = Math.sin(a) * ry * 0.56 - 6, rot = (Math.random() - 0.5) * 24;
      cards += '<div class="cn-dcard fly" style="transform:translate(' + (off * 9).toFixed(1) + 'px,' + (Math.abs(off) * 2.6 - 10).toFixed(1) + 'px) rotate(' + (off * 7).toFixed(1) + 'deg);animation-delay:' + (150 + i * 30) + 'ms" data-t="translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(.86)"></div>';
    });
    tb.innerHTML = seats + cards;
    S.qa('.cn-dcard.fly').forEach(c => { c.innerHTML = K.backImg(); });
    S.scene('candle', S.y(tb));
    S.fb('whoosh');
    await ctx.sleep(S.M(750));
    const flies = S.qa('.cn-dcard.fly'), seatEls = S.qa('.cn-seat');
    const stagger = Math.min(130, Math.round(1050 / n));
    for (let i = 0; i < flies.length; i++) {
      flies[i].style.transform = flies[i].dataset.t;
      S.sfx(i % 2 ? 'tick' : 'flip');
      const se = seatEls[i]; setTimeout(() => se && se.classList.add('got'), ctx.skipped ? 0 : 420);
      await ctx.sleep(S.M(stagger));
    }
    await ctx.sleep(S.M(600));
    const meSeat = S.q('.cn-seat.me') || seatEls[meIdx];
    S.burst(meSeat, { n: 22, speed: 110, size: 9 });
    S.fb('chime');
    S.on(S.q('.ux-verse'));
    await ctx.sleep(S.M(400));
    S.tap();
    await ctx.tapOrWait(2600);
  };

  // =====================================================================
  // begin: reveal -> first propose
  // =====================================================================
  C.begin = async (ctx, ev, v) => {
    const S = stage(ctx);
    const r = (v.round || 0) + 1, size = K.teamSize(v);
    ctx.set('<div class="cn-wrap cn-begin">' +
      '<div class="cn-emblem">' + K.tokenImg('leader') + '</div>' +
      '<div class="ux-banner good">' + E(Q()) + ' ' + r + '</div>' +
      scroll(L('첫 ', 'First ') + E(LEADER()) + ' · <b>' + nm(v, v.leaderId) + '</b>' + (K.isMe(v, v.leaderId) ? ' ' + ME() : '')) +
      '<div class="ux-cine-sub cn-pre">' + L(EP(LEADER(), '이') + ' ' + E(TEAMW()) + ' ' + size + '명을 제안해요', 'The ' + E(LEADER()) + ' proposes ' + size + ' players for the ' + E(TEAMW())) + '</div>' +
      V('너희는 세상의 빛이라', '마 5:14', 'You are the light of the world', 'Matthew 5:14', true) + TAP() + '</div>');
    S.scene('light', S.y(S.q('.ux-banner')), { rays: true });
    S.fb('chime');
    S.burst(S.q('.cn-emblem'), { n: 36, speed: 190 });
    await ctx.sleep(S.M(900));
    S.on(S.q('.ux-cine-sub.cn-pre'));
    await ctx.sleep(S.M(400));
    S.on(S.q('.ux-verse'));
    await ctx.sleep(S.M(500));
    S.tap();
    await ctx.tapOrWait(2500);
  };

  // =====================================================================
  // vote reveal (ev.d = lastVote)
  // =====================================================================
  C.vote = async (ctx, ev, v) => {
    const S = stage(ctx);
    const d = ev.d || {}, votes = d.votes || {};
    let ids = seatOrder(v, Object.keys(votes)); if (!ids.length) ids = K.players(v).map(p => p.id);
    const team = d.team || [], n = ids.length;
    const yes = ids.filter(id => votes[id] === true).length, no = n - yes;
    const ok = typeof d.approved === 'boolean' ? d.approved : yes * 2 > n;
    const cols = n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : n <= 8 ? 4 : 5;
    const pNo = d.proposalNo || 1, round = (d.round || 0) + 1;
    const A = term('approve', L('찬성', 'Approve')), X = term('reject', L('반대', 'Reject'));
    const cards = ids.map((id, i) => {
      const y = votes[id] === true;
      return '<div class="ux-vcard' + (id === d.leaderId ? ' lead' : '') + (team.indexOf(id) >= 0 ? ' cn-onteam' : '') + '" data-y="' + (y ? 1 : 0) + '" style="animation-delay:' + (250 + i * 55) + 'ms">' +
        '<div class="c"><div class="b"></div><div class="f ' + (y ? 'yes' : 'no') + '">' + K.tokenImg(y ? 'approve' : 'reject') + '<span>' + E(y ? A : X) + '</span></div></div>' +
        '<div class="n">' + nm(v, id) + (K.isMe(v, id) ? ' ' + ME() : '') + '</div></div>';
    }).join('');
    ctx.set('<div class="cn-wrap cn-vote">' +
      '<div class="ux-ornament">✦</div>' +
      '<div class="ux-cine-title">' + L('투표 공개', 'The votes') + '</div>' +
      '<div class="ux-cine-sub">' + E(Q()) + ' ' + round + ' · ' + L(pNo + '번째 제안', 'Proposal ' + pNo) + ' · ' + E(LEADER()) + ' ' + who(v, d.leaderId) + '</div>' +
      chips(v, team) +
      '<div class="cn-vgw"><div class="cn-vg' + (n >= 9 ? ' sm' : '') + '" style="--cols:' + cols + '">' + cards + '</div><div class="cn-count" aria-hidden="true"></div></div>' +
      '<div class="ux-tally cn-pre"><div class="y"><b>0</b>' + E(A) + '</div><div class="x"><b>0</b>' + E(X) + '</div></div>' +
      '<div class="cn-res"></div>' + TAP() + '</div>');
    const grid = S.q('.cn-vg');
    S.scene('candle', S.y(grid));
    S.sfx('whoosh');
    await ctx.sleep(S.M(650 + n * 55));
    // 3-2-1 drum countdown over the face-down cards
    const cnt = S.q('.cn-count');
    for (const k of [3, 2, 1]) {
      if (ctx.skipped) break;
      cnt.innerHTML = '<b>' + k + '</b>'; S.fb('drum');
      await ctx.sleep(S.M(560));
    }
    cnt.innerHTML = '';
    // flip near-simultaneously
    const vc = S.qa('.ux-vcard');
    S.fb('flip');
    for (let i = 0; i < vc.length; i++) { vc[i].classList.add('flip'); if (i % 2) S.sfx('tick'); await ctx.sleep(S.M(55)); }
    await ctx.sleep(S.M(560));
    vc.forEach(c => S.burst(c.querySelector('.c'), { n: 6, colors: c.dataset.y === '1' ? GOLD : DUSK, speed: 70, size: 8, life: 0.7 }));
    // tally count-up
    const tally = S.q('.ux-tally'); S.on(tally);
    const by = tally.querySelector('.y b'), bx = tally.querySelector('.x b');
    const steps = Math.max(yes, no);
    for (let s = 1; s <= steps; s++) { by.textContent = Math.min(s, yes); bx.textContent = Math.min(s, no); S.sfx('tick'); await ctx.sleep(S.M(70)); }
    by.textContent = yes; bx.textContent = no;
    await ctx.sleep(S.M(450));
    // result
    const res = S.q('.cn-res');
    if (ok) {
      res.innerHTML = '<div class="ux-banner good">' + L(E(TEAMW()) + ' 출발!', 'The ' + E(TEAMW()) + ' sets out!') + '</div>' +
        '<div class="cn-note">' + L(E(TEAMW()) + ' ' + team.length + '명이 ' + E(Q()) + ' ' + round + '에 나서요', team.length + ' ' + pl1(team.length, 'player goes', 'players go') + ' on ' + E(Q()) + ' ' + round) + '</div>' +
        V('한마음과 한뜻이 되어', '행 4:32', 'Of one heart and soul', 'Acts 4:32');
      S.scene('light', S.y(res.firstElementChild), { rays: true });
      S.flash('good'); S.fb('good');
      S.burst(res.firstElementChild, { n: 44, speed: 210 });
    } else {
      const last = pNo >= 5;
      const pips = '<div class="cn-pips">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= pNo ? 'on' : '') + (i === pNo ? ' last' : '') + '"></i>').join('') + '</div>';
      res.innerHTML = '<div class="ux-banner evil cn-dusky">' + L('부결', 'Rejected') + '</div>' + pips +
        (last
          ? '<div class="cn-note evil">' + L('<b>다섯 번째 연속 부결!</b><br>이 부결로 승부가 결정돼요', '<b>Fifth rejection in a row!</b><br>This rejection decides the game') + '</div>'
          : '<div class="cn-note">' + L('연속 부결 ' + pNo + '/5 · ' + EP(LEADER(), '이') + ' 다음 사람에게 넘어가요', 'Rejected in a row ' + pNo + '/5 · The next player becomes ' + E(LEADER())) + '</div>' +
            V('범사에 헤아려 좋은 것을 취하라', '살전 5:21', 'Test all things, and hold firmly that which is good', '1 Thessalonians 5:21'));
      S.scene('dusk', S.y(res.firstElementChild));
      S.fb('evil');
      if (last) { S.flash('evil'); S.shake(); S.burst(res.firstElementChild, { n: 36, colors: DUSK, speed: 200 }); }
    }
    await ctx.sleep(S.M(900));
    S.tap();
    await ctx.tapOrWait(3000);
  };

  // =====================================================================
  // quest reveal (ev.d = lastQuest)
  // =====================================================================
  C.quest = async (ctx, ev, v) => {
    const S = stage(ctx);
    const d = ev.d || {}, ri = d.round || 0, round = ri + 1, team = d.team || [];
    const succ = d.successes | 0, fails = d.fails | 0, n = Math.max(1, succ + fails);
    const need = K.questFails(v, ri) || 1;
    const ok = d.result ? d.result === 'success' : fails < need;
    const SU = term('success', L('축복', 'Blessing')), FA = term('fail', L('방해', 'Hindrance'));
    const xc = d.excalibur, flipped = !!(xc && xc.targetId);
    const FAn = k => L(E(FA) + ' ' + k + '장', k + ' ' + E(FA) + ' ' + pl1(k, 'card', 'cards'));
    const list = []; for (let i = 0; i < succ; i++) list.push('ok'); for (let i = 0; i < fails; i++) list.push('bad');
    const faces = K.shuffle(list.length ? list : ['ok']);
    const cards = faces.map((f, i) => '<div class="ux-qcard shuffle" style="transform:translate(' + ((i - (n - 1) / 2) * 4).toFixed(1) + 'px,' + (-i * 2) + 'px) rotate(' + ((i % 2 ? 1 : -1) * (i * 1.6)).toFixed(1) + 'deg);animation-delay:' + (-i * 0.17).toFixed(2) + 's">' +
      '<div class="c"><div class="b">' + K.backImg() + '</div><div class="f ' + f + '">' + K.tokenImg(f === 'ok' ? 'success' : 'fail') + '<span>' + E(f === 'ok' ? SU : FA) + '</span></div></div></div>').join('');
    ctx.set('<div class="cn-wrap cn-quest">' +
      '<div class="ux-ornament">✦</div>' +
      '<div class="ux-cine-title">' + L(E(Q()) + ' ' + round + ' 결과', E(Q()) + ' ' + round + ' result') + '</div>' +
      '<div class="ux-cine-sub">' + L(E(TEAMW()) + ' ' + team.length + '명이 낸 카드를 섞고 있어요', 'Shuffling the ' + team.length + ' ' + pl1(team.length, 'card', 'cards') + ' the ' + E(TEAMW()) + ' played') +
        (need > 1 ? '<br>' + L('이번엔 ' + FAn(need) + '이 있어야 실패해요', 'This time it takes ' + FAn(need) + ' to fail') : '') +
        (flipped ? '<br>' + L(EP(XC(), '으로') + ' 카드 한 장이 뒤집혔어요', 'One card was flipped with the ' + E(XC())) : '') + '</div>' +
      chips(v, team) +
      '<div class="ux-pile cn-qp">' + cards + '</div>' +
      '<div class="cn-qt cn-pre"><span class="ux-chip s">' + E(SU) + ' <b>0</b></span><span class="ux-chip x">' + E(FA) + ' <b>0</b></span></div>' +
      '<div class="cn-res"></div>' + TAP() + '</div>');
    const pile = S.q('.cn-qp'), qc = S.qa('.ux-qcard');
    S.scene('candle', S.y(pile));
    S.fb('whoosh');
    await ctx.sleep(S.M(800)); S.sfx('whoosh'); await ctx.sleep(S.M(800));
    // spread into a row
    const Wp = pile.clientWidth || 320, cw = 96, gap = 10;
    const sc = Math.min(1, (Wp - gap * (n - 1)) / (n * cw)), step = cw * sc + gap;
    qc.forEach((c, i) => { c.classList.remove('shuffle'); c.style.transform = 'translateX(' + ((i - (n - 1) / 2) * step).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; });
    S.sfx('pick');
    await ctx.sleep(S.M(700));
    const qt = S.q('.cn-qt'), bs = qt.querySelector('.s b'), bf = qt.querySelector('.x b');
    let cs = 0, cf = 0;
    for (let i = 0; i < qc.length; i++) {
      if (i === qc.length - 1 && qc.length > 1) await ctx.sleep(S.M(500));   // suspense before the last card
      qc[i].classList.add('flip'); S.sfx('flip');
      await ctx.sleep(S.M(300));
      if (faces[i] === 'bad') { cf++; S.flash('evil'); S.shake(); S.fb('evil'); S.burst(qc[i], { n: 24, colors: DUSK, speed: 160 }); }
      else { cs++; S.buzz('flip'); S.sfx('pick'); S.burst(qc[i], { n: 14, speed: 110 }); }
      bs.textContent = cs; bf.textContent = cf; S.on(qt);
      await ctx.sleep(S.M(420));
    }
    await ctx.sleep(S.M(350));
    const res = S.q('.cn-res');
    if (ok) {
      res.innerHTML = '<div class="ux-banner good">' + L(E(Q()) + ' 성공!', E(Q()) + ' succeeded!') + '</div>' +
        (fails ? '<div class="cn-note">' + L(FAn(fails) + ' · ' + need + '장이 있어야 실패해요', FAn(fails) + ' · it takes ' + need + ' to fail') + '</div>'
          : '<div class="cn-note">' + L('모두 ' + E(SU) + ' 카드였어요', 'Every card was a ' + E(SU)) + '</div>') +
        V('선을 행하다가 낙심하지 말자', '갈 6:9', 'Let\'s not be weary in doing good', 'Galatians 6:9');
      S.scene('light', S.y(res.firstElementChild), { rays: true });
      S.flash('good'); S.fb('good');
      S.burst(res.firstElementChild, { n: 46, speed: 220 });
    } else {
      res.innerHTML = '<div class="ux-banner evil cn-dusky">' + L(E(Q()) + ' 실패', E(Q()) + ' failed') + '</div>' +
        '<div class="cn-note evil">' + L(E(FA) + ' <b>' + fails + '장</b>', '<b>' + fails + '</b> ' + E(FA) + ' ' + pl1(fails, 'card', 'cards')) + '</div>' +
        V('시험에 들지 않게 깨어 기도하라', '마 26:41', 'Watch and pray, that you don\'t enter into temptation', 'Matthew 26:41');
      S.scene('dusk', S.y(res.firstElementChild), { rays: true });
      S.fb('evil');
      S.burst(res.firstElementChild, { n: 40, colors: DUSK, speed: 200 });
    }
    await ctx.sleep(S.M(1000));
    S.tap();
    await ctx.tapOrWait(3000);
  };

  // =====================================================================
  // lady (등불): private result for the holder, short public notice for everyone else
  // =====================================================================
  C.lady = async (ctx, ev, v) => {
    const S = stage(ctx);
    const d = ev.d || {}, LA = term('lady', L('등불', 'Lamp'));
    if (ev.result) {
      // Private: neutral candle light, no full-screen team tint or team sound (neighbours can see/hear).
      const team = ev.result.team === 'evil' ? 'evil' : 'good';
      const tid = ev.result.targetId || d.targetId;
      ctx.set('<div class="cn-wrap cn-lady">' +
        '<div class="ux-cine-sub">' + E(LA) + ' · ' + L('나에게만 보이는 결과예요', 'Only you can see this result') + '</div>' +
        '<div class="ux-lamp-big">' + K.tokenImg('lady') + '</div>' +
        '<div class="cn-ask">' + L(nm(v, tid) + '님을 비춰보니', 'Shining on ' + nm(v, tid)) + '<span class="ux-dots"><i></i><i></i><i></i></span></div>' +
        '<div class="cn-res cn-lres"></div>' +
        '<div class="cn-secret cn-pre">' + L('이 결과는 나만 알아요. 비밀로 간직하거나 지혜롭게 사용하세요.', 'Only you know this. Keep it secret or use it wisely.') + '</div>' +
        V('주의 말씀은 내 발에 등이요 내 길에 빛이니이다', '시 119:105', 'Your word is a lamp to my feet, and a light for my path', 'Psalm 119:105', true) + TAP() + '</div>');
      const lamp = S.q('.ux-lamp-big');
      S.scene('candle', S.y(lamp));
      S.fb('whoosh');
      await ctx.sleep(S.M(1900));
      const dots = S.q('.cn-ask .ux-dots'); if (dots) dots.remove();
      const res = S.q('.cn-lres');
      res.innerHTML = '<div class="cn-emb">' + K.img(K.asset('team-' + team + '.svg'), team === 'evil' ? 'fail' : 'success', '') + '</div>' +
        '<div class="ux-lady-result cn-' + team + '">' + E(TEAMN(team)) + '</div>' +
        '<div class="cn-note">' + L(nm(v, tid) + '님은 <b>' + EP(TEAMN(team), '이에요') + '</b>', nm(v, tid) + ' is one of <b>' + E(theTeam(team)) + '</b>') + '</div>';
      S.sfx('chime'); S.buzz('pick');
      S.burst(res.firstElementChild, { n: 16, colors: colOf(team), speed: 120 });
      await ctx.sleep(S.M(700));
      S.on(S.q('.cn-secret'));
      await ctx.sleep(S.M(300));
      S.on(S.q('.ux-verse'));
      await ctx.sleep(S.M(500));
      S.tap();
      await ctx.tapOrWait(3500);
      return;
    }
    const hid = d.holderId, tid = d.targetId;
    ctx.set('<div class="cn-wrap cn-lady">' +
      '<div class="ux-lamp-big sm">' + K.tokenImg('lady') + '</div>' +
      '<div class="ux-cine-title cn-t2">' + L((K.isMe(v, hid) ? '내가' : nm(v, hid) + '님이') + ' ' + EP(LA, '으로') + '<br>' + (K.isMe(v, tid) ? '나를' : nm(v, tid) + '님을') + ' 비춰보았어요',
        enSubj(v, hid) + ' shone the ' + E(LA) + '<br>on ' + enObj(v, tid)) + '</div>' +
      '<div class="ux-cine-sub">' + L('결과는 ' + (K.isMe(v, hid) ? '나만' : nm(v, hid) + '님만') + ' 알 수 있어요 · ' + EP(LA, '은') + ' 이제 ' + (K.isMe(v, tid) ? '나에게' : nm(v, tid) + '님에게') + ' 넘어가요',
        (K.isMe(v, hid) ? 'Only you know the result' : 'Only ' + nm(v, hid) + ' knows the result') + ' · The ' + E(LA) + ' now passes to ' + enObj(v, tid)) + '</div>' +
      TAP() + '</div>');
    S.scene('candle', S.y(S.q('.ux-lamp-big')));
    S.fb('chime');
    await ctx.sleep(S.M(800));
    S.tap();
    await ctx.tapOrWait(2200);
  };

  // =====================================================================
  // loyalty (Lancelot module): a Crossroads card is turned face up at the start of missions 3–5.
  // ev = { d: {round, card:'none'|'switch'}, n: cards revealed so far, all: [entries so far] }.
  // Public: only the card. Never says who the pilgrims are (that stays secret on every phone).
  // =====================================================================
  C.loyalty = async (ctx, ev, v) => {
    const S = stage(ctx);
    const d = (ev && ev.d) || {};
    const lr = (v && v.loyaltyRevealed) || [];
    const card = d.card === 'switch' ? 'switch' : 'none';
    const ri = typeof d.round === 'number' ? d.round : (v && v.round) || 0, round = ri + 1;
    const all = (ev && Array.isArray(ev.all) && ev.all.length) ? ev.all : (lr.length ? lr : [d]);
    const idx = Math.max(0, all.length - 1);
    const slots = Math.max(3, all.length);
    const hist = '<div class="cn-lohist cn-pre" aria-hidden="true">' + Array.from({ length: slots }, (_, i) => {
      const e = all[i];
      if (!e) return '<i>' + K.backImg() + '</i>';
      const c = e.card === 'switch' ? 'switch' : 'none';
      return '<i class="' + (i === idx ? 'cur' : '') + '">' + (i === idx ? K.backImg() : K.img(K.asset('loyalty/' + c + '.svg'), 'back', '')) + '</i>';
    }).join('') + '</div>';
    const name = card === 'switch' ? term('loyaltySwitch', L('편이 바뀜', 'Sides switch')) : term('loyaltyNone', L('그대로', 'No change'));
    /* Variant 2: all five cards lie face up from the start (view.loyaltyPlan, card i = mission i+1), so this is not a
       surprise flip: the card is shown face up and highlighted in the plan row as it takes effect. */
    const plan = v && Array.isArray(v.loyaltyPlan) && v.loyaltyPlan.length ? v.loyaltyPlan : null;
    const cimg = c => K.img(K.asset('loyalty/' + (c === 'switch' ? 'switch' : 'none') + '.svg'), 'back', '');
    const row = plan
      ? '<div class="cn-loplan cn-pre" aria-hidden="true"><small>' + E(term('loyaltyPlan', L('펼쳐 둔 갈림길 카드', 'Crossroads cards on the table'))) + '</small><div>' +
        plan.map((c, i) => '<span class="pc' + (i === ri ? ' cur' : i < ri ? ' past' : '') + '"><i>' + cimg(c) + '</i><b>' + (i + 1) + '</b></span>').join('') + '</div></div>'
      : hist;
    const subTxt = plan
      ? L(E(Q()) + ' ' + round + ' 시작 · 이번 사명의 카드가 적용돼요', E(Q()) + ' ' + round + ' begins · This mission\'s card takes effect')
      : L(E(Q()) + ' ' + round + ' 시작 · 카드 한 장을 펼쳐요', E(Q()) + ' ' + round + ' begins · One card is turned over');
    ctx.set('<div class="cn-wrap cn-lo">' +
      '<div class="ux-ornament">✦</div>' +
      '<div class="ux-cine-title">' + E(LOY()) + '</div>' +
      '<div class="ux-cine-sub">' + subTxt + '</div>' +
      '<div class="cn-tcard ' + card + (plan ? ' flip' : '') + '"><div class="cn-beat"><div class="c"><div class="b">' + K.backImg() + '</div><div class="f">' +
        cimg(card) + '</div></div></div></div>' +
      '<div class="cn-res"></div>' + row + TAP() + '</div>');
    const tc = S.q('.cn-tcard'), beat = S.q('.cn-beat');
    S.scene('candle', S.y(tc));
    S.fb('whoosh');
    await ctx.sleep(S.M(700));
    if (plan) {
      const pr = S.q('.cn-loplan'); S.on(pr);
      await ctx.sleep(S.M(500));
      pr.classList.add('cn-hl'); S.sfx('pick'); S.buzz('tick');
      S.burst(S.q('.cn-loplan .pc.cur i'), { n: 12, speed: 90, size: 7 });
      if (!S.R && beat && beat.animate) beat.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
      await ctx.sleep(S.M(800));
    } else {
      S.on(S.q('.cn-lohist'));
      // three slow beats, then the turn
      for (const b of [520, 440, 380]) {
        if (ctx.skipped) break;
        S.sfx('drum'); S.buzz('tick');
        if (!S.R && beat && beat.animate) beat.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
        await ctx.sleep(S.M(b));
      }
      tc.classList.add('flip'); S.fb('flip');
      const cur = S.q('.cn-lohist i.cur'); if (cur) cur.innerHTML = cimg(card);
      await ctx.sleep(S.M(650));
    }
    const res = S.q('.cn-res');
    if (card === 'switch') {
      tc.classList.add('cn-swap');
      res.innerHTML = '<div class="ux-banner cn-sw">' + E(name) + '</div>' +
        '<div class="cn-note">' + L('<b>두 순례자의 편이 서로 바뀌어요</b><br>누가 순례자인지는 여전히 비밀이에요',
          '<b>Both ' + E(LANC()) + ' players switch sides</b><br>Who they are stays secret') + '</div>' +
        V('너희가 섬길 자를 오늘 택하라', '수 24:15', 'Choose today whom you will serve', 'Joshua 24:15');
      S.scene('candle', S.y(tc), { rays: true });
      S.fb('whoosh'); S.shake(tc);
      S.burst(tc, { n: 34, colors: [GOLD[0], DUSK[0], GOLD[2], DUSK[1]], speed: 190 });
    } else {
      res.innerHTML = '<div class="ux-banner good">' + E(name) + '</div>' +
        '<div class="cn-note">' + L('두 순례자는 지금 편 그대로 가요<br>누가 순례자인지는 여전히 비밀이에요',
          'The ' + E(LANC()) + ' players stay on their current sides<br>Who they are stays secret') + '</div>' +
        V('예수 그리스도는 어제나 오늘이나 영원토록 동일하시니라', '히 13:8', 'Jesus Christ is the same yesterday, today, and forever', 'Hebrews 13:8');
      S.sfx('chime'); S.buzz('pick');
      S.burst(tc, { n: 18, speed: 120 });
    }
    await ctx.sleep(S.M(1000));
    S.tap();
    await ctx.tapOrWait(3000);
  };

  // =====================================================================
  // excalibur (Scroll of the Word): plays just before the mission result.
  // ev = { d: {round, holderId, targetId|null}, result: {round, targetId, original}|null (holder's phone only) }.
  // Public: who used the Scroll on whom (or kept the cards as they are). Never what the card was.
  // =====================================================================
  C.excalibur = async (ctx, ev, v) => {
    const S = stage(ctx);
    const d = (ev && ev.d) || (v && v.lastExcalibur) || {};
    const hid = d.holderId || null, tid = d.targetId || null;
    const ri = typeof d.round === 'number' ? d.round : (v && v.round) || 0, round = ri + 1;
    const res = ev && ev.result && (!tid || ev.result.targetId === tid) ? ev.result : null;
    const mineH = !!(hid && K.isMe(v, hid));
    const chip = id => '<span class="ux-team-chip">' + K.avatar(pl(v, id)) + '<span>' + nm(v, id) + (K.isMe(v, id) ? ' ' + ME() : '') + '</span></span>';
    let line, sub, mid;
    if (tid) {
      line = hid
        ? L((mineH ? '내가' : nm(v, hid) + '님이') + ' ' + EP(XC(), '으로') + '<br>' + (K.isMe(v, tid) ? '내' : nm(v, tid) + '님의') + ' 카드를 뒤집었어요',
            enSubj(v, hid) + ' used the ' + E(XC()) + '<br>to flip ' + (K.isMe(v, tid) ? 'your' : nm(v, tid) + '\'s') + ' card')
        : L(EP(XC(), '으로') + '<br>' + nm(v, tid) + '님의 카드가 뒤집혔어요', nm(v, tid) + '\'s card was flipped<br>with the ' + E(XC()));
      sub = hid
        ? L('원래 무슨 카드였는지는 ' + (mineH ? '나만' : nm(v, hid) + '님만') + ' 알아요', (mineH ? 'Only you know' : 'Only ' + nm(v, hid) + ' knows') + ' what the card was before')
        : L('원래 무슨 카드였는지는 비밀이에요', 'What the card was before stays secret');
      mid = '<div class="cn-xpair">' + (hid ? chip(hid) + '<span class="cn-xarrow" aria-hidden="true">➜</span>' : '') +
        '<div class="cn-xcard"><div class="c"><div class="b">' + K.backImg() + '</div><div class="f">' + K.backImg() + '</div></div></div>' +
        '<span class="cn-xarrow" aria-hidden="true">➜</span>' + chip(tid) + '</div>';
    } else {
      line = hid
        ? L((mineH ? '나는' : nm(v, hid) + '님은') + ' 카드를 뒤집지 않고<br>그대로 두었어요', enSubj(v, hid) + ' kept the cards<br>as they are')
        : L('카드를 뒤집지 않고<br>그대로 두었어요', 'The cards were kept<br>as they are');
      sub = L('낸 카드 그대로 공개돼요', 'The cards are revealed as they were played');
      mid = '<div class="cn-xpair">' + (hid ? chip(hid) : '') + '<div class="cn-xcard kept"><div class="c"><div class="b">' + K.backImg() + '</div><div class="f">' + K.backImg() + '</div></div></div></div>';
    }
    const SU = term('success', L('축복', 'Blessing')), FA = term('fail', L('방해', 'Hindrance'));
    const secret = res && tid
      ? '<div class="cn-secret cn-pre">' + L('나에게만 보여요 · 뒤집기 전 카드는 <b>' + EP(res.original ? SU : FA, '이었어요') + '</b>',
          'Only you see this · Before the flip it was <b>' + 'a ' + E(res.original ? SU : FA) + '</b> card') + '</div>'
      : '';
    ctx.set('<div class="cn-wrap cn-xc">' +
      '<div class="cn-emblem">' + K.img(K.asset('excalibur.svg'), 'success', '') + '</div>' +
      '<div class="ux-cine-sub">' + E(XC()) + ' · ' + E(Q()) + ' ' + round + '</div>' +
      '<div class="ux-cine-title cn-t2">' + line + '</div>' +
      mid +
      '<div class="ux-cine-sub cn-pre cn-xsub">' + sub + '</div>' + secret +
      V('하나님의 말씀은 살아 있고 활력이 있어', '히 4:12', 'The word of God is living and active', 'Hebrews 4:12', true) + TAP() + '</div>');
    const em = S.q('.cn-emblem');
    S.scene('candle', S.y(em), { rays: true });
    S.fb('chime');
    S.burst(em, { n: 24, speed: 150 });
    await ctx.sleep(S.M(900));
    const xc = S.q('.cn-xcard');
    if (tid && xc) { xc.classList.add('flip'); S.fb('flip'); S.burst(xc, { n: 16, speed: 120, size: 8 }); }
    await ctx.sleep(S.M(700));
    S.on(S.q('.cn-xsub'));
    await ctx.sleep(S.M(300));
    if (secret) { S.on(S.q('.cn-secret')); S.buzz('pick'); await ctx.sleep(S.M(300)); }
    S.on(S.q('.ux-verse'));
    await ctx.sleep(S.M(400));
    S.tap();
    await ctx.tapOrWait(secret ? 3400 : 2600);
  };

  // =====================================================================
  // assassin: 3 successes reached, entering the assassination phase
  // =====================================================================
  C.assassin = async (ctx, ev, v) => {
    const S = stage(ctx);
    const A = SPY(), M = PROPHET();
    ctx.set('<div class="cn-wrap cn-assa">' +
      '<div class="cn-first">' +
        '<div class="cn-toks">' + [0, 1, 2].map(i => '<div class="cn-tok" style="animation-delay:' + (0.15 + i * 0.24).toFixed(2) + 's">' + K.tokenImg('success') + '</div>').join('') + '</div>' +
        '<div class="ux-banner good cn-long">' + L(EP(TEAMN('good'), '이') + '<br>' + EP(Q(), '을') + ' 완수했어요', E(cap(theTeam('good'))) + '<br>completed three ' + E(Q()) + 's') + '</div>' +
      '</div>' +
      '<div class="cn-turn"></div>' + TAP() + '</div>');
    const first = S.q('.cn-first');
    S.scene('light', S.y(S.q('.cn-toks')));
    S.fb('good');
    await ctx.sleep(S.M(500));
    S.burst(S.q('.cn-toks'), { n: 30, speed: 180 });
    await ctx.sleep(S.M(1500));
    // ...but the dusk falls
    first.classList.add('cn-dim');
    const turn = S.q('.cn-turn');
    const aid = v.assassinId;
    turn.innerHTML = '<div class="cn-but">' + L('하지만…', 'But…') + '</div>' +
      '<div class="ux-banner evil cn-long cn-dusky">' + L(EP(A, '이') + ' ' + EP(M, '을') + '<br>찾고 있어요', 'The ' + E(A) + ' is searching<br>for the ' + E(M)) + '</div>' +
      (aid ? '<div class="cn-who">' + K.avatar(pl(v, aid)) + '<span><small>' + E(A) + '</small><b>' + who(v, aid) + '</b></span></div>' : '') +
      '<div class="cn-note evil">' + L(EP(M, '을') + ' 정확히 지목하면 ' + EP(TEAMN('evil'), '이') + ' 승리해요', 'If the ' + E(A) + ' names the ' + E(M) + ', ' + E(theTeam('evil')) + ' win') + '</div>';
    S.scene('dusk', S.y(turn), { rays: true });
    S.fb('evil'); S.shake();
    await ctx.sleep(S.M(1500));
    S.tap();
    await ctx.tapOrWait(3200);
  };

  // =====================================================================
  // end: (assassination suspense) + winner
  // =====================================================================
  C.end = async (ctx, ev, v) => {
    const S = stage(ctx);
    const win = v.winner === 'evil' ? 'evil' : 'good', reason = v.winReason;
    const A = SPY(), M = PROPHET();
    const tid = v.assassinTargetId;
    if ((reason === 'assassinHit' || reason === 'assassinFailed') && tid) {
      const role = v.revealed && v.revealed[tid];
      const hit = role ? role === 'merlin' : reason === 'assassinHit';
      ctx.set('<div class="cn-wrap cn-pick">' +
        '<div class="ux-cine-title">' + L(E(A) + '의 선택은…', 'The ' + E(A) + '\'s choice…') + '</div>' +
        '<div class="cn-tcard"><div class="cn-beat"><div class="c"><div class="b">' + K.backImg() + '</div><div class="f">' + (role ? K.roleImg(role) : K.backImg()) + '</div></div></div></div>' +
        '<div class="cn-tname"></div>' +
        '<div class="cn-res"></div></div>');
      const card = S.q('.cn-tcard'), beat = S.q('.cn-beat');
      S.scene('dusk', S.y(card));
      // drumroll, speeding up
      const beats = [430, 370, 310, 260, 220, 190, 160, 140, 120, 105, 95];
      for (const b of beats) {
        if (ctx.skipped) break;
        S.sfx('drum'); S.buzz('tick');
        if (!S.R && beat.animate) beat.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: Math.min(220, b), easing: 'ease-out' });
        await ctx.sleep(S.M(b));
      }
      // the target zooms in
      S.q('.cn-tname').innerHTML = '<div class="cn-zoom">' + K.avatar(pl(v, tid)) + '<b>' + who(v, tid) + '</b></div>';
      card.classList.add('ux-target-ring');
      S.fb('whoosh');
      await ctx.sleep(S.M(1300));
      // reveal
      card.classList.remove('ux-target-ring');
      const side = (v.finalTeams && v.finalTeams[tid]) || (role ? K.teamOf(role) : 'good');
      if (role) { card.classList.add('flip', side === 'evil' ? 'evil' : 'good'); S.sfx('flip'); await ctx.sleep(S.M(550)); }
      const res = S.q('.cn-res');
      if (hit) {
        res.innerHTML = '<div class="ux-banner evil cn-dusky">' + L(EP(M, '이었어요') + '!', 'It was the ' + E(M) + '!') + '</div>' +
          '<div class="cn-note evil">' + L(EP(A, '이') + ' ' + EP(M, '을') + ' 찾아냈어요', 'The ' + E(A) + ' found the ' + E(M)) + '</div>';
        S.scene('dusk', S.y(card), { rays: true });
        S.flash('evil'); S.shake(); S.fb('evil');
        S.burst(card, { n: 40, colors: DUSK, speed: 210 });
      } else {
        res.innerHTML = '<div class="ux-banner good">' + L(EP(M, '이') + ' 아니었어요', 'Not the ' + E(M)) + '</div>' +
          (role ? '<div class="cn-note">' + L(nm(v, tid) + '님은 <b>' + EP(K.roleName(role), '이에요') + '</b>', nm(v, tid) + ' is ' + (role === 'servant' || role === 'minion' ? 'a' : 'the') + ' <b>' + E(K.roleName(role)) + '</b>') + '</div>' : '');
        S.scene('light', S.y(card), { rays: true });
        S.flash('good'); S.fb('good');
        S.burst(card, { n: 40, speed: 210 });
      }
      await ctx.sleep(S.M(2300));
      if (ctx.skipped) { /* fall through to the winner banner */ }
    }
    await winner(ctx, S, v, win, reason, M);
  };

  async function winner(ctx, S, v, win, reason, M) {
    const QQ = Q();
    const why = (EN() ? {
      quests: 'Three ' + E(QQ) + 's completed',
      fails: 'Three ' + E(QQ) + 's hindered',
      rejections: 'Five rejections in a row',
      assassinFailed: 'The ' + E(M) + ' was kept safe',
      assassinHit: 'The ' + E(M) + ' was found'
    } : {
      quests: '세 번의 ' + E(QQ) + ' 완수',
      fails: EP(QQ, '이') + ' 세 번 방해받음',
      rejections: '다섯 번 연속 부결',
      assassinFailed: EP(M, '을') + ' 지켜냄',
      assassinHit: EP(M, '이') + ' 들킴'
    })[reason] || '';
    // my side at the finish (a switched pilgrim plays for the current side)
    const mine = v.me && ((v.finalTeams && v.finalTeams[v.me.id]) || v.me.team);
    const won = mine ? mine === win : null;
    ctx.set('<div class="cn-wrap cn-win">' +
      '<div class="cn-crest">' + K.img(K.asset('team-' + win + '.svg'), win === 'evil' ? 'fail' : 'success', '') + '</div>' +
      '<div class="ux-banner ' + win + (win === 'evil' ? ' cn-dusky' : '') + '">' + L(E(TEAMN(win)) + ' 승리!', E(TEAMN(win)) + ' win!') + '</div>' +
      (why ? scroll(why) : '') +
      (won === null ? '' : '<div class="cn-mine ' + (won ? 'w' : 'l') + '">' + (won ? L('우리 팀 승리!', 'Your side won!') : L('아쉽게도 패배', 'Your side lost this time')) + '</div>') +
      (win === 'evil' ? V('일곱 번 넘어질지라도 다시 일어나리라', '잠 24:16', 'A righteous man falls seven times and rises up again', 'Proverbs 24:16')
        : V('빛이 어둠에 비치되 어둠이 이기지 못하더라', '요 1:5', 'The light shines in the darkness, and the darkness hasn\'t overcome it', 'John 1:5')) +
      TAP() + '</div>');
    const crest = S.q('.cn-crest');
    S.scene(win === 'evil' ? 'dusk' : 'light', S.y(crest), { rays: true });
    S.flash(win);
    S.burst(crest, { n: 44, colors: colOf(win), speed: 220 });
    if (won) { if (S.live()) K.fx.rain(win, 3); S.rain(win, 3); S.fb('win'); }
    else if (won === false) S.fb('lose');
    else S.fb('chime');
    await ctx.sleep(S.M(1600));
    S.tap();
    await ctx.tapOrWait(3500);
  }

  // exposed for tests/other parts (harmless)
  K.josa = P;
})();


/* ---- src/45-journey.js ---- */
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


/* ---- src/50-end.js ---- */
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

