/**
 * Tests for the profile store (AsyncStorage-backed cache).
 */

// Mock AsyncStorage
const mockStorage = new Map<string, string>();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
  },
}));

import type { StyleExperience } from "@/src/types/tonematch";

// Re-import with fresh module state on each test
let profileStore: typeof import("@/src/store/profile-store");

const TEST_PROFILE: StyleExperience = {
  undertone: "Warm Neutral",
  contrast: "Medium Contrast",
  confidence: 0.87,
  plan: "plus",
  summary: { title: "Warm / Medium", description: "Test profile." },
  focusItems: [{ title: "Near-face colors", copy: "Rust, Olive work well." }],
  palette: { core: ["Rust", "Olive"], avoid: ["Icy Grey"] },
  recommendations: [],
};

beforeEach(() => {
  mockStorage.clear();
  jest.resetModules();
  // Re-require to reset the in-memory cache
  profileStore = require("@/src/store/profile-store");
});

describe("profile-store", () => {
  it("saveProfile stores and loadProfile retrieves", async () => {
    await profileStore.saveProfile(TEST_PROFILE);
    const loaded = await profileStore.loadProfile();
    expect(loaded).toEqual(TEST_PROFILE);
  });

  it("loadProfile returns null when nothing is stored", async () => {
    const loaded = await profileStore.loadProfile();
    expect(loaded).toBeNull();
  });

  it("clearProfile removes stored data", async () => {
    await profileStore.saveProfile(TEST_PROFILE);
    await profileStore.clearProfile();
    // Need to re-require to clear in-memory cache
    jest.resetModules();
    profileStore = require("@/src/store/profile-store");
    const loaded = await profileStore.loadProfile();
    expect(loaded).toBeNull();
  });

  it("getCachedProfile returns in-memory cache without async", async () => {
    expect(profileStore.getCachedProfile()).toBeNull();
    await profileStore.saveProfile(TEST_PROFILE);
    expect(profileStore.getCachedProfile()).toEqual(TEST_PROFILE);
  });

  it("handles corrupt JSON gracefully", async () => {
    mockStorage.set("tonematch_profile", "{invalid json");
    const loaded = await profileStore.loadProfile();
    expect(loaded).toBeNull();
  });
});
