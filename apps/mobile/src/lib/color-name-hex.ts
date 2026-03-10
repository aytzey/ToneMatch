/**
 * Comprehensive color-name → hex mapping for AI-generated color names.
 *
 * The AI color analysis returns semantic color names (e.g. "Steel Blue",
 * "Petrol", "Ecru"). This map ensures every name resolves to the correct hex.
 */

const SWATCH_HEX: Record<string, string> = {
  // Reds / Wines
  red: "#CC3333",
  crimson: "#DC143C",
  scarlet: "#FF2400",
  cherry: "#DE3163",
  ruby: "#E0115F",
  wine: "#722F37",
  burgundy: "#800020",
  maroon: "#800000",
  oxblood: "#4A0000",
  berry: "#8E4585",
  raspberry: "#E30B5C",
  cranberry: "#9B1B30",
  "blue red": "#C41E3A",
  "brick red": "#CB4154",

  // Oranges / Terracotta
  orange: "#FF8C00",
  tangerine: "#FF9966",
  coral: "#E07A5F",
  salmon: "#FA8072",
  peach: "#FFCBA4",
  apricot: "#FBCEB1",
  terracotta: "#C67D4A",
  rust: "#B7410E",
  copper: "#B87333",
  amber: "#FFBF00",
  "burnt orange": "#CC5500",
  "burnt sienna": "#E97451",

  // Yellows / Golds
  yellow: "#F0C040",
  gold: "#C9A227",
  golden: "#DAA520",
  mustard: "#DFAF37",
  honey: "#EB9605",
  saffron: "#F4C430",
  lemon: "#FFF44F",
  cream: "#F5E6CC",
  ivory: "#FFFFF0",
  champagne: "#F7E7CE",
  ecru: "#C2B280",
  wheat: "#D4B88C",
  butter: "#F6E199",

  // Greens
  green: "#228B22",
  emerald: "#50C878",
  jade: "#00A86B",
  sage: "#87A96B",
  olive: "#6B7F3A",
  moss: "#6B7F3A",
  "forest green": "#2D6A4F",
  "hunter green": "#355E3B",
  mint: "#98FF98",
  "kelly green": "#4CBB17",
  "deep olive": "#5D6146",
  "army green": "#4B5320",
  pine: "#01796F",
  "muted olive": "#6B6B3D",
  "dark green": "#1B4D2E",

  // Teals / Cyans
  teal: "#367588",
  "deep teal": "#005F5F",
  turquoise: "#40E0D0",
  aqua: "#00B5B5",
  seafoam: "#71C5A3",
  petrol: "#005F6A",
  "dark teal": "#004D4D",

  // Blues
  blue: "#4169E1",
  navy: "#1B2A49",
  "warm navy": "#1B3A5C",
  "royal blue": "#4169E1",
  cobalt: "#0047AB",
  sapphire: "#0F52BA",
  "sky blue": "#87CEEB",
  "baby blue": "#89CFF0",
  "steel blue": "#4682B4",
  "powder blue": "#B0E0E6",
  "slate blue": "#6A5ACD",
  periwinkle: "#CCCCFF",
  "ink blue": "#1B2838",
  indigo: "#3F51B5",
  denim: "#1560BD",
  cornflower: "#6495ED",
  "ice blue": "#99C5C4",
  "dusty blue": "#6699CC",
  "cool blue": "#6B9AC4",
  "true blue": "#0066FF",

  // Purples
  purple: "#7B2D8E",
  violet: "#7F00FF",
  lavender: "#B4A7D6",
  lilac: "#C8A2C8",
  mauve: "#C87F89",
  plum: "#6E3A5F",
  eggplant: "#614051",
  aubergine: "#614051",
  amethyst: "#9966CC",
  orchid: "#DA70D6",
  magenta: "#C2185B",
  fuchsia: "#C2185B",
  "blue violet": "#8A2BE2",

  // Pinks
  pink: "#E8829B",
  blush: "#DE5D83",
  rose: "#C66080",
  "hot pink": "#FF69B4",
  "dusty rose": "#DCAE96",
  "dusty pink": "#D4A5A5",
  "soft pink": "#F4B8C1",

  // Browns / Earths
  brown: "#7B4B2A",
  chocolate: "#5C3317",
  coffee: "#6F4E37",
  mocha: "#967969",
  espresso: "#3C1414",
  "soft espresso": "#5C3D2E",
  camel: "#C19A6B",
  "warm camel": "#C8A878",
  tan: "#D2B48C",
  khaki: "#C3B091",
  sand: "#C2B280",
  beige: "#D1BFA5",
  taupe: "#7D6C5B",
  "cool taupe": "#8E8279",
  sienna: "#A0522D",
  chestnut: "#954535",
  cinnamon: "#C57B3A",
  cognac: "#9A463D",
  mushroom: "#BAA378",
  stone: "#928E85",
  "dusty beige": "#C8B99A",

  // Neutrals / Whites / Greys
  white: "#FFFFFF",
  "true white": "#FFFFFF",
  "pure white": "#FFFFFF",
  "off-white": "#FAF9F6",
  pearl: "#F0EAD6",
  bone: "#E3DAC9",
  eggshell: "#F0EAD6",
  black: "#111111",
  grey: "#808080",
  gray: "#808080",
  charcoal: "#36454F",
  graphite: "#41424C",
  slate: "#708090",
  silver: "#C0C0C0",
  ash: "#B2BEB5",
  "icy grey": "#D9E1E8",
  "icy gray": "#D9E1E8",
  "cool grey": "#8C92AC",
  "cool gray": "#8C92AC",
  "warm grey": "#A0968E",
  "warm gray": "#A0968E",
};

const FALLBACK = "#888888";

/**
 * Resolve a color name (as returned by the AI) to a hex code.
 * Falls back to a neutral grey if no match is found.
 */
export function hexForColorName(name: string): string {
  const key = name.toLowerCase().trim();

  // Exact match
  if (SWATCH_HEX[key]) return SWATCH_HEX[key];

  // Partial match: "warm rust" → "rust", "deep forest green" → "forest green"
  for (const [k, v] of Object.entries(SWATCH_HEX)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return FALLBACK;
}
