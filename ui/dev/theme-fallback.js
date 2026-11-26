/* 빛의 원정대 — fallback THEME for the dev harness, used only when web/config.js didn't load.
 * Same shape as CONTRACT.md "THEME shape". Classic script. */
if (!window.THEME) window.THEME = {
  title: "빛의 원정대",
  subtitle: "수련회 숨은 역할 추리 게임",
  teams: {
    good: { name: "빛의 일꾼들", color: "#ffd77a" },
    evil: { name: "유혹의 무리", color: "#e0486e" },
  },
  roles: {
    merlin: {
      name: "선지자", short: "선지자", team: "good", art: "./assets/roles/merlin.svg",
      desc: "유혹의 무리가 누구인지 미리 알고 있어요(양의 탈을 쓴 늑대만 빼고). 조용히 친구들을 바른 길로 이끌되, 정체는 끝까지 들키지 마세요.",
    },
    percival: {
      name: "파수꾼", short: "파수꾼", team: "good", art: "./assets/roles/percival.svg",
      desc: "선지자일지도 모르는 두 사람이 보여요. 한 명은 진짜 선지자, 한 명은 거짓 선지자예요. 진짜 선지자를 곁에서 지켜 주세요.",
    },
    servant: {
      name: "빛의 일꾼", short: "일꾼", team: "good", art: "./assets/roles/servant.svg",
      desc: "특별한 정보는 없지만, 대화와 투표로 진실을 찾아갈 수 있어요. 서로 믿고 힘을 모아 사명을 이뤄 주세요.",
    },
    assassin: {
      name: "정탐꾼", short: "정탐꾼", team: "evil", art: "./assets/roles/assassin.svg",
      desc: "빛의 일꾼들이 사명을 세 번 이루어도, 마지막에 선지자를 정확히 찾아 지목하면 유혹의 무리가 이겨요.",
    },
    morgana: {
      name: "거짓 선지자", short: "거짓", team: "evil", art: "./assets/roles/morgana.svg",
      desc: "파수꾼의 눈에는 선지자처럼 보여요. 진짜 선지자인 척 다정하게 다가가 파수꾼을 헷갈리게 하세요.",
    },
    mordred: {
      name: "양의 탈을 쓴 늑대", short: "늑대", team: "evil", art: "./assets/roles/mordred.svg",
      desc: "선지자에게도 보이지 않는 유혹의 무리예요. 순한 양처럼 빛의 일꾼들 사이에 섞여 지내세요.",
    },
    oberon: {
      name: "방황하는 자", short: "방황", team: "evil", art: "./assets/roles/oberon.svg",
      desc: "유혹의 무리지만 동료를 모르고, 동료도 당신을 몰라요. 선지자에게는 보이니 혼자서 슬기롭게 움직이세요.",
    },
    minion: {
      name: "유혹하는 자", short: "유혹", team: "evil", art: "./assets/roles/minion.svg",
      desc: "함께하는 유혹의 무리를 알고 있어요. 티 나지 않게 사명을 살짝 방해해 보세요.",
    },
  },
  terms: {
    quest: "사명", leader: "조장", success: "축복", fail: "방해",
    approve: "찬성", reject: "반대", lady: "등불", assassinate: "지목", team: "원정대",
  },
  knowledgeText: {
    evil: "유혹의 무리",
    merlinCandidate: "선지자일지도",
  },
};
