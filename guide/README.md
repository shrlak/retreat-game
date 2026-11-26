# guide/ — 게임 안 설명서 (UI·통합 담당용)

원본은 `content.mjs`(한국어)와 `content.en.mjs`(영어) 두 개이고, 키·구조가 똑같습니다. `node guide/build.mjs` 로 나머지를 만들며, 두 언어 구조가 다르면 빌드가 실패합니다.
(CONTRACT.md 의 "Guide content" 절은 예전 초안 모양이에요. 실제 UI(ui/src/00-core.js, 10-common.js)는 아래 모양을 씁니다.)

## 파일
| 파일 | 용도 |
|---|---|
| `content.mjs` / `content.en.mjs` | 원본 글 (여기만 고치기). 이름은 `{merlin}`, `{quest}` 같은 자리표시 |
| `guide.js` | 브라우저용 classic script. `window.GUIDE` 를 만듦 (두 언어 모두 들어 있음, fetch 없음) |
| `guide.json` | 자리표시가 남아 있는 원본 `{ ko, en }` |
| `guide.ko.json` / `guide.en.json` | 기본 이름으로 채운 완성본 |
| `rules.md` / `rules.en.md` | 전체 규칙 + 역할 안내 (인쇄·공유용) |
| `host-guide.md` / `host-guide.en.md` | 수련회 진행자 가이드 (인쇄용 한 장 요약 포함) |

## 언어 (한국어 / English)
- **`GUIDE.i18n.ko` / `GUIDE.i18n.en`**: 두 언어의 완성된 설명서 (모양 똑같음, `window.THEME` 으로 처음 읽을 때 만들어 캐시). THEME 이 바뀌면 `GUIDE.refresh()`.
- **최상위 `GUIDE.quick`, `GUIDE.roles`, `GUIDE.phaseHints` …**: 지금 언어(`GUIDE.lang`) 설명서를 펼쳐 둔 것. `GUIDE.setLang()` 하면 함께 바뀌어요.
- 영어 확장 이름: Good Lancelot / Evil Lancelot / Scroll of the Word (Excalibur) / Crossroads card (Stay, Switch sides).
- `GUIDE.lang` 시작값: `localStorage.lang` → `<html lang>` → `"ko"`.
- `GUIDE.setLang("en")` 로 바꾸고 `localStorage.lang` 에 저장. **바꾼 뒤 `GUIDE.build()` 를 다시 불러야 해요** (UI의 `K.G()` 캐시를 비워 주세요).
- `GUIDE.build(theme, lang?)`: lang 생략 시 `GUIDE.lang`.
- THEME 이름은 **같은 언어일 때만** 반영돼요. 지금 `web/config.js` 는 한국어 THEME 이라 `build(THEME,"en")` 은 영어 기본 이름을 씁니다. 영어 이름을 THEME 에서 바꾸고 싶으면 `THEME.i18n.en = { title, teams, roles, terms }` (한국어 THEME 과 같은 모양) 또는 `lang:"en"` 인 별도 THEME 을 주세요.
- 영어 기본 이름: Fellowship of Light / Workers of Light / Tempters / Prophet, Watchman, Worker of Light, Spy, False Prophet, Wolf in Sheep's Clothing, Wanderer, Tempter, Good Lancelot, Evil Lancelot / Mission, Group Leader, Blessing, Hindrance, Approve, Reject, Lamp, Prophet Hunt, Scroll of the Word, Crossroads card (Stay / Switch sides), Host. 전체 목록은 `guide.en.json` 의 `defaultNames`.
- 버튼 문구도 `G.ui` 에 두 언어로 있어요 (다음/이전/닫기/알겠어요/언어 등). UI 안에 한국어로 박힌 문자열(예: 10-common.js 의 '이전', '다음', '알겠어요', '닫기', 20-home.js 의 '1분 설명서')은 `G.ui` 로 바꿔 주세요. 역할 이름은 `G.names[key]` 로 언어에 맞게 꺼낼 수 있어요.

## 쓰는 법
```html
<script src="./config.js"></script>
<script src="./guide/guide.js"></script>   <!-- 배포 시 guide/ 를 web/ 옆에 복사 -->
```
```js
const G = GUIDE.build(window.THEME);       // THEME 이름이 바뀌어도 조사(은/는, 이/가…)까지 자동으로 맞춤
G.quick.pages                               // 홈 화면 "1분 설명서" (방 만들기/참가 옆 버튼)
G.overview                                  // 전체 규칙 (sections[], table)
G.roles[view.me.role]                       // 카드 확인 화면: tagline, know[], goal[], tips[], seenBy
G.knowledgeLabels[tag]                      // me.knowledge 태그 제목 (evil, merlinCandidate) + 빈 목록 문구
G.phaseHints[view.phase]                    // 단계별 도움말 (아래 표)
G.alerts                                    // 상황 알림 (when 은 사람이 읽는 조건식, UI 에서 직접 구현)
G.tutorial.steps                            // 첫 게임 튜토리얼 (phase 있으면 그 단계 코치 말풍선으로도 사용)
G.hostGuide                                 // 진행자 가이드
G.presets.beginner/standard.byCount[n]      // 로비 "추천 구성" → Net.act("settings", preset) 그대로 보낼 수 있는 형식
G.system                                    // 연결 끊김·다시 입장·방장 바뀜 안내
G.glossary, G.ui                            // 용어, 버튼 문구
G.names, G.lang                             // 지금 쓰인 이름표와 언어
GUIDE.format(str, params)                   // 실행 중 값 채우기 (조사 포함)
```

## 실행 중 채우는 자리표시
| 위치 | 자리표시 | 값 |
|---|---|---|
| `phaseHints.propose.leader[0]` | `{size}` | `view.quests[view.round].size` |
| `phaseHints.propose.others[0]` | `{leaderName}` | 조장 이름 |
| `phaseHints.voteResult.*` | `{yes}` `{no}` | `lastVote.votes` 찬성/반대 수 |
| `phaseHints.questResult.*` | `{fails}` | `lastQuest.fails` |
| `phaseHints.lady.others[0]` | `{holderName}` | 등불 가진 사람 |
| `phaseHints.lady.result` | `{targetName}` `{team:이에요}` | `me.ladyResults` + 진영 이름 (`G.names.good/evil`) |
| `phaseHints.excalibur.others/used/passed` | `{holderName}` `{targetName}` | `proposal.excaliburTo`, `lastExcalibur` |
| `phaseHints.excalibur.result` | `{targetName}` `{card:이었어요}` | `me.excaliburResults` (`original` → `G.names.success/fail`) |
| `phaseHints.loyalty.none/switch` | — | `loyaltyRevealed` 마지막 카드 |
| `phaseHints.loyalty.left` | `{count}` | `loyaltyLeft` |
| `phaseHints.loyalty.mySwitchSecret` | `{team}` | `me.team != me.startTeam` 일 때, **본인이 눌렀을 때만** |
| `phaseHints.end.switchedNote` | `{name}` `{team}` | 끝에서 `finalTeams` 가 시작 진영과 다른 순례자 |
| `system.*` | `{targetName}` | 끊긴 사람 / 열린 자리 / 새 방장 |

`questResult` 고르기: `result=="fail"` → `fail`, 성공인데 `fails>0` → `successWithFail`, 아니면 `success`.

## 단계별 도움말 키
| phase | 키 |
|---|---|
| lobby | `host`, `guest` |
| reveal | `all` |
| propose | `leader` (내가 조장), `leaderExcalibur` (말씀 두루마리 켜졌을 때 조장에게 추가), `others` |
| vote | `all`, `voted` (`me.myVote != null`) |
| quest | `onTeam`, `offTeam`, `played` (`me.myQuestPlayed`) |
| excalibur | `holder` (`me.id == proposal.excaliburTo`), `others`, `used`, `passed`, `result` |
| lady | `holder`, `others`, `result` |
| assassin | `assassin` (`me.id == assassinId`), `others` |
| end | `good[winReason]` / `evil[winReason]`, `after[]` |

## 확장 규칙 표시
`module: "lancelot" | "excalibur" | "balance"` 가 붙은 항목(규칙 절, 역할 카드, 1분 설명서의 순례자 두 줄)은 그 확장을 쓸 때만, 또는 "확장" 표시(`G.ui.moduleTag`)를 달아 보여 주세요. `presets` 는 이제 `beginner`, `standard`, `expansion` 세 가지이고, 모두 `lancelot/excalibur/balance` 값을 함께 담아서 누르면 확장 설정도 맞춰집니다 (규칙 엔진 `buildRoles` 로 5~10명 전부 검사 완료).

## 꼭 지켜 주세요
- `phaseHints` 와 `alerts` 는 진영이 드러나지 않는 문장만 있어요. 화면에 늘 띄워도 옆 사람이 봐서 알 수 있는 게 없어요.
- `roles[...]` (특히 `tips`, `know`) 는 진영이 드러나요. "내 역할 팁" 처럼 본인이 눌렀을 때만 보여 주세요.
- quest 단계 `onTeam` 은 모두에게 같은 문장이에요. 선한 사람에게 방해 버튼을 아예 숨기면 옆에서 진영이 보일 수 있으니, 버튼은 둘 다 보이게 하고 누를 때 막는 쪽을 권해요.
