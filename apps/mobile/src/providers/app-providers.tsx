import { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/src/lib/query-client";
import { AuthProvider } from "@/src/providers/auth-provider";
import { CopyProvider } from "@/src/providers/copy-provider";
import { RevenueCatProvider } from "@/src/providers/revenuecat-provider";
import { ThemeProvider } from "@/src/theme/theme-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <CopyProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RevenueCatProvider>{children}</RevenueCatProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </CopyProvider>
    </ThemeProvider>
  );
}
