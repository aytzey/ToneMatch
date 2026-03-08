import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { fetchAnalysisHistory } from "@/src/lib/tonematch-api";

export function useAnalysisHistory() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();

  return useQuery({
    queryKey: ["analysis-history", user?.id ?? "preview", isPreviewMode],
    queryFn: () => fetchAnalysisHistory(user?.id),
    enabled: ready && backendConfigured && !isPreviewMode && Boolean(user?.id),
  });
}
