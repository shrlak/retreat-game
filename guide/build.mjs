// node guide/build.mjs  →  guide.json, guide.ko.json, guide.js, rules.md, host-guide.md
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./content.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// ── 이 함수들은 guide.js 안에도 그대로 들어갑니다 (브라우저 classic script) ──
const RUNTIME = String.raw`
var JOSA = { "은":["은","는"], "이":["이","가"], "을":["을","를"], "과":["과","와"], "으로":["으로","로"],
  "이에요":["이에요","예요"], "이나":["이나","나"], "이면":["이면","면"], "이라고":["이라고","라고"],
  "이지만":["이지만","지만"], "아":["아","야"] };
function lastJong(word) {
  var s = String(word).replace(/[\s)\]"'!?.]+$/, "");
  var c = s.charAt(s.length - 1);
  var code = c.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28;
  var digit = { "0":21, "1":8, "2":0, "3":16, "4":0, "5":0, "6":1, "7":8, "8":8, "9":0 };
  if (c in digit) return digit[c];
  return 0;
}
function josa(word, p) {
  var pair = JOSA[p];
  if (!pair) return String(word) + p;
  var j = lastJong(word);
  var useFirst = p === "으로" ? (j !== 0 && j !== 8) : j !== 0;
  return String(word) + (useFirst ? pair[0] : pair[1]);
}
function format(str, params) {
  if (typeof str !== "string") return str;
  return str.replace(/\{([A-Za-z]+)(?::([가-힣]+))?\}/g, function (m, key, p) {
    if (!params || params[key] == null) return m; // 모르는 자리는 그대로 둠 (실행 중에 채움)
    return p ? josa(params[key], p) : String(params[key]);
  });
}
function fillDeep(v, params) {
  if (typeof v === "string") return format(v, params);
  if (Array.isArray(v)) return v.map(function (x) { return fillDeep(x, params); });
  if (v && typeof v === "object") {
    var o = {};
    for (var k in v) o[k] = fillDeep(v[k], params);
    return o;
  }
  return v;
}
function namesFromTheme(theme, defaults) {
  var n = {};
  for (var k in defaults) n[k] = defaults[k];
  if (!theme) return n;
  if (theme.title) n.title = theme.title;
  if (theme.teams) {
    if (theme.teams.good && theme.teams.good.name) n.good = theme.teams.good.name;
    if (theme.teams.evil && theme.teams.evil.name) n.evil = theme.teams.evil.name;
  }
  if (theme.roles) for (var r in theme.roles) if (theme.roles[r] && theme.roles[r].name) n[r] = theme.roles[r].name;
  if (theme.terms) for (var t in theme.terms) if (typeof theme.terms[t] === "string") n[t] = theme.terms[t];
  return n;
}
`;
// eslint-disable-next-line no-new-func
const rt = new Function(RUNTIME + "; return { josa, format, fillDeep, namesFromTheme };")();

const raw = {
  version: 1,
  defaultNames: C.DEFAULT_NAMES,
  quick: C.quick,
  overview: C.overview,
  roles: C.roles,
  knowledgeLabels: C.knowledgeLabels,
  phaseHints: C.phaseHints,
  alerts: C.alerts,
  tutorial: C.tutorial,
  hostGuide: C.hostGuide,
  presets: C.presets,
  glossary: C.glossary,
  ui: C.ui,
};
const filled = rt.fillDeep(raw, C.DEFAULT_NAMES);

writeFileSync(join(here, "guide.json"), JSON.stringify(raw, null, 2) + "\n");
writeFileSync(join(here, "guide.ko.json"), JSON.stringify(filled, null, 2) + "\n");

const js = `/* 빛의 원정대 설명서 — build.mjs 가 만든 파일입니다. 직접 고치지 말고 content.mjs 를 고치세요. */
(function () {
${RUNTIME}
  var RAW = ${JSON.stringify(raw)};
  window.GUIDE = {
    raw: RAW,
    /** THEME 이름을 넣어 완성된 설명서를 돌려줌. theme 없으면 기본 이름. */
    build: function (theme) {
      var g = fillDeep(RAW, namesFromTheme(theme, RAW.defaultNames));
      g.names = namesFromTheme(theme, RAW.defaultNames);
      return g;
    },
    /** 실행 중 값 채우기: GUIDE.format("{leaderName:이} 고르는 중", {leaderName:"은혜"}) */
    format: format,
    josa: josa,
  };
})();
`;
writeFileSync(join(here, "guide.js"), js);

// ── Markdown (인쇄·공유용) ──
const g = filled;
const md = [];
const list = (a, ordered) => a.map((x, i) => (ordered ? `${i + 1}. ` : "- ") + x).join("\n");

md.push(`# ${g.overview.title}\n\n${g.overview.intro}\n`);
for (const s of g.overview.sections) {
  md.push(`## ${s.heading}\n`);
  if (s.body) md.push(s.body.join("\n\n") + "\n");
  if (s.bullets) md.push(list(s.bullets) + "\n");
  if (s.steps) md.push(s.steps.map((x, i) => `${i + 1}. **${x.title}**: ${x.text}`).join("\n") + "\n");
  if (s.after) md.push(s.after + "\n");
}
const t = g.overview.table;
md.push(`## ${t.heading}\n\n| ${t.columns.join(" | ")} |\n|${t.columns.map(() => "---").join("|")}|\n${t.rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}\n\n${t.note}\n`);
md.push(`## 역할 안내\n`);
for (const [key, r] of Object.entries(g.roles)) {
  md.push(`### ${C.DEFAULT_NAMES[key]} (${r.team === "good" ? g.defaultNames.good : g.defaultNames.evil})\n\n_${r.tagline}_\n\n**아는 것**\n${list(r.know)}\n\n**목표**\n${list(r.goal)}\n\n**팁**\n${list(r.tips)}\n\n**나를 보는 사람**: ${r.seenBy}\n`);
}
md.push(`## 용어\n\n${g.glossary.map((x) => `- **${x.term}**: ${x.text}`).join("\n")}\n`);
writeFileSync(join(here, "rules.md"), md.join("\n"));

const h = g.hostGuide;
const hm = [`# ${h.title}\n\n${h.intro}\n`];
for (const s of h.sections) {
  hm.push(`## ${s.heading}\n`);
  if (s.steps) hm.push(list(s.steps, true) + "\n");
  if (s.bullets) hm.push(list(s.bullets) + "\n");
  if (s.script) hm.push(s.script.map((x) => `> ${x}`).join("\n>\n") + "\n");
  if (s.presetsRef) {
    const rn = (k) => C.DEFAULT_NAMES[k];
    const row = (n) => {
      const p = g.presets.standard.byCount[n];
      const on = Object.entries(p.roles).filter(([, v]) => v).map(([k]) => rn(k));
      return `| ${n}명 | ${on.join(", ")} | ${p.lady ? "켬" : "끔"} |`;
    };
    hm.push(`**기본 추천 구성**\n\n| 인원 | 켤 역할 | ${g.defaultNames.lady} |\n|---|---|---|\n${[5, 6, 7, 8, 9, 10].map(row).join("\n")}\n`);
  }
  if (s.reflection) hm.push(`### ${s.reflection.heading}\n\n${list(s.reflection.questions)}\n`);
}
hm.push(`## 한 장 요약 (${g.quick.title})\n`);
for (const p of g.quick.pages) {
  hm.push(`### ${p.heading}\n`);
  if (p.lines) hm.push(list(p.lines) + "\n");
  if (p.steps) hm.push(list(p.steps, true) + "\n");
  if (p.roles) hm.push(p.roles.map((r) => `- **${C.DEFAULT_NAMES[r.key]}**: ${r.line}`).join("\n") + "\n");
}
writeFileSync(join(here, "host-guide.md"), hm.join("\n"));

console.log("built guide.json, guide.ko.json, guide.js, rules.md, host-guide.md");
