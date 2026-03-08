import { useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";
import { useAuth } from "@/src/features/auth/use-auth";
import { useScanFlow } from "@/src/features/scan/use-scan-flow";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OVAL_WIDTH = 220;
const OVAL_HEIGHT = 290;
const CAPTURE_SIZE = 72;
const CAPTURE_RING = 88;
const PULSE_SIZE = 100;
const SIDE_BTN = 44;
const BOTTOM_BTN = 52;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, pickFromLibrary, captureWithCamera } = useScanFlow();

  /* Pulsing outer ring animation */
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.root}>
      {/* ---- Camera preview placeholder ---- */}
      <View style={styles.cameraArea}>
        <View style={styles.cameraPlaceholder} />

        {/* Header bar */}
        <View style={[styles.headerBar, { paddingTop: insets.top + spacing.xs }]}>
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={12}
          >
            <MaterialIcons name="close" size={22} color={palette.surface} />
          </Pressable>

          <Text style={styles.headerTitle}>TONEMATCH AI</Text>

          <Pressable style={styles.headerBtn} hitSlop={12}>
            <MaterialIcons name="help-outline" size={22} color={palette.surface} />
          </Pressable>
        </View>

        {/* Face oval guide */}
        <View style={styles.ovalContainer} pointerEvents="none">
          <View style={styles.oval}>
            {/* Corner bracket marks at cardinal points */}
            <View style={[styles.bracketMark, styles.bracketTop]} />
            <View style={[styles.bracketMark, styles.bracketBottom]} />
            <View style={[styles.bracketMark, styles.bracketLeft]} />
            <View style={[styles.bracketMark, styles.bracketRight]} />
          </View>
        </View>

        {/* Right-side floating buttons */}
        <View style={styles.sideButtons}>
          <Pressable style={styles.sideBtn}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <MaterialIcons name="wb-sunny" size={20} color={palette.surface} />
          </Pressable>
          <Pressable style={styles.sideBtn}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <MaterialIcons name="visibility-off" size={20} color={palette.surface} />
          </Pressable>
          <Pressable style={styles.sideBtn}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <MaterialIcons name="face" size={20} color={palette.surface} />
          </Pressable>
        </View>

        {/* Instruction card at bottom of camera area */}
        <View style={styles.instructionWrapper}>
          <View style={styles.instructionCard}>
            <BlurView
              intensity={50}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.instructionTitle}>
              Position your face in the frame
            </Text>
            <Text style={styles.instructionSub}>
              Ensure your features align with the guide{"\n"}for high accuracy
            </Text>
          </View>
        </View>
      </View>

      {/* ---- Bottom capture controls ---- */}
      <View style={styles.controlsArea}>
        {/* Library / Capture / Flip row */}
        <View style={styles.controlsRow}>
          {/* Library */}
          <Pressable style={styles.secondaryBtn} onPress={pickFromLibrary}>
            <MaterialIcons
              name="photo-library"
              size={24}
              color={palette.charcoal}
            />
          </Pressable>

          {/* Capture button with pulsing ring */}
          <View style={styles.captureWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Pressable style={styles.captureOuter} onPress={captureWithCamera}>
              <View style={styles.captureInner}>
                <MaterialIcons
                  name="photo-camera"
                  size={28}
                  color={palette.surface}
                />
              </View>
            </Pressable>
          </View>

          {/* Flip */}
          <Pressable style={styles.secondaryBtn}>
            <MaterialIcons
              name="flip-camera-ios"
              size={24}
              color={palette.charcoal}
            />
          </Pressable>
        </View>

        {/* Labels under Library / Flip */}
        <View style={styles.labelsRow}>
          <Text style={styles.controlLabel}>LIBRARY</Text>
          <View style={{ width: CAPTURE_RING }} />
          <Text style={styles.controlLabel}>FLIP</Text>
        </View>

        {/* Tip banner */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            NATURAL LIGHT IS BEST {"  \u2022  "} REMOVE GLASSES AND FILTERS
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Root */
  root: {
    flex: 1,
    backgroundColor: palette.charcoal,
  },

  /* Camera area */
  cameraArea: {
    flex: 1,
    position: "relative",
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#3a3a3a",
  },

  /* Header */
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    overflow: "hidden",
    zIndex: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  headerTitle: {
    ...type.sectionHeader,
    color: palette.surface,
    letterSpacing: 2.5,
    fontSize: 14,
    zIndex: 2,
  },

  /* Oval guide */
  ovalContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2,
    borderColor: palette.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bracketMark: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: palette.primary,
  },
  bracketTop: {
    top: -2,
    alignSelf: "center",
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 0,
  },
  bracketBottom: {
    bottom: -2,
    alignSelf: "center",
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopWidth: 0,
  },
  bracketLeft: {
    left: -2,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderRightWidth: 0,
  },
  bracketRight: {
    right: -2,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderLeftWidth: 0,
  },

  /* Side buttons */
  sideButtons: {
    position: "absolute",
    right: spacing.md,
    top: "35%",
    gap: spacing.sm,
    zIndex: 10,
  },
  sideBtn: {
    width: SIDE_BTN,
    height: SIDE_BTN,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  /* Instruction card */
  instructionWrapper: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg + SIDE_BTN + spacing.md,
    zIndex: 10,
  },
  instructionCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  instructionTitle: {
    ...type.h3,
    color: palette.surface,
    marginBottom: spacing.xs,
  },
  instructionSub: {
    ...type.caption,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 17,
  },

  /* Controls area */
  controlsArea: {
    backgroundColor: palette.surface,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },

  /* Secondary (Library / Flip) buttons */
  secondaryBtn: {
    width: BOTTOM_BTN,
    height: BOTTOM_BTN,
    borderRadius: radius.full,
    backgroundColor: palette.canvas,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Capture button */
  captureWrapper: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "rgba(184, 115, 50, 0.35)",
  },
  captureOuter: {
    width: CAPTURE_RING,
    height: CAPTURE_RING,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Labels */
  labelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
    marginTop: spacing.xs,
  },
  controlLabel: {
    ...type.overline,
    color: palette.muted,
    textAlign: "center",
    width: BOTTOM_BTN,
    fontSize: 9,
  },

  /* Tip banner */
  tipBanner: {
    marginTop: spacing.md,
    backgroundColor: palette.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignSelf: "center",
  },
  tipText: {
    ...type.overline,
    color: palette.primary,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: "center",
  },
});
