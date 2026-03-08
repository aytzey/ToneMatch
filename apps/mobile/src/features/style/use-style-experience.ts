import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { fetchStyleExperience } from "@/src/lib/tonematch-api";
import { useAppStore } from "@/src/store/app-store";

export function useStyleExperience() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();
  const previewPlan = useAppStore((state) => state.previewPlan);

  return useQuery({
    queryKey: ["style-experience", user?.id ?? "preview", isPreviewMode, previewPlan],
    queryFn: () => fetchStyleExperience(user?.id),
    enabled: ready && (Boolean(user?.id) || isPreviewMode || !backendConfigured),
  });
}
