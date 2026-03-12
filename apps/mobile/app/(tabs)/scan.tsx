import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useScanFlow } from "@/src/features/scan/use-scan-flow";
import { motionUseNativeDriver } from "@/src/lib/motion";
import { radius, spacing } from "@/src/theme/spacing";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

const OVAL_RATIO = 1.32;
const MAX_OVAL_WIDTH = 248;
const CAPTURE_SIZE = 72;
const CAPTURE_RING = 88;
const PULSE_SIZE = 100;
const SIDE_BTN = 44;
const BOTTOM_BTN = 52;

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { pickFromLibrary, captureWithCamera } = useScanFlow();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [showGuide, setShowGuide] = useState(true);
  const [showPrivacyShade, setShowPrivacyShade] = useState(false);
  const [showLightingTip, setShowLightingTip] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const ovalWidth = Math.min(MAX_OVAL_WIDTH, Math.max(184, viewportWidth - 120));
  const ovalHeight = Math.round(ovalWidth * OVAL_RATIO);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: motionUseNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: motionUseNativeDriver,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleHelp = () => {
    Alert.alert(
      "Capture tips",
      "Use soft natural light, keep your face centered in the guide, and remove glasses or strong filters before scanning.",
    );
  };

  const handleFlip = () => {
    setFacing((current) => (current === "front" ? "back" : "front"));
  };

  const instructionCopy = showLightingTip
    ? "Face a soft window light and keep your features inside the guide for the most stable read."
    : "Keep your eyes, nose, and lips inside the guide so the analysis can read shape and contrast clearly.";

  return (
    <View style={styles.root}>
      <View style={styles.cameraArea}>
        {permission?.granted ? (
          <CameraView
            accessibilityLabel="Live camera preview"
            facing={facing}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <Pressable
            accessibilityLabel="Allow camera access"
            accessibilityRole="button"
            onPress={requestPermission}
            style={styles.cameraPlaceholder}
          >
            <MaterialIcons name="videocam-off" size={48} color={palette.muted} />
            <Text style={styles.permissionText}>
              Camera access is required{"\n"}Tap to continue
            </Text>
          </Pressable>
        )}

        {showPrivacyShade ? (
          <View style={[styles.privacyShade, styles.pointerEventsNone]} />
        ) : null}

        <View style={[styles.headerBar, { paddingTop: insets.top + spacing.xs }]}>
          <View style={[styles.headerBackdrop, styles.pointerEventsNone]} />

          <Pressable
            accessibilityLabel="Close scanner"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <MaterialIcons name="close" size={22} color={palette.surface} />
          </Pressable>

          <Text style={styles.headerTitle}>TONEMATCH AI</Text>

          <Pressable
            accessibilityLabel="Open capture tips"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleHelp}
            style={styles.headerBtn}
          >
            <MaterialIcons name="help-outline" size={22} color={palette.surface} />
          </Pressable>
        </View>

        {showGuide ? (
          <View style={[styles.ovalContainer, styles.pointerEventsNone]}>
            <View
              style={[
                styles.oval,
                {
                  borderRadius: ovalWidth / 2,
                  height: ovalHeight,
                  width: ovalWidth,
                },
              ]}
            >
              <View style={[styles.bracketMark, styles.bracketTop]} />
              <View style={[styles.bracketMark, styles.bracketBottom]} />
              <View style={[styles.bracketMark, styles.bracketLeft]} />
              <View style={[styles.bracketMark, styles.bracketRight]} />
            </View>
          </View>
        ) : null}

        <View style={styles.sideButtons}>
          <Pressable
            accessibilityLabel="Toggle lighting tips"
            accessibilityRole="button"
            accessibilityState={{ selected: showLightingTip }}
            onPress={() => setShowLightingTip((current) => !current)}
            style={[styles.sideBtn, showLightingTip && styles.sideBtnActive]}
          >
            <MaterialIcons
              name="wb-sunny"
              size={20}
              color={showLightingTip ? palette.onPrimary : palette.surface}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Toggle privacy shade"
            accessibilityRole="button"
            accessibilityState={{ selected: showPrivacyShade }}
            onPress={() => setShowPrivacyShade((current) => !current)}
            style={[styles.sideBtn, showPrivacyShade && styles.sideBtnActive]}
          >
            <MaterialIcons
              name={showPrivacyShade ? "visibility" : "visibility-off"}
              size={20}
              color={showPrivacyShade ? palette.onPrimary : palette.surface}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Toggle framing guide"
            accessibilityRole="button"
            accessibilityState={{ selected: showGuide }}
            onPress={() => setShowGuide((current) => !current)}
            style={[styles.sideBtn, showGuide && styles.sideBtnActive]}
          >
            <MaterialIcons
              name="face"
              size={20}
              color={showGuide ? palette.onPrimary : palette.surface}
            />
          </Pressable>
        </View>

        {showGuide ? (
          <View style={styles.instructionWrapper}>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>Position your face in the frame</Text>
              <Text style={styles.instructionSub}>{instructionCopy}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.controlsArea,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        <View style={styles.controlsRow}>
          <Pressable
            accessibilityLabel="Choose a photo from your library"
            accessibilityRole="button"
            onPress={pickFromLibrary}
            style={styles.secondaryBtn}
          >
            <MaterialIcons name="photo-library" size={24} color={palette.charcoal} />
          </Pressable>

          <View style={styles.captureWrapper}>
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
            />
            <Pressable
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
              onPress={captureWithCamera}
              style={styles.captureOuter}
            >
              <View style={styles.captureInner}>
                <MaterialIcons
                  color={palette.onPrimary}
                  name="photo-camera"
                  size={28}
                />
              </View>
            </Pressable>
          </View>

          <Pressable
            accessibilityLabel={`Switch to ${facing === "front" ? "back" : "front"} camera`}
            accessibilityRole="button"
            onPress={handleFlip}
            style={styles.secondaryBtn}
          >
            <MaterialIcons
              name="flip-camera-ios"
              size={24}
              color={palette.charcoal}
            />
          </Pressable>
        </View>

        <View style={styles.labelsRow}>
          <Text style={styles.controlLabel}>LIBRARY</Text>
          <View style={{ width: CAPTURE_RING }} />
          <Text style={styles.controlLabel}>FLIP</Text>
        </View>

        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            {showLightingTip
              ? "SOFT DAYLIGHT IMPROVES ACCURACY"
              : "GUIDE TOGGLES ARE AVAILABLE ON THE RIGHT"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.charcoal,
  },
  cameraArea: {
    flex: 1,
    position: "relative",
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: palette.ink,
    justifyContent: "center",
  },
  permissionText: {
    color: palette.onDark,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  privacyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
    zIndex: 1,
  },
  pointerEventsNone: {
    pointerEvents: "none",
  },
  headerBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    overflow: "hidden",
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  headerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlaySoft,
  },
  headerBtn: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
    zIndex: 2,
  },
  headerTitle: {
    ...type.sectionHeader,
    color: palette.surface,
    fontSize: 14,
    letterSpacing: 2.5,
    zIndex: 2,
  },
  ovalContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  oval: {
    alignItems: "center",
    borderColor: palette.primary,
    borderStyle: "dashed",
    borderWidth: 2,
    justifyContent: "center",
  },
  bracketMark: {
    borderColor: palette.primary,
    height: 18,
    position: "absolute",
    width: 18,
  },
  bracketTop: {
    alignSelf: "center",
    borderBottomWidth: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderTopWidth: 3,
    top: -2,
  },
  bracketBottom: {
    alignSelf: "center",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    bottom: -2,
  },
  bracketLeft: {
    borderBottomLeftRadius: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderTopLeftRadius: 4,
    borderTopWidth: 3,
    left: -2,
  },
  bracketRight: {
    borderBottomRightRadius: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
    borderTopWidth: 3,
    right: -2,
  },
  sideButtons: {
    gap: spacing.sm,
    position: "absolute",
    right: spacing.md,
    top: "35%",
    zIndex: 10,
  },
  sideBtn: {
    alignItems: "center",
    backgroundColor: palette.surfaceTintMuted,
    borderColor: palette.surfaceTintLineSoft,
    borderRadius: radius.full,
    borderWidth: 1,
    height: SIDE_BTN,
    justifyContent: "center",
    width: SIDE_BTN,
  },
  sideBtnActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  instructionWrapper: {
    bottom: spacing.lg,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg + SIDE_BTN + spacing.md,
    zIndex: 10,
  },
  instructionCard: {
    backgroundColor: palette.surfaceTintMuted,
    borderColor: palette.surfaceTintLineSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  instructionTitle: {
    ...type.h3,
    color: palette.surface,
    marginBottom: spacing.xs,
  },
  instructionSub: {
    ...type.caption,
    color: palette.onDarkMuted,
    lineHeight: 18,
  },
  controlsArea: {
    alignItems: "center",
    backgroundColor: palette.surface,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
  },
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxl,
    justifyContent: "center",
  },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: palette.canvas,
    borderRadius: radius.full,
    height: BOTTOM_BTN,
    justifyContent: "center",
    width: BOTTOM_BTN,
  },
  captureWrapper: {
    alignItems: "center",
    height: PULSE_SIZE,
    justifyContent: "center",
    width: PULSE_SIZE,
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderColor: palette.primaryLine,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  captureOuter: {
    alignItems: "center",
    borderColor: palette.primary,
    borderRadius: radius.full,
    borderWidth: 3,
    height: CAPTURE_RING,
    justifyContent: "center",
    width: CAPTURE_RING,
  },
  captureInner: {
    alignItems: "center",
    backgroundColor: palette.primary,
    borderRadius: radius.full,
    height: CAPTURE_SIZE,
    justifyContent: "center",
    width: CAPTURE_SIZE,
  },
  labelsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxl,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  controlLabel: {
    ...type.overline,
    color: palette.muted,
    fontSize: 12,
    textAlign: "center",
    width: BOTTOM_BTN,
  },
  tipBanner: {
    alignSelf: "center",
    backgroundColor: palette.primarySoft,
    borderRadius: radius.full,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tipText: {
    ...type.overline,
    color: palette.primary,
    fontSize: 12,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  });
