import { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/src/lib/query-client";
import { AuthProvider } from "@/src/providers/auth-provider";
import { RevenueCatProvider } from "@/src/providers/revenuecat-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RevenueCatProvider>{children}</RevenueCatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
