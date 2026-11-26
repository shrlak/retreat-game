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
