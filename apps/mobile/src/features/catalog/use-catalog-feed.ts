import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { fetchCatalogFeed } from "@/src/lib/tonematch-api";

export function useCatalogFeed() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();

  return useQuery({
    queryKey: ["catalog-feed", user?.id ?? "preview", isPreviewMode],
    queryFn: () => fetchCatalogFeed(user?.id),
    enabled: ready && (Boolean(user?.id) || isPreviewMode || !backendConfigured),
  });
}
