// Proves the harness catches real rule bugs: copies server/engine.js, plants one bug at a time,
// and runs a small matrix against each mutant. Every mutant must be caught.
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runMatrix } from "./run-matrix.mjs";

const src = readFileSync(new URL("../server/engine.js", import.meta.url), "utf8");
const MUTANTS = {
  "merlin sees mordred": [`teamOf(r) === "evil" && r !== "mordred") me.knowledge`, `teamOf(r) === "evil") me.knowledge`],
  "oberon sees evil": [`const blindEvil = myRole === "oberon" ||`, `const blindEvil = myRole === "__none__" ||`],
  "no 2-fail quest at 7": [`n >= 7 ? 2 : 1`, `n >= 8 ? 2 : 1`],
  "hammer at 4": [`g.proposalNo >= 5`, `g.proposalNo >= 4`],
  "tie approves": [`yes * 2 > state.players.length`, `yes * 2 >= state.players.length`],
  "leader stuck on reject": [`g.proposal = null;\n              nextLeader(state);`, `g.proposal = null;`],
  "lady on previous holder": [`if (g.ladyUsedBy.includes(t.id)) return err`, `if (false) return err`],
  "revealed leaks early": [`revealed: ended ? { ...g.roleOf } : null`, `revealed: { ...g.roleOf }`],
  "good may fail": [`if (curTeam(g, me.id) === "good" && !success) return err`, `if (false) return err`],
  "percival misses morgana": [`(r === "merlin" || r === "morgana")`, `(r === "merlin")`],
  "6p wrong sizes": [`6: [2, 3, 4, 3, 4]`, `6: [2, 3, 3, 4, 4]`],
  "10p 3 evil": [`10: 4 }`, `10: 3 }`],
  // expansions (Lancelot / Excalibur)
  "quest rule ignores switch": [`if (curTeam(g, me.id) === "good" && !success) return err`, `if (teamOf(g.roleOf[me.id]) === "good" && !success) return err`],
  "switch never flips": [`g.allegiance[id] = g.allegiance[id] === "good" ? "evil" : "good";`, `g.allegiance[id] = g.allegiance[id];`],
  "evil lancelot hidden from evil": [`teamOf(r) === "evil" && r !== "oberon")\n      me.knowledge`, `teamOf(r) === "evil" && r !== "oberon" && r !== "lancelotEvil")\n      me.knowledge`],
  "evil lancelot sees evil": [`const blindEvil = myRole === "oberon" || myRole === "lancelotEvil";`, `const blindEvil = myRole === "oberon";`],
  "v2 lancelot free choice": [`if (g.lancelot === 2 && isLancelot(g.roleOf[me.id])) {`, `if (false) {`],
  "v2 plan ignored": [`else if (g.lancelot === 2 && g.loyaltyPlan && g.loyaltyPlan[g.round]) card = g.loyaltyPlan[g.round];`, `else if (g.lancelot === 2 && g.loyaltyPlan && g.loyaltyPlan[g.round]) card = "none";`],
  "v1 deck from round 2": [`if (g.lancelot === 1 && g.round >= 2 && g.loyaltyDeck.length)`, `if (g.lancelot === 1 && g.round >= 1 && g.loyaltyDeck.length)`],
  "v3 lancelots blind": [`if (g.lancelot === 3 && (myRole`, `if (g.lancelot === 4 && (myRole`],
  "lady shows start team": [`team: curTeam(g, t.id) }`, `team: teamOf(g.roleOf[t.id]) }`],
  "leader keeps excalibur": [`|| excaliburTo === me.id)`, `)`],
  "excalibur on self": [`if (targetId === me.id || !g.proposal.team.includes(targetId))`, `if (!g.proposal.team.includes(targetId))`],
  "excalibur doesn't flip": [`g.questCards[targetId] = !original;`, `g.questCards[targetId] = original;`],
  "excalibur shows wrong original": [`({ round: g.round, targetId, original })`, `({ round: g.round, targetId, original: !original })`],
  "anyone uses excalibur": [`if (g.proposal.excaliburTo !== me.id) return err`, `if (false) return err`],
  "excalibur results leak": [`me.excaliburResults = ((g.excaliburResults || {})[meP.id] || []).slice();`, `me.excaliburResults = Object.values(g.excaliburResults || {}).flat();`],
  "final teams leak early": [`finalTeams: ended ? Object.fromEntries`, `finalTeams: true ? Object.fromEntries`],
};
const dir = mkdtempSync(join(tmpdir(), "mut-"));
// the engine imports its sibling message table
copyFileSync(new URL("../server/messages.js", import.meta.url), join(dir, "messages.js"));
let missed = 0;
for (const [name, [from, to]] of Object.entries(MUTANTS)) {
  if (!src.includes(from)) { console.log(`?? ${name}: pattern not found (engine changed) — update mutant`); missed++; continue; }
  const f = join(dir, name.replace(/\W+/g, "_") + ".mjs");
  writeFileSync(f, src.replace(from, to));
  const engine = await import(f);
  const { findings, stats } = await runMatrix({ games: 1, quiet: true, engine });
  const real = findings.filter((x) => !x.id.startsWith("H3"));
  const caught = real.length > 0 || stats.wrongRefusals.length > 0;
  console.log(`${caught ? "caught" : "MISSED"}  ${name}${caught ? "  ← " + real.map((x) => x.id).join(",") : ""}`);
  if (!caught) missed++;
}
process.exitCode = missed ? 1 : 0;
