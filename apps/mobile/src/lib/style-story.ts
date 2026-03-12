import {
  buildStablePalette,
  type NormalizedContrastLabel,
  type NormalizedUndertoneLabel,
  type ProfileKey,
} from "@/src/lib/style-profile-normalizer";
import type { StyleExperience } from "@/src/types/tonematch";

export type EditorialStory = {
  key: ProfileKey;
  seasonTitle: string;
  essenceTitle: string;
  tagline: string;
  undertoneLabel: NormalizedUndertoneLabel;
  contrastLabel: NormalizedContrastLabel;
  paletteLead: string[];
  cautionLead: string[];
};

const SEASON_TITLES: Record<ProfileKey, { seasonTitle: string; essenceTitle: string; tagline: string }> = {
  "Warm Neutral|Low Contrast": {
    seasonTitle: "Soft Autumn",
    essenceTitle: "Quiet Warmth",
    tagline: "Blended warm neutrals and softened depth keep the face alive without pushing contrast too hard.",
  },
  "Warm Neutral|Medium Contrast": {
    seasonTitle: "Warm Autumn",
    essenceTitle: "Grounded Warmth",
    tagline: "Clear warm earth tones hold structure around the face while staying natural.",
  },
  "Warm Neutral|High Contrast": {
    seasonTitle: "Deep Autumn",
    essenceTitle: "Rich Warm Depth",
    tagline: "Dense, grounded color and deeper value contrast frame the face best.",
  },
  "Cool Bright|Low Contrast": {
    seasonTitle: "Soft Summer",
    essenceTitle: "Cool Softness",
    tagline: "Muted cool tones preserve clarity without overwhelming the complexion.",
  },
  "Cool Bright|Medium Contrast": {
    seasonTitle: "Bright Winter",
    essenceTitle: "Clean Contrast",
    tagline: "Cleaner cool tones and sharper separation keep the skin clear and awake.",
  },
  "Cool Bright|High Contrast": {
    seasonTitle: "Cool Winter",
    essenceTitle: "High Clarity",
    tagline: "Crisp cool contrast and darker framing colors carry the face strongest.",
  },
  "Olive Soft|Low Contrast": {
    seasonTitle: "Soft Olive",
    essenceTitle: "Muted Olive Ease",
    tagline: "Grounded low-contrast colors stabilize olive skin without making it grey.",
  },
  "Olive Soft|Medium Contrast": {
    seasonTitle: "Muted Olive",
    essenceTitle: "Earthbound Balance",
    tagline: "Muted depth and green-leaning neutrals keep the palette coherent.",
  },
  "Olive Soft|High Contrast": {
    seasonTitle: "Deep Olive",
    essenceTitle: "Grounded Contrast",
    tagline: "Deeper grounded tones preserve contrast while avoiding icy drift.",
  },
};

const SECONDARY_PROFILE_MAP: Record<ProfileKey, ProfileKey> = {
  "Warm Neutral|Low Contrast": "Olive Soft|Low Contrast",
  "Warm Neutral|Medium Contrast": "Olive Soft|Medium Contrast",
  "Warm Neutral|High Contrast": "Olive Soft|High Contrast",
  "Cool Bright|Low Contrast": "Olive Soft|Low Contrast",
  "Cool Bright|Medium Contrast": "Cool Bright|High Contrast",
  "Cool Bright|High Contrast": "Cool Bright|Medium Contrast",
  "Olive Soft|Low Contrast": "Warm Neutral|Low Contrast",
  "Olive Soft|Medium Contrast": "Warm Neutral|Medium Contrast",
  "Olive Soft|High Contrast": "Warm Neutral|High Contrast",
};

export const LOW_MATCH_THRESHOLD = 0.82;

function buildEditorialStoryFromStable(
  stable: ReturnType<typeof buildStablePalette>,
  options?: {
    tagline?: string;
  },
): EditorialStory {
  const defaultSeason = SEASON_TITLES[stable.key];

  return {
    key: stable.key,
    seasonTitle: defaultSeason.seasonTitle,
    essenceTitle: defaultSeason.essenceTitle,
    tagline: options?.tagline || defaultSeason.tagline,
    undertoneLabel: stable.undertoneLabel,
    contrastLabel: stable.contrastLabel,
    paletteLead: stable.core.slice(0, 4),
    cautionLead: stable.avoid.slice(0, 3),
  };
}

export function buildEditorialStoryFromKey(key: ProfileKey): EditorialStory {
  const [undertone, contrast] = key.split("|") as [string, string];
  return buildEditorialStoryFromStable(buildStablePalette(undertone, contrast));
}

export function buildEditorialStory(profile?: StyleExperience | null): EditorialStory {
  const stable = buildStablePalette(
    profile?.undertone ?? "Warm Neutral",
    profile?.contrast ?? "Medium Contrast",
  );

  return buildEditorialStoryFromStable(stable, {
    tagline: profile?.summary.description || profile?.focusItems[0]?.copy,
  });
}

export function buildEditorialMatchPair(profile?: StyleExperience | null) {
  const primary = buildEditorialStory(profile);
  const secondary = buildEditorialStoryFromKey(SECONDARY_PROFILE_MAP[primary.key]);

  return {
    primary,
    secondary,
    shouldSuggestSecondary:
      typeof profile?.confidence === "number" && profile.confidence < LOW_MATCH_THRESHOLD,
  };
}
