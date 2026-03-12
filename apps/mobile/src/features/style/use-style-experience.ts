import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { fetchStyleExperience } from "@/src/lib/tonematch-api";
import { useAppStore } from "@/src/store/app-store";

export function useStyleExperience() {
  const { user, ready, isPreviewMode, backendConfigured } = useAuth();
  const previewPlan = useAppStore((state) => state.previewPlan);

  const enabled = ready && (Boolean(user?.id) || isPreviewMode || !backendConfigured);
  console.log("[useStyleExperience] ready:", ready, "userId:", user?.id, "isPreviewMode:", isPreviewMode, "backendConfigured:", backendConfigured, "enabled:", enabled);

  return useQuery({
    queryKey: ["style-experience", user?.id ?? "preview", isPreviewMode, previewPlan],
    queryFn: async () => {
      console.log("[useStyleExperience] queryFn called with userId:", user?.id);
      try {
        const result = await fetchStyleExperience(user?.id);
        console.log("[useStyleExperience] queryFn success:", result ? "got data" : "null");
        return result;
      } catch (err) {
        console.error("[useStyleExperience] queryFn ERROR:", err);
        throw err;
      }
    },
    enabled,
  });
}
