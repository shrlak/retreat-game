// 빛의 원정대 — theme & names. Change names/texts here only. Role KEYS are fixed (see CONTRACT.md).
// Mapping to the classic roles is kept in `classic` for reference.
window.THEME = {
  title: "빛의 원정대",
  subtitle: "수련회 숨은 역할 추리 게임",
  teams: {
    good: { name: "빛의 일꾼들", short: "빛", color: "#f4c95d" },
    evil: { name: "유혹의 무리", short: "유혹", color: "#8e6cc8" },
  },
  roles: {
    merlin:   { classic: "seer",        name: "선지자",          short: "선지자", team: "good", art: "./assets/roles/merlin.svg",
                desc: "유혹의 무리가 누구인지 알고 있어요. 단, 양의 탈을 쓴 늑대는 보이지 않아요. 끝까지 정체를 들키지 마세요." },
    percival: { classic: "protector",   name: "파수꾼",          short: "파수꾼", team: "good", art: "./assets/roles/percival.svg",
                desc: "선지자 후보 두 명이 보여요. 한 명은 진짜 선지자, 한 명은 거짓 선지자예요. 진짜를 지켜 주세요." },
    servant:  { classic: "loyal",       name: "빛의 일꾼",       short: "일꾼",   team: "good", art: "./assets/roles/servant.svg",
                desc: "아무 정보도 없지만, 대화와 투표로 유혹의 무리를 찾아내 사명을 성공시키세요." },
    assassin: { classic: "assassin",    name: "정탐꾼",          short: "정탐꾼", team: "evil", art: "./assets/roles/assassin.svg",
                desc: "빛의 일꾼들이 사명을 3번 성공해도, 마지막에 선지자를 정확히 지목하면 유혹의 무리가 이겨요." },
    morgana:  { classic: "false seer",  name: "거짓 선지자",     short: "거짓",   team: "evil", art: "./assets/roles/morgana.svg",
                desc: "파수꾼에게 선지자처럼 보여요. 진짜 선지자인 척해서 파수꾼을 헷갈리게 하세요." },
    mordred:  { classic: "hidden lord", name: "양의 탈을 쓴 늑대", short: "늑대",  team: "evil", art: "./assets/roles/mordred.svg",
                desc: "선지자에게도 보이지 않는 유혹의 무리예요. 빛의 일꾼인 척 숨어 있으세요." },
    oberon:   { classic: "lone evil",   name: "방황하는 자",     short: "방황",   team: "evil", art: "./assets/roles/oberon.svg",
                desc: "유혹의 무리지만 동료를 모르고, 동료도 당신을 몰라요. 선지자에게는 보여요." },
    minion:   { classic: "minion",      name: "유혹하는 자",     short: "유혹",   team: "evil", art: "./assets/roles/minion.svg",
                desc: "동료 유혹하는 자들을 알고 있어요. 몰래 사명을 방해하세요." },
    // optional module: 갈림길의 순례자 (classic: Lancelot). Can switch sides when a 갈림길 카드 says so.
    lancelotGood: { classic: "good lancelot", en: "Good Lancelot", name: "갈림길의 순례자 (선한 랜슬롯)", baseName: "갈림길의 순례자", subtitle: "선한 랜슬롯", short: "순례자", team: "good", art: "./assets/roles/lancelotGood.svg",
                desc: "빛의 일꾼 편으로 시작해요. 변형 1·2에서는 갈림길 카드에 따라 편이 바뀔 수 있어요. 늘 지금 내 편으로 카드를 내세요." },
    lancelotEvil: { classic: "evil lancelot", en: "Evil Lancelot", name: "갈림길의 그림자 (악한 랜슬롯)", baseName: "갈림길의 그림자", subtitle: "악한 랜슬롯", short: "그림자", team: "evil", art: "./assets/roles/lancelotEvil.svg",
                desc: "유혹의 무리 편으로 시작해요. 변형 1·2에서는 갈림길 카드에 따라 편이 바뀔 수 있어요. 늘 지금 내 편으로 카드를 내세요." },
  },
  terms: {
    quest: "사명", questTeam: "원정대", leader: "조장",
    success: "축복", fail: "방해",
    approve: "찬성", reject: "반대",
    lady: "등불", ladyAction: "등불로 비추기",
    assassinate: "선지자 지목", host: "방장",
    ready: "준비 완료", notReady: "준비하기",
    lancelot: "갈림길의 순례자 (랜슬롯)", loyalty: "갈림길 카드", loyaltyNone: "그대로", loyaltySwitch: "편이 바뀜",
    lancelotVariant1: "변형 1: 3번째 사명부터 갈림길 카드 한 장씩", lancelotVariant2: "변형 2: 갈림길 카드를 처음부터 펼쳐 둠, 카드는 편대로", lancelotVariant3: "변형 3: 편은 안 바뀌고 두 랜슬롯이 서로 앎", loyaltyPlan: "펼쳐 둔 갈림길 카드", lancelotForced: "지금 편대로만 낼 수 있어요",
    excalibur: "말씀 두루마리", excaliburEn: "Excalibur", lancelotEn: "Lancelot", excaliburAction: "카드 하나 뒤집기", excaliburPass: "뒤집지 않기",
    allowRejoin: "다시 입장 허용", claimHost: "방장 맡기",
  },
  knowledgeText: {
    evil: "유혹의 무리",
    merlinCandidate: "선지자 후보",
    lancelot: "또 다른 랜슬롯",
  },
  winText: {
    quests: "빛의 일꾼들이 사명 3번을 이뤘어요",
    assassinFailed: "정탐꾼이 선지자를 찾지 못했어요",
    assassinHit: "정탐꾼이 선지자를 찾아냈어요",
    rejections: "원정대가 5번 연속 반대로 무산됐어요",
    fails: "사명이 3번 방해받았어요",
  },
};
// English. Same keys as THEME; the UI overlays THEME.i18n.en on THEME when the language is "en".
// Language choice: localStorage "mist.lang" = "ko" | "en" (default "ko"), switchable on the home screen.
window.THEME.i18n = {
  ko: {},
  en: {
    title: "Light Expedition",
    subtitle: "A hidden-role deduction game for retreats",
    teams: { good: { name: "Workers of Light", short: "Light" }, evil: { name: "The Tempters", short: "Tempters" } },
    roles: {
      merlin:   { name: "Prophet", short: "Prophet", desc: "You know who the Tempters are, except the Wolf in Sheep's Clothing. Don't let them find out who you are." },
      percival: { name: "Watchman", short: "Watchman", desc: "You see two Prophet candidates: the real Prophet and the False Prophet. Protect the real one." },
      servant:  { name: "Worker of Light", short: "Worker", desc: "You know nothing, but with talk and votes you can find the Tempters and complete the missions." },
      assassin: { name: "Spy", short: "Spy", desc: "Even if the Light completes 3 missions, the Tempters win if you point out the Prophet at the end." },
      morgana:  { name: "False Prophet", short: "False", desc: "You look like the Prophet to the Watchman. Act like the real Prophet to confuse them." },
      mordred:  { name: "Wolf in Sheep's Clothing", short: "Wolf", desc: "A Tempter the Prophet can't see. Hide as a Worker of Light." },
      oberon:   { name: "Wanderer", short: "Wanderer", desc: "You're a Tempter, but you don't know the others and they don't know you. The Prophet can see you." },
      minion:   { name: "Tempter", short: "Tempter", desc: "You know your fellow Tempters. Quietly hinder the missions." },
      lancelotGood: { name: "Good Lancelot", baseName: "Good Lancelot", subtitle: "", short: "Lancelot", desc: "You start with the Light. In Variants 1 and 2 a crossroads card can switch your side. Always play for your current side." },
      lancelotEvil: { name: "Evil Lancelot", baseName: "Evil Lancelot", subtitle: "", short: "Lancelot", desc: "You start with the Tempters. In Variants 1 and 2 a crossroads card can switch your side. Always play for your current side." },
    },
    terms: {
      quest: "Mission", questTeam: "Expedition", leader: "Leader",
      success: "Blessing", fail: "Hindrance",
      approve: "Approve", reject: "Reject",
      lady: "Lamp", ladyAction: "Shine the Lamp",
      assassinate: "Point out the Prophet", host: "Host",
      ready: "Ready", notReady: "Get ready",
      lancelot: "Lancelot", loyalty: "Crossroads card", loyaltyNone: "No change", loyaltySwitch: "Sides switch",
      lancelotVariant1: "Variant 1: a crossroads card each round from mission 3", lancelotVariant2: "Variant 2: cards dealt face up, Lancelots play for their side", lancelotVariant3: "Variant 3: no switching, the Lancelots know each other", loyaltyPlan: "Crossroads cards on the table", lancelotForced: "You can only play for your current side",
      excalibur: "Scroll of the Word", excaliburAction: "Flip one card", excaliburPass: "Don't flip",
      allowRejoin: "Allow rejoin", claimHost: "Become host",
    },
    knowledgeText: { evil: "Tempter", merlinCandidate: "Prophet candidate", lancelot: "The other Lancelot" },
    winText: {
      quests: "The Workers of Light completed 3 missions",
      assassinFailed: "The Spy couldn't find the Prophet",
      assassinHit: "The Spy found the Prophet",
      rejections: "The expedition was rejected 5 times in a row",
      fails: "3 missions were hindered",
    },
  },
};
// Backend (public values only; the function keeps all secrets).
window.BACKEND = {
  fnUrl: "https://datihyxdmpshreyifvzn.supabase.co/functions/v1/mist-game",
  supabaseUrl: "https://datihyxdmpshreyifvzn.supabase.co",
  anonKey: "sb_publishable_ELxGSab8ISe1RaejUkKNtw_urwJd2ed",
};
