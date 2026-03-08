import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StyleExperience } from "@/src/types/tonematch";

const PROFILE_KEY = "tonematch_profile";

let cachedProfile: StyleExperience | null = null;

export async function saveProfile(profile: StyleExperience): Promise<void> {
  cachedProfile = profile;
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<StyleExperience | null> {
  if (cachedProfile) return cachedProfile;

  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;

  try {
    cachedProfile = JSON.parse(raw) as StyleExperience;
    return cachedProfile;
  } catch {
    return null;
  }
}

export function getCachedProfile(): StyleExperience | null {
  return cachedProfile;
}

export async function clearProfile(): Promise<void> {
  cachedProfile = null;
  await AsyncStorage.removeItem(PROFILE_KEY);
}
