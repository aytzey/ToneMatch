/**
 * Tests for the profile store (FileSystem-backed cache).
 */

// Mock expo-file-system legacy API used on native platforms
const mockFiles = new Map<string, string>();
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///mock/",
  writeAsStringAsync: jest.fn((path: string, content: string) => {
    mockFiles.set(path, content);
    return Promise.resolve();
  }),
  readAsStringAsync: jest.fn((path: string) => {
    const content = mockFiles.get(path);
    if (content === undefined) throw new Error("File not found");
    return Promise.resolve(content);
  }),
  getInfoAsync: jest.fn((path: string) =>
    Promise.resolve({ exists: mockFiles.has(path) }),
  ),
  deleteAsync: jest.fn((path: string) => {
    mockFiles.delete(path);
    return Promise.resolve();
  }),
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
  mockFiles.clear();
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
    mockFiles.set("file:///mock/tonematch_profile.json", "{invalid json");
    const loaded = await profileStore.loadProfile();
    expect(loaded).toBeNull();
  });
});
