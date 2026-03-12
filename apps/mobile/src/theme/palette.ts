const lightPalette = {
  // Backgrounds
  canvas: "#f8f7f6",
  surface: "#ffffff",
  surfaceRaised: "#fdfbf9",
  surfaceMuted: "#f2ece5",
  ink: "#191410",
  onDark: "#f8f7f6",
  onDarkMuted: "rgba(248, 247, 246, 0.82)",
  onDarkSoft: "rgba(248, 247, 246, 0.76)",

  // Text
  charcoal: "#191410",
  muted: "#745d44",
  subtle: "#745842",

  // Brand
  primary: "#7b4b1b",
  onPrimary: "#ffffff",
  primarySoft: "rgba(138, 86, 36, 0.12)",
  primaryMuted: "rgba(138, 86, 36, 0.06)",

  // Neutrals
  clay: "#d7c7b5",
  accentSoft: "#ead8c5",
  border: "rgba(138, 86, 36, 0.14)",
  borderLight: "rgba(138, 86, 36, 0.07)",
  focusRing: "rgba(138, 86, 36, 0.18)",
  overlay: "rgba(25, 20, 16, 0.56)",
  overlaySoft: "rgba(25, 20, 16, 0.42)",
  overlayMedium: "rgba(25, 20, 16, 0.65)",
  overlayStrong: "rgba(25, 20, 16, 0.78)",
  overlayHeavy: "rgba(25, 20, 16, 0.92)",
  surfaceTintStrong: "rgba(255, 255, 255, 0.90)",
  surfaceTintSoft: "rgba(255, 255, 255, 0.70)",
  surfaceTintMuted: "rgba(255, 255, 255, 0.16)",
  surfaceTintSubtle: "rgba(255, 255, 255, 0.12)",
  surfaceTintGlow: "rgba(255, 255, 255, 0.30)",
  surfaceTintMild: "rgba(255, 255, 255, 0.18)",
  surfaceTintGlass: "rgba(255, 255, 255, 0.10)",
  surfaceTintLineBright: "rgba(255, 255, 255, 0.20)",
  surfaceTintLine: "rgba(255, 255, 255, 0.25)",
  surfaceTintLineSoft: "rgba(255, 255, 255, 0.14)",
  surfaceTintLineSubtle: "rgba(255, 255, 255, 0.12)",
  primaryHalo: "rgba(138, 86, 36, 0.18)",
  primaryLine: "rgba(138, 86, 36, 0.35)",
  primaryAccent: "rgba(138, 86, 36, 0.40)",
  dangerSoft: "rgba(157, 2, 8, 0.05)",
  dangerBorder: "rgba(157, 2, 8, 0.10)",

  // Semantic
  green: "#2d6a4f",
  red: "#9d0208",
  amber: "#b08968",

  // Swatch presets (for "Deep Autumn" example)
  swatch1: "#4a2c2a",
  swatch2: "#b87332",
  swatch3: "#5d6146",
  swatch4: "#d9b382",
} as const;

export type ThemePalette = { [K in keyof typeof lightPalette]: string };

const darkPalette: ThemePalette = {
  // Backgrounds
  canvas: "#14110e",
  surface: "#1d1713",
  surfaceRaised: "#231c17",
  surfaceMuted: "#2a221c",
  ink: "#f8f7f6",
  onDark: "#f8f7f6",
  onDarkMuted: "rgba(248, 247, 246, 0.84)",
  onDarkSoft: "rgba(248, 247, 246, 0.76)",

  // Text
  charcoal: "#f8f7f6",
  muted: "#c9b8a5",
  subtle: "#b39980",

  // Brand
  primary: "#d0a06c",
  onPrimary: "#1b140f",
  primarySoft: "rgba(208, 160, 108, 0.18)",
  primaryMuted: "rgba(208, 160, 108, 0.10)",

  // Neutrals
  clay: "#6f5a49",
  accentSoft: "#3a2d23",
  border: "rgba(208, 160, 108, 0.22)",
  borderLight: "rgba(208, 160, 108, 0.12)",
  focusRing: "rgba(208, 160, 108, 0.30)",
  overlay: "rgba(10, 8, 6, 0.62)",
  overlaySoft: "rgba(10, 8, 6, 0.42)",
  overlayMedium: "rgba(10, 8, 6, 0.68)",
  overlayStrong: "rgba(10, 8, 6, 0.80)",
  overlayHeavy: "rgba(10, 8, 6, 0.92)",
  surfaceTintStrong: "rgba(248, 247, 246, 0.92)",
  surfaceTintSoft: "rgba(248, 247, 246, 0.72)",
  surfaceTintMuted: "rgba(248, 247, 246, 0.16)",
  surfaceTintSubtle: "rgba(248, 247, 246, 0.12)",
  surfaceTintGlow: "rgba(248, 247, 246, 0.30)",
  surfaceTintMild: "rgba(248, 247, 246, 0.18)",
  surfaceTintGlass: "rgba(248, 247, 246, 0.10)",
  surfaceTintLineBright: "rgba(248, 247, 246, 0.20)",
  surfaceTintLine: "rgba(248, 247, 246, 0.25)",
  surfaceTintLineSoft: "rgba(248, 247, 246, 0.16)",
  surfaceTintLineSubtle: "rgba(248, 247, 246, 0.12)",
  primaryHalo: "rgba(208, 160, 108, 0.22)",
  primaryLine: "rgba(208, 160, 108, 0.36)",
  primaryAccent: "rgba(208, 160, 108, 0.42)",
  dangerSoft: "rgba(196, 59, 54, 0.14)",
  dangerBorder: "rgba(196, 59, 54, 0.28)",

  // Semantic
  green: "#6fb091",
  red: "#d36b6b",
  amber: "#d0a06c",

  // Swatch presets
  swatch1: "#6b4a44",
  swatch2: "#d0a06c",
  swatch3: "#7b8163",
  swatch4: "#cfa77c",
};

export { darkPalette, lightPalette };

export const palette = lightPalette;

export const editorialGuideBackgrounds = [
  "#f1e4d7",
  "#ece2d7",
  "#e6ddd6",
  "#ede7dc",
  "#efe3d3",
  "#e9e0d8",
] as const;
