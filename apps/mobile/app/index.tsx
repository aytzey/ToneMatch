import { Redirect } from "expo-router";

import { useAuth } from "@/src/features/auth/use-auth";
import { useAppStore } from "@/src/store/app-store";

export default function IndexScreen() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const { isAuthenticated, isDevSingleUserMode, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!hasCompletedOnboarding && !isDevSingleUserMode) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/auth"} />;
}
