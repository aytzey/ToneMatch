import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { fetchWardrobeItems } from "@/src/lib/tonematch-api";

export function useWardrobeItems() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();

  return useQuery({
    queryKey: ["wardrobe-items", user?.id ?? "preview", isPreviewMode],
    queryFn: () => fetchWardrobeItems(user?.id),
    enabled: ready && (Boolean(user?.id) || isPreviewMode || !backendConfigured),
  });
}
