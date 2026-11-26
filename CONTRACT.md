# 빛의 원정대 (church-retreat hidden-role game) — build contract

Owner/integrator: the main thread. Everyone builds against this file. Need a change? Ask the integrator; don't edit this file.

## Stack
- **Frontend**: static, no build step. Plain HTML + CSS + vanilla JS (ES2020, classic `<script>` tags, no modules, no frameworks). Mobile-first (360–430px wide), Korean UI. Hosted on GitHub Pages.
- **Backend**: one Supabase Edge Function `mist-game` (Deno). It is the only authority. State lives in Postgres table `public.mist_rooms` (RLS on, no policies → only the function can read it). Clients never see other players' roles.
- **Realtime**: after any change the function broadcasts on Supabase Realtime channel `mist:<CODE>` event `update` payload `{v}`. Clients listen and then call `state`. Clients also poll `state` every 4 s as a fallback (this also marks them online).
- **Rules engine**: `server/engine.js`, pure JS ESM, no deps, runs in Deno and Node (`node --test`). Same file is deployed with the function.

## Folder layout (`/mnt/project-files/avalon-game/`)
```
CONTRACT.md
server/engine.js      rules engine (pure)
server/index.ts       edge function handler
index.html            page shell (repo root); loads files below in this order
web/config.js         THEME: all names/texts/role art paths (swap names here only)
web/net.js            window.Net: API + realtime + local token storage
ui/ui.css, ui/ui.js   window.UI: all screens + animations
assets/               SVG art (see Assets)
web/app.js            glue: Net -> UI
tests/                node tests + bot harness
```
Deployed site root = repo root (GitHub Pages from `main`), so paths are `./web/config.js`, `./ui/ui.js`, `./assets/roles/merlin.svg`, `./guide/guide.js`. All paths relative, no leading slash.

## Role keys (fixed) and church-theme names (in `web/config.js`)
| key | original-style role | 이름 | team |
|---|---|---|---|
| `merlin` | seer | 선지자 | good |
| `percival` | seer's protector | 파수꾼 | good |
| `servant` | loyal good | 빛의 일꾼 | good |
| `assassin` | assassin | 정탐꾼 | evil |
| `morgana` | false seer | 거짓 선지자 | evil |
| `mordred` | hidden leader | 양의 탈을 쓴 늑대 | evil |
| `oberon` | lone evil | 방황하는 자 | evil |
| `minion` | evil | 유혹하는 자 | evil |
Token `lady` (lady of the lake) = **등불**. Teams: `good` = 빛의 일꾼들, `evil` = 유혹의 무리. Quest = 사명, leader = 조장, success card = 축복, fail card = 방해, approve = 찬성, reject = 반대.

`THEME` shape (config.js):
```js
window.THEME = {
  title, subtitle,
  teams: { good: {name, color}, evil: {name, color} },
  roles: { merlin: {name, short, desc, art: "./assets/roles/merlin.svg"}, ... all 8 keys },
  terms: { quest, leader, success, fail, approve, reject, lady, assassinate, ... },
  knowledgeText: { evil: "...", merlinCandidate: "...", ... }  // labels for me.knowledge tags
}
```

## Rules (server enforces)
- Players 5–10. Evil count: 5→2, 6→2, 7→3, 8→3, 9→3, 10→4.
- Team sizes per quest: 5:[2,3,2,3,3] 6:[2,3,4,3,4] 7:[2,3,3,4,4] 8–10:[3,4,4,5,5]. Quest 4 (index 3) needs 2 fails when 7+ players.
- Roles random. Host toggles optional roles; rest filled with servant/minion. Merlin ⇒ an assassination at the end (Assassin if enabled, else a random evil holds it).
- Knowledge: merlin sees all evil except mordred (tag `evil`). percival sees merlin+morgana (tag `merlinCandidate`). Evil except oberon see each other (tag `evil`, plus their role isn't shown). oberon sees nobody and is unseen by evil. 
- Leader rotates clockwise each proposal. 5 rejected proposals in one round → evil wins.
- Vote: all players vote approve/reject simultaneously; majority (strictly more than half) approves.
- Quest: team members play secretly; good can only play success.
- Lady (등불), optional: holder starts at the player right of first leader. After quests 2,3,4 resolve (and game not over), holder inspects one player who hasn't held it; holder privately learns that player's team; token passes to them.
- 3 successes → if merlin in game: assassination phase (assassin picks; hitting merlin → evil wins) else good wins. 3 fails → evil wins.

## Client → server API
`POST {FN_URL}` with JSON `{action, code?, playerId?, token?, ...params}`. Headers: `apikey` and `Authorization: Bearer <anon>` and `content-type: application/json`.
Response: `{ok:true, view, playerId?, token?, code?}` or `{ok:false, error:"한국어 메시지"}`.

| action | params | who / when |
|---|---|---|
| `create` | `name` | anyone → new room, caller is host |
| `join` | `code, name` (+`token` if rejoining) | lobby: new seat; in game: rejoin by token, or by exact name |
| `state` | — | anyone in room |
| `ready` | `ready:bool` | lobby |
| `settings` | `settings` (partial) | host, lobby |
| `kick` | `targetId` | host, lobby |
| `start` | — | host, lobby, 5–10 players, everyone ready |
| `ack` | — | phase `reveal` (I've seen my card) |
| `propose` | `team:[playerId]` | leader, phase `propose` |
| `vote` | `approve:bool` | phase `vote` |
| `quest` | `success:bool` | team member, phase `quest` |
| `lady` | `targetId` | holder, phase `lady` |
| `assassinate` | `targetId` | assassin holder, phase `assassin` |
| `restart` | — | host, phase `end` → back to lobby (same players, ready reset) |
| `leave` | — | lobby only |

`settings`: `{ roles: {percival, morgana, mordred, oberon, assassin, merlin: bool}, lady: bool, balance: bool, maxPlayers: 5..10 }`. `balance` = alternate team sizes: 5p [3,2,3,2,3], 7p [2,3,4,3,4].

## View (what a client receives — only its own secrets)
```js
{
  code, v,                       // v = state version
  phase: "lobby"|"reveal"|"propose"|"vote"|"quest"|"lady"|"assassin"|"end",
  me: { id, name, isHost, ready, seat,
        role: "merlin"|... (null in lobby), team: "good"|"evil"|null,
        knowledge: [{ id, tag: "evil"|"merlinCandidate" }],
        acked, myVote: true|false|null, myQuestPlayed: bool,
        ladyResults: [{ targetId, team }] },          // only what I learned
  players: [{ id, name, seat, isHost, ready, online, acked }],   // seat order = table order
  settings, playerCount, evilCount, teamSizes:[5], failsNeeded:[5],
  rolesInGame: ["merlin","percival","servant",...],   // multiset, public (as in the board game)
  round,            // 0..4 current quest index
  proposalNo,       // 1..5 within the round
  leaderId, ladyHolderId, ladyUsedBy:[ids],
  quests: [{ size, failsNeeded, result: null|"success"|"fail", team:[ids], fails:null|n }],
  proposal: { team:[ids] } | null,
  votedIds: [ids],                      // who has voted this proposal (not how)
  questPlayedIds: [ids],
  lastVote: { seq, round, proposalNo, leaderId, team, votes:{id:bool}, approved } | null,
  lastQuest: { seq, round, team, successes, fails, result } | null,
  lastLady: { seq, holderId, targetId } | null,     // public: who inspected whom
  voteHistory: [ lastVote-like entries ],
  winner: null|"good"|"evil", winReason: null|"quests"|"assassinFailed"|"assassinHit"|"rejections"|"fails",
  assassinId: id|null (only at phase assassin/end), assassinTargetId,
  revealed: { [id]: role } | null       // only at phase end
}
```
UI detects transitions itself: new `lastVote.seq` → vote reveal animation, new `lastQuest.seq` → card shuffle reveal, phase change → screen transition.

## window.Net (web/net.js)
`Net.create(name)`, `Net.join(code,name)`, `Net.act(action, params)`, `Net.onView(cb)`, `Net.resume()` (rejoin from localStorage), `Net.leave()`. All return `Promise<{ok, error?, view?}>`.

## window.UI (ui/ui.js)
```js
UI.init(rootEl, api, THEME)   // api = { create(name), join(code,name), ready(b), settings(s), kick(id), start(), ack(),
                              //         propose(ids), vote(b), quest(b), lady(id), assassinate(id), restart(), leave() }
UI.render(view|null)          // null = home screen (create / join by code). Called on every new view.
UI.toast(msg)                 // errors
```
UI must never assume more than the view shows. Sound: optional, off by default (toggle).

## Assets (`assets/`, all SVG, original art, warm church-retreat style: candles, lamps, hills, dawn light, doves, sheep; no violence)
- `roles/<key>.svg` for the 8 keys — card front art, viewBox `0 0 600 840`, no text baked in
- `card-back.svg` (0 0 600 840), `token-success.svg`, `token-fail.svg`, `vote-approve.svg`, `vote-reject.svg`, `leader.svg`, `lady.svg` (all 0 0 200 200), `bg-pattern.svg` (tileable).

## Engine API (server/engine.js, ESM) — for tests
```js
import * as E from "../server/engine.js";
const { state, player } = E.createState(code, hostName, { now, rng });   // player = {id, token, name, seat, ready}
E.joinPlayer(state, name, token?, { now, rng })   // → {player} | {error}; mutates state
E.applyAction(state, { action, playerId, ...params }, { now, rng })  // → {} | {error}; mutates state, bumps state.v
E.viewFor(state, playerId, now)                   // → view (shape above)
// constants: E.EVIL_COUNT, E.TEAM_SIZES, E.failsNeeded(n), E.teamOf(role), E.buildRoles(n, settings)
```
Extra host action: `skipReveal` (phase reveal → propose without waiting for every ack).
Lobby view also has `rolesInGame` (preview of the role set for current count, or null) and `setupError` (why start would fail with current settings).
Settings dependency: turning `merlin` off also turns off `percival` and `assassin`; `merlin` on forces `assassin` on.
The host counts as ready (`ready:true` always).

## Guide content (`guide/guide.js`, written by the guide helper)
Classic script, defines one global, plain strings only (no HTML; UI sets textContent; `\n` = new paragraph):
```js
window.GUIDE = {
  rulesSummary: [{ title, body }],                    // short rules pages, in order
  roles: { merlin: { tip, howToWin }, ... 8 keys },    // shown on my role card back / help
  phaseHints: { lobby, reveal, propose_leader, propose_other, vote, quest_member, quest_other, lady_holder, lady_other, assassin_assassin, assassin_other, end },
  tutorial: [{ title, body }],                         // first-time walkthrough, 4–8 steps
  hostGuide: [{ title, body }],                        // how to run it at a retreat
  recommendedSetups: { 5: {roles:{...settings.roles}, lady:false, note}, ... 10 }
};
```
Loaded after config.js; UI must work if `window.GUIDE` is missing.
Deployed path: `./guide/guide.js`.
