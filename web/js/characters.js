// Character roster for the store. Skins are purely cosmetic: every character
// uses the exact same hitbox and physics as the default Pteranodon, only
// the color palette and silhouette flavor passed to art.js change.
const CHARACTERS = [
  {
    id: "raptor",
    name: "Pteranodon",
    blurb: "True flight. The original, and still the best.",
    rarity: "common",
    price: 0,
    starter: true,
    features: ["wings"],
    palette: { body: "#d97a3a", belly: "#ffe2b8", accent: "#8a431a", eye: "#1a1a1a", wing: "#ffb35c" },
  },
  {
    id: "compy",
    name: "Compsognathus",
    blurb: "Tiny, twitchy, and always hungry.",
    rarity: "common",
    price: 6.99,
    features: ["small"],
    palette: { body: "#9c8a4f", belly: "#e3d9a8", accent: "#6b5a2f", eye: "#1a1a1a" },
  },
  {
    id: "dilo",
    name: "Dilophosaurus",
    blurb: "Frilled show-off with a venomous reputation.",
    rarity: "uncommon",
    price: 14.99,
    features: ["frill"],
    palette: { body: "#2f9c8a", belly: "#bfeede", accent: "#16544a", eye: "#1a1a1a", frill: "#e0466b" },
  },
  {
    id: "pachy",
    name: "Pachycephalosaurus",
    blurb: "Hard-headed in every sense.",
    rarity: "uncommon",
    price: 19.99,
    features: ["dome"],
    palette: { body: "#a9683a", belly: "#e8c9a0", accent: "#6e3f1f", eye: "#1a1a1a", dome: "#7a4a26" },
  },
  {
    id: "stego",
    name: "Stegosaurus",
    blurb: "Plated, spiked, never rushed.",
    rarity: "rare",
    price: 34.99,
    features: ["plates"],
    palette: { body: "#5b7a96", belly: "#cfe3f0", accent: "#34506b", eye: "#1a1a1a", plate: "#e0a23a" },
  },
  {
    id: "anky",
    name: "Ankylosaurus",
    blurb: "Walking tank with a club-tailed attitude.",
    rarity: "rare",
    price: 39.99,
    features: ["armor", "clubtail"],
    palette: { body: "#6f7a4a", belly: "#d8e0bf", accent: "#454f28", eye: "#1a1a1a", armor: "#3a4520" },
  },
  {
    id: "trike",
    name: "Triceratops",
    blurb: "Three horns, zero patience for nonsense.",
    rarity: "epic",
    price: 59.99,
    features: ["horns", "frill"],
    palette: { body: "#8a7a6a", belly: "#e8ddcf", accent: "#5a4a3a", eye: "#1a1a1a", horn: "#e8e0cf", frill: "#6b5a4a" },
  },
  {
    id: "spino",
    name: "Spinosaurus",
    blurb: "Sail-backed river hunter, bigger than it looks.",
    rarity: "epic",
    price: 74.99,
    features: ["sail", "big"],
    palette: { body: "#3a6ea8", belly: "#cfe0f0", accent: "#1f3f6b", eye: "#1a1a1a", sail: "#e0466b" },
  },
  {
    id: "trex",
    name: "Tyrannosaurus Rex",
    blurb: "King of the leaderboard. Apex everything.",
    rarity: "mythic",
    price: 149.99,
    features: ["big", "glow", "trim"],
    palette: { body: "#b8860b", belly: "#ffe9b0", accent: "#7a1212", eye: "#ffe066", trim: "#e0b020" },
  },
];

const RARITY_LABEL = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
