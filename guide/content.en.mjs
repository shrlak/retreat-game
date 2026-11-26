// Fellowship of Light — English in-game guide (same structure and keys as content.mjs).
// Edit this file, then run `node build.mjs`.
// Name placeholders: {merlin} {percival} ... {good} {evil} {quest} {leader} {success} {fail} ... (same keys as Korean).
// No particle suffixes in English. Names are written without "the"; the text adds articles.
// Same rules as the original board game; all wording is original.

export const DEFAULT_NAMES = {
  title: "Fellowship of Light",
  good: "Workers of Light",
  evil: "Tempters",
  merlin: "Prophet",
  percival: "Watchman",
  servant: "Worker of Light",
  assassin: "Spy",
  morgana: "False Prophet",
  mordred: "Wolf in Sheep's Clothing",
  oberon: "Wanderer",
  minion: "Tempter",
  lancelotGood: "Good Lancelot",
  lancelotEvil: "Evil Lancelot",
  lancelot: "Lancelot",
  quest: "Mission",
  leader: "Group Leader",
  success: "Blessing",
  fail: "Hindrance",
  approve: "Approve",
  reject: "Reject",
  lady: "Lamp",
  assassinate: "Prophet Hunt",
  excalibur: "Scroll of the Word",
  loyalty: "Crossroads card",
  loyaltyNone: "Stay",
  loyaltySwitch: "Switch sides",
  questTeam: "mission team",
  host: "Host",
  allowRejoin: "Allow rejoin",
  claimHost: "Take over as host",
};

// ───────────────────────── 1. Home-screen quick guide ─────────────────────────
export const quick = {
  title: "1-Minute Guide",
  pages: [
    {
      heading: "What is this game?",
      lines: [
        "Some {evil} are secretly hiding among us.",
        "The {good} win by completing 3 of 5 {quest}s with {success}s. The {evil} win by spoiling 3 {quest}s with {fail}s.",
        "Talk, vote and figure out who is who. For 5 to 10 players.",
      ],
    },
    {
      heading: "How a round works",
      steps: [
        "The {leader} picks a {quest} team.",
        "Everyone votes {approve} or {reject} at the same time. More than half must approve.",
        "If approved, only team members secretly play a {success} or {fail} card.",
        "Even one {fail} card means the {quest} fails.",
        "If rejected, the next player becomes {leader}. Five rejections in a row on one {quest} and the {evil} win at once.",
      ],
    },
    {
      heading: "The roles in one line",
      roles: [
        { key: "merlin", line: "Knows the {evil} from the start. Helps quietly without getting caught." },
        { key: "percival", line: "Sees two {merlin} candidates. Protect the real one." },
        { key: "servant", line: "Knows nothing. Wins with sharp eyes and good reasoning." },
        { key: "assassin", line: "If the {good} win, gets one last chance to find the {merlin} and steal the win." },
        { key: "morgana", line: "Looks like the {merlin} to the {percival}. Pretends to be the real one." },
        { key: "mordred", line: "The hidden leader that even the {merlin} cannot see." },
        { key: "oberon", line: "One of the {evil}, but doesn't know the others, and they don't know them." },
        { key: "minion", line: "An ordinary member of the {evil}. Knows their teammates." },
        { key: "lancelotGood", module: "lancelot", line: "(Expansion) Starts with the {good}, but a {loyalty} can switch their side." },
        { key: "lancelotEvil", module: "lancelot", line: "(Expansion) Starts with the {evil}, but a {loyalty} can switch their side." },
      ],
    },
    {
      heading: "Remember",
      lines: [
        "Never show your phone screen to anyone.",
        "You can say anything out loud. Lying in the game is just part of the fun.",
        "The {good} can only play {success}.",
        "Even after 3 wins for the {good}, the {evil} win if the {assassin} finds the {merlin}.",
      ],
    },
  ],
};

// ───────────────────────── 2. Full rules ─────────────────────────
export const overview = {
  title: "{title} Rules",
  intro:
    "Some {evil} have slipped in among your retreat friends. Decide whom to trust as you set out on five {quest}s together in this hidden-role deduction game.",
  sections: [
    {
      id: "teams",
      heading: "Two sides",
      body: [
        "{good}: there are more of them, but most don't know who the {evil} are.",
        "{evil}: there are fewer of them, but most know exactly who their teammates are.",
        "When the game starts, everyone secretly checks their own role card on their phone.",
      ],
    },
    {
      id: "win",
      heading: "How to win",
      body: [
        "The {good} win by completing 3 {quest}s. If the {merlin} is in the game, they must also survive the {assassin}'s {assassinate} at the end.",
        "The {evil} win if any one of these happens:",
      ],
      bullets: [
        "3 {quest}s fail",
        "A team is rejected 5 times in a row on one {quest}",
        "After 3 wins for the {good}, the {assassin} correctly names the {merlin}",
      ],
    },
    {
      id: "round",
      heading: "How a round goes",
      steps: [
        { title: "Propose", text: "This round's {leader} picks exactly the required number of players for the {quest}. They may include themselves." },
        { title: "Discuss", text: "Talk freely about why this team, and who seems suspicious." },
        { title: "Vote", text: "Everyone taps {approve} or {reject} at the same time. Who voted which way is shown to all." },
        { title: "Result", text: "If more than half approve, the team sets out. On a tie or more rejects, the {leader} role moves to the next player." },
        { title: "Mission", text: "Only team members secretly play a {success} or {fail} card. The {good} can only play {success}." },
        { title: "Reveal", text: "The cards are shuffled and only the number of {fail}s is shown. Nobody knows who played what. One {fail} is enough to fail." },
      ],
      after: "The next round starts with the {leader} role passing one seat along.",
    },
    {
      id: "special",
      heading: "Good to know",
      bullets: [
        "With 7 or more players, the fourth {quest} only fails if 2 {fail}s are played.",
        "If the fifth proposal on one {quest} is rejected too, the {evil} win immediately. So the fifth vote really matters.",
        "Once a {quest} goes ahead, the rejection count starts again from 0.",
        "The {evil} may play either {success} or {fail}. Sometimes they play {success} on purpose to earn trust.",
        "Everyone can see which roles are in the game. Only who holds each role is secret.",
      ],
    },
    {
      id: "assassinate",
      heading: "The final twist: {assassinate}",
      body: [
        "Completing 3 {quest}s is not quite the end. The {evil} talk it over, and the {assassin} names the one person they think is the {merlin}.",
        "If they are right, the {evil} steal the win. If they are wrong, the {good} win for good. That's why the {merlin} must stay hidden to the very end.",
      ],
    },
    {
      id: "lady",
      heading: "The {lady} (optional rule)",
      body: [
        "This rule is used only if the host turns it on. Recommended for 7 or more players.",
        "The player to the right of the first {leader} starts with the {lady}.",
        "After the 2nd, 3rd and 4th {quest}s, the {lady} holder picks one player and secretly learns their side ({good} or {evil}).",
        "The player who was checked receives the {lady} next. Anyone who has already held it cannot be picked.",
        "Everyone sees who checked whom, but only the holder sees the answer. Whether to share it, or to share it truthfully, is up to them.",
      ],
    },
    {
      id: "lancelot",
      module: "lancelot",
      heading: "Expansion: {lancelotGood} and {lancelotEvil}",
      body: [
        "This expansion is used only if the host turns it on. The two Lancelots join the game, and the {lancelotEvil} takes one of the {evil} seats.",
        "A deck of 5 {loyalty}s (3 {loyaltyNone}, 2 {loyaltySwitch}) is shuffled. At the start of the 3rd, 4th and 5th {quest}s, one card is shown to everyone.",
        "When a '{loyaltySwitch}' card comes up, the two Lancelots swap sides. If another one comes up, they swap back.",
        "{quest} cards, the {lady}'s answer and the final result all use each Lancelot's current side. A Lancelot currently with the {good} can only play {success}.",
      ],
      bullets: [
        "Quiet Crossroads: the {lancelotEvil} and the other {evil} don't know each other. The {merlin} still sees the {lancelotEvil} as one of the {evil}.",
        "Known Crossroads: the two Lancelots recognise each other, and the {lancelotEvil} and the other {evil} also know each other.",
        "The {lancelotEvil} never carries out the {assassinate}.",
      ],
    },
    {
      id: "excalibur",
      module: "excalibur",
      heading: "The {excalibur} (expansion)",
      body: [
        "When proposing a team, the {leader} also hands the {excalibur} to one team member. They can't give it to themselves.",
        "After everyone on the team has played a card, the {excalibur} holder may flip one other team member's card to the opposite. They can also choose not to.",
        "Only the holder learns what the flipped card originally was. Everyone sees whose card was flipped, and by whom.",
      ],
    },
    {
      id: "balance",
      module: "balance",
      heading: "Alternate team sizes (optional)",
      body: [
        "If the host turns this on, the team sizes change for 5 and 7 player games.",
        "5 players: 3 · 2 · 3 · 2 · 3",
        "7 players: 2 · 3 · 4 · 3 · 4 (the fourth {quest} still needs 2 {fail}s)",
      ],
    },
    {
      id: "talk",
      heading: "Table talk",
      bullets: [
        "You can say anything out loud. Suspicion, excuses and bluffing are all part of the game.",
        "The one thing you may not do is show your screen or look at someone else's.",
        "Cover your screen when you vote and when you play a {quest} card.",
        "Lying in the game is just play. When it's over, smile and bless one another.",
      ],
    },
  ],
  table: {
    heading: "Players and teams",
    columns: ["Players", "{good}", "{evil}", "Team size per {quest}"],
    rows: [
      ["5", "3", "2", "2 · 3 · 2 · 3 · 3"],
      ["6", "4", "2", "2 · 3 · 4 · 3 · 4"],
      ["7", "4", "3", "2 · 3 · 3 · 4* · 4"],
      ["8", "5", "3", "3 · 4 · 4 · 5* · 5"],
      ["9", "6", "3", "3 · 4 · 4 · 5* · 5"],
      ["10", "6", "4", "3 · 4 · 4 · 5* · 5"],
    ],
    note: "* This {quest} only fails with 2 {fail}s.",
  },
};

// ───────────────────────── 3. Role cards ─────────────────────────
// Shown on the card reveal and "my role" sheet. They reveal your side: show only on the player's own phone.
export const roles = {
  merlin: {
    team: "good",
    tagline: "Knows everything, but can't say it",
    know: [
      "You can see most of the {evil}.",
      "But the {mordred} is hidden from you.",
      "The {oberon} shows up as one of the {evil}.",
      "You don't know which {evil} role each of them has.",
    ],
    goal: [
      "Guide the {good} to complete 3 {quest}s.",
      "Keep the {assassin} from finding out who you are, right to the end.",
    ],
    tips: [
      "Saying \"That person is one of the {evil}!\" makes you an instant target. Nudge people with questions and votes instead.",
      "Now and then, act unsure or suspect the wrong person. Being too accurate gets you noticed.",
      "Reject teams that include the {evil}, but don't always be the only one who does.",
      "If the {percival} is in the game, they'll try to protect you. Trust them.",
    ],
    seenBy: "The {percival} sees you as a {merlin} candidate.",
  },
  percival: {
    team: "good",
    tagline: "The one who protects the {merlin}",
    know: [
      "You can see {merlin} candidates.",
      "If the {morgana} is in the game, you see two candidates and can't tell which one is real.",
      "If there is no {morgana}, the person you see is the real {merlin}.",
    ],
    goal: [
      "Work out the real {merlin} and follow their hints.",
      "Keep the {assassin} from finding the {merlin}.",
    ],
    tips: [
      "Compare which teams the two candidates approve and reject. Whoever matches the results better is more likely the real one.",
      "Acting as if you know things can draw the {assassin}'s attention to you instead.",
      "Even when you're sure, never point out the real one in public. That puts the {merlin} in danger.",
    ],
    seenBy: "Nobody sees you in any special way.",
  },
  servant: {
    team: "good",
    tagline: "Fights with faith and sharp eyes",
    know: ["You have no information. That leaves you free to reason most honestly of all."],
    goal: ["Uncover the {evil} and complete 3 {quest}s."],
    tips: [
      "Watch the vote history. Someone who keeps approving teams that fail is suspicious.",
      "Remember who was on teams that got a {fail}. That narrows things down.",
      "Ask questions whenever you're curious. How people answer tells you a lot.",
      "At the end, acting as if you know something can confuse the {assassin}.",
    ],
    seenBy: "Nobody sees you in any special way.",
  },
  assassin: {
    team: "evil",
    tagline: "Holds the final move",
    know: [
      "You can see your fellow {evil}.",
      "But the {oberon} is hidden from you.",
    ],
    goal: [
      "Make 3 {quest}s fail, or",
      "if the {good} complete 3, find and name the {merlin} at the end.",
    ],
    tips: [
      "All game long, watch who seems to know too much. Someone who avoids the {evil} from the very start may be the {merlin}.",
      "Playing {fail} every time gets you caught fast. Playing {success} early can build trust.",
      "When you're on a team with a teammate, try to avoid both of you playing {fail}.",
      "Before the final pick, talk it through with your teammates.",
    ],
    seenBy: "The {merlin} sees you as one of the {evil}.",
  },
  morgana: {
    team: "evil",
    tagline: "Pretends to be a person of light",
    know: [
      "You can see your fellow {evil}.",
      "But the {oberon} is hidden from you.",
    ],
    goal: [
      "Fool the {percival} into believing you are the {merlin}.",
      "Make 3 {quest}s fail.",
    ],
    tips: [
      "Share opinions with confidence, like the real {merlin} would. The {percival} is trying to decide between you and the real one.",
      "If you suspect who the real {merlin} is, quietly let the {assassin} know.",
    ],
    seenBy: "The {percival} sees you as a {merlin} candidate, and the {merlin} sees you as one of the {evil}.",
  },
  mordred: {
    team: "evil",
    tagline: "The hidden leader even the {merlin} can't see",
    know: [
      "You can see your fellow {evil}.",
      "But the {oberon} is hidden from you.",
    ],
    goal: ["Win the deep trust of the {good}, and make 3 {quest}s fail."],
    tips: [
      "Even the {merlin} doesn't know you. So act boldly, like one of the {good}.",
      "If someone suspects you, it's only guesswork, not something the {merlin} saw. Stay calm and explain yourself.",
      "Playing a {fail} on an important {quest} after you've earned trust hits hardest.",
    ],
    seenBy: "Even the {merlin} can't see you. Only your fellow {evil} know you.",
  },
  oberon: {
    team: "evil",
    tagline: "One of the {evil}, wandering alone",
    know: [
      "You can't see anyone.",
      "The other {evil} don't know who you are either.",
    ],
    goal: ["Make 3 {quest}s fail, even without knowing your teammates."],
    tips: [
      "Since you don't know your teammates, watch who was on teams that got a {fail}.",
      "A teammate may be on your team. Two {fail}s puts suspicion on both of you, so pick your moment.",
      "Remember that the {merlin} sees you as one of the {evil}.",
    ],
    seenBy: "The {merlin} sees you as one of the {evil}. Your fellow {evil} can't see you.",
  },
  minion: {
    team: "evil",
    tagline: "Quietly stirs things up",
    know: [
      "You can see your fellow {evil}.",
      "But the {oberon} is hidden from you.",
    ],
    goal: ["Make 3 {quest}s fail, and help find the {merlin}."],
    tips: [
      "Suspect people and ask questions like one of the {good}. Staying too quiet stands out.",
      "Don't defend a suspected teammate too hard. You may get caught together.",
      "Remember who looks like the {merlin}, and tell your teammates at the final pick.",
    ],
    seenBy: "The {merlin} sees you as one of the {evil}.",
  },
  lancelotGood: {
    team: "good",
    module: "lancelot",
    tagline: "A Lancelot of the light, standing at a crossroads",
    know: [
      "Quiet Crossroads: you can't see anyone.",
      "Known Crossroads: you can see the {lancelotEvil}, and they know you too.",
    ],
    goal: [
      "Help your current side win. You start with the {good}.",
      "From the 3rd {quest} on, a '{loyaltySwitch}' card can move you to the {evil}.",
    ],
    tips: [
      "Every time a {loyalty} is turned over, check your current side again. The result uses your side at the very end.",
      "While you're with the {good}, you can only play {success}. With the {evil}, you can play {fail} too.",
      "Your side may change, so don't sound too certain too early.",
    ],
    seenBy: "In Known Crossroads, the {lancelotEvil} can see you. Otherwise nobody can.",
  },
  lancelotEvil: {
    team: "evil",
    module: "lancelot",
    tagline: "A Lancelot in shadow, standing at a crossroads",
    know: [
      "Quiet Crossroads: you can't see anyone, and the other {evil} don't know you.",
      "Known Crossroads: you can see your fellow {evil} and the {lancelotGood}, and they know you too.",
    ],
    goal: [
      "Help your current side win. You start with the {evil}.",
      "From the 3rd {quest} on, a '{loyaltySwitch}' card can move you to the {good}.",
    ],
    tips: [
      "The {merlin} sees you as one of the {evil} from the start, and isn't told if your side changes.",
      "If you end up with the {good}, you can only play {success}.",
      "You never carry out the {assassinate}. Just share your opinion with your teammates.",
    ],
    seenBy: "The {merlin} sees you as one of the {evil}. In Known Crossroads, your fellow {evil} and the {lancelotGood} see you too.",
  },
};

export const knowledgeLabels = {
  evil: "{evil}",
  merlinCandidate: "{merlin} candidate",
  lancelot: "The other Lancelot",
  emptyGood: "You can't see anyone. Use conversation and votes to work it out.",
  emptyOberon: "You can't see any teammates. You can do this on your own.",
};

// ───────────────────────── 4. Phase hints ─────────────────────────
// Team-neutral: safe to show on screen all the time.
export const phaseHints = {
  lobby: {
    host: [
      "Once everyone is in, choose the roles in Settings. You can also tap a recommended setup.",
      "First time? Try with only the {merlin} and the {assassin} turned on.",
      "You can start when everyone is ready.",
    ],
    guest: [
      "Share the room code with your friends.",
      "Sit in a circle in the order people joined, so the {leader} order is easy to follow.",
      "Tap Ready when you're set.",
    ],
  },
  reveal: {
    all: [
      "Cover your screen with your hand and check your role.",
      "Tap Confirm when you're done. The game begins once everyone has confirmed.",
      "Keep a straight face from here on.",
    ],
  },
  propose: {
    leader: [
      "You are this round's {leader}. Choose {size} players for the {quest}.",
      "Explaining your choice first makes the vote easier.",
      "You can include yourself.",
    ],
    leaderExcalibur: [
      "Give the {excalibur} to one team member. You can't give it to yourself.",
    ],
    others: [
      "{leaderName} is choosing a team.",
      "If you want someone on or off the team, say so now.",
    ],
  },
  vote: {
    all: [
      "Send this team on the {quest}? Choose {approve} or {reject}.",
      "All votes are revealed at once. Remember who voted which way.",
      "More than half must {approve} for the team to go.",
    ],
    voted: ["Vote in! Waiting for the others."],
  },
  voteResult: {
    approved: "{approve} {yes}, {reject} {no}. The team sets out on the {quest}!",
    rejected: "{approve} {yes}, {reject} {no}. Rejected, so the next {leader} takes over.",
  },
  quest: {
    onTeam: [
      "Secretly choose {success} or {fail}.",
      "The {good} can only play {success}.",
      "Cover your screen when you tap.",
    ],
    offTeam: [
      "The team is on the {quest}.",
      "When the result comes in, remember who was on the team.",
    ],
    played: ["Card played. Waiting for the result."],
  },
  questResult: {
    success: "{quest} complete! {fails} {fail} card(s).",
    successWithFail: "{fails} {fail} card(s) came up, but this {quest} needs 2, so it succeeds!",
    fail: "{quest} failed. {fails} {fail} card(s).",
  },
  excalibur: {
    holder: [
      "You hold the {excalibur}. You may flip one other team member's card to the opposite.",
      "You can also choose not to flip anything.",
      "If you flip a card, only you learn what it originally was.",
    ],
    others: [
      "{holderName} is deciding whether to use the {excalibur}.",
      "Everyone will see whose card gets flipped.",
    ],
    used: "{holderName} flipped {targetName}'s card.",
    passed: "{holderName} chose not to flip any card.",
    result: "{targetName}'s original card was {card}. It has now been flipped.",
  },
  loyalty: {
    none: "A {loyalty} was revealed: {loyaltyNone}. The Lancelots keep their sides.",
    switch: "A {loyalty} was revealed: {loyaltySwitch}! The two Lancelots have swapped sides.",
    left: "{loyalty}s left: {count}",
    // Show only on that Lancelot's own phone, when they tap (it reveals their side).
    mySwitchSecret: "Your side has changed. You are now with the {team}.",
  },
  lady: {
    holder: [
      "Shine the {lady} on one player. Only you will learn their side.",
      "You can't pick anyone who has already held the {lady}.",
      "Whether and how you share the result is up to you.",
    ],
    others: [
      "{holderName} is shining the {lady} on someone.",
      "Everyone can see who they pick.",
    ],
    result: "{targetName} is with the {team}. Only you can see this.",
  },
  assassin: {
    assassin: [
      "The {good} have completed 3 {quest}s. This is your last chance.",
      "Talk with your teammates, then name the one person you think is the {merlin}.",
      "Get it right and the {evil} steal the win.",
    ],
    others: [
      "The {assassin} is searching for the {merlin}.",
      "The {evil} may talk it over. Everyone else, keep a straight face!",
    ],
  },
  end: {
    good: {
      quests: "The {good} win! They completed all 3 {quest}s.",
      assassinFailed: "The {good} win! The {assassin} couldn't find the {merlin}.",
    },
    evil: {
      fails: "The {evil} win! 3 {quest}s were spoiled.",
      rejections: "The {evil} win! A team was rejected 5 times in a row on one {quest}.",
      assassinHit: "The {evil} steal the win! The {assassin} found the {merlin}.",
    },
    switchedNote: "{name} switched sides at the crossroads and finished with the {team}.",
    after: [
      "Every role has been revealed. Talk about who was who.",
      "The suspicion ends here! Tell each other well done.",
    ],
  },
};

export const system = {
  offline: "{targetName} lost connection. Reopening on the same phone brings them back.",
  rejoinHostTip: "If they need to use a new phone, the {host} can tap '{allowRejoin}'.",
  rejoinOpen: "{targetName}'s seat is open for 2 minutes. Join from the new phone with the same room code and the same name.",
  hostAway: "The {host} has been away for over a minute. Anyone can tap '{claimHost}' to keep the game going.",
  newHost: "{targetName} is now the {host}.",
};

export const alerts = [
  { id: "firstQuest", when: "round == 0 && proposalNo == 1 && phase == 'propose'",
    text: "This is the first {quest}. There's no information yet, so start light." },
  { id: "proposal4", when: "proposalNo == 4",
    text: "This is the 4th proposal for this {quest}. One more {reject} leaves only the last chance." },
  { id: "proposal5", when: "proposalNo == 5",
    text: "Last proposal! If this one is rejected, the {evil} win immediately." },
  { id: "twoFails", when: "quests[round].failsNeeded == 2",
    text: "This {quest} only fails if 2 {fail} cards are played." },
  { id: "goodMatchPoint", when: "successes == 2",
    text: "2 {quest}s complete! One more and the {assassinate} begins." },
  { id: "evilMatchPoint", when: "fails == 2",
    text: "2 {quest}s failed! One more failure and the {evil} win." },
  { id: "loyaltyRevealed", when: "lancelot && round >= 2 && proposalNo == 1 && phase == 'propose'",
    text: "A {loyalty} was revealed as this {quest} began. Think again about the Lancelots' sides." },
  { id: "loyaltySoon", when: "lancelot && round == 1 && phase == 'propose'",
    text: "From the next {quest} on, one {loyalty} is revealed at the start of each {quest}." },
  { id: "excaliburOn", when: "excalibur && phase == 'propose'",
    text: "This team also needs someone to hold the {excalibur}." },
  { id: "ladyNext", when: "settings.lady && (round == 1 || round == 2 || round == 3) && phase == 'propose'",
    text: "When this {quest} ends, the {lady} will be used." },
];

// ───────────────────────── 5. First-game tutorial ─────────────────────────
export const tutorial = {
  title: "Your First {title}",
  steps: [
    { id: "welcome", title: "Welcome!",
      text: "In this game you find the {evil} hiding among you. Follow these 7 steps and you're ready to play." },
    { id: "join", phase: "lobby", title: "1. Join a room",
      text: "One person creates a room and shares the code. Everyone else enters the code to join. Use a name others will recognise." },
    { id: "seat", phase: "lobby", title: "2. Sit in a circle",
      text: "Sit in a circle in the order shown on screen. The {leader} role goes around in this order." },
    { id: "card", phase: "reveal", title: "3. Peek at your card",
      text: "Cover your screen and check your role. Remember whether you're with the {good} or the {evil}, and who you can see. Then act like nothing happened!" },
    { id: "propose", phase: "propose", title: "4. The {leader} picks a team",
      text: "The player marked {leader} picks who goes on the {quest}. The screen shows how many are needed. Everyone else shares their opinion." },
    { id: "vote", phase: "vote", title: "5. Everyone votes",
      text: "{approve} if the team looks trustworthy, {reject} if it looks suspicious. Votes are revealed together, so watch who voted which way." },
    { id: "quest", phase: "quest", title: "6. Play a {quest} card",
      text: "Only team members secretly play a card. The {good} play only {success}. The {evil} choose {success} or {fail}. One {fail} is enough to fail." },
    { id: "repeat", title: "7. Repeat and reason",
      text: "There are 5 {quest}s. The first side to take 3 wins. Who was on which team and who voted which way are your biggest clues." },
    { id: "twist", phase: "assassin", title: "The final twist",
      text: "Even if the {good} complete 3, the {evil} win if the {assassin} names the {merlin}. The {merlin} stays hidden, and the other {good} act like the {merlin} to confuse them." },
    { id: "ready", title: "All set!",
      text: "Mistakes are fine. The first game is practice. One round and you'll get the hang of it." },
  ],
  example: {
    heading: "A sample game (5 players)",
    lines: [
      "Grace, Hope, Sky, David and Joseph start. 3 are {good} and 2 are {evil}.",
      "The first {leader}, Grace, picks Grace and Sky. The vote passes, {approve} 4 to {reject} 1!",
      "The {quest} shows 0 {fail}s. The first {quest} is complete.",
      "The second {leader}, Hope, needs 3 players and picks Hope, David and Joseph, but 3 {reject} votes sink it. The {leader} role passes to Sky.",
      "Sky's team (Sky, Grace, Joseph) is approved, and 1 {fail} comes up! One of those three is with the {evil}.",
      "You collect clues like this and use them to choose the next team.",
    ],
  },
};

// ───────────────────────── 6. Host guide ─────────────────────────
export const hostGuide = {
  title: "{title} Host Guide",
  intro: "A guide to help you run a fun game in about 30 minutes at a retreat or small group, even with first-time players.",
  sections: [
    {
      heading: "What you need",
      bullets: [
        "One phone per person (Wi-Fi or mobile data)",
        "5 to 10 players per room. With more people, split into several rooms. 7 or 8 is the sweet spot.",
        "Seats in a circle. Being able to see each other's faces matters.",
        "A game takes 20 to 40 minutes. Allow 40 minutes for the first one, including the explanation.",
      ],
    },
    {
      heading: "Before you start (5 minutes)",
      steps: [
        "The host creates a room and reads out or shows the room code.",
        "Once everyone is in, sit in a circle in the order shown on screen. The {leader} role goes around in this order.",
        "Turn on roles to fit your group size. See the recommended setups below.",
        "Read the '3-minute explanation' below, and start once everyone taps Ready.",
      ],
    },
    {
      heading: "Recommended setups",
      presetsRef: true,
      bullets: [
        "First game: turn on only the {merlin} and the {assassin}. Every other seat is filled automatically as a {servant} or a {minion}.",
        "Once you're comfortable: add the {percival} and the {morgana}. They keep each other in check and add a lot of fun.",
        "7 or more players: add the {mordred} and turn on the {lady}.",
        "10 players: add the {oberon} too, so all 4 of the {evil} have special roles.",
      ],
    },
    {
      heading: "Expansions to try later",
      bullets: [
        "{lancelotGood} and {lancelotEvil}: from the 3rd {quest}, {loyalty}s are revealed and the two Lancelots may swap sides. For a first try, use 'Quiet Crossroads'.",
        "{excalibur}: the {leader} hands it to a team member, who may flip one other member's card. Great with 7 or more.",
        "Alternate team sizes: changes the team sizes in 5 and 7 player games. Nice when the same group plays several rounds.",
        "Add only one expansion at a time. Long explanations are hard on first-time players.",
      ],
    },
    {
      heading: "3-minute explanation",
      script: [
        "\"Some {evil} are secretly hiding among us. Everyone else is one of the {good}.\"",
        "\"There are 5 {quest}s, and the first side to take 3 wins.\"",
        "\"Each time, the {leader} picks a team and we all vote {approve} or {reject}.\"",
        "\"An approved team secretly plays {success} or {fail} cards. One {fail} and the {quest} fails. The {good} can only play {success}.\"",
        "\"The {merlin} knows who the {evil} are but must not get caught. Even if the {good} win, the {assassin} can turn it around by naming the {merlin}.\"",
        "\"You can say anything, but never show your phone screen. Ready to check your cards?\"",
      ],
    },
    {
      heading: "While you play",
      bullets: [
        "If discussion drags on, set a limit of about 2 to 3 minutes per proposal.",
        "Asking quiet players \"What do you think?\" helps everyone join in.",
        "If suspicion piles onto one person, especially a newcomer or a younger player, lighten the mood.",
        "Agree beforehand not to use faith statements like \"I swear to God\" as proof in the game. A game is a game, and faith is faith.",
        "When the fifth proposal comes around, remind everyone: \"If this one is rejected, the {evil} win!\"",
      ],
    },
    {
      heading: "If something goes wrong",
      bullets: [
        "A phone turned off or the app closed: reopening on the same phone returns the player to their seat and role.",
        "Someone needs a different phone: after they've been disconnected for 15 seconds, the {host} taps '{allowRejoin}'. For 2 minutes, the new phone can join with the same name.",
        "The {host}'s phone went off: after a minute, a '{claimHost}' button appears for the others. Whoever taps it takes over.",
        "One player is stuck on the card reveal: the host can tap Skip to start the game.",
        "Someone accidentally showed their screen: treat this game as practice, play it out, then open a new game with Restart when it ends.",
        "Rules feel confusing: the guide button is available any time, even during a game.",
      ],
    },
    {
      heading: "After the game (5-minute sharing)",
      bullets: [
        "Every role is revealed. Talk about who noticed what, and when.",
        "Laugh it off with questions like \"Why did you reject that one?\"",
        "Say \"Sorry, and well played\" to anyone you suspected.",
      ],
      reflection: {
        heading: "Optional sharing questions",
        questions: [
          "Whose words did you trust today, and why?",
          "What helped you tell the true from the false? (See Matthew 10:16 and 1 John 4:1.)",
          "What does it mean to trust one another in a community?",
        ],
      },
    },
  ],
};

// ───────────────────────── 7. Recommended setups ─────────────────────────
const base = { merlin: true, assassin: true, percival: false, morgana: false, mordred: false, oberon: false };
const off = { lancelot: 0, excalibur: false, balance: false };
export const presets = {
  beginner: {
    label: "First game",
    desc: "The simplest setup, with only the {merlin} and the {assassin}",
    byCount: Object.fromEntries([5, 6, 7, 8, 9, 10].map((n) => [n, { roles: { ...base }, lady: false, ...off }])),
  },
  standard: {
    label: "Recommended",
    desc: "Adds the {percival} and the {morgana} to keep each other in check",
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
    label: "Try the expansions",
    desc: "Adds the two Lancelots (Quiet Crossroads) and the {excalibur}",
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

// ───────────────────────── 8. Glossary ─────────────────────────
export const glossary = [
  { term: "{good}", text: "The side of light. More players, but less information." },
  { term: "{evil}", text: "The hidden side. Fewer players, but they know each other." },
  { term: "{quest}", text: "One of 5 tasks. The first side to take 3 wins." },
  { term: "{leader}", text: "The player picking this {quest} team. Passes to the next seat after each proposal." },
  { term: "{success} / {fail}", text: "The cards team members secretly play. The {good} can only play {success}." },
  { term: "{approve} / {reject}", text: "The vote on whether to send the {leader}'s team." },
  { term: "{lady}", text: "Optional rule. A lamp that secretly reveals one player's side." },
  { term: "{excalibur}", text: "Expansion. Lets one team member flip another member's card." },
  { term: "{loyalty}", text: "Expansion. Revealed one at a time from the 3rd {quest}, and can switch the Lancelots' sides." },
  { term: "{assassinate}", text: "After 3 wins for the {good}, the {assassin}'s last chance to find and name the {merlin}." },
];

export const ui = {
  helpButton: "Guide",
  quickButton: "1-Minute Guide",
  fullRulesButton: "Full rules",
  tutorialButton: "I'm new",
  myRoleTipsButton: "My role tips",
  hostGuideButton: "Host guide",
  next: "Next",
  prev: "Back",
  close: "Close",
  done: "Got it",
  skipTutorial: "Skip",
  language: "Language",
  langKo: "한국어",
  langEn: "English",
  moduleTag: "Expansion",
};
