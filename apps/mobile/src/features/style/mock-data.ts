export const mockStyleProfile = {
  undertone: "Autumn Warm",
  contrast: "Deep Contrast",
  confidence: 0.98,
  plan: "free",
  summary: {
    title: "Autumn Warm /\nDeep Contrast",
    description:
      "Your skin features rich golden undertones and a high level of contrast between your eyes and hair. These earthy, saturated tones harmonize with your natural vibrancy, creating a radiant and sophisticated aesthetic.",
  },
  focusItems: [
    {
      title: "Why this works for you",
      copy: "Your skin features rich golden undertones and a high level of contrast between your eyes and hair. These earthy, saturated tones harmonize with your natural vibrancy, creating a radiant and sophisticated aesthetic.",
    },
    {
      title: "Weekend switch",
      copy: "Swap bright white for off-white to keep your skin looking vibrant and warm.",
    },
  ],
  palette: {
    core: ["Rust", "Deep Olive", "Forest Green"],
    avoid: ["Cool Blue", "Lavender"],
  },
  recommendations: [
    {
      id: "preview-1",
      category: "Outerwear",
      title: "Warm navy overshirt",
      reason: "It frames your face cleanly without pushing your contrast too hard.",
      score: 0.94,
      price: "$88",
    },
    {
      id: "preview-2",
      category: "Top",
      title: "Ecru heavyweight tee",
      reason: "It is softer than pure white and keeps your warmth intact.",
      score: 0.91,
      price: "$44",
    },
    {
      id: "preview-3",
      category: "Occasion",
      title: "Olive dinner knit",
      reason: "It looks more refined for dinner or a date without washing you out.",
      score: 0.89,
      price: "$72",
    },
  ],
};

export const wardrobeItems = [
  {
    id: "wardrobe-preview-1",
    name: "Stone overshirt",
    note: "Safe when worn near the face. It feels more balanced with an ecru base layer than with black.",
    tags: ["safe near face", "smart casual", "warm neutral"],
    fitScore: 0.9,
  },
  {
    id: "wardrobe-preview-2",
    name: "Cool grey tee",
    note: "Works as a base layer or for sportier outfits, but it is weaker as the main near-face piece.",
    tags: ["borderline", "better as base", "avoid near face"],
    fitScore: 0.74,
  },
];
