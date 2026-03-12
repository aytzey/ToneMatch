import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/src/features/auth/use-auth";
import { pollAnalysisSession, uploadAndAnalyzeSelfie } from "@/src/lib/tonematch-api";
import { useAppStore } from "@/src/store/app-store";

/* Module-level ref to hold the selected asset between screens */
let pendingAsset: ImagePicker.ImagePickerAsset | null = null;

export function useScanFlow() {
  const router = useRouter();
  const { backendConfigured, isPreviewMode, user } = useAuth();
  const scanState = useAppStore((state) => state.scanState);
  const setScanState = useAppStore((state) => state.setScanState);
  const queryClient = useQueryClient();

  const ensureCameraPermission = async (): Promise<boolean> => {
    const { status: existing } = await ImagePicker.getCameraPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera access required",
        "Allow camera access to capture a selfie. You can change this in Settings > ToneMatch > Camera.",
      );
      return false;
    }
    return true;
  };

  const ensureLibraryPermission = async (): Promise<boolean> => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo library access required",
        "Allow photo access so you can choose a selfie from your library.",
      );
      return false;
    }
    return true;
  };

  /**
   * Step 1: Select image (camera or library), then navigate to scan-review.
   */
  const selectImage = async (source: "camera" | "library") => {
    if (source === "camera") {
      const granted = await ensureCameraPermission();
      if (!granted) return;
    } else {
      const granted = await ensureLibraryPermission();
      if (!granted) return;
    }

    setScanState({
      status: "selecting",
      message: source === "camera" ? "Opening camera..." : "Selecting a selfie from your library...",
      previewUri: null,
      sessionId: null,
    });

    let pickerResponse: ImagePicker.ImagePickerResult;

    try {
      pickerResponse =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.9,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.9,
            });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "The camera could not be opened.";
      setScanState({
        status: "error",
        message: errMsg,
        previewUri: null,
        sessionId: null,
      });
      Alert.alert(
        "Camera Error",
        errMsg + "\n\nMake sure camera permissions are enabled for Expo Go in Settings.",
      );
      return;
    }

    if (pickerResponse.canceled || !pickerResponse.assets[0]) {
      setScanState({
        status: "idle",
        message: "No selfie was selected. Open the camera or library again to continue.",
        previewUri: null,
        sessionId: null,
      });
      return;
    }

    const selectedAsset = pickerResponse.assets[0];
    pendingAsset = selectedAsset;

    setScanState({
      status: "reviewing",
      message: "Photo selected. Review the quality, then start the analysis.",
      previewUri: selectedAsset.uri,
      sessionId: null,
    });

    await Haptics.selectionAsync();
    router.push("/scan-review");
  };

  /**
   * Step 2: Start analysis with the previously selected image.
   * Called from scan-review when user taps "Analyze Now".
   */
  const startAnalysis = async () => {
    const asset = pendingAsset;
    if (!asset) {
      Alert.alert("No image selected", "Please go back and select a photo first.");
      return;
    }

    setScanState({
      status: "uploading",
      message:
        isPreviewMode || !backendConfigured || !user
          ? "Preview mode: photo selected, local analysis is being simulated."
          : "Uploading your selfie and opening the analysis session.",
      previewUri: asset.uri,
      sessionId: null,
    });

    router.push("/analysis-loading");

    try {
      console.log("[startAnalysis] calling uploadAndAnalyzeSelfie");
      const { sessionId, mode } = await uploadAndAnalyzeSelfie(asset);
      console.log("[startAnalysis] upload done | sessionId:", sessionId, "mode:", mode);

      setScanState({
        status: "analyzing",
        message:
          mode === "preview"
            ? "Preview analysis is running. Result screens will update with the preview profile."
            : "Analysis started. Waiting for undertone, contrast, and recommendation results.",
        previewUri: asset.uri,
        sessionId,
      });

      console.log("[startAnalysis] polling session:", sessionId);
      const session = await pollAnalysisSession(sessionId);
      console.log("[startAnalysis] poll result | status:", session.status, "id:", session.id);

      await queryClient.invalidateQueries({ queryKey: ["style-experience"] });
      await queryClient.invalidateQueries({ queryKey: ["analysis-history"] });

      setScanState({
        status: session.status === "completed" ? "ready" : "error",
        message:
          session.status === "completed"
            ? "Analysis finished. Home and Discover have been refreshed."
            : "The analysis could not be completed. Check lighting and image quality, then try again.",
        previewUri: asset.uri,
        sessionId: session.id,
      });

      await Haptics.notificationAsync(
        session.status === "completed"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );

      if (session.status === "completed") {
        pendingAsset = null;
        router.replace(`/analysis/${session.id}`);
      }
    } catch (error) {
      console.error("[startAnalysis] CAUGHT ERROR:", error);
      setScanState({
        status: "error",
        message: error instanceof Error ? error.message : "The scan flow stopped unexpectedly.",
        previewUri: asset.uri,
        sessionId: null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const pickFromLibrary = () => selectImage("library");
  const captureWithCamera = () => selectImage("camera");

  return { state: scanState, pickFromLibrary, captureWithCamera, startAnalysis };
}
