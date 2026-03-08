import { useRevenueCatContext } from "@/src/providers/revenuecat-provider";

export function useRevenueCat() {
  return useRevenueCatContext();
}
