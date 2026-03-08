import { type PropsWithChildren, createContext, useContext, useMemo } from "react";

import type { SubscriptionStateView } from "@/src/types/tonematch";

type RevenueCatPackageView = {
  identifier: string;
  packageType: string;
  product: {
    title: string;
    priceString: string;
  };
};

type RevenueCatOfferingView = {
  identifier: string;
  availablePackages: RevenueCatPackageView[];
};

type PaywallResult = "PURCHASED" | "RESTORED" | "ERROR" | "CANCELLED" | "NOT_PRESENTED" | null;

type RevenueCatContextValue = {
  ready: boolean;
  isConfigured: boolean;
  isSyncing: boolean;
  error: Error | null;
  customerInfo: null;
  offerings: null;
  currentOffering: RevenueCatOfferingView | null;
  subscriptionState: SubscriptionStateView | null;
  primaryPackagePrice: string | null;
  lastSyncAt: string | null;
  refresh: () => Promise<void>;
  presentPaywall: () => Promise<PaywallResult>;
  restorePurchases: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<boolean>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const value = useMemo<RevenueCatContextValue>(
    () => ({
      ready: true,
      isConfigured: false,
      isSyncing: false,
      error: null,
      customerInfo: null,
      offerings: null,
      currentOffering: null,
      subscriptionState: null,
      primaryPackagePrice: null,
      lastSyncAt: null,
      refresh: async () => undefined,
      presentPaywall: async () => null,
      restorePurchases: async () => false,
      presentCustomerCenter: async () => false,
    }),
    []
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCatContext() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCatContext must be used inside RevenueCatProvider");
  }
  return context;
}
