/**
 * Tests for the ToneMatch API layer.
 *
 * These tests verify the fallback logic, data transformation, and helper
 * functions without requiring external services (Supabase/OpenRouter).
 */

/* ------------------------------------------------------------------ */
/*  Mocks — must be set up BEFORE importing the module under test      */
/* ------------------------------------------------------------------ */

// Mock env — no backend configured
jest.mock("@/src/lib/env", () => ({
  backendConfigured: false,
  supabaseConfig: { url: "https://example.supabase.co", anonKey: "test-key" },
}));

// Mock supabase client
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
    }),
    storage: { from: jest.fn() },
    rpc: jest.fn(),
  },
}));

// Mock profile store
const mockProfileStore = {
  loadProfile: jest.fn().mockResolvedValue(null),
  saveProfile: jest.fn().mockResolvedValue(undefined),
  clearProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock("@/src/store/profile-store", () => mockProfileStore);

// Mock openrouter
jest.mock("@/src/lib/openrouter", () => ({
  openrouterConfigured: false,
  analyzeSelfie: jest.fn(),
  analyzeClothing: jest.fn(),
  selfieResultToStyleExperience: jest.fn(),
}));

// Mock image compress
jest.mock("@/src/lib/image-compress", () => ({
  compressForAnalysis: jest.fn((asset: unknown) => asset),
  compressForWardrobe: jest.fn((asset: unknown) => asset),
}));

// Mock app store
jest.mock("@/src/store/app-store", () => ({
  useAppStore: Object.assign(
    jest.fn((selector: (state: Record<string, unknown>) => unknown) => selector({
      previewPlan: "free",
      previewMode: false,
    })),
    { getState: () => ({ previewPlan: "free", previewMode: false }) },
  ),
}));

// Mock style mock data
jest.mock("@/src/features/style/mock-data", () => ({
  mockStyleProfile: {
    undertone: "Warm Neutral",
    contrast: "Medium Contrast",
    confidence: 0.87,
    plan: "plus",
    summary: { title: "Warm / Medium", description: "Mock profile." },
    focusItems: [],
    palette: { core: ["Rust", "Olive"], avoid: ["Icy Grey"] },
    recommendations: [
      { id: "rec-1", title: "Blazer", category: "Outerwear", reason: "Nice.", score: 0.94, price: "$88" },
    ],
  },
  wardrobeItems: [
    { id: "w1", name: "Test Shirt", note: "Good", tags: ["warm"], fitScore: 0.9 },
  ],
}));

/* ------------------------------------------------------------------ */
/*  Imports (after mocks)                                              */
/* ------------------------------------------------------------------ */

import {
  fetchStyleExperience,
  pollAnalysisSession,
  fetchWardrobeItems,
  fetchAnalysisHistory,
  fetchCatalogFeed,
  fetchSubscriptionState,
} from "@/src/lib/tonematch-api";

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("fetchStyleExperience", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns stored profile when available", async () => {
    const storedProfile = {
      undertone: "Cool Bright",
      contrast: "High Contrast",
      confidence: 0.9,
      plan: "plus" as const,
      summary: { title: "Cool / High", description: "Stored." },
      focusItems: [],
      palette: { core: ["Ink Blue"], avoid: ["Camel"] },
      recommendations: [],
    };
    mockProfileStore.loadProfile.mockResolvedValueOnce(storedProfile);

    const result = await fetchStyleExperience("user-1");
    expect(result).toEqual(storedProfile);
  });

  it("returns mock profile when no backend and no stored profile", async () => {
    mockProfileStore.loadProfile.mockResolvedValueOnce(null);

    const result = await fetchStyleExperience("user-1");
    expect(result).not.toBeNull();
    expect(result!.undertone).toBe("Warm Neutral");
  });

  it("returns mock profile when userId is null", async () => {
    mockProfileStore.loadProfile.mockResolvedValueOnce(null);

    const result = await fetchStyleExperience(null);
    expect(result).not.toBeNull();
  });
});

describe("pollAnalysisSession", () => {
  it("returns completed immediately for openrouter sessions", async () => {
    const result = await pollAnalysisSession("openrouter-12345");
    expect(result.status).toBe("completed");
    expect(result.id).toBe("openrouter-12345");
    expect(result.confidenceScore).toBe(0.92);
  });

  it("returns completed quickly when backend not configured", async () => {
    const result = await pollAnalysisSession("mock-session-1", 5000);
    expect(result.status).toBe("completed");
    expect(result.confidenceScore).toBe(0.86);
  });
});

describe("fetchWardrobeItems", () => {
  it("returns preview items when backend not configured", async () => {
    const items = await fetchWardrobeItems("user-1");
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toBe("Test Shirt");
  });

  it("returns preview items when userId is null", async () => {
    const items = await fetchWardrobeItems(null);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("fetchAnalysisHistory", () => {
  it("returns empty array when backend not configured", async () => {
    const history = await fetchAnalysisHistory("user-1");
    expect(history).toEqual([]);
  });

  it("returns empty array when userId is null", async () => {
    const history = await fetchAnalysisHistory(null);
    expect(history).toEqual([]);
  });
});

describe("fetchCatalogFeed", () => {
  it("uses stored profile recommendations when available", async () => {
    const storedProfile = {
      undertone: "Warm",
      contrast: "Medium",
      confidence: 0.87,
      plan: "plus" as const,
      summary: { title: "W/M", description: "" },
      focusItems: [],
      palette: { core: ["Rust"], avoid: ["Grey"] },
      recommendations: [
        { id: "r1", title: "Item 1", category: "Top", reason: "Good.", score: 0.9, price: "$50" },
      ],
    };
    mockProfileStore.loadProfile.mockResolvedValueOnce(storedProfile);

    const feed = await fetchCatalogFeed("user-1");
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].title).toBe("Item 1");
    expect(feed[0].description).toContain("Warm");
  });

  it("falls back to mock recommendations when no profile", async () => {
    mockProfileStore.loadProfile.mockResolvedValueOnce(null);

    const feed = await fetchCatalogFeed(null);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].description).toContain("Scan your face");
  });
});

describe("fetchSubscriptionState", () => {
  it("returns default plan when backend not configured", async () => {
    const state = await fetchSubscriptionState("user-1");
    expect(state.plan).toBe("plus");
    expect(state.provider).toBe("local");
  });
});
