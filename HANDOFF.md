# HANDOFF — 빛의 원정대 (retreat-game)

_Last updated: see the bottom "Snapshot" section (regenerated on every push by `sync.sh`)._

## Goal (Spencer's ask)
Phone-based online hidden-role game in the style of the classic team-quest deduction board game, redesigned for church retreats and gatherings, with all the standard rules. Adjustable player count (5–10), anyone creates a room, others join by code, random roles, everyone presses ready, host starts. Flashy, immersive design and animation. Original card illustrations; church-retreat role names.

## Architecture (see CONTRACT.md)
- Static frontend on GitHub Pages (this repo, `main` root). Vanilla JS, no build.
- Supabase Edge Function `mist-game` = only authority; state in `public.mist_rooms`. Realtime broadcast `mist:<CODE>` event `update` + 4 s polling fallback.
- Rules engine `server/engine.js` shared by function and tests.

## Done
- Rules engine: 5–10 players, evil counts, team sizes, quest 4 double-fail for 7+, balance mode (5p/7p alt sizes), optional roles (선지자/파수꾼/거짓 선지자/양의 탈을 쓴 늑대/방황하는 자/정탐꾼), knowledge rules, 5-rejection loss, 등불 (lady) inspections after quests 2–4, assassination endgame, restart. 1,800 simulated games pass invariants.
- Expansions (host toggles): 갈림길의 순례자/그림자 (Good/Evil Lancelot, `settings.lancelot` 1 = quiet, 2 = known), loyalty deck flipped from round 3, current side tracked (`curTeam`); 말씀 두루마리 (Excalibur, `settings.excalibur`, phase `excalibur`). Tests: tests/expansions.test.mjs.
- Secure rejoin: seats bound to the device token; name rejoin only after host `allowRejoin` (2 min, one use). `claimHost` when host offline ≥60 s.
- Synced transitions: engine stamps `phaseSeq/phaseStartedAt/prevPhase/transitionMs/serverNow`; Net estimates server clock (`Net.serverTime()`, `view.serverOffsetMs`).
- Handler: jittered backoff on optimistic-lock retries (14 attempts); realtime broadcast no longer delays the reply (EdgeRuntime.waitUntil).
- Edge function `mist-game` v4 deployed, pinned to commit 5287161 via jsDelivr. Table `mist_rooms` with RLS.
- Korean/English: THEME.i18n.en (all role/team/term/win names in English, Lancelots as Good/Evil Lancelot), server/messages.js (every server message in ko+en, responses carry errorKey/errorParams/errorEn), Net.getLang/setLang/errorText. UI thread builds the language switch on the home screen.
- Favicon, apple-touch icon, site.webmanifest in index.html. README.md (Korean) at repo root.
- web/config.js (names, incl. English names for Lancelot/Excalibur as `en`), web/net.js, web/app.js (api: excalibur, allowRejoin, claimHost, propose(ids, excaliburTo)), web/dev-ui.js covers all phases.

## In progress (parallel helpers)
- `ui/` real screens + animations (UI thread): needs excalibur phase, Lancelot loyalty cards, rejoin/claimHost buttons, synced transitions from phaseStartedAt.
- `tests/` thread: concurrency + handler models.

## Next, in priority order
1. Run tests/e2e.html matrix 5–10 on GitHub Pages incl. expansions; fix anything found.
2. Verify the real UI on the live site with the new view fields.
3. Clean up test leftovers in Supabase: function `mist-admin`, storage bucket `mist-game`.
4. Keep README.md, HANDOFF.md, CLAUDE.md in step with every feature change.

## Open decisions
- Role names: church-retreat names in `web/config.js` (Spencer asked for church-themed names; current set is a first pick).
- Hosting: Supabase (free, in existing project "health-dashboard") + GitHub Pages. Cloudflare not possible from the cloud session (connector can't deploy Workers).

## Snapshot (2026-11-26 09:39 UTC, auto-generated every push)

### Engine tests
```
tests did not run
```
### Helper folders (files, newest change)
- `ui/`: 18 files, newest 2026-11-26 09:40 UTC
- `assets/`: 114 files, newest 2026-11-26 09:25 UTC
- `guide/`: 12 files, newest 2026-11-26 09:40 UTC
- `tests/`: 19 files, newest 2026-11-26 09:40 UTC
- `web/`: 4 files, newest 2026-11-26 09:36 UTC
- `server/`: 4 files, newest 2026-11-26 09:36 UTC
### Recent commits
```
c7068bc Sync progress
b4116f9 Sync progress
62f0a7b Sync progress
fed8261 Auto-sync work in progress (09:32 UTC)
c64a236 Sync progress
5287161 Sync progress
8742f12 Auto-sync work in progress (09:26 UTC)
7140171 Auto-sync work in progress (09:19 UTC)
```
### Files
```
.nojekyll
CLAUDE.md
CONTRACT.md
HANDOFF.md
README.md
assets/STYLE.md
assets/_src/build_expansion.py
assets/_src/build_manifest.py
assets/_src/build_map.py
assets/_src/build_phases.py
assets/_src/build_roles_evil.py
assets/_src/build_roles_good.py
assets/_src/build_scenes.py
assets/_src/build_tokens.py
assets/_src/build_ui.py
assets/_src/lib.py
assets/avatars/avatar-1.svg
assets/avatars/avatar-10.svg
assets/avatars/avatar-2.svg
assets/avatars/avatar-3.svg
assets/avatars/avatar-4.svg
assets/avatars/avatar-5.svg
assets/avatars/avatar-6.svg
assets/avatars/avatar-7.svg
assets/avatars/avatar-8.svg
assets/avatars/avatar-9.svg
assets/backgrounds/game.svg
assets/backgrounds/home.svg
assets/backgrounds/phase-assassin.svg
assets/backgrounds/phase-lady.svg
assets/backgrounds/phase-mission.svg
assets/backgrounds/phase-propose.svg
assets/backgrounds/phase-vote.svg
assets/backgrounds/phase-wait.svg
assets/backgrounds/reveal.svg
assets/backgrounds/victory-evil.svg
assets/backgrounds/victory-good.svg
assets/bg-pattern-overlay.svg
assets/bg-pattern.svg
assets/card-back.svg
assets/excalibur.svg
assets/icons/apple-touch-icon.png
assets/icons/check.svg
assets/icons/clock.svg
assets/icons/copy.svg
assets/icons/dove.svg
assets/icons/exit.svg
assets/icons/eye-off.svg
assets/icons/eye.svg
assets/icons/favicon-16.png
assets/icons/favicon-32.png
assets/icons/favicon.svg
assets/icons/flag.svg
assets/icons/help.svg
assets/icons/home.svg
assets/icons/icon-192.png
assets/icons/icon-512.png
assets/icons/icon-maskable-512.png
assets/icons/info.svg
assets/icons/lamp.svg
assets/icons/olive-branch.svg
assets/icons/play.svg
assets/icons/refresh.svg
assets/icons/scroll.svg
assets/icons/settings.svg
assets/icons/share.svg
assets/icons/sheep.svg
assets/icons/shield.svg
assets/icons/star.svg
assets/icons/user-minus.svg
assets/icons/user-plus.svg
assets/icons/users.svg
assets/icons/volume-off.svg
assets/icons/volume-on.svg
assets/icons/wifi-off.svg
assets/icons/x.svg
assets/knowledge/evil.svg
assets/knowledge/merlin-candidate.svg
assets/knowledge/target.svg
assets/knowledge/unknown.svg
assets/lady.svg
assets/leader.svg
assets/logo-light.svg
assets/logo-mark.svg
assets/logo.svg
assets/loyalty/none.svg
assets/loyalty/switch.svg
assets/manifest.json
assets/map/README.md
assets/map/journey.svg
assets/map/marker.svg
assets/map/route.json
assets/map/stop-current.svg
assets/map/stop-done-evil.svg
assets/map/stop-done-good.svg
assets/preview-expansion.png
assets/preview-sheet.png
assets/preview.html
assets/roles/assassin.svg
assets/roles/lancelotEvil.svg
assets/roles/lancelotGood.svg
assets/roles/merlin.svg
assets/roles/minion.svg
assets/roles/mordred.svg
assets/roles/morgana.svg
assets/roles/oberon.svg
assets/roles/percival.svg
assets/roles/servant.svg
assets/team-evil.svg
assets/team-good.svg
assets/token-fail.svg
assets/token-success.svg
assets/track/quest-board.svg
assets/track/quest-slot.svg
assets/track/two-fails.svg
assets/track/vote-marker.svg
assets/track/vote-track.svg
assets/vote-approve.svg
assets/vote-reject.svg
guide/README.md
guide/build.mjs
guide/content.en.mjs
guide/content.mjs
guide/guide.en.json
guide/guide.js
guide/guide.json
guide/guide.ko.json
guide/host-guide.en.md
guide/host-guide.md
guide/rules.en.md
guide/rules.md
index.html
server/engine.js
server/handler.js
server/index.ts
server/messages.js
site.webmanifest
sync.sh
tests/BUGS.md
tests/README.md
tests/RULES_CHECKLIST.md
tests/concurrency.test.mjs
tests/e2e.html
tests/engine.rules.test.mjs
tests/expansions.test.mjs
tests/handler.test.mjs
tests/lib/harness.mjs
tests/lib/oracle.mjs
tests/lib/transport-handler.mjs
tests/lib/transport-http.mjs
tests/lib/transport-local.mjs
tests/lib/transport-occ.mjs
tests/live.html
tests/mutation-check.mjs
tests/perf.mjs
tests/run-matrix.mjs
tests/stress.mjs
ui/README.md
ui/build.js
ui/dev.html
ui/dev/mock.js
ui/dev/theme-fallback.js
ui/src/00-core.js
ui/src/01-i18n.js
ui/src/10-common.js
ui/src/20-home.js
ui/src/21-lobby.js
ui/src/22-reveal.js
ui/src/30-board.js
ui/src/40-cine.js
ui/src/45-journey.js
ui/src/50-end.js
ui/src/KIT.md
ui/ui.css
ui/ui.js
web/app.js
web/config.js
web/dev-ui.js
web/net.js
```
