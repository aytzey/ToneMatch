import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const revenueCatAppleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? "";
const revenueCatGoogleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? "";
const revenueCatWebApiKey = process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY ?? "";
const revenueCatOfferingId = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? "";
const revenueCatPlusEntitlementId = process.env.EXPO_PUBLIC_REVENUECAT_PLUS_ENTITLEMENT_ID ?? "";
const revenueCatProEntitlementId = process.env.EXPO_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID ?? "";
const devSingleUserModeFlag = process.env.EXPO_PUBLIC_DEV_SINGLE_USER_MODE ?? "";
const devSingleUserEmail = process.env.EXPO_PUBLIC_DEV_SINGLE_USER_EMAIL ?? "";
const devSingleUserPassword = process.env.EXPO_PUBLIC_DEV_SINGLE_USER_PASSWORD ?? "";

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export const backendConfigured =
  Boolean(supabaseUrl) &&
  !supabaseUrl.includes("example.supabase.co") &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== "public-anon-key";

export function getRevenueCatApiKey() {
  if (Platform.OS === "ios") {
    return revenueCatAppleApiKey;
  }

  if (Platform.OS === "android") {
    return revenueCatGoogleApiKey;
  }

  return revenueCatWebApiKey || revenueCatAppleApiKey || revenueCatGoogleApiKey;
}

export const revenueCatConfigured = Boolean(getRevenueCatApiKey());

export const devSingleUserMode =
  backendConfigured &&
  devSingleUserModeFlag.toLowerCase() === "true" &&
  Boolean(devSingleUserEmail) &&
  Boolean(devSingleUserPassword);

export const revenueCatConfig = {
  offeringId: revenueCatOfferingId,
  plusEntitlementId: revenueCatPlusEntitlementId,
  proEntitlementId: revenueCatProEntitlementId,
};

export const devSingleUserConfig = {
  email: devSingleUserEmail,
  password: devSingleUserPassword,
};
