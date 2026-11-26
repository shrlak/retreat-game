// node guide/build.mjs  →  guide.js, guide.json, guide.ko.json, guide.en.json,
//                          rules.md, rules.en.md, host-guide.md, host-guide.en.md
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as KO from "./content.mjs";
import * as EN from "./content.en.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCES = { ko: KO, en: EN };
const KEYS = ["quick", "overview", "roles", "knowledgeLabels", "phaseHints", "system", "alerts", "tutorial", "hostGuide", "presets", "glossary", "ui"];

// ── 아래 함수들은 guide.js 안에도 그대로 들어갑니다 (브라우저 classic script) ──
const RUNTIME = String.raw`
var JOSA = { "은":["은","는"], "이":["이","가"], "을":["을","를"], "과":["과","와"], "으로":["으로","로"],
  "이에요":["이에요","예요"], "이었어요":["이었어요","였어요"], "이나":["이나","나"], "이면":["이면","면"],
  "이라고":["이라고","라고"], "이지만":["이지만","지만"], "아":["아","야"] };
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
// THEME 이름은 그 THEME 의 언어(theme.lang, 없으면 "ko")와 고른 언어가 같을 때만 씁니다.
// 영어 THEME 을 따로 두려면 theme.lang = "en" 으로 표시하거나, theme.i18n.en 에 같은 모양으로 넣으세요.
function namesFromTheme(theme, defaults, lang) {
  var n = {};
  for (var k in defaults) n[k] = defaults[k];
  if (!theme) return n;
  var t = null;
  if (theme.i18n && theme.i18n[lang]) t = theme.i18n[lang];
  else if ((theme.lang || "ko") === lang) t = theme;
  if (!t) return n;
  if (t.title) n.title = t.title;
  if (t.teams) {
    if (t.teams.good && t.teams.good.name) n.good = t.teams.good.name;
    if (t.teams.evil && t.teams.evil.name) n.evil = t.teams.evil.name;
    // English text already writes "the {good}" / "the {evil}", so drop a leading "The " from team names.
    if (lang === "en") { n.good = String(n.good).replace(/^the\s+/i, ""); n.evil = String(n.evil).replace(/^the\s+/i, ""); }
  }
  if (t.roles) for (var r in t.roles) if (t.roles[r] && t.roles[r].name) n[r] = t.roles[r].name;
  if (t.terms) for (var x in t.terms) if (typeof t.terms[x] === "string" && x !== "excaliburEn" && x !== "lancelotEn") n[x] = t.terms[x];
  return n;
}
function detectLang() {
  try { var s = window.localStorage && localStorage.getItem("lang"); if (s === "ko" || s === "en") return s; } catch (e) {}
  try { var h = document.documentElement.lang || ""; if (/^en/i.test(h)) return "en"; if (/^ko/i.test(h)) return "ko"; } catch (e) {}
  return "ko";
}
`;
// eslint-disable-next-line no-new-func
const rt = new Function(RUNTIME + "; return { josa, format, fillDeep, namesFromTheme };")();

const raw = {};
for (const [lang, C] of Object.entries(SOURCES)) {
  raw[lang] = { version: 2, lang, defaultNames: C.DEFAULT_NAMES };
  for (const k of KEYS) {
    if (!(k in C)) throw new Error(`${lang}: missing export ${k}`);
    raw[lang][k] = C[k];
  }
}

// ── 두 언어의 구조가 같은지 검사 (키·배열 길이·자리표시) ──
function shape(v, path, out) {
  if (Array.isArray(v)) { out.push(path + "[" + v.length + "]"); v.forEach((x, i) => shape(x, path + "." + i, out)); }
  else if (v && typeof v === "object") Object.keys(v).sort().forEach((k) => shape(v[k], path + "." + k, out));
  else if (typeof v === "string") {
    const ph = (v.match(/\{[A-Za-z]+/g) || []).map((x) => x.slice(1)).sort().join(",");
    out.push(path + "{" + ph + "}");
  } else out.push(path + "=" + JSON.stringify(v));
}
const skip = (p) => /^\.(defaultNames|lang)/.test(p) || /\.(label|desc|langKo|langEn)\{/.test(p);
const sk = [], se = [];
for (const k of KEYS) { shape(raw.ko[k], "." + k, sk); shape(raw.en[k], "." + k, se); }
const a = new Set(sk.filter((x) => !skip(x))), b = new Set(se.filter((x) => !skip(x)));
const onlyKo = [...a].filter((x) => !b.has(x)), onlyEn = [...b].filter((x) => !a.has(x));
// 자리표시가 문장마다 꼭 같을 필요는 없으므로, 구조(키·배열 길이)만 엄격히 비교하고 자리표시 차이는 경고만
const strip = (x) => x.replace(/\{[^}]*\}$/, "");
const sa = new Set([...a].map(strip)), sb = new Set([...b].map(strip));
const structDiff = [...sa].filter((x) => !sb.has(x)).concat([...sb].filter((x) => !sa.has(x)));
if (structDiff.length) { console.error("STRUCTURE MISMATCH ko/en:\n" + structDiff.join("\n")); process.exit(1); }
const runtimeParams = new Set(["size", "leaderName", "yes", "no", "fails", "holderName", "targetName", "team", "card", "count", "name"]);
const names = new Set(Object.keys(KO.DEFAULT_NAMES).concat(Object.keys(EN.DEFAULT_NAMES)));
for (const s of sk.concat(se)) {
  const m = s.match(/\{([^}]*)\}$/); if (!m || !m[1]) continue;
  for (const k of m[1].split(",")) if (!names.has(k) && !runtimeParams.has(k)) { console.error("unknown placeholder {" + k + "} at " + s); process.exit(1); }
}
if (onlyKo.length || onlyEn.length) console.log(`note: ${onlyKo.length} strings use different placeholders in ko/en (fine)`);

const filled = { ko: rt.fillDeep(raw.ko, KO.DEFAULT_NAMES), en: rt.fillDeep(raw.en, EN.DEFAULT_NAMES) };
writeFileSync(join(here, "guide.json"), JSON.stringify(raw, null, 2) + "\n");
writeFileSync(join(here, "guide.ko.json"), JSON.stringify(filled.ko, null, 2) + "\n");
writeFileSync(join(here, "guide.en.json"), JSON.stringify(filled.en, null, 2) + "\n");

const js = `/* 빛의 원정대 / Fellowship of Light guide — generated by build.mjs. Edit content.mjs / content.en.mjs instead. */
(function () {
${RUNTIME}
  var RAW = ${JSON.stringify(raw)};
  var G = {
    raw: RAW,
    langs: ["ko", "en"],
    lang: detectLang(),
    /** 언어 바꾸기. 바꾼 뒤에는 build() 를 다시 불러 주세요 (UI 캐시 비우기). */
    setLang: function (l) { if (RAW[l]) { G.lang = l; try { localStorage.setItem("lang", l); } catch (e) {} } return G.lang; },
    /** 완성된 설명서. lang 없으면 GUIDE.lang. THEME 이름은 같은 언어일 때만 반영. */
    build: function (theme, lang) {
      var l = RAW[lang] ? lang : G.lang;
      var src = RAW[l];
      var names = namesFromTheme(theme, src.defaultNames, l);
      var g = fillDeep(src, names);
      g.names = names;
      g.lang = l;
      return g;
    },
    /** 실행 중 값 채우기: GUIDE.format("{leaderName:이} 고르는 중", {leaderName:"은혜"}) */
    format: format,
    josa: josa,
  };
  // GUIDE.i18n.ko / GUIDE.i18n.en: 완성된 설명서 (같은 모양). window.THEME 을 처음 읽을 때 만들고 캐시합니다.
  var cache = {};
  G.i18n = {};
  RAW && Object.keys(RAW).forEach(function (l) {
    Object.defineProperty(G.i18n, l, { enumerable: true, get: function () {
      if (!cache[l]) cache[l] = G.build(typeof window !== "undefined" ? window.THEME : null, l);
      return cache[l];
    } });
  });
  // 최상위에도 지금 언어의 설명서를 펼쳐 둡니다 (GUIDE.quick, GUIDE.roles …). setLang 하면 바뀝니다.
  var TOP = ["quick", "overview", "roles", "knowledgeLabels", "phaseHints", "system", "alerts", "tutorial", "hostGuide", "presets", "glossary", "ui", "names", "defaultNames"];
  function spread() { var g = G.i18n[G.lang]; TOP.forEach(function (k) { G[k] = g[k]; }); }
  var baseSet = G.setLang;
  G.setLang = function (l) { var r = baseSet(l); spread(); return r; };
  G.refresh = function () { cache = {}; spread(); };   // THEME 이 바뀌었을 때
  spread();
  window.GUIDE = G;
})();
`;
writeFileSync(join(here, "guide.js"), js);

// ── Markdown (인쇄·공유용) ──
const L = {
  ko: { roles: "역할 안내", know: "아는 것", goal: "목표", tips: "팁", seenBy: "나를 보는 사람", glossary: "용어",
        presetTable: "기본 추천 구성", count: "인원", rolesOn: "켤 역할", on: "켬", off: "끔", players: (n) => `${n}명`,
        expTable: "확장 규칙 맛보기 구성", modules: "확장", lancelotV: "갈림길(조용한)", excal: "두루마리", summary: "한 장 요약" },
  en: { roles: "Roles", know: "What you know", goal: "Your goal", tips: "Tips", seenBy: "Who can see you", glossary: "Glossary",
        presetTable: "Recommended setups", count: "Players", rolesOn: "Roles to turn on", on: "on", off: "off", players: (n) => `${n}`,
        expTable: "Expansion taster setups", modules: "Expansions", lancelotV: "Crossroads (quiet)", excal: "Scroll", summary: "One-page summary" },
};
const list = (arr, ordered) => arr.map((x, i) => (ordered ? `${i + 1}. ` : "- ") + x).join("\n");

function rulesMd(g, lang) {
  const N = g.defaultNames, l = L[lang], md = [`# ${g.overview.title}\n\n${g.overview.intro}\n`];
  for (const s of g.overview.sections) {
    md.push(`## ${s.heading}\n`);
    if (s.body) md.push(s.body.join("\n\n") + "\n");
    if (s.bullets) md.push(list(s.bullets) + "\n");
    if (s.steps) md.push(s.steps.map((x, i) => `${i + 1}. **${x.title}**: ${x.text}`).join("\n") + "\n");
    if (s.after) md.push(s.after + "\n");
  }
  const t = g.overview.table;
  md.push(`## ${t.heading}\n\n| ${t.columns.join(" | ")} |\n|${t.columns.map(() => "---").join("|")}|\n${t.rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}\n\n${t.note}\n`);
  md.push(`## ${l.roles}\n`);
  for (const [key, r] of Object.entries(g.roles)) {
    md.push(`### ${N[key]} · ${r.team === "good" ? N.good : N.evil}\n\n_${r.tagline}_\n\n**${l.know}**\n${list(r.know)}\n\n**${l.goal}**\n${list(r.goal)}\n\n**${l.tips}**\n${list(r.tips)}\n\n**${l.seenBy}**: ${r.seenBy}\n`);
  }
  md.push(`## ${l.glossary}\n\n${g.glossary.map((x) => `- **${x.term}**: ${x.text}`).join("\n")}\n`);
  return md.join("\n");
}
function presetTable(g, l, key, title, withModules) {
  const N = g.defaultNames;
  const row = (n) => {
    const p = g.presets[key].byCount[n];
    const on = Object.entries(p.roles).filter(([, v]) => v).map(([k]) => N[k]);
    if (p.lancelot) on.push(N.lancelotGood, N.lancelotEvil);
    const mods = withModules ? ` ${[p.lancelot ? l.lancelotV : "", p.excalibur ? l.excal : ""].filter(Boolean).join(", ") || "-"} |` : "";
    return `| ${l.players(n)} | ${on.join(", ")} | ${p.lady ? l.on : l.off} |${mods}`;
  };
  const head = withModules ? `| ${l.count} | ${l.rolesOn} | ${N.lady} | ${l.modules} |\n|---|---|---|---|` : `| ${l.count} | ${l.rolesOn} | ${N.lady} |\n|---|---|---|`;
  return `**${title}**\n\n${head}\n${[5, 6, 7, 8, 9, 10].map(row).join("\n")}\n`;
}
function hostMd(g, lang) {
  const N = g.defaultNames, l = L[lang], h = g.hostGuide, hm = [`# ${h.title}\n\n${h.intro}\n`];
  for (const s of h.sections) {
    hm.push(`## ${s.heading}\n`);
    if (s.steps) hm.push(list(s.steps, true) + "\n");
    if (s.bullets) hm.push(list(s.bullets) + "\n");
    if (s.script) hm.push(s.script.map((x) => `> ${x}`).join("\n>\n") + "\n");
    if (s.presetsRef) hm.push(presetTable(g, l, "standard", l.presetTable, false) + "\n" + presetTable(g, l, "expansion", l.expTable, true));
    if (s.reflection) hm.push(`### ${s.reflection.heading}\n\n${list(s.reflection.questions)}\n`);
  }
  hm.push(`## ${l.summary} (${g.quick.title})\n`);
  for (const p of g.quick.pages) {
    hm.push(`### ${p.heading}\n`);
    if (p.lines) hm.push(list(p.lines) + "\n");
    if (p.steps) hm.push(list(p.steps, true) + "\n");
    if (p.roles) hm.push(p.roles.map((r) => `- **${N[r.key]}**: ${r.line}`).join("\n") + "\n");
  }
  return hm.join("\n");
}
writeFileSync(join(here, "rules.md"), rulesMd(filled.ko, "ko"));
writeFileSync(join(here, "rules.en.md"), rulesMd(filled.en, "en"));
writeFileSync(join(here, "host-guide.md"), hostMd(filled.ko, "ko"));
writeFileSync(join(here, "host-guide.en.md"), hostMd(filled.en, "en"));

console.log("built guide.js, guide.json, guide.{ko,en}.json, rules{,.en}.md, host-guide{,.en}.md");
