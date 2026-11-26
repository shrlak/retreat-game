// Proves the harness catches real rule bugs: copies server/engine.js, plants one bug at a time,
// and runs a small matrix against each mutant. Every mutant must be caught.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runMatrix } from "./run-matrix.mjs";

const src = readFileSync(new URL("../server/engine.js", import.meta.url), "utf8");
const MUTANTS = {
  "merlin sees mordred": [`teamOf(r) === "evil" && r !== "mordred") me.knowledge`, `teamOf(r) === "evil") me.knowledge`],
  "oberon sees evil": [`myRole !== "oberon" && teamOf(r)`, `teamOf(r)`],
  "no 2-fail quest at 7": [`n >= 7 ? 2 : 1`, `n >= 8 ? 2 : 1`],
  "hammer at 4": [`g.proposalNo >= 5`, `g.proposalNo >= 4`],
  "tie approves": [`yes * 2 > state.players.length`, `yes * 2 >= state.players.length`],
  "leader stuck on reject": [`g.proposal = null;\n              nextLeader(state);`, `g.proposal = null;`],
  "lady on previous holder": [`if (g.ladyUsedBy.includes(t.id)) return err`, `if (false) return err`],
  "revealed leaks early": [`revealed: ended ? { ...g.roleOf } : null`, `revealed: { ...g.roleOf }`],
  "good may fail": [`if (teamOf(g.roleOf[me.id]) === "good" && !success) return err`, `if (false) return err`],
  "percival misses morgana": [`(r === "merlin" || r === "morgana")`, `(r === "merlin")`],
  "6p wrong sizes": [`6: [2, 3, 4, 3, 4]`, `6: [2, 3, 3, 4, 4]`],
  "10p 3 evil": [`10: 4 }`, `10: 3 }`],
};
const dir = mkdtempSync(join(tmpdir(), "mut-"));
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
