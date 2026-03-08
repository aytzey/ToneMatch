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
        "Kamera izni gerekli",
        "Selfie cekmek icin kamera erisim izni vermelisin. Ayarlar > ToneMatch > Kamera adimini takip edebilirsin.",
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
        "Galeri izni gerekli",
        "Galeriden fotograf secmek icin erisim izni vermelisin.",
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
      message: source === "camera" ? "Kamera aciliyor..." : "Galeriden selfie seciliyor...",
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
      const errMsg = err instanceof Error ? err.message : "Kamera acilamadi.";
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
        message: "Selfie secilmedi. Devam etmek icin kamera veya galeriyi tekrar ac.",
        previewUri: null,
        sessionId: null,
      });
      return;
    }

    const selectedAsset = pickerResponse.assets[0];
    pendingAsset = selectedAsset;

    setScanState({
      status: "reviewing",
      message: "Fotograf secildi. Kaliteyi kontrol et ve analizi baslat.",
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
          ? "Preview mode: fotograf secildi, yerel analiz simule ediliyor."
          : "Selfie signed upload ile yukleniyor ve analiz job'i aciliyor.",
      previewUri: asset.uri,
      sessionId: null,
    });

    router.push("/analysis-loading");

    try {
      const { sessionId, mode } = await uploadAndAnalyzeSelfie(asset);

      setScanState({
        status: "analyzing",
        message:
          mode === "preview"
            ? "Preview analiz calisiyor. Sonuc ekranlari mock profille yenilenecek."
            : "Analiz job'i acildi. Undertone, contrast ve recommendation pipeline'i bekleniyor.",
        previewUri: asset.uri,
        sessionId,
      });

      const session = await pollAnalysisSession(sessionId);

      await queryClient.invalidateQueries({ queryKey: ["style-experience"] });
      await queryClient.invalidateQueries({ queryKey: ["analysis-history"] });

      setScanState({
        status: session.status === "completed" ? "ready" : "error",
        message:
          session.status === "completed"
            ? "Analiz tamamlandi. Home ve Discover ekranlari guncellendi."
            : "Analiz tamamlanamadi. Isik ve cekim kalitesini kontrol edip tekrar dene.",
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
      setScanState({
        status: "error",
        message: error instanceof Error ? error.message : "Scan akisi beklenmedik sekilde durdu.",
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
