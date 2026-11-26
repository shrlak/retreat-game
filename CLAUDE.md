# retreat-game (빛의 원정대)

Church-retreat hidden-role social deduction game for phones. Original game; mechanics follow the classic hidden-role team-quest format. Do not use the commercial game's title, logo, card art or rulebook text.

Read `CONTRACT.md` first (architecture, API, view shape, role keys, asset list), then `HANDOFF.md` (status and what's next).

## Layout
- `index.html` — page shell at repo root (GitHub Pages serves `main` root).
- `web/` — `config.js` (THEME: all names/texts; BACKEND URLs), `net.js` (API + realtime), `app.js` (glue), `dev-ui.js` (plain fallback UI; force with `?dev=1`).
- `ui/` — the real screens and animations (`window.UI`).
- `assets/` — original SVG art. `guide/` — Korean rules/tutorial text (`window.GUIDE`).
- `server/engine.js` — pure rules engine (Node + Deno). `server/index.ts` — Supabase Edge Function `mist-game`.
- `tests/` — node tests and bot harness.

## Run / test
- Engine tests: `node --test tests/` (and `node tests/run-matrix.mjs` if present).
- Local page: `npx serve .` then open `http://localhost:3000/?dev=1`. It talks to the live backend.

## Deploy
- Frontend: push to `main`; GitHub Pages publishes the repo root.
- Backend: Supabase project `datihyxdmpshreyifvzn` (Spencer's "health-dashboard" project, shared on the free plan). Function `mist-game` (verify_jwt off; the function checks per-player tokens). Deploy with Supabase CLI: copy `server/index.ts` and `server/engine.js` into `supabase/functions/mist-game/` and run `supabase functions deploy mist-game --no-verify-jwt --project-ref datihyxdmpshreyifvzn`, or with the Supabase MCP `deploy_edge_function` (files: index.ts + engine.js).
- DB: table `public.mist_rooms(code pk, state jsonb, v int, updated_at)`, RLS on with no policies. Only the function's service role touches it.

## Rules for agents
- Never leak roles to clients: all secrets stay in `state.game.roleOf`; clients only get `viewFor()`.
- Keep role keys fixed; rename only in `web/config.js`.
- Mobile first, Korean UI, sound off by default.
