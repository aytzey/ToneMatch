import { create } from "zustand";

import type { SubscriptionPlan } from "@/src/types/tonematch";

type ScanState = {
  status: "idle" | "selecting" | "reviewing" | "uploading" | "analyzing" | "ready" | "error";
  message: string;
  previewUri?: string | null;
  sessionId?: string | null;
};

type AppState = {
  hasCompletedOnboarding: boolean;
  previewMode: boolean;
  previewPlan: SubscriptionPlan;
  scanState: ScanState;
  completeOnboarding: () => void;
  enablePreviewMode: () => void;
  disablePreviewMode: () => void;
  setPreviewPlan: (plan: SubscriptionPlan) => void;
  setScanState: (state: ScanState) => void;
};

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  previewMode: false,
  previewPlan: "free",
  scanState: {
    status: "idle",
    message: "Camera, library, and upload flow are ready. The next step is the live capture experience.",
    previewUri: null,
    sessionId: null,
  },
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  enablePreviewMode: () => set({ previewMode: true }),
  disablePreviewMode: () => set({ previewMode: false, previewPlan: "free" }),
  setPreviewPlan: (previewPlan) => set({ previewPlan }),
  setScanState: (scanState) => set({ scanState }),
}));
