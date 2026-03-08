import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassCard } from "@/src/components/glass-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useAppStore } from "@/src/store/app-store";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

const STEP_LABELS = [
  "Analyzing skin undertones",
  "Evaluating facial contrast",
  "Matching seasonal palette colors",
  "Curating personalized recommendations",
];

function deriveSteps(status: string) {
  if (status === "ready") {
    return STEP_LABELS.map((label) => ({
      label,
      status: "complete" as const,
      icon: "check-circle" as const,
      badge: "COMPLETE",
    }));
  }

  if (status === "error") {
    return STEP_LABELS.map((label, i) => ({
      label,
      status: i < 2 ? ("complete" as const) : ("pending" as const),
      icon: i < 2 ? ("check-circle" as const) : ("error-outline" as const),
      badge: i < 2 ? "COMPLETE" : "FAILED",
    }));
  }

  // uploading or analyzing
  const activeIdx = status === "uploading" ? 0 : 2;
  return STEP_LABELS.map((label, i) => {
    if (i < activeIdx)
      return { label, status: "complete" as const, icon: "check-circle" as const, badge: "COMPLETE" };
    if (i === activeIdx)
      return { label, status: "in_progress" as const, icon: "radio-button-checked" as const, badge: "IN PROGRESS" };
    return { label, status: "pending" as const, icon: "radio-button-unchecked" as const, badge: "PENDING" };
  });
}

function deriveProgress(status: string) {
  switch (status) {
    case "uploading": return 15;
    case "analyzing": return 65;
    case "ready": return 100;
    case "error": return 0;
    default: return 35;
  }
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AnalysisLoadingScreen() {
  const router = useRouter();
  const scanState = useAppStore((s) => s.scanState);
  const { status, previewUri, sessionId, message } = scanState;

  const progress = deriveProgress(status);
  const steps = deriveSteps(status);

  /* Auto-navigate to results on completion */
  useEffect(() => {
    if (status === "ready" && sessionId) {
      const timer = setTimeout(() => {
        router.replace(`/analysis/${sessionId}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [status, sessionId, router]);

  /* Pulse animation for the in-progress icon */
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleClose = () => {
    router.back();
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* -- Header -- */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <MaterialIcons name="close" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>TONEMATCH AI</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* -- Portrait container -- */}
      <View style={styles.portraitContainer}>
        <Image
          source={
            previewUri
              ? { uri: previewUri }
              : require("../assets/images/analysis_blur.png")
          }
          style={styles.portraitPlaceholder}
          resizeMode="cover"
          blurRadius={15}
        />

        <LinearGradient
          colors={["transparent", "rgba(184,115,50,0.10)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.analyzingPill}>
          <Text style={styles.analyzingPillText}>
            {status === "error" ? "ANALYSIS FAILED" : status === "ready" ? "COMPLETE" : "ANALYZING PROFILE"}
          </Text>
        </View>
      </View>

      {/* -- Title section -- */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>
          {status === "error" ? "Something went wrong" : status === "ready" ? "Analysis complete!" : "Defining your palette"}
        </Text>
        <Text style={styles.subtitleText}>
          {status === "error"
            ? message || "Could not complete analysis. Please try again."
            : status === "ready"
              ? "Redirecting to your results..."
              : "Our AI is mapping your unique chromatic profile."}
        </Text>
      </View>

      {/* -- Error actions -- */}
      {status === "error" && (
        <View style={styles.errorActions}>
          <PrimaryButton label="Go Back" icon="arrow-back" onPress={() => router.back()} />
        </View>
      )}

      {/* -- Progress card (shown when not error) -- */}
      {status !== "error" && (
        <GlassCard>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const isComplete = step.status === "complete";
              const isInProgress = step.status === "in_progress";

              return (
                <View key={step.label} style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    {isInProgress ? (
                      <Animated.View style={{ opacity: pulseAnim }}>
                        <MaterialIcons
                          name={step.icon}
                          size={22}
                          color={palette.primary}
                        />
                      </Animated.View>
                    ) : (
                      <MaterialIcons
                        name={step.icon}
                        size={22}
                        color={isComplete ? palette.primary : palette.clay}
                      />
                    )}

                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor: isComplete
                              ? "rgba(184,115,50,0.20)"
                              : palette.clay,
                          },
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepLabel,
                        step.status === "pending" && styles.stepLabelPending,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={[
                        styles.stepBadge,
                        isComplete && styles.stepBadgeComplete,
                        isInProgress && styles.stepBadgeInProgress,
                        step.status === "pending" && styles.stepBadgePending,
                      ]}
                    >
                      {step.badge}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>
      )}

      {/* -- Footer -- */}
      {status !== "error" && (
        <>
          <Text style={styles.footerNote}>
            We're processing your image locally to ensure your privacy. This
            usually takes less than 15 seconds.
          </Text>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...type.sectionHeader,
    color: palette.ink,
    textAlign: "center",
    flex: 1,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },

  portraitContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  portraitPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.clay,
  },
  analyzingPill: {
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  analyzingPillText: {
    ...type.overline,
    color: "#ffffff",
    letterSpacing: 3,
  },

  titleSection: {
    alignItems: "center",
    gap: spacing.xs,
  },
  titleText: {
    ...type.h2,
    color: palette.charcoal,
  },
  subtitleText: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
  },

  errorActions: {
    gap: spacing.sm,
  },

  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...type.label,
    color: palette.charcoal,
  },
  progressPercent: {
    ...type.label,
    color: palette.primary,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 2,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: 2,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
  },

  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepIconColumn: {
    alignItems: "center",
    width: 22,
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    minHeight: 28,
    marginVertical: spacing.xs,
  },
  stepContent: {
    flex: 1,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  stepLabel: {
    ...type.body,
    color: palette.charcoal,
    fontSize: 14,
    lineHeight: 20,
  },
  stepLabelPending: {
    color: palette.clay,
  },
  stepBadge: {
    ...type.overline,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  stepBadgeComplete: {
    color: palette.primary,
  },
  stepBadgeInProgress: {
    color: palette.muted,
  },
  stepBadgePending: {
    color: palette.clay,
  },

  footerNote: {
    ...type.caption,
    color: palette.muted,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  dot1: {
    backgroundColor: palette.primary,
  },
  dot2: {
    backgroundColor: "rgba(184,115,50,0.40)",
  },
  dot3: {
    backgroundColor: "rgba(184,115,50,0.20)",
  },
});
