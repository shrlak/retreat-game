// 빛의 원정대 — 게임 안 설명서 원본 (이 파일만 고치고 `node build.mjs` 를 돌리세요)
//
// 이름 자리표시: {merlin} {percival} {servant} {assassin} {morgana} {mordred} {oberon} {minion}
//               {lancelotGood} {lancelotEvil} {good} {evil} {quest} {leader} {success} {fail} {approve} {reject}
//               {lady} {assassinate} {excalibur} {loyalty} {loyaltyNone} {loyaltySwitch} {host} {allowRejoin} {claimHost} {title}
// 조사 자동: {key:은} {key:이} {key:을} {key:과} {key:으로} {key:이에요} {key:이나} {key:이면} {key:이라고} {key:이지만} {key:아}
//   예) "{lady:으로}" → "등불로", "{percival:은}" → "파수꾼은"
// 원작 규칙과 같고, 문장은 모두 새로 썼습니다.

export const DEFAULT_NAMES = {
  title: "빛의 원정대",
  good: "빛의 일꾼들",
  evil: "유혹의 무리",
  merlin: "선지자",
  percival: "파수꾼",
  servant: "빛의 일꾼",
  assassin: "정탐꾼",
  morgana: "거짓 선지자",
  mordred: "양의 탈을 쓴 늑대",
  oberon: "방황하는 자",
  minion: "유혹하는 자",
  quest: "사명",
  leader: "조장",
  success: "축복",
  fail: "방해",
  approve: "찬성",
  reject: "반대",
  lady: "등불",
  assassinate: "선지자 지목",
  lancelotGood: "갈림길의 순례자 (선한 랜슬롯)",
  lancelotEvil: "갈림길의 그림자 (악한 랜슬롯)",
  lancelot: "갈림길의 순례자 (랜슬롯)",
  excalibur: "말씀 두루마리",
  loyalty: "갈림길 카드",
  loyaltyNone: "그대로",
  loyaltySwitch: "편이 바뀜",
  questTeam: "원정대",
  host: "방장",
  allowRejoin: "다시 입장 허용",
  claimHost: "방장 맡기",
};

// ───────────────────────── 1. 홈 화면용 짧은 설명서 ─────────────────────────
// 폰 화면 3~4장 분량. 방 만들기/참가 옆 "설명서" 버튼에서 엽니다.
export const quick = {
  title: "1분 설명서",
  pages: [
    {
      heading: "어떤 게임인가요?",
      lines: [
        "우리 중에 몰래 숨어 있는 {evil:이} 있어요.",
        "{good:은} {quest} 5번 중 3번을 {success:으로} 이루면 이기고, {evil:은} 3번을 {fail:으로} 무너뜨리면 이겨요.",
        "누가 누군지 대화와 투표로 알아맞히는 추리 게임이에요. 5~10명이 함께해요.",
      ],
    },
    {
      heading: "한 라운드는 이렇게",
      steps: [
        "{leader:이} {quest} 팀을 골라요.",
        "모두 동시에 {approve} 또는 {reject} 투표해요. 절반보다 많아야 통과예요.",
        "통과하면 팀원만 몰래 {success} 또는 {fail} 카드를 내요.",
        "{fail} 카드가 한 장이라도 있으면 {quest:은} 실패예요.",
        "{reject:이} 되면 다음 사람이 {leader:이} 돼요. 한 {quest}에서 5번 연속 {reject:이면} {evil:이} 바로 이겨요.",
      ],
    },
    {
      heading: "역할 한 줄 소개",
      roles: [
        { key: "merlin", line: "{evil:을} 처음부터 알아요. 들키지 않게 몰래 도와요." },
        { key: "percival", line: "{merlin} 후보 두 명을 알아요. 진짜를 지켜 주세요." },
        { key: "servant", line: "아무것도 몰라요. 눈치와 추리로 싸워요." },
        { key: "assassin", line: "{good:이} 이기면 마지막에 {merlin:을} 찾아 역전해요." },
        { key: "morgana", line: "{percival}에게 {merlin:으로} 보여요. 진짜인 척해요." },
        { key: "mordred", line: "{merlin}에게도 안 보이는 숨은 우두머리예요." },
        { key: "oberon", line: "{evil:이지만} 동료를 모르고, 동료도 이 사람을 몰라요." },
        { key: "minion", line: "{evil}의 평범한 일원이에요. 동료를 알아요." },
        { key: "lancelotGood", module: "lancelot", line: "(확장) {good} 편으로 시작하지만 {loyalty}에 따라 편이 바뀔 수 있어요." },
        { key: "lancelotEvil", module: "lancelot", line: "(확장) {evil} 편으로 시작하지만 {loyalty}에 따라 편이 바뀔 수 있어요." },
      ],
    },
    {
      heading: "꼭 기억해요",
      lines: [
        "내 폰 화면은 절대 남에게 보여주지 않아요.",
        "말로는 무엇이든 할 수 있어요. 게임 속 거짓말은 놀이일 뿐이에요.",
        "{good:은} {success}만 낼 수 있어요.",
        "{good:이} 3번 이겨도 {assassin:이} {merlin:을} 맞히면 {evil:이} 역전승해요.",
      ],
    },
  ],
};

// ───────────────────────── 2. 규칙 요약 (전체) ─────────────────────────
export const overview = {
  title: "{title} 규칙",
  intro:
    "수련회 친구들 사이에 {evil:이} 몰래 섞여 있어요. 서로를 믿을지 의심할지 고민하며 다섯 번의 {quest:을} 함께 떠나는 숨은 정체 추리 게임이에요.",
  sections: [
    {
      id: "teams",
      heading: "두 진영",
      body: [
        "{good}: 사람 수가 더 많지만, 대부분 누가 {evil}인지 몰라요.",
        "{evil}: 사람 수는 적지만, 대부분 서로가 누구인지 알고 있어요.",
        "게임이 시작되면 각자 폰으로 자기 역할 카드를 몰래 확인해요.",
      ],
    },
    {
      id: "win",
      heading: "이기는 방법",
      body: [
        "{good:은} {quest} 3번을 성공시키면 이겨요. 단, 게임에 {merlin:이} 있으면 마지막에 {assassin}의 {assassinate:을} 버텨야 해요.",
        "{evil:은} 아래 셋 중 하나면 이겨요.",
      ],
      bullets: [
        "{quest} 3번을 실패시키기",
        "한 {quest}에서 팀 제안이 5번 연속 {reject}되기",
        "{good:이} 3번 성공한 뒤 {assassin:이} {merlin:을} 정확히 지목하기",
      ],
    },
    {
      id: "round",
      heading: "한 라운드의 흐름",
      steps: [
        { title: "팀 제안", text: "이번 {leader:이} {quest}에 갈 사람을 정해진 인원만큼 골라요. 자기 자신을 넣어도 돼요." },
        { title: "토론", text: "왜 이 팀인지, 누가 수상한지 자유롭게 이야기해요." },
        { title: "투표", text: "모든 사람이 동시에 {approve} 또는 {reject:을} 눌러요. 누가 어떻게 투표했는지는 모두에게 공개돼요." },
        { title: "결과", text: "{approve:이} 절반보다 많으면 팀이 출발해요. 반반이거나 {reject:이} 많으면 {leader:이} 다음 사람에게 넘어가요." },
        { title: "{quest} 수행", text: "팀원만 몰래 {success} 또는 {fail} 카드를 내요. {good:은} {success}만 낼 수 있어요." },
        { title: "공개", text: "카드를 섞어서 {fail:이} 몇 장인지만 보여줘요. 누가 냈는지는 아무도 몰라요. {fail:이} 한 장이라도 있으면 실패예요." },
      ],
      after: "다음 라운드는 {leader} 자리가 한 칸 옆으로 넘어가며 다시 시작해요.",
    },
    {
      id: "special",
      heading: "알아두면 좋은 규칙",
      bullets: [
        "7명 이상이면 네 번째 {quest:은} {fail:이} 2장 나와야 실패예요.",
        "한 {quest}에서 5번째 제안까지 {reject}되면 그 즉시 {evil:이} 이겨요. 그래서 5번째 투표는 정말 중요해요.",
        "{quest:이} 진행되면 {reject} 횟수는 다시 0부터 세요.",
        "{evil:은} {success:과} {fail} 중 마음대로 낼 수 있어요. 일부러 {success:을} 내서 믿음을 얻기도 해요.",
        "게임에 어떤 역할들이 들어 있는지는 모두에게 공개돼요. 누가 그 역할인지만 비밀이에요.",
      ],
    },
    {
      id: "assassinate",
      heading: "끝까지 모르는 반전: {assassinate}",
      body: [
        "{good:이} {quest:을} 3번 성공시켜도 아직 끝이 아니에요. {evil:은} 서로 상의한 뒤 {assassin:이} {merlin:이라고} 생각하는 한 사람을 지목해요.",
        "맞히면 {evil:이} 역전승, 틀리면 {good:이} 최종 승리예요. 그래서 {merlin:은} 끝까지 정체를 숨겨야 해요.",
      ],
    },
    {
      id: "lady",
      heading: "{lady} (선택 규칙)",
      body: [
        "진행자가 켜면 쓰는 규칙이에요. 7명 이상일 때 추천해요.",
        "처음에는 첫 {leader}의 오른쪽 사람이 {lady:을} 가지고 시작해요.",
        "2·3·4번째 {quest:이} 끝날 때마다 {lady:을} 가진 사람이 한 명을 골라 그 사람의 진영({good} 또는 {evil})을 혼자 몰래 확인해요.",
        "확인받은 사람이 다음 {lady:을} 받아요. 이미 {lady:을} 가졌던 사람은 다시 고를 수 없어요.",
        "누가 누구를 비췄는지는 모두에게 보이지만, 결과는 본 사람만 알아요. 결과를 말로 전할지, 거짓으로 말할지는 본인 자유예요.",
      ],
    },
    {
      id: "lancelot",
      module: "lancelot",
      heading: "확장 규칙: {lancelotGood:과} {lancelotEvil}",
      body: [
        "진행자가 켜면 쓰는 확장 규칙이에요. 두 순례자가 들어가서 {lancelotGood:은} {good} 한 자리를, {lancelotEvil:은} {evil} 한 자리를 차지해요.",
        "카드를 확인할 때 {evil}({oberon} 제외)는 {lancelotEvil:이} 누구인지 알지만, {lancelotEvil:은} 동료를 보지 못해요. 두 순례자도 서로를 몰라요(변형 3만 예외).",
        "{merlin}에게는 {lancelotEvil:이} {evil:으로} 보여요. {lancelotEvil:은} {assassinate:을} 맡지 않아요.",
        "{quest} 카드, {lady}의 결과, 최종 승패는 모두 '지금 편'을 기준으로 정해져요. 순례자가 {good} 편일 때는 {success}만 낼 수 있어요.",
      ],
      bullets: [
        "변형 1: {loyalty} 5장({loyaltyNone} 3장, {loyaltySwitch} 2장)을 섞어 두고, 3·4·5번째 {quest:이} 시작될 때 한 장씩 모두에게 공개해요. '{loyaltySwitch}' 카드가 나오면 두 순례자의 편이 서로 바뀌고, 한 장 더 나오면 다시 바뀌어요.",
        "변형 2: {loyalty} 7장({loyaltyNone} 5장, {loyaltySwitch} 2장) 중 5장을 처음부터 {quest}마다 한 장씩 앞면으로 펼쳐 둬요. 그래서 언제 편이 바뀔지 모두 미리 알아요. 카드는 그 {quest:이} 시작될 때 효과가 나고, 순례자는 지금 편대로만 내요({evil} 편이면 늘 {fail}, {good} 편이면 늘 {success}).",
        "변형 3: {loyalty:은} 쓰지 않고 편도 바뀌지 않아요. 대신 두 순례자가 서로를 알아봐요.",
      ],
    },
    {
      id: "excalibur",
      module: "excalibur",
      heading: "{excalibur} (확장 규칙)",
      body: [
        "{leader:은} 팀을 고를 때 팀원 한 명에게 {excalibur:을} 맡겨요. 자기 자신에게는 줄 수 없어요.",
        "팀원이 모두 카드를 낸 뒤, {excalibur:을} 받은 사람은 다른 팀원 한 명의 카드를 반대로 뒤집을 수 있어요. 뒤집지 않아도 돼요.",
        "뒤집힌 카드가 원래 무엇이었는지는 {excalibur:을} 쓴 사람만 알아요. 누가 누구의 카드를 뒤집었는지는 모두에게 공개돼요.",
      ],
    },
    {
      id: "balance",
      module: "balance",
      heading: "다른 팀 인원표 (선택)",
      body: [
        "진행자가 켜면 5명, 7명 게임의 {quest}별 팀 인원이 바뀌어요.",
        "5명: 3 · 2 · 3 · 2 · 3",
        "7명: 2 · 3 · 4 · 3 · 4 (네 번째 {quest:은} 여전히 {fail} 2장이 필요해요)",
      ],
    },
    {
      id: "talk",
      heading: "대화 규칙",
      bullets: [
        "말로는 무엇이든 할 수 있어요. 의심, 변명, 연기 모두 게임의 일부예요.",
        "폰 화면을 보여주거나 남의 폰을 보는 것만은 안 돼요.",
        "{quest} 카드를 낼 때와 투표할 때는 화면을 가리고 눌러요.",
        "게임 속 거짓말은 놀이예요. 게임이 끝나면 웃으며 서로 축복해 주세요.",
      ],
    },
  ],
  // 인원표 (엔진 상수와 같음)
  table: {
    heading: "인원별 구성",
    columns: ["인원", "{good}", "{evil}", "{quest}별 팀 인원"],
    rows: [
      ["5명", "3", "2", "2 · 3 · 2 · 3 · 3"],
      ["6명", "4", "2", "2 · 3 · 4 · 3 · 4"],
      ["7명", "4", "3", "2 · 3 · 3 · 4* · 4"],
      ["8명", "5", "3", "3 · 4 · 4 · 5* · 5"],
      ["9명", "6", "3", "3 · 4 · 4 · 5* · 5"],
      ["10명", "6", "4", "3 · 4 · 4 · 5* · 5"],
    ],
    note: "* 표시된 {quest:은} {fail:이} 2장 나와야 실패예요.",
  },
};

// ───────────────────────── 3. 역할 카드 ─────────────────────────
// 카드 확인 화면과 "내 역할 다시 보기"에서 씁니다. 진영이 드러나므로 본인 폰에서만 보여주세요.
export const roles = {
  merlin: {
    team: "good",
    tagline: "모든 것을 알지만, 말할 수 없는 사람",
    know: [
      "{evil} 대부분이 누구인지 보여요.",
      "단, {mordred:은} 보이지 않아요.",
      "{oberon:은} {evil:으로} 보여요.",
      "누가 어떤 {evil} 역할인지까지는 몰라요.",
    ],
    goal: [
      "{good:이} {quest} 3번을 성공하도록 이끌어요.",
      "마지막까지 {assassin}에게 정체를 들키지 않아요.",
    ],
    tips: [
      "\"저 사람이 {evil:이에요}!\"라고 대놓고 말하면 바로 표적이 돼요. 질문이나 투표로 살짝 방향만 알려 주세요.",
      "가끔은 모르는 척 의심도 틀려 보세요. 너무 정확하면 눈에 띄어요.",
      "{evil:이} 들어간 팀에는 {reject:을} 누르되, 매번 혼자 튀지 않게 조심해요.",
      "{percival:이} 있다면 그 사람이 나를 지켜 줄 거예요. 믿고 맡겨요.",
    ],
    seenBy: "{percival}에게 {merlin} 후보로 보여요.",
  },
  percival: {
    team: "good",
    tagline: "{merlin:을} 지키는 사람",
    know: [
      "{merlin} 후보가 보여요.",
      "{morgana:이} 게임에 있으면 후보가 두 명이에요. 둘 중 누가 진짜인지는 몰라요.",
      "{morgana:이} 없다면 보이는 사람이 바로 진짜 {merlin:이에요}.",
    ],
    goal: [
      "진짜 {merlin:을} 찾아 그 사람의 신호를 따라가요.",
      "{assassin:이} {merlin:을} 못 찾도록 지켜요.",
    ],
    tips: [
      "두 후보가 어떤 팀에 {approve}하고 {reject}하는지 비교해 보세요. 결과와 잘 맞는 쪽이 진짜일 가능성이 커요.",
      "내가 {merlin}처럼 아는 척 행동하면 {assassin:이} 나를 노리게 만들 수 있어요.",
      "진짜를 찾아도 공개적으로 지목하지 마세요. 그러면 {merlin:이} 위험해져요.",
    ],
    seenBy: "아무에게도 특별히 보이지 않아요.",
  },
  servant: {
    team: "good",
    tagline: "믿음과 눈치로 싸우는 사람",
    know: ["아무 정보도 없어요. 그래서 오히려 가장 솔직하게 추리할 수 있어요."],
    goal: ["{evil:을} 가려내고 {quest} 3번을 성공시켜요."],
    tips: [
      "투표 기록을 보세요. {fail:이} 나온 팀을 계속 {approve}한 사람이 수상해요.",
      "{fail:이} 나온 팀의 멤버를 기억해 두면 범위가 좁혀져요.",
      "궁금하면 바로 물어보세요. 대답하는 태도에서 많은 게 보여요.",
      "마지막에는 나도 뭔가 아는 척해서 {assassin:을} 헷갈리게 만들 수 있어요.",
    ],
    seenBy: "아무에게도 특별히 보이지 않아요.",
  },
  assassin: {
    team: "evil",
    tagline: "마지막 한 수를 쥔 사람",
    know: [
      "다른 {evil} 동료가 보여요.",
      "단, {oberon:은} 보이지 않아요.",
    ],
    goal: [
      "{quest} 3번을 실패시키거나,",
      "{good:이} 3번 성공하면 마지막에 {merlin:을} 정확히 찾아 지목해요.",
    ],
    tips: [
      "게임 내내 '누가 너무 잘 아는지'를 관찰하세요. 처음부터 {evil:을} 피해 가는 사람이 {merlin}일 수 있어요.",
      "매번 {fail:을} 내면 금방 들켜요. 초반에는 {success:을} 내서 믿음을 쌓는 것도 방법이에요.",
      "동료와 같은 팀에 들어가면 둘 다 {fail:을} 내지 않도록 눈치껏 맞춰요.",
      "마지막 지목 때는 동료와 충분히 상의한 뒤 고르세요.",
    ],
    seenBy: "{merlin}에게 {evil:으로} 보여요.",
  },
  morgana: {
    team: "evil",
    tagline: "빛의 사람인 척하는 사람",
    know: [
      "다른 {evil} 동료가 보여요.",
      "단, {oberon:은} 보이지 않아요.",
    ],
    goal: [
      "{percival:을} 속여 나를 {merlin:으로} 믿게 만들어요.",
      "{quest} 3번을 실패시켜요.",
    ],
    tips: [
      "진짜 {merlin}처럼 자신 있게 의견을 내세요. {percival:은} 나와 진짜 중 누가 맞는지 고민하고 있어요.",
      "진짜 {merlin:이} 누구인지 짐작되면 {assassin}에게 넌지시 알려 주세요.",
    ],
    seenBy: "{percival}에게 {merlin} 후보로 보이고, {merlin}에게는 {evil:으로} 보여요.",
  },
  mordred: {
    team: "evil",
    tagline: "{merlin}도 알아보지 못하는 숨은 우두머리",
    know: [
      "다른 {evil} 동료가 보여요.",
      "단, {oberon:은} 보이지 않아요.",
    ],
    goal: ["{good}의 깊은 신뢰를 얻고, {quest} 3번을 실패시켜요."],
    tips: [
      "{merlin}도 나를 몰라요. 그러니 당당하게 {good}처럼 행동하세요.",
      "누가 나를 의심하더라도 그건 {merlin:이} 본 게 아니라 추리일 뿐이에요. 흔들리지 말고 차분히 해명하세요.",
      "믿음을 얻은 뒤 중요한 {quest}에서 {fail:을} 내면 효과가 커요.",
    ],
    seenBy: "{merlin}에게도 보이지 않아요. 동료 {evil}에게만 보여요.",
  },
  oberon: {
    team: "evil",
    tagline: "홀로 길을 잃은 {evil}",
    know: [
      "아무도 보이지 않아요.",
      "다른 {evil}도 내가 누구인지 몰라요.",
    ],
    goal: ["동료를 몰라도 {quest} 3번을 실패시켜요."],
    tips: [
      "동료가 누군지 모르니, {fail:이} 나온 팀에 있던 사람들을 눈여겨보세요.",
      "같은 팀에 동료가 있을 수도 있어요. {fail:이} 두 장 나오면 둘 다 의심받으니 타이밍을 잘 보세요.",
      "{merlin}에게는 내가 {evil:으로} 보여요. 그 점을 기억하세요.",
    ],
    seenBy: "{merlin}에게 {evil:으로} 보여요. 동료 {evil}에게는 보이지 않아요.",
  },
  minion: {
    team: "evil",
    tagline: "조용히 흔드는 사람",
    know: [
      "다른 {evil} 동료가 보여요.",
      "단, {oberon:은} 보이지 않아요.",
    ],
    goal: ["{quest} 3번을 실패시키고, {merlin} 찾기를 도와요."],
    tips: [
      "{good}처럼 의심도 하고 질문도 해 보세요. 너무 조용하면 오히려 눈에 띄어요.",
      "동료가 의심받으면 너무 감싸지 마세요. 같이 묶여서 들킬 수 있어요.",
      "{merlin}처럼 보이는 사람을 기억해 두었다가 마지막 지목 때 알려 주세요.",
    ],
    seenBy: "{merlin}에게 {evil:으로} 보여요.",
  },
  lancelotGood: {
    team: "good",
    module: "lancelot",
    tagline: "갈림길 앞에 선 순례자",
    know: [
      "아무도 보이지 않아요.",
      "변형 3에서만 {lancelotEvil:이} 누구인지 보이고, 그 사람도 나를 알아요.",
    ],
    goal: [
      "지금 내 편이 이기도록 도와요. 처음에는 {good} 편이에요.",
      "변형 1·2에서 '{loyaltySwitch}' 카드가 적용되면 {evil} 편이 될 수 있어요.",
    ],
    tips: [
      "{loyalty:이} 적용될 때마다 지금 내 편을 다시 확인하세요. 승패는 마지막 순간의 편으로 정해져요.",
      "{good} 편일 때는 {success}만 낼 수 있어요. {evil} 편이 되면 변형 1에서는 고를 수 있고, 변형 2에서는 늘 {fail:을} 내야 해요.",
      "변형 2에서는 펼쳐 둔 카드로 내 편이 언제 바뀔지 미리 보고 계획을 세워 보세요.",
    ],
    seenBy: "아무에게도 보이지 않아요. 변형 3에서만 {lancelotEvil}에게 보여요.",
  },
  lancelotEvil: {
    team: "evil",
    module: "lancelot",
    tagline: "갈림길에 드리운 그림자",
    know: [
      "다른 {evil:은} 보이지 않아요. 대신 {evil} 동료({oberon} 제외)는 내가 누구인지 알아요.",
      "변형 3에서만 {lancelotGood:이} 누구인지 보이고, 그 사람도 나를 알아요.",
    ],
    goal: [
      "지금 내 편이 이기도록 도와요. 처음에는 {evil} 편이에요.",
      "변형 1·2에서 '{loyaltySwitch}' 카드가 적용되면 {good} 편이 될 수 있어요.",
    ],
    tips: [
      "{merlin}에게는 처음부터 {evil:으로} 보여요. 편이 바뀌어도 {merlin:은} 그 사실을 따로 알지 못해요.",
      "{good} 편이 되면 {success}만 낼 수 있어요. 변형 2에서는 {evil} 편일 때 늘 {fail:을} 내야 해요.",
      "동료는 나를 알지만 나는 동료를 몰라요. 동료가 보내는 신호를 잘 읽어 보세요.",
      "{assassinate:은} 내가 하지 않아요. 동료에게 의견만 보태 주세요.",
    ],
    seenBy: "{merlin:과} {evil} 동료({oberon} 제외)에게 보여요. 변형 3이면 {lancelotGood}에게도 보여요.",
  },
};

// 카드 확인 화면에서 knowledge 목록 위에 붙일 제목 (me.knowledge tag별)
export const knowledgeLabels = {
  evil: "{evil}",
  merlinCandidate: "{merlin} 후보",
  lancelot: "또 다른 순례자",
  emptyGood: "보이는 사람이 없어요. 대화와 투표로 추리해 보세요.",
  emptyOberon: "보이는 동료가 없어요. 혼자서도 해낼 수 있어요.",
};

// ───────────────────────── 4. 진행 단계별 힌트 ─────────────────────────
// 화면 위 작은 도움말. 옆 사람이 봐도 진영이 드러나지 않도록 모두 같은 문장만 씁니다.
// 진영별 팁은 roles[key].tips 를 "내 역할 팁" 버튼을 눌렀을 때만 보여주세요.
export const phaseHints = {
  lobby: {
    host: [
      "모두 들어오면 설정에서 역할을 고르세요. 추천 구성을 눌러도 돼요.",
      "처음이라면 {merlin:과} {assassin}만 켜고 시작해 보세요.",
      "모두 준비를 누르면 시작할 수 있어요.",
    ],
    guest: [
      "방 코드를 친구에게 알려 주세요.",
      "앱에 들어온 순서대로 둥글게 앉으면 {leader} 순서가 헷갈리지 않아요.",
      "준비되면 준비 버튼을 눌러 주세요.",
    ],
  },
  reveal: {
    all: [
      "화면을 손으로 가리고 내 역할을 확인하세요.",
      "다 봤으면 확인을 눌러요. 모두 확인하면 게임이 시작돼요.",
      "표정 관리, 지금부터 시작이에요.",
    ],
  },
  propose: {
    leader: [
      "당신이 이번 {leader:이에요}. {quest}에 갈 {size}명을 고르세요.",
      "고르기 전에 이유를 말해 주면 투표가 쉬워져요.",
      "나를 포함해도 괜찮아요.",
    ],
    leaderExcalibur: [
      "팀원 중 한 명에게 {excalibur:을} 맡겨 주세요. 나 자신에게는 줄 수 없어요.",
    ],
    others: [
      "{leaderName}님이 팀을 고르는 중이에요.",
      "넣고 싶은 사람이나 빼고 싶은 사람이 있다면 지금 말해 보세요.",
    ],
  },
  vote: {
    all: [
      "이 팀으로 {quest:을} 보낼까요? {approve} 또는 {reject:을} 골라요.",
      "모두 동시에 공개돼요. 누가 어떻게 냈는지 기억해 두세요.",
      "절반보다 많이 {approve}해야 출발해요.",
    ],
    voted: ["투표 완료! 다른 사람을 기다리는 중이에요."],
  },
  voteResult: {
    approved: "{approve} {yes}명, {reject} {no}명. 팀이 {quest:을} 떠나요!",
    rejected: "{approve} {yes}명, {reject} {no}명. 부결되어 다음 {leader:으로} 넘어가요.",
  },
  quest: {
    onTeam: [
      "{success} 또는 {fail} 중 하나를 몰래 고르세요.",
      "{good:은} {success}만 낼 수 있어요.",
      "화면을 가리고 눌러 주세요.",
    ],
    offTeam: [
      "팀이 {quest:을} 수행하는 중이에요.",
      "결과가 나오면 누가 팀에 있었는지 꼭 기억하세요.",
    ],
    played: ["카드를 냈어요. 결과를 기다리는 중이에요."],
  },
  questResult: {
    success: "{quest} 성공! {fail} 카드 {fails}장.",
    successWithFail: "{fail} 카드가 {fails}장 나왔지만, 이번 {quest:은} 2장이 필요해서 성공이에요!",
    fail: "{quest} 실패. {fail} 카드 {fails}장.",
  },
  excalibur: {
    holder: [
      "{excalibur:을} 받았어요. 다른 팀원 한 명의 카드를 반대로 뒤집을 수 있어요.",
      "뒤집지 않고 넘어가도 돼요.",
      "뒤집으면 그 카드가 원래 무엇이었는지 나만 알게 돼요.",
    ],
    others: [
      "{holderName}님이 {excalibur:을} 쓸지 고민하는 중이에요.",
      "누구의 카드를 뒤집었는지는 모두에게 공개돼요.",
    ],
    used: "{holderName}님이 {targetName}님의 카드를 뒤집었어요.",
    passed: "{holderName}님은 카드를 뒤집지 않았어요.",
    result: "{targetName}님의 원래 카드는 {card:이었어요}. 지금은 반대로 뒤집혔어요.",
  },
  loyalty: {
    none: "이번 {quest}의 {loyalty}: {loyaltyNone}. 두 순례자의 편은 그대로예요.",
    switch: "이번 {quest}의 {loyalty}: {loyaltySwitch}! 두 순례자의 편이 서로 바뀌었어요.",
    left: "남은 {loyalty} {count}장",
    // 아래 문장은 순례자 본인 폰에만, 본인이 눌렀을 때 보여 주세요 (진영이 드러나요)
    mySwitchSecret: "내 편이 바뀌었어요. 지금 나는 {team} 편이에요.",
  },
  lady: {
    holder: [
      "{lady:으로} 한 사람을 비춰 보세요. 그 사람의 진영을 나만 알게 돼요.",
      "이미 {lady:을} 가졌던 사람은 고를 수 없어요.",
      "결과를 말할지, 어떻게 말할지는 내 자유예요.",
    ],
    others: [
      "{holderName}님이 {lady:으로} 누군가를 비추는 중이에요.",
      "누구를 골랐는지는 모두에게 보여요.",
    ],
    result: "{targetName}님은 {team:이에요}. 이 결과는 나만 볼 수 있어요.",
  },
  assassin: {
    assassin: [
      "{good:이} 3번 성공했어요. 이제 마지막 기회예요.",
      "동료들과 상의한 뒤 {merlin:이라고} 생각하는 한 사람을 지목하세요.",
      "맞히면 {evil:이} 역전승이에요.",
    ],
    others: [
      "{assassin:이} {merlin:을} 찾는 중이에요.",
      "{evil}끼리 상의할 수 있어요. 나머지는 표정 관리!",
    ],
  },
  end: {
    good: {
      quests: "{good}의 승리! {quest} 3번을 모두 지켜냈어요.",
      assassinFailed: "{good}의 승리! {assassin:이} {merlin:을} 찾지 못했어요.",
    },
    evil: {
      fails: "{evil}의 승리! {quest} 3번이 무너졌어요.",
      rejections: "{evil}의 승리! 한 {quest}에서 5번 연속 팀이 {reject}되었어요.",
      assassinHit: "{evil}의 역전승! {assassin:이} {merlin:을} 찾아냈어요.",
    },
    switchedNote: "{name}님은 갈림길에서 편이 바뀌어 {team} 편으로 끝났어요.",
    after: [
      "모든 사람의 역할이 공개됐어요. 누가 누구였는지 이야기 나눠 보세요.",
      "게임 속 의심은 여기서 끝! 서로 수고했다고 말해 주세요.",
    ],
  },
};

// 상황 알림: 조건이 맞을 때 단계 힌트 위에 강조해서 보여주세요. (모두 진영 중립)
// 연결·방장 관련 안내 (모두에게 보여도 괜찮아요)
export const system = {
  offline: "{targetName}님의 연결이 끊겼어요. 같은 폰으로 다시 열면 돌아올 수 있어요.",
  rejoinHostTip: "새 폰으로 들어와야 한다면 {host:이} '{allowRejoin}'을 눌러 주세요.",
  rejoinOpen: "{targetName}님 자리가 2분 동안 열렸어요. 새 폰에서 같은 방 코드와 같은 이름으로 들어오면 돼요.",
  hostAway: "{host:이} 1분 넘게 자리를 비웠어요. 누구든 '{claimHost}'를 누르면 이어서 진행할 수 있어요.",
  newHost: "이제 {targetName}님이 {host:이에요}.",
};

export const alerts = [
  { id: "firstQuest", when: "round == 0 && proposalNo == 1 && phase == 'propose'",
    text: "첫 {quest:이에요}. 아직 정보가 없으니 가볍게 시작해 보세요." },
  { id: "proposal4", when: "proposalNo == 4",
    text: "이번 {quest}에서 4번째 제안이에요. 한 번 더 {reject}되면 마지막 기회만 남아요." },
  { id: "proposal5", when: "proposalNo == 5",
    text: "마지막 제안이에요! 이번에도 {reject}되면 {evil:이} 바로 이겨요." },
  { id: "twoFails", when: "quests[round].failsNeeded == 2",
    text: "이번 {quest:은} {fail} 카드가 2장 나와야 실패예요." },
  { id: "goodMatchPoint", when: "successes == 2",
    text: "{quest} 성공 2번! 한 번만 더 성공하면 {assassinate:이} 시작돼요." },
  { id: "evilMatchPoint", when: "fails == 2",
    text: "{quest} 실패 2번! 한 번 더 실패하면 {evil:이} 이겨요." },
  { id: "loyaltyRevealed", when: "(lancelot == 1 || lancelot == 2) && loyaltyRevealed.at(-1).round == round && proposalNo == 1 && phase == 'propose'",
    text: "이번 {quest}의 {loyalty:이} 적용됐어요. 순례자들의 편을 다시 생각해 보세요." },
  { id: "loyaltySoon", when: "lancelot == 1 && round == 1 && phase == 'propose'",
    text: "다음 {quest}부터 시작할 때마다 {loyalty:이} 한 장씩 공개돼요." },
  { id: "excaliburOn", when: "excalibur && phase == 'propose'",
    text: "이번 팀에는 {excalibur:을} 맡을 사람도 함께 정해요." },
  { id: "ladyNext", when: "settings.lady && (round == 1 || round == 2 || round == 3) && phase == 'propose'",
    text: "이번 {quest:이} 끝나면 {lady:이} 켜져요." },
];

// ───────────────────────── 5. 첫 게임 튜토리얼 ─────────────────────────
// 화면을 넘기는 슬라이드. phase 가 있으면 그 단계에 처음 들어갈 때 코치 말풍선으로도 쓸 수 있어요.
export const tutorial = {
  title: "처음 해 보는 {title}",
  steps: [
    { id: "welcome", title: "환영해요!",
      text: "이 게임은 우리 중 숨어 있는 {evil:을} 찾아내는 게임이에요. 7단계만 따라오면 바로 할 수 있어요." },
    { id: "join", phase: "lobby", title: "1. 방에 들어가기",
      text: "한 사람이 방을 만들고 방 코드를 알려 줘요. 나머지는 코드를 입력해 들어와요. 이름은 서로 알아볼 수 있게 적어 주세요." },
    { id: "seat", phase: "lobby", title: "2. 둥글게 앉기",
      text: "화면에 보이는 순서대로 둥글게 앉아요. {leader} 차례가 이 순서대로 돌아가요." },
    { id: "card", phase: "reveal", title: "3. 내 카드 몰래 보기",
      text: "화면을 가리고 내 역할을 확인해요. {good}인지 {evil}인지, 누가 보이는지 꼭 기억하세요. 그리고 아무 일 없다는 표정!" },
    { id: "propose", phase: "propose", title: "4. {leader:이} 팀 고르기",
      text: "{leader} 표시가 있는 사람이 {quest}에 갈 사람을 골라요. 화면 위에 몇 명이 필요한지 나와요. 다른 사람들은 의견을 말해 줘요." },
    { id: "vote", phase: "vote", title: "5. 다 같이 투표",
      text: "이 팀이 믿을 만하면 {approve}, 수상하면 {reject}. 모두 동시에 공개되니 누가 어떻게 냈는지 잘 봐 두세요." },
    { id: "quest", phase: "quest", title: "6. {quest} 카드 내기",
      text: "팀원만 몰래 카드를 내요. {good:은} {success}만, {evil:은} {success:이나} {fail} 중 골라요. {fail:이} 한 장이라도 나오면 실패예요." },
    { id: "repeat", title: "7. 반복하며 추리하기",
      text: "{quest:은} 모두 5번이에요. 먼저 3번을 가져가는 쪽이 이겨요. 누가 어느 팀에 있었는지, 누가 어떻게 투표했는지가 가장 큰 단서예요." },
    { id: "twist", phase: "assassin", title: "마지막 반전",
      text: "{good:이} 3번 성공해도, {assassin:이} {merlin:을} 맞히면 {evil:이} 역전해요. {merlin:은} 끝까지 숨고, 다른 {good:은} {merlin}인 척해서 헷갈리게 해 주세요." },
    { id: "ready", title: "준비 완료!",
      text: "틀려도 괜찮아요. 첫 판은 연습이에요. 한 판만 해 보면 금방 익숙해질 거예요." },
  ],
  // 첫 판을 같이 보며 이해하는 짧은 예시 (5명)
  example: {
    heading: "예시로 보는 한 판 (5명)",
    lines: [
      "은혜, 소망, 하늘, 다윗, 요셉 다섯 명이 시작해요. {good} 3명, {evil} 2명이에요.",
      "첫 {leader} 은혜가 자신과 하늘을 골라요. 투표는 {approve} 4, {reject} 1로 통과!",
      "{quest} 결과 {fail} 0장. 첫 {quest} 성공이에요.",
      "두 번째 {leader} 소망은 3명을 골라야 해요. 소망, 다윗, 요셉을 골랐지만 {reject} 3으로 부결. {leader:이} 하늘에게 넘어가요.",
      "하늘의 팀(하늘, 은혜, 요셉)이 통과했는데 {fail:이} 1장! 이 셋 중에 {evil:이} 있어요.",
      "이런 단서를 모아 가며 다음 팀을 고르는 거예요.",
    ],
  },
};

// ───────────────────────── 6. 진행자(수련회 리더) 가이드 ─────────────────────────
export const hostGuide = {
  title: "{title} 진행자 가이드",
  intro: "수련회나 모임에서 처음 하는 사람들과도 30분 안에 즐겁게 한 판을 끝낼 수 있도록 돕는 안내예요.",
  sections: [
    {
      heading: "준비물",
      bullets: [
        "한 사람당 폰 1대 (와이파이나 데이터 연결)",
        "한 방에 5~10명. 인원이 많으면 여러 방으로 나눠요. 7~8명이 가장 재미있어요.",
        "둥글게 앉을 자리. 서로 얼굴이 보이는 게 중요해요.",
        "한 판에 20~40분 정도 걸려요. 첫 판은 설명 포함 40분을 잡아 주세요.",
      ],
    },
    {
      heading: "시작 전 (5분)",
      steps: [
        "진행자가 방을 만들고 방 코드를 크게 불러 주거나 적어 보여 줘요.",
        "모두 들어오면 화면에 보이는 순서대로 둥글게 앉아요. {leader} 차례가 이 순서로 돌아가요.",
        "인원에 맞게 역할을 켜요. 아래 추천 구성을 참고하세요.",
        "아래 '3분 설명' 대본을 읽어 주고, 모두 준비를 누르면 시작해요.",
      ],
    },
    {
      heading: "추천 구성",
      presetsRef: true,
      bullets: [
        "첫 판: {merlin:과} {assassin}만 켜요. 나머지는 자동으로 {servant:과} {minion:으로} 채워져요.",
        "익숙해지면: {percival:과} {morgana:을} 함께 켜요. 서로를 견제해서 재미가 커져요.",
        "7명 이상: {mordred:을} 더하고 {lady:을} 켜 보세요.",
        "10명: {oberon}까지 넣으면 {evil} 4명이 모두 특별한 역할이 돼요.",
      ],
    },
    {
      heading: "익숙해지면 해 볼 확장 규칙",
      bullets: [
        "{lancelotGood:과} {lancelotEvil}: 변형 1은 3번째 {quest}부터 {loyalty:이} 한 장씩 공개되며 두 순례자의 편이 바뀔 수 있어요. 변형 2는 카드를 처음부터 펼쳐 두고, 변형 3은 편이 바뀌지 않아요. 처음이면 변형 1을 추천해요.",
        "{excalibur}: {leader:이} 팀원 한 명에게 맡기고, 그 사람이 다른 팀원의 카드 한 장을 뒤집을 수 있어요. 7명 이상에서 재미있어요.",
        "다른 팀 인원표: 5명, 7명 게임의 팀 인원이 달라져요. 같은 사람들끼리 여러 판 할 때 바꿔 보세요.",
        "확장 규칙은 한 번에 하나씩만 더해 보세요. 설명이 길어지면 처음 온 친구들이 힘들어해요.",
      ],
    },
    {
      heading: "3분 설명 대본",
      script: [
        "\"우리 중에 {evil:이} 몰래 숨어 있어요. 나머지는 {good:이에요}.\"",
        "\"{quest:은} 5번 있고, 먼저 3번을 가져가는 쪽이 이겨요.\"",
        "\"매번 {leader:이} 팀을 고르면 다 같이 {approve} {reject} 투표를 해요.\"",
        "\"통과된 팀은 몰래 {success:이나} {fail} 카드를 내요. {fail:이} 한 장이라도 있으면 실패예요. {good:은} {success}만 낼 수 있어요.\"",
        "\"{merlin:은} {evil:을} 알고 있지만 들키면 안 돼요. {good:이} 이겨도 마지막에 {assassin:이} {merlin:을} 맞히면 뒤집혀요.\"",
        "\"말로는 뭐든 해도 되지만, 폰 화면은 절대 보여주지 마세요. 자, 카드 확인해 볼까요?\"",
      ],
    },
    {
      heading: "진행하면서",
      bullets: [
        "토론이 길어지면 팀 제안마다 2~3분 정도로 시간을 정해 주세요.",
        "조용한 사람에게 \"어떻게 생각해요?\" 하고 물어 주면 모두가 참여할 수 있어요.",
        "처음 온 친구나 어린 친구가 몰리지 않게, 의심이 한 사람에게만 쏠리면 분위기를 풀어 주세요.",
        "\"진짜 하나님께 맹세해\"처럼 신앙 고백을 게임 속 증거로 쓰지 않도록 미리 이야기해 주세요. 게임은 게임, 믿음은 믿음이에요.",
        "5번째 제안 차례가 오면 \"이번에 부결되면 {evil:이} 이겨요!\"라고 한 번 더 알려 주세요.",
      ],
    },
    {
      heading: "문제가 생기면",
      bullets: [
        "폰이 꺼지거나 앱이 닫혔다면: 같은 폰으로 다시 열면 자기 자리와 역할로 돌아와요.",
        "다른 폰으로 바꿔야 한다면: 그 사람 연결이 15초 넘게 끊긴 뒤 {host:이} '{allowRejoin}'을 누르면, 2분 동안 새 폰에서 같은 이름으로 들어올 수 있어요.",
        "{host} 폰이 꺼졌다면: 1분이 지나면 다른 사람 화면에 '{claimHost}' 버튼이 생겨요. 누르면 그 사람이 이어서 진행해요.",
        "카드 확인에서 한 사람이 계속 멈춰 있다면: 진행자가 '건너뛰기'로 게임을 시작할 수 있어요.",
        "누군가 실수로 화면을 보여 줬다면: 이번 판은 연습이라 생각하고 끝까지 즐긴 뒤, 끝나면 '다시 시작'으로 새 판을 열어요.",
        "규칙이 헷갈리면: 게임 중에도 설명서 버튼으로 언제든 다시 볼 수 있어요.",
      ],
    },
    {
      heading: "게임이 끝나면 (나눔 5분)",
      bullets: [
        "모든 역할이 공개돼요. 누가 언제 눈치챘는지 이야기 나눠 보세요.",
        "\"그때 왜 {reject}했어?\" 같은 이야기로 웃으며 마무리해요.",
        "의심했던 사람에게 \"미안, 수고했어\" 한마디씩 해 주세요.",
      ],
      reflection: {
        heading: "원하면 짧은 나눔 질문",
        questions: [
          "오늘 누구의 말을 믿었고, 왜 믿었나요?",
          "진짜와 가짜를 구별하는 데 무엇이 도움이 됐나요? (참고: 마태복음 10장 16절, 요한일서 4장 1절)",
          "공동체 안에서 서로를 믿어 주는 건 어떤 의미일까요?",
        ],
      },
    },
  ],
};

// ───────────────────────── 7. 추천 역할 구성 (로비 '추천 구성' 버튼용) ─────────────────────────
// settings 형식은 CONTRACT.md 와 같아요. merlin 을 켜면 엔진이 assassin 을 강제로 켭니다.
const base = { merlin: true, assassin: true, percival: false, morgana: false, mordred: false, oberon: false };
const off = { lancelot: 0, excalibur: false, balance: false };
export const presets = {
  beginner: {
    label: "처음 하는 판",
    desc: "{merlin:과} {assassin}만 있는 가장 단순한 구성",
    byCount: Object.fromEntries([5, 6, 7, 8, 9, 10].map((n) => [n, { roles: { ...base }, lady: false, ...off }])),
  },
  standard: {
    label: "기본 추천",
    desc: "{percival:과} {morgana}까지 넣어 서로 견제하는 구성",
    byCount: {
      5: { roles: { ...base, percival: true, morgana: true }, lady: false, ...off },
      6: { roles: { ...base, percival: true, morgana: true }, lady: false, ...off },
      7: { roles: { ...base, percival: true, morgana: true, mordred: true }, lady: true, ...off },
      8: { roles: { ...base, percival: true, morgana: true, mordred: true }, lady: true, ...off },
      9: { roles: { ...base, percival: true, morgana: true, mordred: true }, lady: true, ...off },
      10: { roles: { ...base, percival: true, morgana: true, mordred: true, oberon: true }, lady: true, ...off },
    },
  },
  expansion: {
    label: "확장 규칙 맛보기",
    desc: "두 순례자(변형 1)와 {excalibur:을} 더한 구성",
    byCount: {
      5: { roles: { ...base }, lady: false, ...off, lancelot: 1 },
      6: { roles: { ...base, percival: true }, lady: false, ...off, lancelot: 1 },
      7: { roles: { ...base, percival: true, morgana: true }, lady: true, ...off, lancelot: 1, excalibur: true },
      8: { roles: { ...base, percival: true, morgana: true }, lady: true, ...off, lancelot: 1, excalibur: true },
      9: { roles: { ...base, percival: true, morgana: true }, lady: true, ...off, lancelot: 1, excalibur: true },
      10: { roles: { ...base, percival: true, morgana: true, mordred: true }, lady: true, ...off, lancelot: 1, excalibur: true },
    },
  },
};

// ───────────────────────── 8. 용어 ─────────────────────────
export const glossary = [
  { term: "{good}", text: "선한 쪽 진영. 사람이 더 많지만 정보가 적어요." },
  { term: "{evil}", text: "숨어 있는 쪽 진영. 사람은 적지만 서로를 알아요." },
  { term: "{quest}", text: "모두 5번 있는 임무. 먼저 3번을 가져가는 쪽이 이겨요." },
  { term: "{leader}", text: "이번에 {quest} 팀을 고르는 사람. 제안마다 옆 사람에게 넘어가요." },
  { term: "{success} / {fail}", text: "{quest} 팀원이 몰래 내는 카드. {good:은} {success}만 낼 수 있어요." },
  { term: "{approve} / {reject}", text: "{leader:이} 고른 팀을 보낼지 정하는 투표." },
  { term: "{lady}", text: "선택 규칙. 한 사람의 진영을 몰래 확인할 수 있는 등불이에요." },
  { term: "{excalibur}", text: "확장 규칙. 팀원 한 명이 다른 팀원의 카드 한 장을 뒤집을 수 있어요." },
  { term: "{loyalty}", text: "확장 규칙. 변형 1에서는 3번째 {quest}부터 한 장씩 공개되고, 변형 2에서는 처음부터 펼쳐 둬요. '{loyaltySwitch}' 카드는 두 순례자의 편을 바꿔요." },
  { term: "{assassinate}", text: "{good:이} 3번 이긴 뒤 {assassin:이} {merlin:을} 찾아 지목하는 마지막 기회." },
];

// 화면 버튼 등에 쓸 짧은 문구
export const ui = {
  helpButton: "설명서",
  quickButton: "1분 설명서",
  fullRulesButton: "전체 규칙",
  tutorialButton: "처음이에요",
  myRoleTipsButton: "내 역할 팁",
  hostGuideButton: "진행자 가이드",
  next: "다음",
  prev: "이전",
  close: "닫기",
  done: "알겠어요",
  skipTutorial: "건너뛰기",
  language: "언어",
  langKo: "한국어",
  langEn: "English",
  moduleTag: "확장",
};
