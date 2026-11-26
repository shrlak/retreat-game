# UI internal kit (for files in ui/src/)

`ui/ui.js` is generated: `node ui/build.js` concatenates `ui/src/*.js` in name order. Each part is a classic-script IIFE:

```js
(function () { 'use strict'; const K = window.UI._k; /* ... */ })();
```

00-core.js defines everything below. Parts never touch the DOM outside their screen element / overlay, never call `api` directly (use `K.call`), and never hard-code role/term names (use the theme helpers).

## Registering
- `K.screens.<name> = { build(v, K) -> HTMLElement, update(v, K, el) }` — screens: `home` (v=null), `lobby`, `reveal`, `board` (phases propose/vote/quest/lady/assassin), `end`. `build` returns one root element (core adds class `ux-screen`). `update` is called on EVERY new view (polls every 4 s), so it must be idempotent: use `K.patch(el, html)` (replaces innerHTML only when the html string changed) and `K.patchList(box, [{key, html}])` (keyed children; new keys get class `fresh`).
- `K.cine.<type> = async (ctx, ev, v, K)` — full-screen cinematics, played in order before the screen re-renders. Types: `deal` (lobby→reveal), `vote` (`ev.d` = view.lastVote), `quest` (`ev.d` = view.lastQuest), `lady` (`ev.d` = lastLady, `ev.result` = `{targetId, team}` only if I was the holder), `begin` (reveal→first propose), `assassin` (entered assassin phase), `end` (entered end). `ctx.inner` is the centered container, `ctx.set(html)`, `await ctx.sleep(ms)` (resolves instantly once skipped), `await ctx.tapOrWait(ms)`, `ctx.skipped`. Return when done; core fades the overlay out.
- `K.actions.<name> = (dataset, el, event) => {}` — any element with `data-act="<name>"` (plus `data-*` params) triggers it via one delegated click handler. Name actions with a prefix per part (`bd-…`, `cn-…`) to avoid clashes.

## State
- `K.view` latest view, `K.local` per-screen scratch object (reset on screen change), `K.rerender()` re-runs the current screen's update with K.view (call after changing K.local).
- `await K.call('vote', true)` → calls the contract api method; shows the server's Korean error as a toast; returns `{ok, ...}`. `K.busy('vote')`.

## Theme / data helpers
`K.term(key, fallback)` (quest 사명, leader 조장, success 축복, fail 방해, approve 찬성, reject 반대, lady 등불, assassinate), `K.teamName('good'|'evil')`, `K.teamOf(roleKey)`, `K.roleName(key)`, `K.roleDesc(key)`, `K.knowText(tag)`.
`K.players(v)` (seat order), `K.player(v,id)`, `K.pname(v,id)`, `K.isMe(v,id)`, `K.knowOf(v,id)` → tags I know about that player, `K.ladyOf(v,id)` → team I learned with the lamp or null, `K.teamSize(v)` current quest size, `K.questFails(v,i)`, `K.sizes(v)`.

## Markup helpers (return HTML strings)
`K.esc(s)` (ALWAYS escape names), `K.avatar(player, withOnlineDot)`, `K.roleImg(key, cls)`, `K.backImg(cls)`, `K.tokenImg('success'|'fail'|'approve'|'reject'|'leader'|'lady', cls)` — images fall back to generated placeholders automatically. `K.soundBtn()`.

## Feedback
`K.fb(name)` = sound + haptic; names: tap, pick, flip, chime, good, evil, tick, drum, whoosh, win, lose. `K.sfx(name)`, `K.buzz(name)`.
`K.fx.burst(x, y, {n, colors, speed, life, size, gravity, lift})`, `K.fx.burstAt(el, opts)`, `K.fx.rain('good'|'evil', secs)`, `K.flash('good'|'evil')`, `K.shake(el)`.
`K.toast(msg, 'info'?)`, `K.sheet(html)` → bottom sheet (`data-close` closes; returns el with `.close()`), `await K.confirm(title, bodyHtml, {ok, cancel, danger})` → bool.
Utilities: `K.el(html)`, `K.$`, `K.$$`, `K.sleep`, `K.shuffle`, `K.reduced()` (prefers-reduced-motion), `K.store.get/set` (localStorage, prefixed).

## CSS
All classes live in `ui/ui.css` (prefix `ux-`). Useful existing ones: panels `ux-panel`, buttons `ux-btn ux-btn-gold|ghost|evil|ok|sm`, `ux-top`, `ux-icon-btn`, `ux-chip`, `ux-h2`, `ux-p`, `ux-action-title`, `ux-action-sub`, `ux-waiting`, `ux-dots` (`<span class="ux-dots"><i></i><i></i><i></i></span>`), `ux-progress` (`<div class="ux-progress"><i style="width:40%"></i></div>`), track `ux-track`/`ux-quest` (+`current|success|fail|just`, `.sz`, `.two`), rejects `ux-rejects`/`ux-rej` (+`on|last`), table `ux-table`/`ux-seat` (+`selectable|selected|evil-pick|on-team|is-me|disabled`, children `.meta .sub .icons .check .knowtag`), `ux-team-row`/`ux-team-chip`, choices `ux-choices`/`ux-choice` (+`approve|reject|success|fail|picked|dim`, `.ic`, `.lock`), cinematics `ux-cine-title`, `ux-cine-sub`, `ux-banner good|evil`, `ux-vote-grid`/`ux-vcard` (+`flip|lead`, `.c .f.yes|.f.no .b .n`), `ux-tally .y .x`, `ux-pile`/`ux-qcard` (+`flip|shuffle`, `.c .f.ok|.f.bad .b`), `ux-lamp-big`, `ux-lady-result`, `ux-assassin-veil`, `ux-target-ring`, `ux-flash`. If a part needs new CSS, put it in a `<style>` injected once by that part (prefix the classes with the part's prefix), so ui.css stays single-owner.

## Privacy rules (a phone is seen by neighbours)
Never tint the whole screen or show my role/team on persistent chrome during play. Knowledge marks on other players respect `K.store.get('showMarks', false)` (eye toggle). After I play a quest card, show only "제출 완료", never which card.
