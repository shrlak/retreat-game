// Independent rules oracle (original Avalon rulebook). Do NOT import from server/.
export const EVIL = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
// House "balance" variant (not in the rulebook): engine's own table for 5 and 7 players.
export const BALANCE_SIZES = { 5: [3, 2, 3, 2, 3], 7: [2, 3, 4, 3, 4] };
export const sizesFor = (n, balance) => (balance && BALANCE_SIZES[n]) || SIZES[n];
export const SIZES = {
  5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5],
};
export const FAILS = (n) => [1, 1, 1, n >= 7 ? 2 : 1, 1];
const EVIL_ROLES = new Set(["assassin", "morgana", "mordred", "oberon", "minion", "lancelotEvil"]);
export const teamOf = (r) => (EVIL_ROLES.has(r) ? "evil" : "good");

/**
 * Expected night knowledge for `meId`: Map<id, tag>. roleOf = {id: role}.
 * lancelot: 0 off, 1 = official variant (Lancelots don't know each other; evil Lancelot shows his
 * thumb so the evil team knows him, but he sees nobody), 2 = base mode (Lancelots know each other).
 * Returns a Map; its `.optional` Map holds ids that may or may not appear (rulebook silent: Merlin vs evil Lancelot).
 */
// Official Lancelot module (Indie Boards & Cards 2012), every variant (lancelot = 1, 2 or 3):
//   Evil Lancelot keeps his eyes closed and shows a thumb: the evil team (not Oberon) sees him, he sees no one.
//   Only in variant 3 do the two Lancelots know each other (tag "lancelot").
//   Merlin vs Evil Lancelot is not covered by the rulebook, so either answer is accepted (.optional).
export function expectedKnowledge(roleOf, meId, lancelot = 0) {
  const my = roleOf[meId];
  const out = new Map();
  const optional = new Map();
  const blindEvil = (r) => r === "oberon" || r === "lancelotEvil";
  const hiddenFromEvil = (r) => r === "oberon";
  for (const [id, r] of Object.entries(roleOf)) {
    if (id === meId) continue;
    if (my === "merlin" && teamOf(r) === "evil" && r !== "mordred") (r === "lancelotEvil" ? optional : out).set(id, "evil");
    if (my === "percival" && (r === "merlin" || r === "morgana")) out.set(id, "merlinCandidate");
    if (teamOf(my) === "evil" && !blindEvil(my) && teamOf(r) === "evil" && !hiddenFromEvil(r)) out.set(id, "evil");
    if (lancelot === 3 && my.startsWith("lancelot") && r.startsWith("lancelot")) out.set(id, "lancelot");
  }
  out.optional = optional;
  return out;
}

// Loyalty cards per Lancelot variant: v1 deck of 5 (3 none, 2 switch) flipped at rounds 3-5 (index 2-4);
// v2 deck of 7 (5 none, 2 switch), 5 dealt face up, card i takes effect at the start of round i; v3 none.
export const LOYALTY = { 1: { none: 3, switch: 2, from: 2 }, 2: { none: 5, switch: 2, from: 0 } };

/** All on/off role combos the host can pick (settings.roles), valid or not. */
export function allRoleCombos() {
  const keys = ["merlin", "percival", "morgana", "mordred", "oberon"];
  const out = [];
  for (let m = 0; m < 1 << keys.length; m++) {
    const roles = {};
    keys.forEach((k, i) => (roles[k] = !!(m & (1 << i))));
    roles.assassin = roles.merlin;
    out.push(roles);
  }
  return out;
}

/** Is this combo legal for n players under original rules? */
export function comboLegal(n, roles, lancelot = 0) {
  if (roles.percival && !roles.merlin) return false;
  const L = lancelot ? 1 : 0;
  const evilSpecial = ["assassin", "morgana", "mordred", "oberon"].filter((k) => roles[k]).length + L;
  const goodSpecial = ["merlin", "percival"].filter((k) => roles[k]).length + L;
  return evilSpecial <= EVIL[n] && goodSpecial <= n - EVIL[n];
}

// Current allegiance of a player given the public loyalty cards revealed up to and including `round`.
export function allegianceAt(role, loyaltyRevealed, round = Infinity) {
  let t = teamOf(role);
  if (!role.startsWith("lancelot")) return t;
  for (const c of loyaltyRevealed || []) if (c.round <= round && c.card === "switch") t = t === "good" ? "evil" : "good";
  return t;
}
