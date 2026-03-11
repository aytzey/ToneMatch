/**
 * Tests for the Zustand app store.
 */

import { useAppStore } from "@/src/store/app-store";

describe("app-store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      hasCompletedOnboarding: false,
      previewMode: false,
      previewPlan: "free",
      scanState: {
        status: "idle",
        message: "",
        previewUri: null,
        sessionId: null,
      },
    });
  });

  it("completeOnboarding sets flag", () => {
    useAppStore.getState().completeOnboarding();
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it("enablePreviewMode / disablePreviewMode toggle", () => {
    useAppStore.getState().enablePreviewMode();
    expect(useAppStore.getState().previewMode).toBe(true);

    useAppStore.getState().disablePreviewMode();
    expect(useAppStore.getState().previewMode).toBe(false);
    expect(useAppStore.getState().previewPlan).toBe("free");
  });

  it("setPreviewPlan updates plan", () => {
    useAppStore.getState().setPreviewPlan("pro");
    expect(useAppStore.getState().previewPlan).toBe("pro");
  });

  it("setScanState updates scan state", () => {
    useAppStore.getState().setScanState({
      status: "analyzing",
      message: "Running analysis...",
      previewUri: "file:///photo.jpg",
      sessionId: "session-123",
    });

    const state = useAppStore.getState().scanState;
    expect(state.status).toBe("analyzing");
    expect(state.sessionId).toBe("session-123");
    expect(state.previewUri).toBe("file:///photo.jpg");
  });

  it("scan state transitions through expected flow", () => {
    const { setScanState } = useAppStore.getState();

    setScanState({ status: "selecting", message: "Selecting...", previewUri: null, sessionId: null });
    expect(useAppStore.getState().scanState.status).toBe("selecting");

    setScanState({ status: "reviewing", message: "Review photo.", previewUri: "file:///p.jpg", sessionId: null });
    expect(useAppStore.getState().scanState.status).toBe("reviewing");

    setScanState({ status: "uploading", message: "Uploading...", previewUri: "file:///p.jpg", sessionId: null });
    expect(useAppStore.getState().scanState.status).toBe("uploading");

    setScanState({ status: "analyzing", message: "Analyzing...", previewUri: "file:///p.jpg", sessionId: "s1" });
    expect(useAppStore.getState().scanState.status).toBe("analyzing");

    setScanState({ status: "ready", message: "Done!", previewUri: "file:///p.jpg", sessionId: "s1" });
    expect(useAppStore.getState().scanState.status).toBe("ready");
  });
});
