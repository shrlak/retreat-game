# HANDOFF — 빛의 원정대 (retreat-game)

_Last updated by hand with each feature change. Auto status: STATUS.md (rewritten on every push)._

## Goal (Spencer's ask)
Phone-based online hidden-role game in the style of the classic team-quest deduction board game, redesigned for church retreats and gatherings, with all the standard rules. Adjustable player count (5–10), anyone creates a room, others join by code, random roles, everyone presses ready, host starts. Flashy, immersive design and animation. Original card illustrations; church-retreat role names.

## Architecture (see CONTRACT.md)
- Static frontend on GitHub Pages (this repo, `main` root). Vanilla JS, no build.
- Supabase Edge Function `mist-game` = only authority; state in `public.mist_rooms`. Realtime broadcast `mist:<CODE>` event `update` + 4 s polling fallback.
- Rules engine `server/engine.js` shared by function and tests.

## Done
- Rules engine: 5–10 players, evil counts, team sizes, quest 4 double-fail for 7+, balance mode (5p/7p alt sizes), optional roles (선지자/파수꾼/거짓 선지자/양의 탈을 쓴 늑대/방황하는 자/정탐꾼), knowledge rules, 5-rejection loss, 등불 (lady) inspections after quests 2–4, assassination endgame, restart. 1,800 simulated games pass invariants.
- Expansions (host toggles): 갈림길의 순례자/그림자 (Good/Evil Lancelot, `settings.lancelot` 1/2/3 = official rulebook variants 1/2/3, see CONTRACT.md; changed 2026-11-26 10:20 UTC at Spencer's request to match the rulebook), current side tracked (`curTeam`); 말씀 두루마리 (Excalibur, `settings.excalibur`, phase `excalibur`). Tests: tests/expansions.test.mjs.
- Secure rejoin: seats bound to the device token; name rejoin only after host `allowRejoin` (2 min, one use). `claimHost` when host offline ≥60 s.
- Synced transitions: engine stamps `phaseSeq/phaseStartedAt/prevPhase/transitionMs/serverNow`; Net estimates server clock (`Net.serverTime()`, `view.serverOffsetMs`).
- Handler: jittered backoff on optimistic-lock retries (14 attempts); realtime broadcast no longer delays the reply (EdgeRuntime.waitUntil).
- Edge function `mist-game` v7 deployed (2026-11-26 10:21 UTC), pinned to commit 5ac74c6 via jsDelivr. Table `mist_rooms` with RLS.
- Korean/English: THEME.i18n.en (all role/team/term/win names in English, Lancelots as Good/Evil Lancelot), server/messages.js (every server message in ko+en, responses carry errorKey/errorParams/errorEn), Net.getLang/setLang/errorText. UI thread builds the language switch on the home screen.
- Favicon, apple-touch icon, site.webmanifest in index.html. README.md (Korean) at repo root.
- Real-UI check of the core flow on the live backend (2026-11-26, Playwright, 390×844 and 360×740, Korean and English): home, join by code and `?code=`, lobby, full 5p/7p games with the lamp, 5 rejections, assassin, end, restart, two games in one room, auto-resume, `allowRejoin` + new phone, `claimHost`, reduced motion. Fixed in `ui/`: token art paths (success/fail/approve/reject showed emoji placeholders and 404s), the action panel's glow took ~150px of layout above every action, lobby shows the seer dependency (🔒 notes, toasts) and the setup error with the evil roles in use next to the start button, guests are told why ready reset, the lobby dock sticks to the bottom (`.ux-app` uses `overflow: clip`), the 'host away' note stays in view, shorter board top bar texts (propose, assassin).
- web/config.js (names, incl. English names for Lancelot/Excalibur as `en`), web/net.js, web/app.js (api: excalibur, allowRejoin, claimHost, propose(ids, excaliburTo)), web/dev-ui.js covers all phases.

## In progress (parallel helpers)
- `ui/` real screens + animations (UI thread): needs excalibur phase, Lancelot loyalty cards, rejoin/claimHost buttons, synced transitions from phaseStartedAt.
- `tests/` thread: concurrency + handler models.

- Live bot tests on GitHub Pages against function v6 (2026-11-26): base game 5–10 players 12 games 0 fails; expansions (Lancelot 1/2, Excalibur, lady) 5–10 players 16 games 0 fails. One request out of 4,588 hung 160 s (504) earlier → every DB call now has a 5 s deadline, a timed-out write is recognised by `_saveId`, phones abort a tap after 15 s.
- Live bot tests against function v7 (official Lancelot variants 1/2/3, 2026-11-26 10:35 UTC): 7–10 players × 3 games = 12 games, 0 fails, 1,875 calls (covers V2 forced cards and public plan, V3 mutual knowledge, Excalibur, lady, Oberon at 10).
- Final check (2026-11-26 12:05 UTC): all 64 unit tests pass (`node --test tests/*.test.mjs`; concurrency.test.mjs alone takes about 10 minutes). Tests thread: 600k simulated games (100k per player count 5–10), 0 rule violations, 0 role leaks, 0 server errors; 28 of 28 seeded mutations caught; live server 20 bot games clean, tap response typically 0.15 s, worst 0.21 s.
- Auto push: the cloud session pushed with sync.sh every 60 s while it worked; that loop has stopped. In Claude Code, just commit and push to `main` (GitHub Pages serves `gh-pages`, so also `git push -f origin HEAD:gh-pages`, or run `bash sync.sh`).

## Next, in priority order
1. Rerun tests/e2e.html after each server change.
2. Clean up test leftovers in Supabase: function `mist-admin`, storage bucket `mist-game`.
3. Keep README.md, HANDOFF.md, CLAUDE.md in step with every feature change.

## Open decisions
- Role names: church-retreat names in `web/config.js` (Spencer asked for church-themed names; current set is a first pick).
- Hosting: Supabase (free, in existing project "health-dashboard") + GitHub Pages. Cloudflare not possible from the cloud session (connector can't deploy Workers).

Auto status (tests, folder sizes, recent commits, file list) is in STATUS.md, rewritten on every push.
