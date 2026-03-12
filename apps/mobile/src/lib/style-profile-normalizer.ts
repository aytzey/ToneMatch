import type { StyleExperience, StyleTheoryExample } from "@/src/types/tonematch";

export type NormalizedUndertoneLabel =
  | "Warm Neutral"
  | "Cool Bright"
  | "Olive Soft";

export type NormalizedContrastLabel =
  | "Low Contrast"
  | "Medium Contrast"
  | "High Contrast";

export type ProfileKey =
  | "Warm Neutral|Low Contrast"
  | "Warm Neutral|Medium Contrast"
  | "Warm Neutral|High Contrast"
  | "Cool Bright|Low Contrast"
  | "Cool Bright|Medium Contrast"
  | "Cool Bright|High Contrast"
  | "Olive Soft|Low Contrast"
  | "Olive Soft|Medium Contrast"
  | "Olive Soft|High Contrast";

type StableProfile = {
  key: ProfileKey;
  undertoneLabel: NormalizedUndertoneLabel;
  contrastLabel: NormalizedContrastLabel;
  coreColors: string[];
  neutralColors: string[];
  accentColors: string[];
  avoidColors: string[];
  explanation: string;
};

const PROFILE_LIBRARY: Record<ProfileKey, StableProfile> = {
  "Warm Neutral|Low Contrast": {
    key: "Warm Neutral|Low Contrast",
    undertoneLabel: "Warm Neutral",
    contrastLabel: "Low Contrast",
    coreColors: ["Ecru", "Oat", "Soft Olive", "Warm Taupe"],
    neutralColors: ["Stone", "Mushroom", "Camel Mist"],
    accentColors: ["Terracotta", "Muted Teal"],
    avoidColors: ["Blue White", "Harsh Black", "Icy Grey"],
    explanation:
      "Warm undertone with softer contrast prefers quiet, blended colors close to the face.",
  },
  "Warm Neutral|Medium Contrast": {
    key: "Warm Neutral|Medium Contrast",
    undertoneLabel: "Warm Neutral",
    contrastLabel: "Medium Contrast",
    coreColors: ["Petrol", "Ecru", "Olive", "Warm Navy"],
    neutralColors: ["Stone", "Mushroom", "Soft Espresso"],
    accentColors: ["Rust", "Deep Teal"],
    avoidColors: ["Icy Grey", "Pure White", "Blue Violet"],
    explanation:
      "Warm undertone and medium contrast prefer softened but clear hues around the face.",
  },
  "Warm Neutral|High Contrast": {
    key: "Warm Neutral|High Contrast",
    undertoneLabel: "Warm Neutral",
    contrastLabel: "High Contrast",
    coreColors: ["Deep Olive", "Copper Brown", "Warm Ink", "Sand"],
    neutralColors: ["Rich Camel", "Espresso", "Warm Stone"],
    accentColors: ["Burnt Orange", "Forest"],
    avoidColors: ["Cold Lilac", "Steel Grey", "Snow White"],
    explanation:
      "Warm profiles with stronger contrast can handle deeper, richer tones without going muddy.",
  },
  "Cool Bright|Low Contrast": {
    key: "Cool Bright|Low Contrast",
    undertoneLabel: "Cool Bright",
    contrastLabel: "Low Contrast",
    coreColors: ["Cool Taupe", "Dusty Rose", "Ink Blue", "Soft Berry"],
    neutralColors: ["Pearl Grey", "Slate", "Cloud"],
    accentColors: ["Plum", "Blue Red"],
    avoidColors: ["Warm Camel", "Orange Rust", "Moss"],
    explanation:
      "Cool undertones with softer contrast need cooler colors that stay refined rather than loud.",
  },
  "Cool Bright|Medium Contrast": {
    key: "Cool Bright|Medium Contrast",
    undertoneLabel: "Cool Bright",
    contrastLabel: "Medium Contrast",
    coreColors: ["Ink Blue", "True White", "Berry", "Blue Red"],
    neutralColors: ["Charcoal", "Cool Taupe", "Graphite"],
    accentColors: ["Emerald", "Cobalt"],
    avoidColors: ["Dusty Beige", "Muted Olive", "Warm Camel"],
    explanation:
      "Cool undertones with clarity respond best to cleaner contrast and cooler chroma.",
  },
  "Cool Bright|High Contrast": {
    key: "Cool Bright|High Contrast",
    undertoneLabel: "Cool Bright",
    contrastLabel: "High Contrast",
    coreColors: ["Black Cherry", "Ink", "True White", "Cobalt"],
    neutralColors: ["Charcoal", "Graphite", "Night Blue"],
    accentColors: ["Fuchsia Berry", "Emerald"],
    avoidColors: ["Warm Beige", "Muted Camel", "Khaki"],
    explanation:
      "High-contrast cool profiles look strongest in crisp, clean contrast and cooler saturation.",
  },
  "Olive Soft|Low Contrast": {
    key: "Olive Soft|Low Contrast",
    undertoneLabel: "Olive Soft",
    contrastLabel: "Low Contrast",
    coreColors: ["Moss", "Muted Cream", "Soft Cocoa", "Smoked Teal"],
    neutralColors: ["Pebble", "Oat", "Washed Brown"],
    accentColors: ["Terracotta", "Forest"],
    avoidColors: ["Neon Coral", "Blue White", "Harsh Black"],
    explanation:
      "Soft olive profiles benefit from earthy, blended color groups that avoid high starkness.",
  },
  "Olive Soft|Medium Contrast": {
    key: "Olive Soft|Medium Contrast",
    undertoneLabel: "Olive Soft",
    contrastLabel: "Medium Contrast",
    coreColors: ["Forest", "Stone Olive", "Muted Cream", "Deep Teal"],
    neutralColors: ["Pebble", "Taupe", "Washed Espresso"],
    accentColors: ["Rust Brown", "Pine"],
    avoidColors: ["Sharp White", "Electric Blue", "Hot Pink"],
    explanation:
      "Olive undertones with moderate contrast need depth, but still prefer a muted finish.",
  },
  "Olive Soft|High Contrast": {
    key: "Olive Soft|High Contrast",
    undertoneLabel: "Olive Soft",
    contrastLabel: "High Contrast",
    coreColors: ["Deep Forest", "Stone Cream", "Oxidized Teal", "Espresso"],
    neutralColors: ["Warm Graphite", "Pebble", "Dark Taupe"],
    accentColors: ["Auburn", "Burnished Green"],
    avoidColors: ["Fluorescent Coral", "Icy White", "Cold Silver"],
    explanation:
      "Even with more contrast, olive skin stays strongest in grounded tones rather than icy extremes.",
  },
};

function normalizeTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z/\s-]/g, " ")
    .split(/[\s/-]+/)
    .filter(Boolean);
}

export function normalizeUndertoneLabel(undertone: string): NormalizedUndertoneLabel {
  const tokens = normalizeTokens(undertone);

  if (tokens.includes("olive")) {
    return "Olive Soft";
  }

  if (
    tokens.includes("cool") ||
    tokens.includes("rose") ||
    tokens.includes("rosy") ||
    tokens.includes("pink") ||
    tokens.includes("winter")
  ) {
    return "Cool Bright";
  }

  return "Warm Neutral";
}

export function normalizeContrastLabel(contrast: string): NormalizedContrastLabel {
  const tokens = normalizeTokens(contrast);

  if (
    tokens.includes("high") ||
    tokens.includes("deep") ||
    tokens.includes("rich") ||
    tokens.includes("strong") ||
    tokens.includes("dark") ||
    tokens.includes("intense")
  ) {
    return "High Contrast";
  }

  if (
    tokens.includes("low") ||
    tokens.includes("light") ||
    tokens.includes("soft") ||
    tokens.includes("airy") ||
    tokens.includes("gentle")
  ) {
    return "Low Contrast";
  }

  return "Medium Contrast";
}

export function getStablePalette(undertone: string, contrast: string): StableProfile {
  const undertoneLabel = normalizeUndertoneLabel(undertone);
  const contrastLabel = normalizeContrastLabel(contrast);
  const key = `${undertoneLabel}|${contrastLabel}` as ProfileKey;

  return PROFILE_LIBRARY[key];
}

export function buildStablePalette(undertone: string, contrast: string) {
  const stable = getStablePalette(undertone, contrast);

  return {
    key: stable.key,
    undertoneLabel: stable.undertoneLabel,
    contrastLabel: stable.contrastLabel,
    core: [...stable.coreColors],
    neutrals: [...stable.neutralColors],
    accents: [...stable.accentColors],
    avoid: [...stable.avoidColors],
    explanation: stable.explanation,
  };
}

export function buildTheoryExamples(profile: StyleExperience): StyleTheoryExample[] {
  const stable = buildStablePalette(profile.undertone, profile.contrast);

  const undertoneExample =
    stable.undertoneLabel === "Olive Soft"
      ? "In the article implementation, Olive Soft is the difficult branch: it is chosen when chroma stays muted, b*/a* climbs above 1.3, a* stays suppressed, and hue angle remains above 48 degrees."
      : stable.undertoneLabel === "Warm Neutral"
        ? "In the article implementation, Warm Neutral resolves when normalized skin hue angle moves above 57 degrees, or when a near-neutral hue still shows enough yellow dominance through the b*/a* ratio."
        : "In the article implementation, Cool Bright resolves when normalized hue angle falls below 48 degrees, or when the neutral band fails to show enough yellow dominance to stay in the warm bucket.";

  const contrastExample =
    stable.contrastLabel === "Low Contrast"
      ? "The worker maps Low Contrast when the L* standard deviation of the center facial crop stays below 0.11, which means the face reads softer and more blended."
      : stable.contrastLabel === "Medium Contrast"
        ? "The worker maps Medium Contrast when facial L* spread sits between 0.11 and 0.19, which is the band where the face carries structure without needing extreme sharpness."
        : "The worker maps High Contrast once L* spread crosses 0.19, meaning the face can hold stronger light-dark separation and deeper wardrobe framing.";

  return [
    {
      title: `${stable.undertoneLabel} branch example`,
      copy: `${undertoneExample} Your current result is normalized into the ${stable.undertoneLabel} bucket, so the palette resolver uses that branch instead of free-form color guessing.`,
    },
    {
      title: `${stable.contrastLabel} threshold example`,
      copy: `${contrastExample} That is why the implementation keeps returning the same contrast bucket for the same signal family instead of drifting between different advice sets.`,
    },
    {
      title: "Deterministic palette example",
      copy: `Once the result lands in ${stable.undertoneLabel} x ${stable.contrastLabel}, the implementation always resolves to ${stable.core.slice(0, 3).join(", ")} as the leading palette and ${stable.avoid.slice(0, 3).join(", ")} as the caution group.`,
    },
  ];
}

export function buildStableFocusItems(undertone: string, contrast: string) {
  const stable = buildStablePalette(undertone, contrast);

  return [
    {
      title: "Mechanical match",
      copy: `${stable.undertoneLabel} x ${stable.contrastLabel} is the normalized bucket your result maps into in the article-based implementation.`,
    },
    {
      title: "Palette resolver",
      copy: `${stable.core.slice(0, 3).join(", ")} are pulled from the deterministic profile library for this bucket, while ${stable.avoid.slice(0, 3).join(", ")} stay in the caution lane.`,
    },
  ];
}

export function applyStablePalette(profile: StyleExperience): StyleExperience {
  const stable = buildStablePalette(profile.undertone, profile.contrast);
  const stableFocusItems = buildStableFocusItems(profile.undertone, profile.contrast);

  return {
    ...profile,
    focusItems: [
      {
        title: profile.focusItems[0]?.title ?? stableFocusItems[0].title,
        copy: stableFocusItems[0].copy,
      },
      {
        title: profile.focusItems[1]?.title ?? stableFocusItems[1].title,
        copy: stableFocusItems[1].copy,
      },
      ...profile.focusItems.slice(2),
    ],
    palette: {
      core: stable.core,
      avoid: stable.avoid,
    },
  };
}
