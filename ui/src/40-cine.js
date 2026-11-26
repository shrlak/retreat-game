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
