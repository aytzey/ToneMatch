jest.mock("@/assets/images/discover_hero.png", () => 1);
jest.mock("@/assets/images/discover_office.png", () => 1);
jest.mock("@/assets/images/discover_datenight.png", () => 1);
jest.mock("@/assets/images/discover_smartcasual.png", () => 1);
jest.mock("@/assets/images/gift_hero.png", () => 1);
jest.mock("@/assets/images/home_hero.png", () => 1);
jest.mock("@/assets/images/gift_cashmere_silver.png", () => 1);
jest.mock("@/assets/images/gift_silk_gold.png", () => 1);
jest.mock("@/assets/images/occasion_office_hero.png", () => 1);
jest.mock("@/assets/images/occasion_date_hero.png", () => 1);
jest.mock("@/assets/images/occasion_weekend_hero.png", () => 1);
jest.mock("@/assets/images/seasons/winter_office_hero.jpg", () => 1);
jest.mock("@/assets/images/seasons/spring_date_hero.jpg", () => 1);
jest.mock("@/assets/images/seasons/summer_weekend_hero.jpg", () => 1);

import { buildEditorialGuideBundle } from "@/src/lib/editorial-guides";

describe("buildEditorialGuideBundle", () => {
  it("builds a detailed primary guide for the saved lane", () => {
    const bundle = buildEditorialGuideBundle({
      undertone: "Warm Neutral",
      contrast: "Medium Contrast",
      confidence: 0.9,
      plan: "plus",
      summary: {
        title: "Warm / Medium",
        description: "Grounded warm depth and balanced contrast.",
      },
      focusItems: [],
      palette: {
        core: ["Rust", "Olive", "Warm Navy"],
        avoid: ["Icy Grey", "Blue Violet"],
      },
      recommendations: [],
    });

    expect(bundle.story.seasonTitle).toBe("Warm Autumn");
    expect(bundle.styleDirections).toHaveLength(5);
    expect(bundle.occasions).toHaveLength(6);
    expect(bundle.shouldSuggestAlternate).toBe(false);
  });

  it("surfaces the alternate lane below the confidence threshold", () => {
    const bundle = buildEditorialGuideBundle(
      {
        undertone: "Warm Neutral",
        contrast: "Low Contrast",
        confidence: 0.72,
        plan: "plus",
        summary: {
          title: "Warm / Low",
          description: "Soft, close-value harmony.",
        },
        focusItems: [],
        palette: {
          core: ["Ecru", "Soft Olive", "Warm Taupe"],
          avoid: ["Blue White", "Harsh Black"],
        },
        recommendations: [],
      },
      "secondary",
    );

    expect(bundle.shouldSuggestAlternate).toBe(true);
    expect(bundle.alternate?.story.seasonTitle).toBe("Soft Autumn");
    expect(bundle.story.seasonTitle).toBe("Soft Olive");
  });
});
