import type { StyleExperience } from "@/src/types/tonematch";

const PROFILE_STORAGE_KEY = "tonematch_profile";
const isWebRuntime = typeof window !== "undefined" && typeof document !== "undefined";

let cachedProfile: StyleExperience | null = null;

async function getNativeFileSystem() {
  return import("expo-file-system/legacy");
}

function getProfileStorage() {
  if (!isWebRuntime) {
    return null;
  }

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: StyleExperience): Promise<void> {
  cachedProfile = profile;
  const serialized = JSON.stringify(profile);

  if (isWebRuntime) {
    getProfileStorage()?.setItem(PROFILE_STORAGE_KEY, serialized);
    return;
  }

  const { documentDirectory, writeAsStringAsync } = await getNativeFileSystem();
  if (!documentDirectory) {
    return;
  }

  await writeAsStringAsync(`${documentDirectory}${PROFILE_STORAGE_KEY}.json`, serialized);
}

export async function loadProfile(): Promise<StyleExperience | null> {
  if (cachedProfile) return cachedProfile;

  if (isWebRuntime) {
    const raw = getProfileStorage()?.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      cachedProfile = JSON.parse(raw) as StyleExperience;
      return cachedProfile;
    } catch {
      getProfileStorage()?.removeItem(PROFILE_STORAGE_KEY);
      return null;
    }
  }

  const { documentDirectory, getInfoAsync, readAsStringAsync } = await getNativeFileSystem();
  if (!documentDirectory) {
    return null;
  }

  const profilePath = `${documentDirectory}${PROFILE_STORAGE_KEY}.json`;
  const info = await getInfoAsync(profilePath);
  if (!info.exists) return null;

  try {
    const raw = await readAsStringAsync(profilePath);
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

  if (isWebRuntime) {
    getProfileStorage()?.removeItem(PROFILE_STORAGE_KEY);
    return;
  }

  const { documentDirectory, deleteAsync, getInfoAsync } = await getNativeFileSystem();
  if (!documentDirectory) {
    return;
  }

  const profilePath = `${documentDirectory}${PROFILE_STORAGE_KEY}.json`;
  const info = await getInfoAsync(profilePath);
  if (info.exists) {
    await deleteAsync(profilePath);
  }
}
