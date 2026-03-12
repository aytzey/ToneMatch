import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useAuth } from "@/src/features/auth/use-auth";
import { backendConfigured } from "@/src/lib/env";
import {
  motionDuration,
  motionEasing,
  motionUseNativeDriver,
  useReducedMotion,
} from "@/src/lib/motion";
import { useAppCopy } from "@/src/providers/copy-provider";
import { supabase } from "@/src/lib/supabase";
import { useAppStore } from "@/src/store/app-store";
import { radius, spacing } from "@/src/theme/spacing";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

const SHIMMER_TRAVEL = Dimensions.get("window").width - spacing.lg * 2;

function deriveSteps(status: string, labels: string[]) {
  if (status === "ready") {
    return labels.map((label) => ({
      label,
      status: "complete" as const,
      icon: "check-circle" as const,
      badge: "COMPLETE",
    }));
  }

  if (status === "error") {
    return labels.map((label, i) => ({
      label,
      status: i < 2 ? ("complete" as const) : ("pending" as const),
      icon: i < 2 ? ("check-circle" as const) : ("error-outline" as const),
      badge: i < 2 ? "COMPLETE" : "FAILED",
    }));
  }

  const activeIdx = status === "uploading" ? 0 : 2;

  return labels.map((label, i) => {
    if (i < activeIdx) {
      return {
        label,
        status: "complete" as const,
        icon: "check-circle" as const,
        badge: "COMPLETE",
      };
    }

    if (i === activeIdx) {
      return {
        label,
        status: "in_progress" as const,
        icon: "radio-button-checked" as const,
        badge: "IN PROGRESS",
      };
    }

    return {
      label,
      status: "pending" as const,
      icon: "radio-button-unchecked" as const,
      badge: "PENDING",
    };
  });
}

function deriveProgress(status: string) {
  switch (status) {
    case "uploading":
      return 15;
    case "analyzing":
      return 65;
    case "ready":
      return 100;
    case "error":
      return 0;
    default:
      return 35;
  }
}

function buildRevealStyle(
  progress: Animated.Value,
  start: number,
  end: number,
  distance = 20,
  scaleFrom = 1,
) : Animated.WithAnimatedValue<ViewStyle> {
  const translateTransform = {
    translateY: progress.interpolate({
      inputRange: [start, end],
      outputRange: [distance, 0],
      extrapolate: "clamp",
    }),
  };
  const transforms =
    scaleFrom !== 1
      ? [
          {
            scale: progress.interpolate({
              inputRange: [start, end],
              outputRange: [scaleFrom, 1],
              extrapolate: "clamp",
            }),
          },
          translateTransform,
        ]
      : [translateTransform];

  return {
    opacity: progress.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    transform: transforms,
  } as Animated.WithAnimatedValue<ViewStyle>;
}

export default function AnalysisLoadingScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const copy = useAppCopy().analysisLoading;
  const reducedMotion = useReducedMotion();
  const scanState = useAppStore((state) => state.scanState);
  const setScanState = useAppStore((state) => state.setScanState);
  const { status, previewUri, sessionId, message } = scanState;

  const progress = deriveProgress(status);
  const steps = deriveSteps(status, [...copy.steps]);

  const introProgress = useRef(new Animated.Value(0)).current;
  const ambientProgress = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  useEffect(() => {
    if (status !== "idle" || !backendConfigured || !user?.id) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from("analysis_sessions")
          .select("id, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (data?.status === "completed") {
          router.replace(`/analysis/${data.id}`);
        } else if (data?.status === "queued" || data?.status === "processing") {
          setScanState({
            status: "analyzing",
            message: copy.inProgressMessage,
            previewUri: null,
            sessionId: data.id,
          });
        } else {
          router.replace("/(tabs)/home");
        }
      } catch {
        if (!cancelled) {
          router.replace("/(tabs)/home");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [copy.inProgressMessage, router, setScanState, status, user?.id]);

  useEffect(() => {
    if (status === "ready" && sessionId) {
      const timer = setTimeout(() => {
        router.replace(`/analysis/${sessionId}`);
      }, reducedMotion ? 80 : 720);

      return () => clearTimeout(timer);
    }
  }, [reducedMotion, router, sessionId, status]);

  useEffect(() => {
    if (reducedMotion) {
      introProgress.setValue(1);
      return;
    }

    introProgress.setValue(0);
    Animated.timing(introProgress, {
      toValue: 1,
      duration: 760,
      easing: motionEasing.enter,
      useNativeDriver: motionUseNativeDriver,
    }).start();
  }, [introProgress, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || status === "ready" || status === "error") {
      ambientProgress.setValue(status === "ready" ? 1 : 0.5);
      return;
    }

    ambientProgress.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientProgress, {
          toValue: 1,
          duration: 1600,
          easing: motionEasing.settle,
          useNativeDriver: motionUseNativeDriver,
        }),
        Animated.timing(ambientProgress, {
          toValue: 0,
          duration: 1600,
          easing: motionEasing.settle,
          useNativeDriver: motionUseNativeDriver,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [ambientProgress, reducedMotion, status]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: motionDuration(reducedMotion, status === "ready" ? 360 : 520),
      easing: motionEasing.settle,
      useNativeDriver: motionUseNativeDriver,
    }).start();
  }, [progress, progressAnim, reducedMotion, status]);

  useEffect(() => {
    if (reducedMotion || status === "ready" || status === "error") {
      shimmerProgress.setValue(1);
      return;
    }

    shimmerProgress.setValue(0);

    const loop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: motionUseNativeDriver,
      }),
    );

    loop.start();

    return () => loop.stop();
  }, [reducedMotion, shimmerProgress, status]);

  const handleClose = () => {
    router.back();
  };

  const portraitShellStyle = buildRevealStyle(introProgress, 0.02, 0.42, 28, 0.97);
  const titleRevealStyle = buildRevealStyle(introProgress, 0.18, 0.58, 18);
  const cardRevealStyle = buildRevealStyle(introProgress, 0.28, 0.8, 18);
  const footerRevealStyle = buildRevealStyle(introProgress, 0.48, 1, 12);
  const portraitBreathStyle = reducedMotion
    ? undefined
    : {
        transform: [
          {
            scale: ambientProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1.01, 1.04],
            }),
          },
        ],
      };
  const portraitGlowStyle = reducedMotion
    ? undefined
    : {
        opacity: ambientProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.18, 0.34],
        }),
        transform: [
          {
            scale: ambientProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1.02, 1.08],
            }),
          },
        ],
      };
  const activeIconStyle = reducedMotion
    ? undefined
    : {
        opacity: ambientProgress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.48, 1],
        }),
        transform: [
          {
            scale: ambientProgress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.97, 1.02],
            }),
          },
        ],
      };
  const pillStyle = reducedMotion
    ? undefined
    : {
        opacity: ambientProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
        transform: [
          {
            translateY: ambientProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -4],
            }),
          },
        ],
      };
  const dotStyles = reducedMotion
    ? [{}, {}, {}]
    : [
        {
          opacity: ambientProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.45, 1],
          }),
          transform: [
            {
              scale: ambientProgress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1.05, 0.82, 1.05],
              }),
            },
          ],
        },
        {
          opacity: ambientProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.45, 1, 0.45],
          }),
          transform: [
            {
              scale: ambientProgress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.82, 1.05, 0.82],
              }),
            },
          ],
        },
        {
          opacity: ambientProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.65, 0.4, 0.9],
          }),
          transform: [
            {
              scale: ambientProgress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.9, 0.78, 1],
              }),
            },
          ],
        },
      ];
  const progressScale = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0.0001, 1],
  });
  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [-progressTrackWidth / 2, 0],
  });
  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_TRAVEL, SHIMMER_TRAVEL],
  });

  return (
    <Screen
      scrollable
      role="main"
      accessibilityLabel="Analysis loading screen"
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close analysis"
          accessibilityRole="button"
          style={styles.closeBtn}
          onPress={handleClose}
        >
          <MaterialIcons name="close" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>TONEMATCH AI</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[styles.portraitContainer, portraitShellStyle]}>
        <Animated.Image
          accessibilityLabel={
            previewUri
              ? "Preview of the selfie being analyzed"
              : "Blurred portrait placeholder while analysis is running"
          }
          accessibilityRole="image"
          source={
            previewUri
              ? { uri: previewUri }
              : require("../assets/images/analysis_blur.jpg")
          }
          style={[styles.portraitPlaceholder, portraitBreathStyle]}
          resizeMode="cover"
          blurRadius={15}
        />

        <Animated.View
          style={[
            styles.portraitGlow,
            styles.pointerEventsNone,
            portraitGlowStyle,
          ]}
        />

        <LinearGradient
          colors={["transparent", palette.primarySoft]}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View style={[styles.analyzingPill, pillStyle]}>
          <Text style={styles.analyzingPillText}>
            {status === "error"
              ? copy.failedPill
              : status === "ready"
                ? copy.completePill
                : copy.analyzingPill}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.titleSection, titleRevealStyle]}>
        <Text style={styles.titleText}>
          {status === "error"
            ? copy.errorTitle
            : status === "ready"
              ? copy.readyTitle
              : copy.workingTitle}
        </Text>
        <Text style={styles.subtitleText}>
          {status === "error"
            ? message || copy.errorBody
            : status === "ready"
              ? copy.readyBody
              : copy.workingBody}
        </Text>
      </Animated.View>

      {status === "error" && (
        <View style={styles.errorActions}>
          <PrimaryButton
            label={copy.goBack}
            icon="arrow-back"
            onPress={() => router.back()}
          />
        </View>
      )}

      {status !== "error" && (
        <Animated.View style={cardRevealStyle}>
          <SurfaceCard>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>{copy.progressLabel}</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>

            <View
              onLayout={(event) =>
                setProgressTrackWidth(event.nativeEvent.layout.width)
              }
              style={styles.progressBarTrack}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    transform: [
                      { scaleX: progressScale },
                      { translateX: progressTranslateX },
                    ],
                  },
                ]}
              />
              {!reducedMotion && status !== "ready" ? (
                <Animated.View
                  style={[
                    styles.progressShimmer,
                    styles.pointerEventsNone,
                    { transform: [{ translateX: shimmerTranslateX }] },
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.stepsContainer}>
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const isComplete = step.status === "complete";
                const isInProgress = step.status === "in_progress";

                return (
                  <Animated.View
                    key={step.label}
                    style={buildRevealStyle(
                      introProgress,
                      0.36 + index * 0.08,
                      0.72 + index * 0.08,
                      12,
                    )}
                  >
                    <View style={styles.stepRow}>
                      <View style={styles.stepIconColumn}>
                        {isInProgress ? (
                          <Animated.View style={activeIconStyle}>
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
                            color={
                              isComplete ? palette.primary : palette.subtle
                            }
                          />
                        )}

                        {!isLast && (
                          <View
                            style={[
                              styles.stepLine,
                              {
                                backgroundColor: isComplete
                                  ? palette.primarySoft
                                  : palette.subtle,
                              },
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.stepContent}>
                        <Text
                          style={[
                            styles.stepLabel,
                            step.status === "pending" &&
                              styles.stepLabelPending,
                          ]}
                        >
                          {step.label}
                        </Text>
                        <Text
                          style={[
                            styles.stepBadge,
                            isComplete && styles.stepBadgeComplete,
                            isInProgress && styles.stepBadgeInProgress,
                            step.status === "pending" &&
                              styles.stepBadgePending,
                          ]}
                        >
                          {step.badge}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </SurfaceCard>
        </Animated.View>
      )}

      {status !== "error" && (
        <Animated.View style={footerRevealStyle}>
          <Text style={styles.footerNote}>{copy.footerNote}</Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, styles.dot1, dotStyles[0]]} />
            <Animated.View style={[styles.dot, styles.dot2, dotStyles[1]]} />
            <Animated.View style={[styles.dot, styles.dot3, dotStyles[2]]} />
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
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
    width: 44,
    height: 44,
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
    width: 44,
  },

  portraitContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.clay,
  },
  portraitPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.clay,
  },
  portraitGlow: {
    position: "absolute",
    width: "80%",
    height: "68%",
    borderRadius: radius.full,
    backgroundColor: palette.surfaceTintMild,
  },
  pointerEventsNone: {
    pointerEvents: "none",
  },
  analyzingPill: {
    backgroundColor: palette.surfaceTintGlass,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.surfaceTintLineBright,
  },
  analyzingPillText: {
    ...type.overline,
    color: palette.onPrimary,
    letterSpacing: 3,
  },

  titleSection: {
    alignItems: "center",
    gap: spacing.xs,
  },
  titleText: {
    ...type.h2,
    color: palette.charcoal,
    textAlign: "center",
  },
  subtitleText: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
    maxWidth: 340,
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
    height: 6,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    marginBottom: spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: palette.primary,
    width: "100%",
  },
  progressShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 72,
    height: "100%",
    backgroundColor: palette.surfaceTintGlow,
    borderRadius: radius.full,
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
    color: palette.subtle,
  },
  stepBadge: {
    ...type.overline,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  stepBadgeComplete: {
    color: palette.primary,
  },
  stepBadgeInProgress: {
    color: palette.muted,
  },
  stepBadgePending: {
    color: palette.subtle,
  },

  footerNote: {
    ...type.caption,
    color: palette.muted,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 18,
    marginBottom: spacing.sm,
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
    backgroundColor: palette.primaryAccent,
  },
  dot3: {
    backgroundColor: palette.primarySoft,
  },
  });
