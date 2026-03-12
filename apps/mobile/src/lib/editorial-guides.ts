import type { ImageSourcePropType } from "react-native";

import {
  buildStablePalette,
  type NormalizedContrastLabel,
  type NormalizedUndertoneLabel,
} from "@/src/lib/style-profile-normalizer";
import {
  buildEditorialMatchPair,
  LOW_MATCH_THRESHOLD,
  type EditorialStory,
} from "@/src/lib/style-story";
import { editorialGuideBackgrounds } from "@/src/theme/palette";
import type { StyleExperience } from "@/src/types/tonematch";

export type GuideVariant = "primary" | "secondary";

export type StyleDirectionCard = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  backgroundColor: string;
  palette: string[];
  formula: string[];
  stylingTips: string[];
  textures: string[];
  finishingTouches: string[];
  avoid: string[];
};

export type OccasionPlaybook = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  backgroundColor: string;
  palette: string[];
  anchorPieces: string[];
  outfitFormula: string[];
  stylingMoves: string[];
  avoid: string[];
  finishingNote: string;
};

export type EditorialGuideBundle = {
  variant: GuideVariant;
  story: EditorialStory;
  summary: string;
  intro: string;
  paletteNarrative: string;
  confidenceNote: string;
  confidenceLabel: string;
  thresholdLabel: string;
  shouldSuggestAlternate: boolean;
  alternate:
    | {
        story: EditorialStory;
        reason: string;
      }
    | null;
  styleDirections: StyleDirectionCard[];
  occasions: OccasionPlaybook[];
};

type UndertoneSeed = {
  mood: string;
  temperatureLead: string;
  metals: string[];
  materials: string[];
  printDirection: string;
  accessoryDirection: string;
  avoidLead: string;
  stylingNorthStar: string;
  eventMood: string;
};

type ContrastSeed = {
  mixingRule: string;
  silhouetteRule: string;
  printScale: string;
  jewelryScale: string;
  finishingRule: string;
  caution: string;
};

const STYLE_VISUALS = [
  require("@/assets/images/discover_hero.jpg"),
  require("@/assets/images/discover_office.jpg"),
  require("@/assets/images/discover_datenight.jpg"),
  require("@/assets/images/discover_smartcasual.jpg"),
  require("@/assets/images/gift_hero.jpg"),
  require("@/assets/images/home_hero.jpg"),
  require("@/assets/images/gift_cashmere_silver.jpg"),
  require("@/assets/images/gift_silk_gold.jpg"),
] as const;

const OCCASION_VISUALS = [
  require("@/assets/images/occasion_office_hero.jpg"),
  require("@/assets/images/occasion_date_hero.jpg"),
  require("@/assets/images/occasion_weekend_hero.jpg"),
  require("@/assets/images/seasons/winter_office_hero.jpg"),
  require("@/assets/images/seasons/spring_date_hero.jpg"),
  require("@/assets/images/seasons/summer_weekend_hero.jpg"),
] as const;

const UNDERTONE_SEEDS: Record<NormalizedUndertoneLabel, UndertoneSeed> = {
  "Warm Neutral": {
    mood: "sun-warmed, grounded, and naturally rich",
    temperatureLead: "lean into warmth before brightness",
    metals: ["brushed gold", "cognac leather", "amber resin"],
    materials: ["brushed suede", "washed twill", "matte silk"],
    printDirection: "organic geometrics, softened stripes, and blurred animal motifs",
    accessoryDirection: "rounded bags, burnished hardware, and earthy tortoise accents",
    avoidLead: "icy optic white, blue-lilac, and steel-heavy pairings",
    stylingNorthStar: "keep the face framed with depth and warmth instead of sharp chill",
    eventMood: "luxurious without looking glossy or over-polished",
  },
  "Cool Bright": {
    mood: "clean, high-definition, and polished",
    temperatureLead: "let clarity and coolness stay visible",
    metals: ["silver", "gunmetal", "patent black"],
    materials: ["compact knit", "crisp poplin", "liquid satin"],
    printDirection: "graphic stripes, precise florals, and sharp contrast layouts",
    accessoryDirection: "sleek hardware, pointed shapes, and mirrored surfaces",
    avoidLead: "dusty beige, muted camel, and muddy warm browns",
    stylingNorthStar: "preserve contrast so the face stays awake and bright",
    eventMood: "editorial, clean-lined, and photo-ready",
  },
  "Olive Soft": {
    mood: "muted, directional, and earthy with a modern edge",
    temperatureLead: "normalize warmth with smoke and depth instead of obvious yellow",
    metals: ["oxidized brass", "weathered gold", "smoked hardware"],
    materials: ["washed linen", "matte crepe", "brushed cotton"],
    printDirection: "soft abstracts, tonal ikat, and low-contrast utility patterns",
    accessoryDirection: "structured but matte accessories with smoked finishes",
    avoidLead: "neon coral, icy white, and hyper-clean silver-blue contrast",
    stylingNorthStar: "keep everything grounded enough that olive depth reads intentional",
    eventMood: "understated, expensive, and slightly off-center in the best way",
  },
};

const CONTRAST_SEEDS: Record<NormalizedContrastLabel, ContrastSeed> = {
  "Low Contrast": {
    mixingRule: "build tonal columns and let transitions stay blended instead of abrupt",
    silhouetteRule: "prefer softly tailored silhouettes, gentle waist definition, and low-break layering",
    printScale: "keep prints watercolor-soft, micro-scale, or faded enough to read as texture",
    jewelryScale: "stay in fine to medium jewelry scale with restrained shine",
    finishingRule: "repeat one color family across top, mid-layer, and accessory so the outfit feels calm",
    caution: "hard black-and-white splits will overpower the face faster than they sharpen it",
  },
  "Medium Contrast": {
    mixingRule: "work with two clear values and one accent so the outfit feels composed without going stark",
    silhouetteRule: "use tailored lines, visible structure at the shoulders, and one controlled break point",
    printScale: "medium-scale prints and clean stripe rhythm will read strongest",
    jewelryScale: "medium jewelry scale with one visible focal point keeps balance",
    finishingRule: "anchor one darker neutral near the face and lift with one cleaner support tone",
    caution: "too many equal-value pieces flatten the result and make the palette feel indecisive",
  },
  "High Contrast": {
    mixingRule: "show visible light-dark separation or inky framing so your natural contrast does the work",
    silhouetteRule: "choose elongated, structured silhouettes, clean shoulders, and sharper necklines",
    printScale: "graphic, crisp, and high-definition patterns land better than blurred ones",
    jewelryScale: "medium-bold to bold jewelry can hold its own without swallowing the face",
    finishingRule: "let one dark frame and one clean highlight sit close to the face on purpose",
    caution: "when every piece is equally soft, the outfit loses the sharpness your coloring can carry",
  },
};

function buildStoryPalette(story: EditorialStory) {
  const [undertone, contrast] = story.key.split("|") as [string, string];
  return buildStablePalette(undertone, contrast);
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function pickImage(pool: readonly ImageSourcePropType[], index: number) {
  return pool[index % pool.length];
}

function buildDirectionCards(story: EditorialStory) {
  const stable = buildStoryPalette(story);
  const undertoneSeed = UNDERTONE_SEEDS[story.undertoneLabel];
  const contrastSeed = CONTRAST_SEEDS[story.contrastLabel];
  const paletteCore = stable.core;
  const paletteNeutrals = stable.neutrals;
  const paletteAccents = stable.accents;

  const backgrounds = editorialGuideBackgrounds;

  return [
    {
      id: "daily-signature",
      eyebrow: "Signature Uniform",
      title: `${story.essenceTitle} in daylight`,
      subtitle: `Your easiest daily formula should feel ${undertoneSeed.mood}.`,
      image: pickImage(STYLE_VISUALS, 0),
      backgroundColor: backgrounds[0],
      palette: [paletteNeutrals[0], paletteCore[0], paletteAccents[0]],
      formula: [
        `${titleCase(paletteNeutrals[0])} knit or tee near the face`,
        `${titleCase(paletteCore[0])} bottom or overshirt to lock in depth`,
        `${titleCase(paletteAccents[0])} used once through a shoe, bag, or lip`,
      ],
      stylingTips: [
        `Start with ${paletteNeutrals[0]} or ${paletteCore[0]} above the waist so you stay inside the ${story.seasonTitle} lane immediately.`,
        `Follow the contrast rule: ${contrastSeed.mixingRule}.`,
        `Choose ${undertoneSeed.materials[0]} and ${undertoneSeed.materials[1]} before high-gloss finishes; they support ${undertoneSeed.temperatureLead}.`,
        `If you add print, use ${contrastSeed.printScale} driven by ${undertoneSeed.printDirection}.`,
        `Your easiest accessory win is ${undertoneSeed.accessoryDirection} finished in ${undertoneSeed.metals[0]}.`,
      ],
      textures: [
        `${undertoneSeed.materials[0]} for tops and light layers`,
        `${undertoneSeed.materials[1]} for trousers, skirts, or overshirts`,
        contrastSeed.silhouetteRule,
      ],
      finishingTouches: [
        `Keep makeup and lip tone close to ${paletteAccents[0]} when you want the outfit to look finished without adding another color story.`,
        `Repeat ${paletteCore[0]} or ${paletteNeutrals[0]} in one accessory to avoid visual drift.`,
      ],
      avoid: [
        undertoneSeed.avoidLead,
        contrastSeed.caution,
      ],
    },
    {
      id: "work-tailoring",
      eyebrow: "Work Tailoring",
      title: `Polished structure for ${story.seasonTitle}`,
      subtitle: "This is the lane to use when you need authority without leaving your palette.",
      image: pickImage(STYLE_VISUALS, 1),
      backgroundColor: backgrounds[1],
      palette: [paletteCore[1], paletteNeutrals[1], paletteAccents[0]],
      formula: [
        `${titleCase(paletteCore[1])} blazer, jacket, or strong knit layer`,
        `${titleCase(paletteNeutrals[1])} shirt, shell, or base layer`,
        `${titleCase(paletteAccents[0])} only in one strategic accent for lift`,
      ],
      stylingTips: [
        `Treat ${paletteCore[1]} as the authority color. It gives shape without disconnecting from your face.`,
        `Keep shirt colors inside ${paletteNeutrals[0]}, ${paletteNeutrals[1]}, or ${paletteCore[0]} so the top half stays analysis-safe.`,
        `Let tailoring follow this rule: ${contrastSeed.silhouetteRule}.`,
        `Hardware should stay in ${undertoneSeed.metals.slice(0, 2).join(" or ")}; mixed shiny metals usually weaken the read.`,
        `When you need polish for meetings, ${contrastSeed.finishingRule}.`,
      ],
      textures: [
        `${undertoneSeed.materials[1]} suiting and matte structure outperform slippery sheen in daylight.`,
        `Use ${undertoneSeed.materials[2]} for blouses, scarves, or refined shells when you need softness.`,
        `Choose ${undertoneSeed.printDirection} only if the print is subtle enough to support your contrast lane.`,
      ],
      finishingTouches: [
        `A belt, watch strap, or shoe in ${paletteCore[1]} or ${paletteAccents[0]} keeps the outfit looking intentional.`,
        `If you wear glasses, pick frames closer to ${paletteCore[0]} than pure black unless your lane is high contrast cool.`,
      ],
      avoid: [
        `Do not park ${stable.avoid[0]} at the collar line; it will fight the skin before the tailoring can help.`,
        `Avoid office outfits where every neutral sits at the same value, especially for ${story.contrastLabel.toLowerCase()} profiles.`,
      ],
    },
    {
      id: "smart-casual",
      eyebrow: "Smart Casual",
      title: "Relaxed pieces that still read matched",
      subtitle: "Use this lane for lunches, gallery days, coffee meetings, and easy social plans.",
      image: pickImage(STYLE_VISUALS, 3),
      backgroundColor: backgrounds[2],
      palette: [paletteCore[2], paletteNeutrals[0], paletteAccents[1]],
      formula: [
        `${titleCase(paletteCore[2])} knitwear, overshirt, or utility jacket`,
        `${titleCase(paletteNeutrals[0])} denim-adjacent neutral or soft trouser`,
        `${titleCase(paletteAccents[1])} in a scarf, sneaker detail, or compact bag`,
      ],
      stylingTips: [
        `${undertoneSeed.stylingNorthStar}. Use smart-casual outfits to prove that comfort does not mean palette drift.`,
        `Choose washed, peached, or softly brushed fabrics before cold technical shine.`,
        `For denim, stay closer to ${paletteCore[2]} and ${paletteNeutrals[0]} than stark indigo-white contrast.`,
        `The best casual print direction is ${undertoneSeed.printDirection}, kept within ${contrastSeed.printScale}.`,
        `If you wear sneakers, match them to ${paletteNeutrals[0]} or ${paletteCore[2]} instead of defaulting to bright white.`,
      ],
      textures: [
        `${undertoneSeed.materials[0]} and ${undertoneSeed.materials[2]} keep weekend pieces elevated.`,
        `Relaxed silhouettes work best when the neckline, collar, or first layer still respects ${contrastSeed.finishingRule}.`,
      ],
      finishingTouches: [
        `Use one strong textural piece, not three. Texture should substitute for extra color noise.`,
        `Choose sunglasses, caps, or outerwear trims that echo ${undertoneSeed.metals[0]} or ${paletteCore[2]}.`,
      ],
      avoid: [
        `Do not let optic white sneakers or loud logo graphics become the brightest thing in the outfit.`,
        `Skip casual color pops that live in ${stable.avoid[1]} or ${stable.avoid[2]}; they will read random, not playful.`,
      ],
    },
    {
      id: "evening-editorial",
      eyebrow: "Evening Editorial",
      title: "After-dark depth without costume energy",
      subtitle: `Your evening lane should feel ${undertoneSeed.eventMood}.`,
      image: pickImage(STYLE_VISUALS, 2),
      backgroundColor: backgrounds[3],
      palette: [paletteCore[0], paletteCore[1], paletteAccents[0]],
      formula: [
        `${titleCase(paletteCore[0])} or ${titleCase(paletteCore[1])} as the dominant column`,
        `${titleCase(paletteAccents[0])} carried through lip, heel, bag, or jewelry stone`,
        `One clean highlight only if it supports ${story.contrastLabel.toLowerCase()}`,
      ],
      stylingTips: [
        `Night looks get better when you deepen inside your palette instead of switching to generic black.`,
        `Use sheen strategically: ${undertoneSeed.materials[2]} is enough; the rest should stay matte or softly reflective.`,
        `Let jewelry scale follow this rule: ${contrastSeed.jewelryScale}.`,
        `For dresses or suiting, keep the neckline and shoulder line aligned with ${contrastSeed.silhouetteRule}.`,
        `If you need one memorable detail, place ${paletteAccents[0]} or ${paletteAccents[1]} closest to the face and let the rest quiet down.`,
      ],
      textures: [
        `${undertoneSeed.materials[2]} for slip pieces, evening shells, or draped scarves`,
        `${undertoneSeed.materials[1]} for evening tailoring so the frame still looks expensive`,
      ],
      finishingTouches: [
        `Choose a bag or shoe finish that echoes ${undertoneSeed.metals[0]} or ${undertoneSeed.metals[1]}.`,
        `If you wear a lip, anchor it to ${paletteAccents[0]} rather than introducing a completely new undertone.`,
      ],
      avoid: [
        `Pure nightclub brights and generic metallic silver can disconnect the face from the outfit fast in this lane.`,
        `Avoid over-highlighting the eye or cheek if the outfit already carries contrast; one focal point is enough.`,
      ],
    },
    {
      id: "statement-layer",
      eyebrow: "Statement Piece",
      title: "How to add fashion energy without leaving the analysis",
      subtitle: "Use this card when you want more personality, trend, or fashion tension.",
      image: pickImage(STYLE_VISUALS, 4),
      backgroundColor: backgrounds[4],
      palette: [paletteAccents[0], paletteAccents[1], paletteCore[0]],
      formula: [
        `Pick one statement item in ${titleCase(paletteAccents[0])} or ${titleCase(paletteAccents[1])}`,
        `Support it with ${titleCase(paletteCore[0])} plus one quiet neutral`,
        `Repeat the statement color once in beauty, metal, or accessory detail`,
      ],
      stylingTips: [
        `Statement dressing works best when the loudest move still belongs to your bucket. Start from ${paletteAccents[0]} before experimenting outside the analysis.`,
        `Trend pieces should respect ${contrastSeed.mixingRule}; the formula matters as much as the color.`,
        `Use volume, texture, or shape to create drama before adding a fourth color.`,
        `Your print lane is ${undertoneSeed.printDirection}; if a trend piece ignores that, it will feel costume-like quickly.`,
        `When in doubt, let ${paletteCore[0]} or ${paletteNeutrals[0]} quiet the rest of the look down.`,
      ],
      textures: [
        `Trend fabrics still need restraint: ${undertoneSeed.materials.join(", ")} will outperform plastic shine.`,
        `One oversized or directional silhouette is enough when the palette is already doing visual work.`,
      ],
      finishingTouches: [
        `Mirror the statement tone in a ring, nail, lip, or shoe edge so the outfit feels authored.`,
        `Photographs improve when you keep one clean face-framing color and let the statement piece sit slightly away from the center.`,
      ],
      avoid: [
        `Do not borrow your statement color from ${stable.avoid[0]} just because it is trending.`,
        `If a piece requires heavy makeup correction to work, it is outside your lane.`,
      ],
    },
  ] satisfies StyleDirectionCard[];
}

function buildOccasionGuides(story: EditorialStory) {
  const stable = buildStoryPalette(story);
  const undertoneSeed = UNDERTONE_SEEDS[story.undertoneLabel];
  const contrastSeed = CONTRAST_SEEDS[story.contrastLabel];

  return [
    {
      id: "office-day",
      eyebrow: "Office Day",
      title: "Desk-to-meeting formula",
      subtitle: "Use when you need polish, calm authority, and zero palette drift.",
      image: pickImage(OCCASION_VISUALS, 0),
      backgroundColor: editorialGuideBackgrounds[0],
      palette: [stable.core[0], stable.neutrals[1], stable.accents[0]],
      anchorPieces: [
        `${stable.core[0]} blazer or knit jacket`,
        `${stable.neutrals[1]} shell, shirt, or fine gauge knit`,
        `${stable.core[1]} trouser, skirt, or structured dress base`,
      ],
      outfitFormula: [
        `Keep the first color seen at the collar in ${stable.core[0]} or ${stable.neutrals[1]}.`,
        `Let one darker column carry competence, then add one accent only through ${stable.accents[0]}.`,
        `Finish with ${undertoneSeed.metals[0]} hardware and clean footwear that does not introduce a new undertone.`,
      ],
      stylingMoves: [
        `Client-facing days reward restraint. ${contrastSeed.finishingRule}.`,
        `If you add pattern, it should follow ${contrastSeed.printScale}.`,
        `Choose bags, belts, or watches that echo ${undertoneSeed.accessoryDirection}.`,
      ],
      avoid: [
        `Skip bright white shirting unless your lane is cool and high contrast.`,
        `Avoid putting ${stable.avoid[0]} directly in scarves, collars, or statement earrings.`,
      ],
      finishingNote: `This occasion works when the outfit feels competent first and stylish second. ${story.seasonTitle} does that best through coherence, not surprise.`,
    },
    {
      id: "date-night",
      eyebrow: "Date Night",
      title: "Soft focus, strong face framing",
      subtitle: "Designed for dinner, drinks, rooftop evenings, and low light.",
      image: pickImage(OCCASION_VISUALS, 1),
      backgroundColor: editorialGuideBackgrounds[1],
      palette: [stable.core[1], stable.accents[0], stable.accents[1]],
      anchorPieces: [
        `${stable.core[1]} slip, dress, blouse, or compact knit`,
        `${stable.accents[0]} bag, lip, heel, or jewelry stone`,
        `${stable.accents[1]} used once if the outfit needs a second note`,
      ],
      outfitFormula: [
        `Build the look around one deep or flattering base color instead of default black.`,
        `Place the most flattering accent closest to the face through a neckline, lip, earring, or scarf edge.`,
        `Keep outerwear inside your neutral lane so the lightest value in the outfit stays intentional.`,
      ],
      stylingMoves: [
        `Evening romance is stronger when the texture does the work. Reach for ${undertoneSeed.materials[2]} and one matte balancing surface.`,
        `Let jewelry scale follow ${contrastSeed.jewelryScale}.`,
        `Keep beauty inside the same undertone family as ${stable.accents[0]} so the face and clothing stay in dialogue.`,
      ],
      avoid: [
        `Do not use trend colors from ${stable.avoid.join(", ")} just because night lighting feels forgiving.`,
        `Avoid adding both heavy sparkle and high-contrast makeup unless your profile is built for it.`,
      ],
      finishingNote: `The winning version of this look feels ${undertoneSeed.eventMood} and still unmistakably tied to ${story.seasonTitle}.`,
    },
    {
      id: "weekend",
      eyebrow: "Weekend",
      title: "Brunch, errands, and social ease",
      subtitle: "Comfort-first looks that still photograph like a matched wardrobe.",
      image: pickImage(OCCASION_VISUALS, 2),
      backgroundColor: editorialGuideBackgrounds[2],
      palette: [stable.neutrals[0], stable.core[2], stable.accents[1]],
      anchorPieces: [
        `${stable.neutrals[0]} base layer or knit`,
        `${stable.core[2]} denim alternative, overshirt, or utility piece`,
        `${stable.accents[1]} only if the look needs a pulse`,
      ],
      outfitFormula: [
        `Start soft, then add one grounded color to stop the outfit from washing out.`,
        `Use sneakers, flats, or boots in a value close to your trousers or bag.`,
        `Let texture replace excessive layering; one washed or brushed piece is usually enough.`,
      ],
      stylingMoves: [
        `${contrastSeed.mixingRule}. Weekend styling gets stronger when the contrast story still looks deliberate.`,
        `Choose sunglasses, caps, and outer layers that stay close to ${stable.core[2]} or ${stable.neutrals[0]}.`,
        `If you want a playful note, pull from ${stable.accents[1]} instead of defaulting to optic white or neon sport colors.`,
      ],
      avoid: [
        `Skip cold, hyper-bright activewear colors near the neckline if they sit in ${stable.avoid.join(", ")}.`,
        `Avoid making the shoe the brightest item in the look unless that is the only statement you are carrying.`,
      ],
      finishingNote: "This guide should feel easy enough to repeat every weekend without thinking. Repetition is a feature, not a limitation.",
    },
    {
      id: "events",
      eyebrow: "Events",
      title: "Wedding guest, gallery opening, or dressy dinner",
      subtitle: "More elevated than date night, but still analysis-led.",
      image: pickImage(OCCASION_VISUALS, 3),
      backgroundColor: editorialGuideBackgrounds[3],
      palette: [stable.core[0], stable.accents[0], stable.neutrals[2]],
      anchorPieces: [
        `${stable.core[0]} or ${stable.accents[0]} as the hero fabric`,
        `${stable.neutrals[2]} as the balancing layer, shoe, or wrap`,
        `${undertoneSeed.metals[0]} jewelry family throughout`,
      ],
      outfitFormula: [
        `Choose one hero color, then build the rest as support instead of competition.`,
        `If the dress or suit is already dramatic, keep shoe and bag inside your neutral lane.`,
        `If the garment is simple, let jewelry or lip carry the elevated finish.`,
      ],
      stylingMoves: [
        `Events reward clean editing. ${contrastSeed.finishingRule}.`,
        `Select fabrics that move well in light: ${undertoneSeed.materials[2]} for drape, ${undertoneSeed.materials[1]} for shape.`,
        `Your best camera-ready move is to repeat one palette color in three places: garment, beauty, and accessory.`,
      ],
      avoid: [
        `Avoid icy formalwear defaults if your face reads stronger in warmth or smoke.`,
        `Do not over-stack statement pieces; one memorable note is enough.`,
      ],
      finishingNote: `This look succeeds when people notice you before they notice the dress code. ${undertoneSeed.stylingNorthStar}.`,
    },
    {
      id: "travel-day",
      eyebrow: "Travel Day",
      title: "Functional layers that still look matched",
      subtitle: "Airport, train, road trip, or full-day movement.",
      image: pickImage(OCCASION_VISUALS, 4),
      backgroundColor: editorialGuideBackgrounds[4],
      palette: [stable.neutrals[1], stable.core[0], stable.core[2]],
      anchorPieces: [
        `${stable.neutrals[1]} set, knit, or jersey base`,
        `${stable.core[0]} outer layer closest to the face`,
        `${stable.core[2]} shoe, scarf, or functional bag to ground the outfit`,
      ],
      outfitFormula: [
        `Travel looks work when the top half still reads like a real outfit, not only activewear.`,
        `Choose three pieces in neighboring values so creases and layers still look intentional.`,
        `Let the outer layer carry the strongest analysis-safe color because it will dominate most photos.`,
      ],
      stylingMoves: [
        `Use easy-care versions of ${undertoneSeed.materials[0]} and ${undertoneSeed.materials[1]}.`,
        `Keep your brightest item in the bag, shoe, or luggage trim instead of the collar line.`,
        `${contrastSeed.caution}`,
      ],
      avoid: [
        `Skip airport outfits built around fluorescent trainers or icy hoodies that fight your skin tone.`,
        `Avoid overcomplicating travel style with too many visible accessories; functionality should still win.`,
      ],
      finishingNote: "A good travel outfit survives bad lighting. Staying inside the analysis-safe neutral lane matters more here than on almost any other day.",
    },
    {
      id: "camera-day",
      eyebrow: "Camera Day",
      title: "Photos, content shoots, and profile-picture moments",
      subtitle: "For any day where the outfit needs to hold up on screen and in stills.",
      image: pickImage(OCCASION_VISUALS, 5),
      backgroundColor: editorialGuideBackgrounds[5],
      palette: [stable.core[0], stable.accents[0], stable.neutrals[0]],
      anchorPieces: [
        `${stable.core[0]} or ${stable.accents[0]} nearest the face`,
        `${stable.neutrals[0]} as the balancing field so the camera sees depth`,
        `${undertoneSeed.metals[0]} or ${undertoneSeed.metals[1]} detail for finish`,
      ],
      outfitFormula: [
        `Put the strongest face-flattering color into the neckline zone because the crop will often cut everything else away.`,
        `Avoid tiny noisy prints. Cameras prefer shape, value control, and one memorable color.`,
        `If the background is unknown, keep the outfit palette unmistakably yours instead of trendy.`,
      ],
      stylingMoves: [
        `${contrastSeed.finishingRule}. Cameras exaggerate confusion faster than the naked eye does.`,
        `Matte or softly reflective fabrics hold detail better than highly shiny synthetics.`,
        `Repeat one color across outfit, lip, and accessory so the frame looks authored.`,
      ],
      avoid: [
        `Avoid all colors in ${stable.avoid.join(", ")} on days where you know you will be photographed closely.`,
        `Do not let a bag, phone case, or jacket lining introduce a random bright color near the face.`,
      ],
      finishingNote: `If you remember one rule for camera days, let it be this: ${undertoneSeed.stylingNorthStar}.`,
    },
  ] satisfies OccasionPlaybook[];
}

export function buildEditorialGuideBundle(
  profile?: StyleExperience | null,
  variant: GuideVariant = "primary",
): EditorialGuideBundle {
  const pair = buildEditorialMatchPair(profile);
  const selected = variant === "secondary" ? pair.secondary : pair.primary;
  const stable = buildStoryPalette(selected);

  const confidencePct = Math.round((profile?.confidence ?? 0.98) * 100);
  const confidenceNote = pair.shouldSuggestSecondary
    ? `Your current match is ${confidencePct}%, which sits below the ${Math.round(LOW_MATCH_THRESHOLD * 100)}% confidence threshold. Read this lane first, then compare it with ${pair.secondary.seasonTitle} because both are close.`
    : `Your current match is ${confidencePct}%, which is above the ${Math.round(LOW_MATCH_THRESHOLD * 100)}% confidence threshold. This is the main lane the app should prioritize across shopping, wardrobe, and outfit guides.`;

  const summary =
    variant === "secondary"
      ? `${selected.seasonTitle} is the nearest alternate lane. Review it when your best colors feel slightly too warm, too cool, too soft, or too sharp in real life.`
      : `${selected.seasonTitle} is the lead lane ToneMatch should use for styling, shopping, and wardrobe decisions.`;

  const intro =
    variant === "secondary"
      ? `This alternate guide lets you compare the second-closest analysis lane against your primary result. Use it when the primary match feels close but not perfect, especially in near-face pieces and camera-heavy outfits.`
      : `This guide translates your saved analysis into real styling moves. Every recommendation below is tied to the same normalized undertone and contrast bucket that powers your palette, product ranking, and outfit logic.`;

  const paletteNarrative = `${selected.tagline} The deterministic palette for this lane starts with ${stable.core.slice(0, 3).join(", ")}, supports with ${stable.neutrals.slice(0, 2).join(", ")}, and keeps ${stable.avoid.slice(0, 2).join(", ")} out of the face zone whenever possible.`;

  return {
    variant,
    story: selected,
    summary,
    intro,
    paletteNarrative,
    confidenceNote,
    confidenceLabel: `${confidencePct}% MATCH`,
    thresholdLabel: `${Math.round(LOW_MATCH_THRESHOLD * 100)}% THRESHOLD`,
    shouldSuggestAlternate: pair.shouldSuggestSecondary,
    alternate: pair.shouldSuggestSecondary
      ? {
          story: variant === "secondary" ? pair.primary : pair.secondary,
          reason:
            variant === "secondary"
              ? `Compare this against ${pair.primary.seasonTitle} to see which lane handles your real wardrobe and selfies more convincingly.`
              : `Because your score is below the confidence threshold, it is worth comparing this guide against ${pair.secondary.seasonTitle} before buying heavily into one palette.`,
        }
      : null,
    styleDirections: buildDirectionCards(selected),
    occasions: buildOccasionGuides(selected),
  };
}
