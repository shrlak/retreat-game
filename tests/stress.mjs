// Stress run: many full bot games per player count, through the real engine, over every legal setup.
//
//   node tests/stress.mjs                       # 5..10 players, 10,000 games each, parallel
//   node tests/stress.mjs --per-n 20000         # more games per player count
//   node tests/stress.mjs --n 7 --per-n 2000    # one player count
//   node tests/stress.mjs --n 7 --repro 70004321  # replay one failing game by its seed
//
// Setups cycled round-robin per player count (so every setup gets the same share):
//   optional roles (merlin, percival, morgana, mordred, oberon; assassin follows merlin) ×
//   lady on/off × Lancelot off/quiet/known × Excalibur on/off × balance on/off (5 and 7 only),
//   keeping only setups the rules allow.
// Each game draws its own pacing from its seed: approve rate, evil fail rate and how often bots
// try illegal moves (chaos). Every view every bot receives is checked (see lib/harness.mjs).
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { playGame } from "./lib/harness.mjs";
import { allRoleCombos, comboLegal, BALANCE_SIZES } from "./lib/oracle.mjs";
import { localTransport } from "./lib/transport-local.mjs";

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const perN = Number(arg("--per-n", 10000));
const onlyN = arg("--n", null);
const repro = arg("--repro", null);
const worker = args.includes("--worker");

export function setupsFor(n) {
  const out = [];
  for (const roles of allRoleCombos())
    for (const lady of [false, true])
      for (const lancelot of [0, 1, 2])
        for (const excalibur of [false, true])
          for (const balance of BALANCE_SIZES[n] ? [false, true] : [false])
            if (comboLegal(n, roles, lancelot)) out.push({ roles, lady, lancelot, excalibur, balance });
  return out;
}

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function gameFor(n, i) {
  const setups = setupsFor(n);
  const setup = setups[i % setups.length];
  const seed = n * 10_000_000 + i;
  const r = rng(seed ^ 0x9e3779b9);
  return {
    ...setup, n, seed,
    approveProb: [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9][Math.floor(r() * 7)],
    evilFailProb: [0, 0.3, 0.7, 1][Math.floor(r() * 4)],
    chaos: [0, 0.05, 0.15, 0.3][Math.floor(r() * 4)],
  };
}

async function runOne(n, i) {
  const opts = gameFor(n, i);
  const res = await playGame(localTransport({ seed: opts.seed }), opts);
  return { opts, res };
}

async function runWorker(n, from, to) {
  const s = {
    n, games: 0, setups: setupsFor(n).length, refused: 0, winners: {}, reasons: {},
    cover: { hammer: 0, twoFailSaved: 0, twoFailFailed: 0, assassinHit: 0, assassinMiss: 0, ladyUses: 0, switches: 0, lancelotSwitchedGames: 0, balance: 0, lancelot1: 0, lancelot2: 0, excalibur: 0 },
    findings: {}, steps: 0,
  };
  for (let i = from; i < to; i++) {
    const { opts, res } = await runOne(n, i);
    if (res.setupRefused) { s.refused++; (s.findings[`SETUP|legal setup refused: ${res.setupRefused}`] ||= { count: 0, seed: opts.seed, tag: res.tag }).count++; continue; }
    s.games++;
    s.steps += res.steps || 0;
    const { winner, winReason } = res.result || {};
    s.winners[winner] = (s.winners[winner] || 0) + 1;
    s.reasons[winReason] = (s.reasons[winReason] || 0) + 1;
    const e = res.end || {};
    const c = s.cover;
    if (winReason === "rejections") c.hammer++;
    if (winReason === "assassinHit") c.assassinHit++;
    if (winReason === "assassinFailed") c.assassinMiss++;
    const q4 = (e.quests || [])[3];
    if (q4 && q4.failsNeeded === 2 && q4.result && q4.fails === 1) c.twoFailSaved++;
    if (q4 && q4.failsNeeded === 2 && q4.result === "fail") c.twoFailFailed++;
    c.ladyUses += (e.lastLady && e.lastLady.seq) || 0;
    const sw = (e.loyaltyRevealed || []).filter((x) => x.card === "switch").length;
    c.switches += sw; if (sw % 2) c.lancelotSwitchedGames++;
    if (opts.balance) c.balance++;
    if (opts.lancelot === 1) c.lancelot1++;
    if (opts.lancelot === 2) c.lancelot2++;
    if (opts.excalibur) c.excalibur++;
    for (const f of res.findings) {
      const k = `${f.id}|${f.msg}`;
      (s.findings[k] ||= { count: 0, seed: opts.seed, tag: res.tag, extra: f.extra }).count++;
    }
    if (process.send && (i - from) % 500 === 499) process.send({ progress: n, done: i - from + 1 });
  }
  return s;
}

if (worker) {
  const n = Number(arg("--n")), from = Number(arg("--from")), to = Number(arg("--to"));
  const s = await runWorker(n, from, to);
  process.send({ result: s });
  process.exit(0);
} else if (repro) {
  const n = Number(onlyN), seed = Number(repro);
  const i = seed - n * 10_000_000;
  const { opts, res } = await runOne(n, i);
  console.log(res.tag, JSON.stringify({ approveProb: opts.approveProb, evilFailProb: opts.evilFailProb, chaos: opts.chaos }));
  console.log(res.result, res.setupRefused || "");
  for (const f of res.findings) console.log(`[${f.id}] ${f.msg}`, f.extra ? JSON.stringify(f.extra) : "");
  if (!res.findings.length) console.log("no findings");
  process.exitCode = res.findings.length ? 1 : 0;
} else {
  const ns = onlyN ? [Number(onlyN)] : [5, 6, 7, 8, 9, 10];
  const chunks = [];
  const CH = 2500;
  for (const n of ns) for (let f = 0; f < perN; f += CH) chunks.push([n, f, Math.min(perN, f + CH)]);
  const par = Number(arg("--jobs", 4));
  const merged = {};
  const t0 = Date.now();
  const self = fileURLToPath(import.meta.url);
  let next = 0;
  async function lane() {
    while (next < chunks.length) {
      const [n, from, to] = chunks[next++];
      const s = await new Promise((res, rej) => {
        const ch = spawn(process.execPath, [self, "--worker", "--n", n, "--from", from, "--to", to], { stdio: ["ignore", "inherit", "inherit", "ipc"] });
        let out = null;
        ch.on("message", (m) => { if (m.result) out = m.result; });
        ch.on("exit", (code) => (out ? res(out) : rej(new Error(`worker n=${n} ${from}-${to} exited ${code}`))));
      });
      const m = (merged[n] ||= { n, games: 0, setups: s.setups, refused: 0, winners: {}, reasons: {}, cover: {}, findings: {}, steps: 0 });
      m.games += s.games; m.refused += s.refused; m.steps += s.steps;
      for (const k of ["winners", "reasons", "cover"]) for (const [a, b] of Object.entries(s[k])) m[k][a] = (m[k][a] || 0) + b;
      for (const [k, f] of Object.entries(s.findings)) { if (m.findings[k]) m.findings[k].count += f.count; else m.findings[k] = f; }
      process.stderr.write(`  n=${n} games ${from}-${to} done (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
    }
  }
  await Promise.all(Array.from({ length: par }, lane));
  let bad = 0, total = 0;
  for (const n of ns) {
    const m = merged[n];
    total += m.games;
    const pct = (k) => ((100 * (m.winners[k] || 0)) / m.games).toFixed(1);
    console.log(`\n${n} players: ${m.games} games over ${m.setups} setups, good ${pct("good")}% / evil ${pct("evil")}%, avg ${(m.steps / m.games).toFixed(0)} steps`);
    console.log(`  endings: ${Object.entries(m.reasons).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    console.log(`  covered: ${Object.entries(m.cover).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    const fs = Object.entries(m.findings);
    if (!fs.length) console.log("  no rule violations or leaks");
    for (const [k, f] of fs) { bad++; console.log(`  FAIL ${k} ×${f.count}  repro: node tests/stress.mjs --n ${n} --repro ${f.seed}  (${f.tag})`); }
  }
  try {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const dir = new URL("./results/", import.meta.url);
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL(`stress-${perN}.json`, dir), JSON.stringify({ at: new Date().toISOString(), perN, seconds: (Date.now() - t0) / 1000, byN: merged }, null, 1));
  } catch (e) { console.error("could not save results:", e.message); }
  console.log(`\ntotal ${total} games in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${bad ? bad + " kinds of failure" : "0 failures"}`);
  process.exitCode = bad ? 1 : 0;
}
