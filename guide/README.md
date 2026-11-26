# guide/ — 게임 안 설명서 (UI·통합 담당용)

CONTRACT.md 에 설명서 형식이 없어서 아래 형식을 제안합니다. 원본은 `content.mjs` 하나이고, `node guide/build.mjs` 로 나머지를 만듭니다.

## 파일
| 파일 | 용도 |
|---|---|
| `content.mjs` | 원본 글 (여기만 고치기). 이름은 `{merlin}`, `{quest}` 같은 자리표시 |
| `guide.js` | 브라우저용 classic script. `window.GUIDE` 를 만듦 (fetch 없이 바로 사용) |
| `guide.json` | 자리표시가 남아 있는 원본 JSON |
| `guide.ko.json` | 기본 이름으로 채운 JSON |
| `rules.md` | 전체 규칙 + 역할 안내 (인쇄·공유용) |
| `host-guide.md` | 수련회 진행자 가이드 (인쇄용 한 장 요약 포함) |

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
G.glossary, G.ui                            // 용어, 버튼 문구
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
| `phaseHints.lady.result` | `{targetName}` `{team:이에요}` | `me.ladyResults` + 진영 이름 |

`questResult` 고르기: `result=="fail"` → `fail`, 성공인데 `fails>0` → `successWithFail`, 아니면 `success`.

## 단계별 도움말 키
| phase | 키 |
|---|---|
| lobby | `host`, `guest` |
| reveal | `all` |
| propose | `leader` (내가 조장), `others` |
| vote | `all`, `voted` (`me.myVote != null`) |
| quest | `onTeam`, `offTeam`, `played` (`me.myQuestPlayed`) |
| lady | `holder`, `others`, `result` |
| assassin | `assassin` (`me.id == assassinId`), `others` |
| end | `good[winReason]` / `evil[winReason]`, `after[]` |

## 꼭 지켜 주세요
- `phaseHints` 와 `alerts` 는 진영이 드러나지 않는 문장만 있어요. 화면에 늘 띄워도 옆 사람이 봐서 알 수 있는 게 없어요.
- `roles[...]` (특히 `tips`, `know`) 는 진영이 드러나요. "내 역할 팁" 처럼 본인이 눌렀을 때만 보여 주세요.
- quest 단계 `onTeam` 은 모두에게 같은 문장이에요. 선한 사람에게 방해 버튼을 아예 숨기면 옆에서 진영이 보일 수 있으니, 버튼은 둘 다 보이게 하고 누를 때 막는 쪽을 권해요.
