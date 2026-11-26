# tests/

Run from `avalon-game/`:

| 명령 | 내용 | 시간 |
|---|---|---|
| `node --test tests/*.test.mjs` | 규칙 단위 테스트(26) + 확장 규칙 단위 테스트(빌드 9 + 테스트 스레드 rules-expansions, 랜슬롯 변형 1·2·3·엑스칼리버) + 서버 코드(handler.js) 테스트 + 동시 탭 테스트 | ~5분 |
| `node tests/run-matrix.mjs` | 봇 전체 게임: 5~10명 × 선택 역할 32조합 × 등불 on/off × (기본 + 랜슬롯 1·2·3 × 엑스칼리버) | ~40초 |
| `node tests/run-matrix.mjs --games 30` | 같은 매트릭스, 기본 30판·확장 15판씩 | ~10분 |
| `node tests/run-matrix.mjs --no-expansions` | 확장 없이 기본 규칙만 | |
| `node tests/stress.mjs` | 인원별(5~10명) 1만 판씩 연습게임, 가능한 모든 설정(역할·등불·랜슬롯·엑스칼리버·밸런스)을 돌아가며, 4개 병렬. 실패 시 재현 명령 출력 | ~6분 |
| `node tests/stress.mjs --n 7 --repro <seed>` | 실패한 한 판 다시 재현 | |
| `node tests/mutation-check.mjs` | 엔진에 버그 25종(기본 12 + 확장 13)을 하나씩 심어서 테스트가 다 잡는지 확인 | ~10분 |
| `node tests/perf.mjs` | 탭당 처리 시간, 폰 1대 다운로드 크기, 10명 게임 트래픽 | 1초 |
| `FN_URL=… ANON_KEY=… node tests/run-matrix.mjs --http` | 실서버 대상 (이 샌드박스는 supabase.co 차단) | |
| `tests/live.html?config=../web/config.js` | 브라우저에서 실서버 대상 봇 게임 + 응답 속도(p50/p95) | |

- `lib/oracle.mjs` — 원작 규칙 독립 구현(엔진 코드를 쓰지 않음).
- `lib/harness.mjs` — 봇은 자기 폰 화면(view)만 보고 플레이. 받은 모든 view를 게임 끝에 공개된 실제 역할과 대조해서 정보 유출·규칙 위반 검사. 일부러 잘못된 동작(대장 아닌 사람이 제안, 선이 실패 카드, 이전 등불 보유자 지목 등)도 섞어서 거절되는지 확인.
- `lib/transport-local.mjs` / `lib/transport-occ.mjs` / `lib/transport-handler.mjs` / `lib/transport-http.mjs` — 엔진 직접 / 낙관적 잠금 동시성 모델 / 진짜 server/handler.js + 가짜 Supabase / 실서버.
- `RULES_CHECKLIST.md` — 규칙 항목 ID, `BUGS.md` — 발견한 문제.
