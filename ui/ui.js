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
  K.GOOD_ROLES = ['merlin', 'percival', 'servant'];
  K.EVIL_ROLES = ['assassin', 'morgana', 'mordred', 'oberon', 'minion'];
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
  K.teamName = t => (T.teams && T.teams[t] && T.teams[t].name) || (t === 'evil' ? '유혹의 무리' : '빛의 일꾼들');
  K.teamOf = role => K.EVIL_ROLES.indexOf(role) >= 0 ? 'evil' : 'good';
  K.role = key => (T.roles && T.roles[key]) || {};
  K.roleName = key => K.role(key).name || key || '';
  K.roleDesc = key => K.role(key).desc || '';
  /* Guide text (guide/guide.js → window.GUIDE). K.G() returns the built guide or null. K.fmt fills runtime {params}. */
  let G = null;
  K.G = () => { if (G) return G; try { if (window.GUIDE && GUIDE.build) G = GUIDE.build(T); } catch (e) { G = null; } return G; };
  K.fmt = (s, p) => { try { return window.GUIDE && GUIDE.format ? GUIDE.format(s, p || {}) : String(s).replace(/\{(\w+)(?::[^}]*)?\}/g, (m, k) => (p && p[k] != null ? p[k] : m)); } catch (e) { return s; } };
  /* K.hint(phase, key, params) -> one hint line (string) or '' */
  K.hint = (phase, key, params, idx) => { const g = K.G(); const a = g && g.phaseHints && g.phaseHints[phase] && g.phaseHints[phase][key]; if (!a) return ''; const s = Array.isArray(a) ? a[idx || 0] : a; return s ? K.fmt(s, params) : ''; };
  K.knowText = tag => (T.knowledgeText && T.knowledgeText[tag]) || (tag === 'evil' ? K.teamName('evil') : tag === 'merlinCandidate' ? K.roleName('merlin') + '일지도' : tag);

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
    assassin: ['🔍', 'evil'], morgana: ['🎭', 'evil'], mordred: ['🐺', 'evil'], oberon: ['🌫️', 'evil'], minion: ['🍎', 'evil']
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
      '<div class="ux-row" style="margin-top:8px"><button class="ux-btn ux-btn-ghost" data-close>' + esc(o.cancel || '취소') + '</button><button class="ux-btn ' + (o.danger ? 'ux-btn-evil' : 'ux-btn-gold') + '" data-yes>' + esc(o.ok || '확인') + '</button></div></div>',
      { onClose: () => { if (!done) { done = true; res(false); } } });
    sh.querySelector('[data-yes]').addEventListener('click', () => { done = true; res(true); sh.close(); });
  });

  // ---------- api calls ----------
  let api = {};
  const busy = new Set();
  /* K.call('vote', true) -> calls api.vote(true); shows toast on error; renders returned view. */
  K.call = async (name, ...args) => {
    if (busy.has(name)) return { ok: false, busy: true };
    if (typeof api[name] !== 'function') { UI.toast('준비 중인 기능이에요'); return { ok: false }; }
    busy.add(name); document.documentElement.classList.add('ux-busy');
    try {
      const r = await api[name](...args);
      if (r && r.offline) { netDown = Date.now(); connCheck(); }
      if (r && r.ok === false) { if (r.error) UI.toast(r.error); }
      else if (r) { netDown = 0; connCheck(); }
      else if (r && r.view) UI.render(r.view);
      return r || { ok: true };
    } catch (e) { UI.toast('연결이 불안정해요. 다시 시도해 주세요.'); return { ok: false }; }
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
  K.soundBtn = () => '<button class="ux-icon-btn" data-act="sound" aria-label="소리">' + (Sound.on ? '🔔' : '🔕') + '</button>';
  K.actions.sound = (d, el) => { Sound.set(!Sound.on); el.textContent = Sound.on ? '🔔' : '🔕'; UI.toast(Sound.on ? '소리를 켰어요' : '소리를 껐어요', 'info'); };

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
  }
  K.screenEl = () => screenEl;

  // ---------- event detection + cinematic queue ----------
  let seen = null, cineBusy = false;
  const seenKey = code => 'seen-' + code;
  function loadSeen(v) {
    const s = K.store.sget(seenKey(v.code), null);
    seen = s && s.code === v.code ? s : { code: v.code, vote: v.lastVote ? v.lastVote.seq : null, quest: v.lastQuest ? v.lastQuest.seq : null, lady: v.lastLady ? v.lastLady.seq : null, phase: v.phase, round: v.round };
  }
  function detect(v) {
    const ev = [];
    if (v.phase === 'lobby') { seen.vote = seen.quest = seen.lady = null; }
    if (seen.phase === 'lobby' && v.phase === 'reveal') ev.push({ type: 'deal' });
    if (v.lastVote && v.lastVote.seq !== seen.vote) { seen.vote = v.lastVote.seq; ev.push({ type: 'vote', d: v.lastVote }); }
    if (v.lastQuest && v.lastQuest.seq !== seen.quest) { seen.quest = v.lastQuest.seq; ev.push({ type: 'quest', d: v.lastQuest }); }
    if (v.lastLady && v.lastLady.seq !== seen.lady) {
      seen.lady = v.lastLady.seq;
      const mine = v.me && v.lastLady.holderId === v.me.id;
      const res = mine ? ((v.me.ladyResults || []).filter(r => r.targetId === v.lastLady.targetId).pop() || null) : null;
      ev.push({ type: 'lady', d: v.lastLady, result: res });
    }
    if (v.phase === 'propose' && seen.phase === 'reveal') ev.push({ type: 'begin' });
    if (v.phase === 'assassin' && seen.phase && seen.phase !== 'assassin') ev.push({ type: 'assassin' });
    if (v.phase === 'end' && seen.phase && seen.phase !== 'end') ev.push({ type: 'end' });
    seen.phase = v.phase; seen.round = v.round;
    return ev.filter(e => K.cine[e.type]);
  }
  function makeCtx() {
    const ov = K.el('<div class="ux-overlay" role="dialog" aria-live="polite"><div class="inner"></div></div>');
    const skip = K.el('<button class="ux-skip">건너뛰기 ›</button>');
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
    for (const e of evs) {
      const ctx = makeCtx();
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
    if (connForced === 'offline' || connForced === 'reconnecting') return connShow(connForced === 'offline' ? '연결이 끊겼어요. 다시 연결하는 중…' : '다시 연결하는 중…');
    if (navigator.onLine === false) return connShow('인터넷 연결이 끊겼어요. 다시 연결하는 중…');
    if (netDown && Date.now() - netDown < 8000) return connShow('연결이 불안정해요. 다시 연결하는 중…');
    connHide();
  }
  /* Optional extra (not in contract): app.js may call UI.setConnection('online'|'offline'|'reconnecting'). */
  UI.setConnection = s => { connForced = s === 'online' ? null : s; connCheck(); };

  // ---------- public API ----------
  /* UI.init(root, api, THEME, extra?) — extra may be window.GUIDE (app.js passes it) or {assetBase, guide}. */
  UI.init = (root, apiObj, theme, extra) => {
    rootEl = root; api = apiObj || {}; T = theme || window.THEME || {};
    const opts = extra && (extra.build || extra.quick || extra.phaseHints) ? { guide: extra } : (extra || {});
    if (opts.guide && !window.GUIDE) window.GUIDE = opts.guide;
    if (opts.assetBase) assetBase = opts.assetBase.replace(/\/?$/, '/');
    K.api = api;
    Sound.init();
    rootEl.innerHTML = '';
    appEl = K.el('<div class="ux-app"><div class="ux-pattern"></div><canvas class="ux-fx" aria-hidden="true"></canvas><div class="ux-stage"></div></div>');
    rootEl.appendChild(appEl);
    stageEl = appEl.querySelector('.ux-stage');
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
    K.view = v || null; lastViewAt = v ? Date.now() : 0; connCheck();
    if (cineBusy) return;   // the queue picks up the newest view when it ends
    pump();
  };
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
      const title = T.title || '빛의 원정대';
      // title letters drop in one by one
      const letters = Array.from(title).map((ch, i) => '<span style="animation-delay:' + (220 + i * 70) + 'ms">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>').join('');
      const el = K.el('<section class="uxh">' +
        '<div class="uxh-rays" aria-hidden="true"></div>' +
        '<div class="ux-home-hero">' + K.emblem(156) +
        '<h1 class="ux-h1 uxh-title">' + letters + '</h1>' +
        '<p class="ux-subtitle uxh-fade" style="animation-delay:.9s">' + esc(T.subtitle || '수련회 숨은 역할 추리 게임') + '</p>' +
        '<div class="uxh-fade" style="animation-delay:1.1s">' + K.verse('home') + '</div></div>' +
        '<div class="ux-panel uxh-card" style="animation-delay:.5s"><div class="ux-stack">' +
        '<label class="ux-field"><span class="ux-label">내 이름</span><input class="ux-input" id="uxh-name" maxlength="10" autocomplete="nickname" enterkeyhint="done" placeholder="예) 은혜" value="' + esc(name) + '"></label>' +
        '<button class="ux-btn ux-btn-gold" data-act="h-create">🕯️ 방 만들기</button>' +
        '<div class="ux-divider">또는 코드로 참가</div>' +
        '<div class="ux-row" style="align-items:stretch"><input class="ux-input ux-code-input" id="uxh-code" maxlength="6" inputmode="text" autocapitalize="characters" autocomplete="off" placeholder="코드" value="' + esc(code) + '" style="flex:1.3">' +
        '<button class="ux-btn ux-btn-ghost" data-act="h-join" style="flex:1">참가하기</button></div>' +
        '</div></div>' +
        '<button class="uxh-guide uxh-fade" data-act="cm-guide" style="animation-delay:.8s"><span class="bk">📖</span><span><b>1분 설명서</b><small>처음이라면 여기부터</small></span><span class="ar">›</span></button>' +
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
    if (!n) { K.toast('이름을 먼저 적어 주세요'); if (i) { K.shake(i); i.focus(); } return null; }
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
    if (c.length < 4) { K.toast('방 코드를 입력해 주세요'); if (ci) { K.shake(ci); ci.focus(); } return; }
    K.fb('pick');
    await go(btn, () => K.call('join', c, n));
  };

  const css = `
.uxh { position: relative; gap: 16px; }
.uxh-rays { position: absolute; left: 50%; top: -120px; width: 700px; height: 700px; margin-left: -350px; pointer-events: none; opacity: .5;
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,220,150,.13) 0 4deg, transparent 4deg 16deg);
  -webkit-mask: radial-gradient(circle, #000 10%, transparent 62%); mask: radial-gradient(circle, #000 10%, transparent 62%);
  animation: spin 90s linear infinite; will-change: transform; }
.uxh-title span { display: inline-block; animation: uxhDrop .7s var(--ease-spring) both; }
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

  K.screens.lobby = {
    build(v) {
      return K.el('<section class="uxl">' +
        '<div class="ux-top"><div class="grow"><div class="ux-top-title">' + esc(K.T().title || '빛의 원정대') + '</div><div class="ux-top-sub">대기실</div></div>' +
        '<button class="ux-icon-btn" data-act="cm-guide" aria-label="설명서">📖</button>' + K.soundBtn() +
        '<button class="ux-icon-btn" data-act="l-leave" aria-label="나가기">🚪</button></div>' +
        '<div class="ux-panel ux-code-card uxl-in" style="animation-delay:.05s"><div class="ux-label">참가 코드</div><div class="ux-code" data-slot="code"></div>' +
        '<div class="ux-row" style="justify-content:center"><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-copy">📋 복사</button><button class="ux-btn ux-btn-sm ux-btn-ghost" data-act="l-share">📨 초대하기</button></div></div>' +
        '<div data-slot="hint"></div>' +
        '<div class="ux-panel uxl-in" style="animation-delay:.12s"><div class="ux-panel-head"><h3 class="ux-h3">함께하는 사람</h3><span class="ux-chip" data-slot="count"></span></div>' +
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
      K.patch(el.querySelector('[data-slot=hint]'), hint ? '<p class="ux-p ux-center uxl-hint">' + esc(hint) + '</p>' : '');

      // players
      const items = ps.map(p => ({
        key: p.id, html: '<div class="ux-player' + (K.isMe(v, p.id) ? ' is-me' : '') + (p.ready || p.isHost ? ' is-ready' : '') + '">' + K.avatar(p, true) +
          '<div class="ux-player-name">' + esc(p.name) + (K.isMe(v, p.id) ? '<small>나</small>' : '') + '</div>' +
          (p.isHost ? '<span class="ux-badge gold">👑 방장</span>' : (p.ready ? '<span class="ux-badge ok">✓ 준비 완료</span>' : '<span class="ux-badge">기다리는 중</span>')) +
          (isHost && !p.isHost ? '<button class="ux-kick" data-act="l-kick" data-id="' + esc(p.id) + '" aria-label="내보내기">✕</button>' : '') + '</div>'
      }));
      for (let i = n; i < Math.max(5, Math.min(max, n + 1)); i++) items.push({ key: 'empty' + i, html: '<div class="ux-player ux-empty-seat">' + (i < 5 ? '빈 자리 · 최소 5명' : '빈 자리') + '</div>' });
      K.patchList(el.querySelector('[data-slot=players]'), items);

      // balance
      const cnt = Math.max(5, Math.min(10, n));
      const evil = (n >= 5 && v.evilCount) || K.EVIL_COUNT[cnt];
      const sizes = (n >= 5 && v.teamSizes) || K.TEAM_SIZES[cnt];
      const rig = Array.isArray(v.rolesInGame) && v.rolesInGame.length ? '<div class="ux-roles-strip" style="margin-top:10px">' + v.rolesInGame.map(r => '<span class="ux-role-pill ' + K.teamOf(r) + '"><i>' + K.roleImg(r) + '</i>' + esc(K.roleName(r)) + '</span>').join('') + '</div>' : '';
      K.patch(el.querySelector('[data-slot=balance]'),
        '<div class="ux-balance"><div class="g"><b>' + (cnt - evil) + '</b>' + esc(K.teamName('good')) + '</div><div class="e"><b>' + evil + '</b>' + esc(K.teamName('evil')) + '</div></div>' +
        '<p class="ux-muted ux-center" style="margin-top:8px">' + (n < 5 ? cnt + '명 기준 · ' : '') + esc(K.term('quest', '사명')) + ' 인원 ' + sizes.join(' · ') + (cnt >= 7 ? ' · 4번째는 ' + esc(K.term('fail', '방해')) + ' 2장' : '') + '</p>' + rig);

      // settings
      const val = (k) => (k in pend ? pend[k] : (k === 'lady' || k === 'balance' ? !!s[k] : !!roles[k]));
      const g = K.G(), presets = g && g.presets;
      let h = '<div class="ux-panel-head"><h3 class="ux-h3">역할과 규칙</h3>' + (isHost ? '' : '<span class="ux-muted">방장이 정해요</span>') + '</div>';
      if (isHost && presets) h += '<div class="uxl-presets">' + Object.keys(presets).map(k => '<button class="ux-chip" data-act="l-preset" data-k="' + esc(k) + '">✨ ' + esc(presets[k].label || k) + '</button>').join('') + '</div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">최대 인원</div><div class="desc">5~10명</div></div><div class="ux-stepper">' +
        (isHost ? '<button data-act="l-max" data-d="-1"' + (max <= Math.max(5, n) ? ' disabled' : '') + '>−</button>' : '') + '<span class="val">' + max + '</span>' +
        (isHost ? '<button data-act="l-max" data-d="1"' + (max >= 10 ? ' disabled' : '') + '>+</button>' : '') + '</div></div>';
      K.OPTIONAL_ROLES.forEach(k => {
        const on = val(k), ev = K.teamOf(k) === 'evil';
        h += '<div class="ux-setting"><div class="thumb">' + K.roleImg(k) + '</div><div class="txt"><div class="name">' + esc(K.roleName(k)) + ' <span class="ux-badge ' + (ev ? 'evil' : 'gold') + '" style="padding:2px 7px">' + esc(ev ? K.teamName('evil') : K.teamName('good')) + '</span></div><div class="desc">' + esc(K.roleDesc(k)) + '</div></div>' +
          '<button class="ux-switch' + (on ? ' on' : '') + (ev ? ' evil' : '') + '" data-act="l-toggle" data-k="' + k + '"' + (isHost ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + esc(K.roleName(k)) + '"></button></div>';
      });
      h += '<div class="ux-setting"><div class="thumb" style="display:grid;place-items:center">' + K.tokenImg('lady') + '</div><div class="txt"><div class="name">' + esc(K.term('lady', '등불')) + '</div><div class="desc">2·3·4번째 ' + esc(K.term('quest', '사명')) + ' 뒤에 한 사람의 진영을 몰래 확인해요. 7명 이상 추천.</div></div>' +
        '<button class="ux-switch' + (val('lady') ? ' on' : '') + '" data-act="l-toggle" data-k="lady"' + (isHost ? '' : ' disabled') + '></button></div>';
      h += '<div class="ux-setting"><div class="txt"><div class="name">균형 모드</div><div class="desc">5명·7명일 때 ' + esc(K.term('quest', '사명')) + ' 인원을 바꿔 균형을 맞춰요.</div></div>' +
        '<button class="ux-switch' + (val('balance') ? ' on' : '') + '" data-act="l-toggle" data-k="balance"' + (isHost ? '' : ' disabled') + '></button></div>';
      if (v.setupError) h += '<div class="ux-warn" style="margin-top:8px">⚠️ ' + esc(v.setupError) + '</div>';
      K.patch(el.querySelector('[data-slot=settings]'), h);

      // dock
      const others = ps.filter(p => !p.isHost), readyN = others.filter(p => p.ready).length;
      const allReady = others.every(p => p.ready);
      let d;
      if (isHost) {
        const can = n >= 5 && n <= 10 && allReady && !v.setupError;
        const why = n < 5 ? (5 - n) + '명이 더 필요해요' : !allReady ? '모두 준비하면 시작할 수 있어요 (' + readyN + '/' + others.length + ')' : v.setupError ? '설정을 확인해 주세요' : '모두 준비됐어요!';
        d = '<div class="ux-progress"><i style="width:' + (others.length ? Math.round(100 * readyN / others.length) : 0) + '%"></i></div><p class="ux-muted ux-center">' + esc(why) + '</p>' +
          '<button class="ux-btn ux-btn-gold uxl-start' + (can ? ' can' : '') + '" data-act="l-start"' + (can ? '' : ' disabled') + '>✝️ 게임 시작</button>';
      } else {
        const r = !!me.ready;
        d = '<p class="ux-muted ux-center">' + (r ? '방장이 시작하기를 기다리는 중 <span class="ux-dots"><i></i><i></i><i></i></span>' : '준비되면 아래 버튼을 눌러 주세요') + ' · ' + readyN + '/' + others.length + ' 준비</p>' +
          '<button class="ux-btn ux-ready-btn ' + (r ? 'is-ready' : 'ux-btn-gold') + '" data-act="l-ready">' + (r ? '준비 완료' : '준비하기') + '</button>';
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
    try { await navigator.clipboard.writeText(c); K.toast('코드를 복사했어요', 'info'); } catch (e) { K.toast('코드: ' + c, 'info'); }
    K.fb('tap');
  };
  K.actions['l-share'] = async () => {
    const c = K.view && K.view.code; if (!c) return;
    const url = location.origin + location.pathname + '?code=' + encodeURIComponent(c);
    const text = (K.T().title || '빛의 원정대') + '에 초대해요! 코드 ' + c;
    if (navigator.share) { try { await navigator.share({ title: K.T().title || '빛의 원정대', text, url }); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(text + '\n' + url); K.toast('초대 링크를 복사했어요', 'info'); } catch (e) { K.toast(url, 'info'); } }
  };
  K.actions['l-ready'] = (d, btn) => { const r = !(K.view.me && K.view.me.ready); K.fb(r ? 'good' : 'tap'); if (r) K.fx.burstAt(btn, { n: 24, speed: 200 }); K.call('ready', r); };
  K.actions['l-start'] = (d, btn) => { K.fb('chime'); K.fx.burstAt(btn, { n: 50, speed: 320 }); K.call('start'); };
  K.actions['l-kick'] = async d => {
    const nm = K.pname(K.view, d.id);
    if (await K.confirm(nm + '님을 내보낼까요?', '', { ok: '내보내기', danger: true })) K.call('kick', d.id);
  };
  K.actions['l-leave'] = async () => {
    if (await K.confirm('대기실에서 나갈까요?', '나가면 코드를 다시 입력해 들어올 수 있어요.', { ok: '나가기', danger: true })) K.call('leave');
  };
  K.actions['l-max'] = d => { const s = K.view.settings || {}; const m = Math.max(5, Math.min(10, (s.maxPlayers || 10) + Number(d.d))); K.fb('tick'); K.call('settings', { maxPlayers: m }); };
  K.actions['l-toggle'] = (d, btn) => {
    const v = K.view, s = v.settings || {}, k = d.k;
    const cur = k === 'lady' || k === 'balance' ? !!s[k] : !!(s.roles || {})[k];
    btn.classList.toggle('on', !cur); K.fb('pick');
    K.local.pend = Object.assign({}, K.local.pend, { [k]: !cur });
    if (k === 'lady' || k === 'balance') K.call('settings', { [k]: !cur });
    else K.call('settings', { roles: Object.assign({}, s.roles || {}, { [k]: !cur }) });
  };
  K.actions['l-preset'] = d => {
    const g = K.G(), p = g && g.presets && g.presets[d.k]; if (!p) return;
    const n = Math.max(5, Math.min(10, K.players(K.view).length));
    const c = (p.byCount && (p.byCount[n] || p.byCount[String(n)])) || null; if (!c) return;
    K.fb('chime'); K.toast((p.label || '추천 구성') + ' 적용' + (c.note ? ' · ' + c.note : ''), 'info');
    K.call('settings', c);
  };

  const css = `
.uxl-in { animation: uxhCard .7s var(--ease-out) both; }
.uxl-hint { margin: -2px 6px 0; font-size: 13px; animation: uxhFade .6s both; }
.uxl-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: -2px 0 8px; } .uxl-presets .ux-chip { color: var(--gold-hi); }
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


/* ---- src/30-board.js ---- */
/* 빛의 원정대 — board screen (phases propose / vote / quest / lady / assassin).
   Layout: top bar · quest track + rejection track · players table · action panel.
   update() runs on every view (polls): it only patches parts whose html changed, and applies
   local picks (seat selection, chosen card) as classes so nothing re-animates on polls. */
(function () {
  'use strict';
  const K = window.UI._k;

  // ---------- Korean particles for themed words (terms may be renamed in config.js) ----------
  const lastCode = w => { const s = String(w || ''); return s.charCodeAt(s.length - 1); };
  const batchim = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
  const rieul = w => { const c = lastCode(w); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 8; };
  const jo = (w, withB, noB) => w + (batchim(w) ? withB : noB);   // jo('사명','을','를')
  const ro = w => w + (batchim(w) && !rieul(w) ? '으로' : '로');

  // ---------- themed words ----------
  const W = {
    quest: () => K.term('quest', '사명'),
    team: () => K.term('questTeam', '원정대'),
    leader: () => K.term('leader', '조장'),
    success: () => K.term('success', '축복'),
    fail: () => K.term('fail', '방해'),
    approve: () => K.term('approve', '찬성'),
    reject: () => K.term('reject', '반대'),
    lady: () => K.term('lady', '등불'),
    assassinate: () => K.term('assassinate', '지목')
  };
  const e = K.esc;
  const nm = (v, id) => e(K.pname(v, id));

  // ---------- one-time CSS ----------
  function injectCSS() {
    if (document.getElementById('bd-style')) return;
    const s = document.createElement('style'); s.id = 'bd-style';
    s.textContent = `
.bd-root { position: relative; z-index: 0; }
.bd-root > .bd-veil { position: fixed; inset: 0; z-index: -1; }
.bd-top .grow { padding-right: 2px; }
.bd-top .ux-top-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-top .ux-icon-btn { width: 36px; height: 36px; border-radius: 11px; font-size: 16px; }
.bd-top .ux-icon-btn.on { border-color: var(--gold); background: rgba(244,201,107,.16); }
.bd-top .ux-role-chip { padding: 3px 10px 3px 3px; gap: 6px; font-size: 12px; color: var(--text); flex: none; }
.bd-top .ux-role-chip .dot { width: 22px; height: 30px; border-radius: 5px; }
.bd-top .ux-role-chip .dot img { object-position: 50% 50%; }
.bd-trackp { overflow: hidden; padding: 8px 8px 12px; }
.bd-trackp > .ux-rose { width: 340px; height: 340px; margin: -170px 0 0 -170px; opacity: .10; }
.bd-trackp > *:not(.ux-rose) { position: relative; }
.bd-trackp .ux-track { padding: 12px 6px 14px; }
.bd-qwrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; }
.bd-qwrap .ux-quest { width: 100%; }
.bd-qn { font-size: 10px; color: var(--text-mute); letter-spacing: .06em; }
.bd-qwrap.cur .bd-qn { color: var(--gold); }
.bd-qwrap .two + .bd-qn, .bd-qwrap.two-b .bd-qn { margin-top: 3px; }
.ux-quest.current::after { content: ''; position: absolute; inset: -7px; border-radius: 50%; border: 1px dashed rgba(244,201,107,.55); animation: spin 14s linear infinite; }
.bd-rejl { margin-right: 4px; }
.ux-rej.last.on { animation: bd-throb 1.4s ease-in-out infinite; }
@keyframes bd-throb { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }
.bd-warn { margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px; background: rgba(224,72,110,.13); border: 1px solid rgba(224,72,110,.45); color: #ffc6d3; font-size: 13px; line-height: 1.45; text-align: center; animation: popIn .45s var(--ease-spring) both; }
.bd-warn b { color: #fff; }
.ux-seat { color: inherit; font: inherit; width: 100%; }
.ux-seat .check { color: transparent; }
.ux-seat.fresh { animation: popIn .45s var(--ease-spring) both; animation-delay: calc(var(--i, 0) * 35ms); }
.ux-seat .icons span img { width: 100%; height: 100%; border: 0; background: none; border-radius: 50%; }
.ux-seat .icons .lamp img { padding: 1px; }
.ux-seat .sub { flex-wrap: wrap; min-height: 14px; margin-top: 2px; }
.ux-seat .sub .off { color: var(--text-mute); }
.ux-seat .sub .tm { color: var(--gold); }
.ux-seat .done { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(111,227,166,.16); animation: popIn .4s var(--ease-spring) both; }
.ux-seat.on-team { background: rgba(244,201,107,.07); }
.ux-seat.selectable { cursor: pointer; }
.ux-seat.disabled { pointer-events: none; }
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
.bd-count { text-align: center; font-size: 14px; color: var(--text-dim); margin: 2px 0 12px; }
.bd-count b { font-size: 24px; font-weight: 900; color: var(--gold-hi); font-variant-numeric: tabular-nums; display: inline-block; transition: transform .25s var(--ease-spring); }
.bd-count b.bump { transform: scale(1.3); }
.bd-count.full b { color: var(--ok); }
.bd-pickname { text-align: center; font-size: 15px; margin: 2px 0 12px; color: var(--text-dim); min-height: 22px; }
.bd-pickname b { color: var(--gold-hi); }
.bd-action.dark .bd-pickname b { color: #ff9db5; }
.bd-root .ux-choices { margin: 4px 0 14px; }
.bd-root .ux-choice { max-width: 148px; aspect-ratio: 4 / 5; font-size: 21px; }
.bd-root .ux-choice img { width: 58%; }
.bd-done { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0 2px; }
.bd-done .seal { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; font-weight: 900; color: #2a1a02;
  background: radial-gradient(circle at 40% 35%, #fff4cf, var(--gold) 55%, var(--gold-deep)); box-shadow: 0 0 22px var(--good-glow); animation: stamp .7s var(--ease-spring) both; }
.bd-done .t { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--gold-hi); }
.bd-live { margin-top: 14px; }
.bd-live:empty { display: none; }
.bd-prog-l { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
.bd-prog-l b { color: var(--text); font-variant-numeric: tabular-nums; }
.bd-next { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; margin-top: 14px; font-size: 12px; color: var(--text-mute); }
.bd-next .ux-chip { padding: 3px 9px; font-size: 12px; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.bd-next .arr { opacity: .5; }
.bd-ti { width: 16px; height: 16px; vertical-align: -3px; }
.bd-wait-ic { width: 54px; height: 54px; }
.bd-wait-ic img { width: 100%; height: 100%; animation: breathe 2.6s ease-in-out infinite; }
`;
    document.head.appendChild(s);
  }

  // ---------- state helpers ----------
  const showMarks = () => !!K.store.get('showMarks', false);
  const meId = v => (v.me && v.me.id) || null;
  const keyOf = v => v.phase + '|' + v.round + '|' + v.proposalNo;
  const onTeamIds = v => (v.proposal && v.proposal.team) || [];

  /* What the current action needs from me: mode multi (propose), single (lady/assassin) or none. */
  function pickMode(v) {
    const me = meId(v); const ps = K.players(v);
    if (v.phase === 'propose' && v.leaderId === me) return { mode: 'multi', size: K.teamSize(v), allowed: new Set(ps.map(p => p.id)), kind: 'team' };
    if (v.phase === 'lady' && v.ladyHolderId === me) {
      const used = new Set(v.ladyUsedBy || []);
      return { mode: 'single', size: 1, allowed: new Set(ps.filter(p => p.id !== me && !used.has(p.id)).map(p => p.id)), kind: 'lady' };
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
    if (v.phase === 'lady') return v.ladyHolderId === me.id;
    if (v.phase === 'assassin') return v.assassinId === me.id;
    return false;
  }

  // ---------- top bar ----------
  function topHtml(v) {
    const n = (v.round || 0) + 1; let title = e(W.quest()) + ' ' + n, sub = '';
    if (v.phase === 'propose') sub = (v.proposalNo || 1) + '번째 제안 · ' + e(W.leader()) + ' ' + nm(v, v.leaderId);
    else if (v.phase === 'vote') sub = (v.proposalNo || 1) + '번째 제안 · 투표 중';
    else if (v.phase === 'quest') sub = e(W.quest()) + ' 수행 중';
    else if (v.phase === 'lady') sub = e(W.lady()) + ' · ' + nm(v, v.ladyHolderId);
    else if (v.phase === 'assassin') { title = '마지막 ' + e(W.assassinate()); sub = '모든 것이 이 한 번에 달렸어요'; }
    const marks = showMarks();
    return '<div class="grow"><div class="ux-top-title">' + title + '</div><div class="ux-top-sub">' + sub + '</div></div>' +
      '<button class="ux-icon-btn' + (marks ? ' on' : '') + '" data-act="bd-marks" aria-label="알고 있는 정보 표시" aria-pressed="' + marks + '">' + (marks ? '👁' : '🙈') + '</button>' +
      '<button class="ux-icon-btn" data-act="bd-history" aria-label="지난 기록">📜</button>' +
      '<button class="ux-chip ux-role-chip" data-act="bd-role" aria-label="내 역할 보기"><span class="dot">' + K.backImg() + '</span>내 역할</button>' +
      K.soundBtn();
  }

  // ---------- quest track + rejection track ----------
  function trackHtml(v) {
    const qs = v.quests || [];
    const sizes = K.sizes(v);
    const prev = K.local.prevResults; const now = Date.now();
    K.local.justAt = K.local.justAt || {};
    const fresh = [];
    let out = '<div class="ux-rose" aria-hidden="true"></div><div class="ux-track">';
    for (let i = 0; i < 5; i++) {
      const q = qs[i] || { size: sizes[i], failsNeeded: K.questFails(v, i), result: null };
      const res = q.result;
      if (prev && res && !prev[i]) { K.local.justAt[i] = now; fresh.push({ i, res }); }
      const just = res && K.local.justAt[i] && now - K.local.justAt[i] < 1500;
      const cur = !res && i === v.round && v.phase !== 'assassin';
      const two = (q.failsNeeded || K.questFails(v, i)) >= 2;
      out += '<div class="bd-qwrap' + (cur ? ' cur' : '') + '"><div class="ux-quest' + (cur ? ' current' : '') + (res ? ' ' + res : '') + (just ? ' just' : '') + '" data-q="' + i + '">' +
        (res ? K.tokenImg(res === 'success' ? 'success' : 'fail', 'tok') : '<span class="sz">' + (q.size || sizes[i] || '') + '</span>') +
        (two && !res ? '<span class="two">' + e(W.fail()) + ' 2</span>' : '') +
        '</div><span class="bd-qn">' + (i + 1) + '</span></div>';
    }
    out += '</div>';
    K.local.prevResults = qs.map(q => q && q.result);
    const filled = Math.max(0, Math.min(5, (v.proposalNo || 1) - 1));
    const showRej = v.phase === 'propose' || v.phase === 'vote';
    out += '<div class="ux-rejects"><span class="bd-rejl">' + e(W.reject()) + ' 누적</span>';
    for (let i = 1; i <= 5; i++) out += '<span class="ux-rej' + (showRej && i <= filled ? ' on' : '') + (i === 5 ? ' last' : '') + '">' + (i === 5 ? '!' : '') + '</span>';
    out += '</div>';
    if (showRej && v.proposalNo >= 5) {
      out += '<div class="bd-warn">⚠ <b>마지막 제안</b>이에요. 이번 ' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.reject(), '으로', '로')) + ' 무산되면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.</div>';
    }
    return { html: out, fresh };
  }

  // ---------- players table ----------
  function seatItems(v, pm) {
    const me = meId(v); const marks = showMarks();
    const team = new Set(onTeamIds(v));
    const done = new Set(v.phase === 'vote' ? (v.votedIds || []) : v.phase === 'quest' ? (v.questPlayedIds || []) : []);
    return K.players(v).map((p, i) => {
      const sel = pm.mode && pm.allowed.has(p.id);
      const dis = pm.mode && !sel;
      const cls = ['ux-seat'];
      if (sel) cls.push('selectable');
      if (dis) cls.push('disabled');
      if (pm.kind === 'assassin' && sel) cls.push('evil-pick', 'ux-target-ring');
      if (team.size && team.has(p.id) && (v.phase === 'vote' || v.phase === 'quest')) cls.push('on-team');
      if (p.id === me) cls.push('is-me');
      let icons = '';
      if (p.id === v.leaderId && v.phase !== 'assassin') icons += '<span class="leader" title="' + e(W.leader()) + '">' + K.tokenImg('leader') + '</span>';
      if (v.ladyHolderId && p.id === v.ladyHolderId && v.phase !== 'assassin') icons += '<span class="lamp" title="' + e(W.lady()) + '">' + K.tokenImg('lady') + '</span>';
      let sub = '';
      if (p.online === false) sub += '<span class="off">연결 끊김</span>';
      if (cls.indexOf('on-team') >= 0) sub += '<span class="tm">' + e(W.team()) + '</span>';
      if (marks && p.id !== me) {
        K.knowOf(v, p.id).forEach(t => { sub += '<span class="knowtag ' + (t === 'merlinCandidate' ? 'merlinCandidate' : 'evil') + '">' + e(K.knowText(t)) + '</span>'; });
        const lt = K.ladyOf(v, p.id);
        if (lt) sub += '<span class="knowtag ' + (lt === 'evil' ? 'evil' : 'good') + '">🪔 ' + e(K.teamName(lt)) + '</span>';
      }
      const tag = sel ? 'button' : 'div';
      const html = '<' + tag + ' class="' + cls.join(' ') + '" style="--i:' + i + '"' + (sel ? ' type="button" data-act="bd-seat" data-id="' + e(p.id) + '"' : '') + ' data-pid="' + e(p.id) + '">' +
        K.avatar(p, true) +
        '<div class="meta"><div class="ux-player-name">' + e(p.name) + (p.id === me ? '<small>나</small>' : '') + '</div><div class="sub">' + sub + '</div></div>' +
        (done.has(p.id) ? '<span class="done" aria-label="완료">✓</span>' : '') +
        (sel ? '<span class="check">✓</span>' : '') +
        (icons ? '<div class="icons">' + icons + '</div>' : '') +
        '</' + tag + '>';
      return { key: p.id, html };
    });
  }

  // ---------- action panel ----------
  const teamChips = v => '<div class="ux-team-row">' + onTeamIds(v).map(id => {
    const p = K.player(v, id) || { id, name: '?' };
    return '<span class="ux-team-chip">' + K.avatar(p, false) + e(p.name) + (K.isMe(v, id) ? ' <small style="opacity:.6">나</small>' : '') + '</span>';
  }).join('') + '</div>';
  const hintLine = (phase, key, params) => { const h = typeof K.hint === 'function' ? K.hint(phase, key, params) : ''; return h ? '<p class="ux-muted bd-hint">' + e(h) + '</p>' : ''; };
  const twoNote = v => K.questFails(v, v.round) >= 2 ? '<p class="bd-note">이번 ' + e(jo(W.quest(), '은', '는')) + ' ' + e(W.fail()) + ' 카드가 2장 나와야 실패해요</p>' : '';
  const waiting = (iconHtml) => '<div class="ux-waiting">' + (iconHtml ? '<div class="bd-wait-ic">' + iconHtml + '</div>' : '') + '<span class="ux-dots"><i></i><i></i><i></i></span></div>';
  const progress = (label, k, n) => '<div class="bd-prog-l"><span>' + label + '</span><b>' + k + ' / ' + n + '</b></div><div class="ux-progress"><i style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></i></div>';
  const doneSeal = t => '<div class="bd-done"><div class="seal">✓</div><div class="t">' + t + '</div></div>';

  function nextLeaders(v) {
    const ps = K.players(v); const i = ps.findIndex(p => p.id === v.leaderId);
    if (i < 0 || ps.length < 2) return '';
    const names = [];
    for (let k = 1; k <= Math.min(3, ps.length - 1); k++) names.push(ps[(i + k) % ps.length]);
    return '<div class="bd-next"><span>다음 ' + e(W.leader()) + '</span>' + names.map((p, j) => (j ? '<span class="arr">›</span>' : '') + '<span class="ux-chip">' + e(p.name) + (K.isMe(v, p.id) ? ' (나)' : '') + '</span>').join('') + '</div>';
  }

  function choiceCards(a, b) {
    return '<div class="ux-choices">' +
      '<button type="button" class="ux-choice ' + a.cls + '" data-act="bd-choice" data-val="1">' + K.tokenImg(a.tok) + e(a.label) + (a.small ? '<small>' + e(a.small) + '</small>' : '') + '</button>' +
      '<button type="button" class="ux-choice ' + b.cls + '" data-act="bd-choice" data-val="0">' + K.tokenImg(b.tok) + e(b.label) + (b.small ? '<small>' + e(b.small) + '</small>' : '') + '</button></div>';
  }

  /* returns { head, ctl, live, mood } — head/ctl only change with the phase key or my own progress. */
  function actionParts(v) {
    const me = v.me || {}; const ph = v.phase;
    const n = (v.players || []).length;
    const P = { head: '', ctl: '', live: '', mood: '' };
    if (ph === 'propose') {
      const size = K.teamSize(v);
      if (v.leaderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">' + K.tokenImg('leader', 'bd-ti') + ' 이번 ' + e(W.leader()) + '</span></div>' +
          '<h3 class="ux-action-title">' + e(jo(W.team(), '을', '를')) + ' 꾸려 주세요</h3>' +
          '<p class="ux-action-sub">' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '에 함께 갈 <b>' + size + '명</b>을 위 자리에서 골라요.<br>나도 포함할 수 있어요.</p>' +
          twoNote(v) + hintLine('propose', 'leader', { size });
        P.ctl = '<div class="bd-count" data-bd="count"><b data-bd="k">0</b> / ' + size + '명 선택</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-propose" data-bd="go" disabled>이 ' + e(ro(W.team())) + ' 제안하기</button>' + nextLeaders(v);
      } else {
        P.head = '<h3 class="ux-action-title">' + e(W.leader()) + ' ' + nm(v, v.leaderId) + '님이 고르는 중</h3>' +
          '<p class="ux-action-sub">' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '에 갈 ' + e(W.team()) + ' <b>' + size + '명</b>을 정하고 있어요.<br>누구를 보내면 좋을지 함께 이야기해 보세요.</p>' +
          twoNote(v) + hintLine('propose', 'others', { leaderName: K.pname(v, v.leaderId) });
        P.ctl = waiting(K.tokenImg('leader')) + nextLeaders(v);
      }
    } else if (ph === 'vote') {
      const last = v.proposalNo >= 5;
      P.head = '<h3 class="ux-action-title">이 ' + e(W.team()) + '에' + ' ' + e(W.approve()) + '하시나요?</h3>' +
        '<p class="ux-action-sub">' + e(W.leader()) + ' ' + nm(v, v.leaderId) + '님의 제안 · ' + e(W.quest()) + ' ' + ((v.round || 0) + 1) + '</p>' + teamChips(v);
      if (me.myVote == null) {
        P.mood = 'turn';
        P.ctl = (last ? '<div class="bd-warn" style="margin:0 0 12px">이번에 ' + e(jo(W.reject(), '이', '가')) + ' 많으면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 바로 승리</b>해요</div>' : '') +
          hintLine('vote', 'all') +
          choiceCards({ cls: 'approve', tok: 'approve', label: W.approve(), small: '이대로 출발' }, { cls: 'reject', tok: 'reject', label: W.reject(), small: '다시 꾸리기' }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-vote" data-bd="go" disabled>투표하기</button>';
      } else {
        P.ctl = doneSeal('투표 완료') + hintLine('vote', 'voted') + '<p class="ux-muted ux-center">모두 투표하면 결과가 함께 공개돼요</p>';
      }
      P.live = progress('투표한 사람', (v.votedIds || []).length, n);
    } else if (ph === 'quest') {
      const team = onTeamIds(v); const mine = team.indexOf(me.id) >= 0;
      if (mine && !me.myQuestPlayed) {
        P.mood = 'turn';
        P.head = '<h3 class="ux-action-title">' + e(W.quest()) + ' 카드를 내 주세요</h3>' +
          '<p class="ux-action-sub">몰래 한 장을 골라요. 누가 무엇을 냈는지는 아무도 몰라요.</p>' + teamChips(v) + twoNote(v) + hintLine('quest', 'onTeam');
        // Both cards look identical for everyone (a neighbour must not learn my team). Good players get a toast on fail.
        P.ctl = choiceCards({ cls: 'success', tok: 'success', label: W.success() }, { cls: 'fail', tok: 'fail', label: W.fail() }) +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-quest" data-bd="go" disabled>제출하기</button>';
      } else if (mine) {
        P.head = '<h3 class="ux-action-title">' + e(W.team()) + ' 카드를 기다리는 중</h3>' + teamChips(v);
        P.ctl = doneSeal('제출 완료') + hintLine('quest', 'played');
      } else {
        P.head = '<h3 class="ux-action-title">' + e(jo(W.team(), '이', '가')) + ' ' + e(jo(W.quest(), '을', '를')) + ' 수행 중이에요</h3>' +
          '<p class="ux-action-sub">카드가 모두 모이면 섞어서 공개돼요.</p>' + teamChips(v) + twoNote(v) + hintLine('quest', 'offTeam');
        P.ctl = waiting(K.tokenImg('success'));
      }
      P.live = progress('카드를 낸 사람', (v.questPlayedIds || []).length, team.length || K.teamSize(v));
    } else if (ph === 'lady') {
      if (v.ladyHolderId === me.id) {
        P.mood = 'turn';
        P.head = '<div class="bd-tag"><span class="ux-phase-tag">🪔 ' + e(W.lady()) + '</span></div>' +
          '<h3 class="ux-action-title">' + e(ro(W.lady())) + ' 한 사람을 비춰 보세요</h3>' +
          '<p class="ux-action-sub">고른 사람이 어느 편인지 <b>나만</b> 알게 돼요.<br>' + e(jo(W.lady(), '을', '를')) + ' 가졌던 사람은 고를 수 없어요.</p>' + hintLine('lady', 'holder');
        P.ctl = '<div class="bd-pickname" data-bd="pick">위 자리에서 한 사람을 골라 주세요</div>' +
          '<button type="button" class="ux-btn ux-btn-gold" data-act="bd-lady" data-bd="go" disabled>' + e(ro(W.lady())) + ' 비춰보기</button>';
      } else {
        P.head = '<h3 class="ux-action-title">' + nm(v, v.ladyHolderId) + '님이 ' + e(jo(W.lady(), '을', '를')) + ' 비추는 중</h3>' +
          '<p class="ux-action-sub">비춘 사람의 편은 ' + e(jo(W.lady(), '을', '를')) + ' 든 사람만 알게 돼요.</p>' + hintLine('lady', 'others', { holderName: K.pname(v, v.ladyHolderId) });
        P.ctl = waiting(K.tokenImg('lady'));
      }
    } else if (ph === 'assassin') {
      P.mood = 'dark';
      const seer = K.roleName('merlin') || '선지자';
      if (v.assassinId && v.assassinId === me.id) {
        P.head = '<h3 class="ux-action-title">' + e(jo(seer, '을', '를')) + ' 찾아내세요</h3>' +
          '<p class="ux-action-sub">맞히면 <b>' + e(jo(K.teamName('evil'), '이', '가')) + ' 승리</b>해요.<br>동료들과 의논한 뒤 신중하게 한 명을 고르세요.</p>' + hintLine('assassin', 'assassin');
        P.ctl = '<div class="bd-pickname" data-bd="pick">위 자리에서 한 사람을 골라 주세요</div>' +
          '<button type="button" class="ux-btn ux-btn-evil" data-act="bd-assassin" data-bd="go" disabled>' + e(W.assassinate()) + '하기</button>';
      } else if (me.team === 'evil') {
        P.head = '<h3 class="ux-action-title">' + nm(v, v.assassinId) + '님이 고르는 중</h3>' +
          '<p class="ux-action-sub">누가 ' + e(seer) + '인지' + ' 함께 의논해 보세요.<br>최종 ' + e(jo(W.assassinate(), '은', '는')) + ' ' + nm(v, v.assassinId) + '님이 해요.</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      } else {
        P.head = '<h3 class="ux-action-title">마지막 ' + e(W.assassinate()) + '을 기다리는 중</h3>' +
          '<p class="ux-action-sub">' + e(jo(K.teamName('evil'), '이', '가')) + ' 정체를 드러내고 의논하고 있어요.<br>숨을 고르고 조용히 기다려 주세요.</p>' + hintLine('assassin', 'others');
        P.ctl = waiting('');
      }
    }
    return P;
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
      if (go) go.disabled = L.picks.length !== pm.size || K.busy('propose');
    } else if (pm.mode === 'single') {
      const pk = K.$('[data-bd="pick"]', el);
      if (pk) pk.innerHTML = L.picks.length ? '<b>' + nm(v, L.picks[0]) + '</b>님을 골랐어요' : '위 자리에서 한 사람을 골라 주세요';
      if (go) go.disabled = !L.picks.length || K.busy(pm.kind === 'lady' ? 'lady' : 'assassinate');
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
  }

  // ---------- screen ----------
  function build(v) {
    injectCSS();
    return K.el('<div class="bd-root">' +
      '<div class="bd-veil-slot"></div>' +
      '<div class="ux-top bd-top" data-bd="top"></div>' +
      '<div class="ux-panel bd-trackp" data-bd="track"></div>' +
      '<div class="ux-table" data-bd="table"></div>' +
      '<div class="ux-panel ux-action bd-action" data-bd="action"><div class="bd-glow" aria-hidden="true"></div><div data-bd="head"></div><div data-bd="ctl"></div><div class="bd-live" data-bd="live"></div></div>' +
      '</div>');
  }

  function update(v, K_, el) {
    if (!v || !v.me) return;
    const L = K.local;
    const key = keyOf(v);
    const newKey = L.key !== key;
    if (newKey) { L.key = key; L.picks = []; L.choice = null; }
    L.pm = pickMode(v);

    // veil
    K.patch(K.$('.bd-veil-slot', el), v.phase === 'assassin' ? '<div class="ux-assassin-veil bd-veil"></div>' : '');
    K.patch(K.$('[data-bd="top"]', el), topHtml(v));
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

  // ---------- actions ----------
  const scr = () => K.screenEl();
  K.actions['bd-marks'] = () => {
    const on = !showMarks(); K.store.set('showMarks', on); K.fb('tap');
    K.toast(on ? '알고 있는 정보를 표시했어요. 옆 사람이 화면을 보지 않게 조심하세요.' : '알고 있는 정보를 숨겼어요', 'info');
    K.rerender();
  };
  K.actions['bd-history'] = () => { K.fb('tap'); if (typeof K.openHistory === 'function') K.openHistory(); else K.toast('기록을 준비 중이에요', 'info'); };
  K.actions['bd-role'] = () => { K.fb('tap'); if (typeof K.openRoleSheet === 'function') K.openRoleSheet(); else K.toast('역할 카드를 준비 중이에요', 'info'); };

  K.actions['bd-seat'] = (d, node) => {
    const L = K.local; const pm = L.pm; if (!pm || !pm.mode || !pm.allowed.has(d.id)) return;
    L.picks = L.picks || [];
    const i = L.picks.indexOf(d.id);
    if (pm.mode === 'single') L.picks = i >= 0 ? [] : [d.id];
    else if (i >= 0) L.picks.splice(i, 1);
    else if (L.picks.length >= pm.size) { K.toast(pm.size + '명까지 고를 수 있어요. 먼저 한 명을 빼 주세요.', 'info'); K.shake(node); K.buzz('tick'); return; }
    else L.picks.push(d.id);
    K.fb('pick');
    applyLocal(scr(), K.view);
  };

  K.actions['bd-choice'] = (d, node) => {
    const v = K.view; const val = d.val === '1';
    if (v.phase === 'quest' && !val && v.me && v.me.team === 'good') {
      K.shake(node); K.buzz('tick');
      K.toast(jo(K.teamName('good'), '은', '는') + ' ' + W.success() + '만' + ' 낼 수 있어요', 'info');
      return;
    }
    K.local.choice = K.local.choice === val ? null : val;
    K.fb('pick');
    applyLocal(scr(), v);
  };

  async function send(btn, name, arg) {
    if (btn) btn.disabled = true;
    K.fb('tap');
    const r = await K.call(name, arg);
    if (r && r.ok !== false) {
      if (btn && (name === 'vote' || name === 'quest')) K.fx.burstAt(btn, { n: 22, speed: 160, life: .9, size: 6 });
    }
    const s = scr(); if (s && K.view) applyLocal(s, K.view);
    return r;
  }
  K.actions['bd-propose'] = (d, btn) => {
    const L = K.local; if (!L.pm || L.pm.mode !== 'multi' || L.picks.length !== L.pm.size) return;
    const team = K.players(K.view).map(p => p.id).filter(id => L.picks.indexOf(id) >= 0);   // seat order
    send(btn, 'propose', team);
  };
  K.actions['bd-vote'] = (d, btn) => { if (K.local.choice == null) return; send(btn, 'vote', !!K.local.choice); };
  K.actions['bd-quest'] = (d, btn) => {
    const v = K.view; const c = K.local.choice; if (c == null) return;
    if (!c && v.me && v.me.team === 'good') return;
    send(btn, 'quest', !!c);
  };
  K.actions['bd-lady'] = (d, btn) => { const id = (K.local.picks || [])[0]; if (id) send(btn, 'lady', id); };
  K.actions['bd-assassin'] = async (d, btn) => {
    const id = (K.local.picks || [])[0]; if (!id) return;
    const raw = K.pname(K.view, id); const name = K.esc(raw);
    const ok = await K.confirm(raw + '님을 ' + W.assassinate() + '할까요?', '<b>' + name + '</b>님이 ' + K.esc(jo(K.roleName('merlin') || '선지자', '이', '가')) + ' 맞다면 ' + K.esc(jo(K.teamName('evil'), '이', '가')) + ' 승리해요.<br>한 번 정하면 되돌릴 수 없어요.', { ok: W.assassinate() + '하기', danger: true });
    if (!ok) return;
    send(btn, 'assassinate', id);
  };
})();


/* ---- src/50-end.js ---- */
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

