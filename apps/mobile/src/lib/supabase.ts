import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key";

const WebStorageAdapter = {
  getItem: async (key: string) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    globalThis.localStorage?.setItem(key, value);
  },
  removeItem: async (key: string) => {
    globalThis.localStorage?.removeItem(key);
  },
};

async function loadSecureStore() {
  return import("expo-secure-store");
}

const NativeSecureStoreAdapter = {
  getItem: async (key: string) => {
    const SecureStore = await loadSecureStore();
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    const SecureStore = await loadSecureStore();
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    const SecureStore = await loadSecureStore();
    return SecureStore.deleteItemAsync(key);
  },
};

const storageAdapter = Platform.OS === "web" ? WebStorageAdapter : NativeSecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: Platform.OS !== "web",
    detectSessionInUrl: false,
    storage: storageAdapter,
  },
});
