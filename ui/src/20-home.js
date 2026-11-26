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
      const lang = K.lang;
      const el = K.el('<section class="uxh">' +
        '<div class="uxh-lang uxh-fade" role="group" aria-label="Language / 언어" style="animation-delay:.2s">' +
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
        '<button class="uxh-guide uxh-fade" data-act="cm-guide" style="animation-delay:.8s"><span class="bk">📖</span><span><b>' + K.L('1분 설명서', '1-minute guide') + '</b><small>' + K.L('처음이라면 여기부터', 'New here? Start here') + '</small></span><span class="ar">›</span></button>' +
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
