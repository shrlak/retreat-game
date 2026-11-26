// Usage:
//   node tests/run-matrix.mjs                 # in-process engine (no network)
//   FN_URL=... ANON_KEY=... node tests/run-matrix.mjs --http [--games 2]
// Plays full games for 5..10 players × every legal optional-role combo × lady on/off.
import { playGame } from "./lib/harness.mjs";
import { allRoleCombos, comboLegal } from "./lib/oracle.mjs";
import { localTransport } from "./lib/transport-local.mjs";

const args = process.argv.slice(2);
const http = args.includes("--http");
const games = Number(args[args.indexOf("--games") + 1]) || (http ? 1 : 3);
const only = args.includes("--n") ? [Number(args[args.indexOf("--n") + 1])] : [5, 6, 7, 8, 9, 10];
let transport;
if (http) transport = (await import("./lib/transport-http.mjs")).httpTransport();

export async function runMatrix({ transport: tr, games = 3, ns = [5, 6, 7, 8, 9, 10], quiet = false, engine } = {}) {
  const findings = new Map();
  const stats = { games: 0, refusedSetups: 0, wrongRefusals: [], winners: {}, reasons: {} };
  for (const n of ns) for (const roles of allRoleCombos()) for (const lady of [false, true]) {
    const legal = comboLegal(n, roles);
    for (let g = 0; g < games; g++) {
      const seed = n * 100000 + g * 977 + JSON.stringify(roles).length * 31 + (lady ? 7 : 0) + Object.values(roles).filter(Boolean).length * 13 + (roles.oberon ? 1 : 0) * 3 + (roles.mordred ? 1 : 0) * 5 + (roles.morgana ? 1 : 0) * 11 + (roles.percival ? 1 : 0) * 17;
      // vary pacing so hammer/fails/assassination all happen
      const approveProb = [0.6, 0.25, 0.85][g % 3];
      const t = tr || localTransport({ seed, engine });
      const res = await playGame(t, { n, roles, lady, seed, approveProb, evilFailProb: 0.7 });
      if (res.setupRefused) {
        stats.refusedSetups++;
        if (legal) stats.wrongRefusals.push(`${res.tag}: ${res.setupRefused}`);
        continue;
      }
      if (!legal && comboLegal(n, res.effectiveRoles || roles)) {} else if (!legal) findings.set(`A7|start accepted an illegal combo`, { id: "A7", msg: "start accepted an illegal role combo", tag: res.tag, count: 1 });
      stats.games++;
      if (res.result) {
        stats.winners[res.result.winner] = (stats.winners[res.result.winner] || 0) + 1;
        stats.reasons[res.result.winReason] = (stats.reasons[res.result.winReason] || 0) + 1;
      }
      for (const f of res.findings) {
        const key = `${f.id}|${f.msg}`;
        const cur = findings.get(key);
        if (cur) cur.count++; else findings.set(key, { ...f, count: 1 });
      }
    }
  }
  if (!quiet) {
    console.log(`games played: ${stats.games}, setups refused: ${stats.refusedSetups}`);
    console.log("winners:", stats.winners, "reasons:", stats.reasons);
    if (stats.wrongRefusals.length) console.log("LEGAL setups refused:\n  " + stats.wrongRefusals.slice(0, 10).join("\n  "));
    if (!findings.size) console.log("no rule violations or leaks found");
    for (const f of findings.values()) console.log(`[${f.id}] ${f.msg} ×${f.count}\n    first: ${f.tag}${f.extra ? " " + JSON.stringify(f.extra) : ""}`);
  }
  return { findings: [...findings.values()], stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { findings, stats } = await runMatrix({ transport, games, ns: only });
  process.exitCode = findings.length || stats.wrongRefusals.length ? 1 : 0;
}
