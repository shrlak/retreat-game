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
- Edge function deployed (v2+), table created with RLS.
- web/config.js (names), web/net.js (API, realtime, rejoin via saved token or same name), web/app.js, web/dev-ui.js (plain fallback UI).

## In progress (parallel helpers)
- `assets/` original SVG card art (helper thread).
- `ui/` real screens + animations (helper thread) — must expose `window.UI` per CONTRACT.md.
- `tests/` rules checklist + bot harness (helper thread).
- `guide/guide.js` Korean rules/tutorial (helper thread).

## Next, in priority order
1. Integrate `ui/` once delivered; make sure index.html loads all its scripts.
2. End-to-end test with 5–10 simulated players against the live function (browser tabs or tests/transport-http).
3. Polish: vote reveal, quest card shuffle, role card flip, win/lose screens, sound toggle.
4. QR code / share link for room code (`?code=XXXXX` already prefills join).

## Open decisions
- Role names: church-retreat names in `web/config.js` (Spencer asked for church-themed names; current set is a first pick).
- Hosting: Supabase (free, in existing project "health-dashboard") + GitHub Pages. Cloudflare not possible from the cloud session (connector can't deploy Workers).

## Snapshot (2026-11-26 09:05 UTC)
```
CLAUDE.md
CONTRACT.md
HANDOFF.md
assets/STYLE.md
assets/_src/__pycache__/lib.cpython-313.pyc
assets/_src/build_manifest.py
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
assets/card-back.svg
assets/icons/check.svg
assets/icons/clock.svg
assets/icons/copy.svg
assets/icons/dove.svg
assets/icons/exit.svg
assets/icons/eye-off.svg
assets/icons/eye.svg
assets/icons/flag.svg
assets/icons/help.svg
assets/icons/home.svg
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
assets/roles/assassin.svg
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
assets/vote-approve.svg
assets/vote-reject.svg
guide/README.md
guide/build.mjs
guide/content.mjs
guide/guide.js
guide/guide.json
guide/guide.ko.json
guide/host-guide.md
guide/rules.md
index.html
server/engine.js
server/handler.js
server/index.ts
sync.sh
tests/RULES_CHECKLIST.md
tests/concurrency.test.mjs
tests/e2e.html
tests/engine.rules.test.mjs
tests/lib/harness.mjs
tests/lib/oracle.mjs
tests/lib/transport-http.mjs
tests/lib/transport-local.mjs
tests/lib/transport-occ.mjs
tests/live.html
tests/mutation-check.mjs
tests/perf.mjs
tests/run-matrix.mjs
ui/build.js
ui/dev.html
ui/dev/mock.js
ui/dev/theme-fallback.js
ui/src/00-core.js
ui/src/10-common.js
ui/src/20-home.js
ui/src/KIT.md
ui/ui.css
web/app.js
web/config.js
web/dev-ui.js
web/net.js
```
