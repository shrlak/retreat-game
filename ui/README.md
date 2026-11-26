# ui/ — 빛의 원정대 화면과 애니메이션

`window.UI` per CONTRACT.md. Load `ui/ui.css` and `ui/ui.js` (index.html already does).

## Files
- `ui.css` — all shared styles (prefix `ux-`). Mobile first, no backdrop-filter/blur, animations use transform/opacity only, `prefers-reduced-motion` respected.
- `ui.js` — **generated**. Edit `src/*.js`, then run `node ui/build.js` (plain concatenation + syntax check, no deps).
- `src/00-core.js` kit, render pipeline, event detection (new `lastVote.seq` / `lastQuest.seq` / `lastLady.seq` / phase changes → cinematics), particles, sound (off by default), haptics, toasts, sheets, connection banner.
- `src/01-i18n.js` Korean/English: `K.L(ko,en)`, `K.setLang`, language pill on home (stored in localStorage `mist.lang`), English theme overlay from `THEME.i18n.en`, English guide via `GUIDE.build(theme, lang)`, Korean→English map for server/engine messages. English-only size tweaks live under `html.ux-en`.
- `src/10-common.js` my-role sheet, history sheet, guide (1분 설명서 / 전체 규칙 / 튜토리얼 from `guide/guide.js`, fallback text if missing).
- `src/20-home.js` home: create room, join by code (`?code=` prefill), guide. `src/21-lobby.js` lobby. `src/22-reveal.js` card flip + night info. `src/30-board.js` propose/vote/quest/lady/assassin. `src/40-cine.js` cinematics. `src/50-end.js` results.
- `src/KIT.md` internal kit reference for anyone editing the parts.
- `dev.html` + `dev/mock.js` + `dev/theme-fallback.js` — standalone harness: real UI against an in-browser mock server with bots (`ui/dev.html?auto=1&n=7`, DEV button bottom-left). Not linked from index.html; don't deploy-link it.

## Integration notes
- `UI.init(root, api, THEME, extra)` — `extra` may be `window.GUIDE` (what app.js passes) or `{assetBase, guide}`.
- `UI.render(null, {code})` prefills the join code.
- Optional extra: `UI.setConnection('online'|'offline'|'reconnecting')` shows/hides a reconnect banner. Without it the UI still shows a banner when the browser goes offline or an api call returns `{offline:true}`.
- Uses api extras from app.js when present: `skipReveal` (host, reveal phase), `home` (end screen "처음 화면으로").
- Asset paths: `./assets/...` by default; missing files fall back to generated placeholders.
- Privacy: no role/team on persistent chrome; knowledge marks on the table are hidden until the eye toggle; quest buttons look the same for everyone.

## Expansions
- Lobby host toggles: Lady of the Lake, Scroll of the Word (Excalibur), Crossroads (Lancelot) Off / Variant 1 / 2 / 3.
- Variant 2 forced play: both quest buttons look the same for everyone; tapping the side you can't play shakes and shows a private toast, so neighbours can't read sides from a disabled button.
- Variant 2 cinematics play only for a Sides switch from mission 2 on; the plan is shown on reveal and on the board.
