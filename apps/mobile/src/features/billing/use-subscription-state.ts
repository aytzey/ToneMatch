import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { useRevenueCat } from "@/src/features/billing/use-revenuecat";
import { fetchSubscriptionState } from "@/src/lib/tonematch-api";
import { mergeSubscriptionState } from "@/src/lib/revenuecat";
import { useAppStore } from "@/src/store/app-store";
import type { SubscriptionStateView } from "@/src/types/tonematch";

export function useSubscriptionState() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();
  const previewPlan = useAppStore((state) => state.previewPlan);
  const revenueCat = useRevenueCat();

  const query = useQuery({
    queryKey: ["subscription-state", user?.id ?? "preview", isPreviewMode, previewPlan],
    queryFn: () => fetchSubscriptionState(user?.id),
    enabled: ready && (Boolean(user?.id) || isPreviewMode || !backendConfigured),
  });

  const data =
    mergeSubscriptionState(query.data, revenueCat.subscriptionState) ??
    ({
      plan: previewPlan,
      provider: "preview",
      periodEndsAt: null,
    } satisfies SubscriptionStateView);

  return {
    ...query,
    data,
    revenueCatReady: revenueCat.ready,
    revenueCatConfigured: revenueCat.isConfigured,
    revenueCatSyncing: revenueCat.isSyncing,
    revenueCatError: revenueCat.error,
    currentOffering: revenueCat.currentOffering,
    offerings: revenueCat.offerings,
    customerInfo: revenueCat.customerInfo,
    lastRevenueCatSyncAt: revenueCat.lastSyncAt,
    primaryPackagePrice: revenueCat.primaryPackagePrice,
    presentPaywall: revenueCat.presentPaywall,
    restorePurchases: revenueCat.restorePurchases,
    presentCustomerCenter: revenueCat.presentCustomerCenter,
    refreshRevenueCat: revenueCat.refresh,
  };
}
