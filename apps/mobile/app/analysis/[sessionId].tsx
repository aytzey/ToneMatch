import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { motionEasing, useReducedMotion } from "@/src/lib/motion";
import { buildEditorialMatchPair } from "@/src/lib/style-story";
import { hexForColorName } from "@/src/lib/color-name-hex";
import { useAppCopy } from "@/src/providers/copy-provider";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

type ColorSwatchProps = {
  name: string;
  swatchSize: number;
  subduedLabel?: boolean;
};

function ColorSwatch({
  name,
  swatchSize,
  subduedLabel = false,
}: ColorSwatchProps) {
  const bg = hexForColorName(name);

  return (
    <View style={[swatchStyles.wrapper, { width: swatchSize }]}>
      <View
        style={[
          swatchStyles.rect,
          {
            backgroundColor: bg,
            width: swatchSize,
            height: swatchSize,
            borderRadius: radius.lg,
          },
        ]}
      />
      <Text
        style={[swatchStyles.label, subduedLabel && swatchStyles.labelSmall]}
        numberOfLines={1}
      >
        {name.toUpperCase()}
      </Text>
    </View>
  );
}

function buildRevealStyle(
  progress: Animated.Value,
  start: number,
  end: number,
  distance = 16,
  scaleFrom = 1,
) {
  const transforms: { translateY?: Animated.AnimatedInterpolation<number>; scale?: Animated.AnimatedInterpolation<number> }[] = [
    {
      translateY: progress.interpolate({
        inputRange: [start, end],
        outputRange: [distance, 0],
        extrapolate: "clamp",
      }),
    },
  ];

  if (scaleFrom !== 1) {
    transforms.unshift({
      scale: progress.interpolate({
        inputRange: [start, end],
        outputRange: [scaleFrom, 1],
        extrapolate: "clamp",
      }),
    });
  }

  return {
    opacity: progress.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    transform: transforms,
  };
}

const swatchStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 108,
  },
  rect: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    ...type.caption,
    color: palette.charcoal,
    letterSpacing: 1,
    fontSize: 12,
  },
  labelSmall: {
    color: palette.muted,
  },
});

export default function AnalysisResultScreen() {
  const { width } = useWindowDimensions();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data, isLoading, error } = useStyleProfile();
  const copy = useAppCopy().analysisResult;
  const reducedMotion = useReducedMotion();
  const revealProgress = useRef(new Animated.Value(0)).current;

  const handleShare = async () => {
    if (!data) {
      return;
    }

    await Share.share({
      message: `ToneMatch analysis: ${data.summary?.title ?? `${data.undertone} / ${data.contrast}`}. Best colors: ${data.palette.core.slice(0, 3).join(", ")}. Avoid: ${data.palette.avoid.slice(0, 2).join(", ")}.`,
    });
  };

  useEffect(() => {
    if (!data || isLoading) {
      return;
    }

    if (reducedMotion) {
      revealProgress.setValue(1);
      return;
    }

    revealProgress.setValue(0);
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: 840,
      easing: motionEasing.enter,
      useNativeDriver: true,
    }).start();
  }, [data, isLoading, reducedMotion, revealProgress]);

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.headerAction}
      >
        <MaterialIcons name="arrow-back" size={24} color={palette.charcoal} />
      </Pressable>

      <Text style={styles.headerTitle}>{copy.header}</Text>

      <Pressable
        accessibilityLabel="Share analysis"
        accessibilityRole="button"
        accessibilityState={{ disabled: !data }}
        disabled={!data}
        onPress={handleShare}
        style={styles.headerAction}
      >
        <MaterialIcons name="share" size={22} color={palette.charcoal} />
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <Text style={styles.errorText}>
            Could not load your analysis. Please try again.
          </Text>
          <PrimaryButton label="Go back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <Text style={styles.errorText}>
            Your analysis is not ready yet. Check back soon.
          </Text>
        </View>
      </Screen>
    );
  }

  const confidencePct = Math.round((data.confidence ?? 0.98) * 100);
  const heroTitle =
    data.summary?.title ?? `${data.undertone} / ${data.contrast}`;
  const theoryItem = data.focusItems?.[0];
  const theoryPreview = theoryItem?.copy ?? data.summary?.description;
  const matchPair = buildEditorialMatchPair(data);
  const contentWidth = Math.max(width - spacing.lg * 2, 240);
  const primarySwatchSize = Math.max(
    72,
    Math.min(96, Math.floor((contentWidth - spacing.md * 2) / 3)),
  );
  const secondarySwatchSize = Math.max(
    64,
    Math.min(72, Math.floor((contentWidth - spacing.md) / 2)),
  );
  const primarySwatches =
    data.palette.core.length > 0
      ? data.palette.core.slice(0, 3)
      : ["Rust", "Deep Olive", "Forest Green"];
  const avoidSwatches =
    data.palette.avoid.length > 0
      ? data.palette.avoid.slice(0, 2)
      : ["Cool Blue", "Lavender"];

  const avatarRevealStyle = buildRevealStyle(
    revealProgress,
    0.02,
    0.26,
    28,
    0.92,
  );
  const badgeRevealStyle = buildRevealStyle(
    revealProgress,
    0.14,
    0.34,
    14,
    0.94,
  );
  const heroRevealStyle = buildRevealStyle(revealProgress, 0.18, 0.42, 18);
  const theoryRevealStyle = buildRevealStyle(revealProgress, 0.34, 0.58, 16);
  const secondaryRevealStyle = buildRevealStyle(
    revealProgress,
    0.44,
    0.68,
    16,
  );
  const primarySectionStyle = buildRevealStyle(
    revealProgress,
    0.54,
    0.78,
    14,
  );
  const avoidSectionStyle = buildRevealStyle(
    revealProgress,
    0.66,
    0.88,
    14,
  );
  const auraStyle = reducedMotion
    ? undefined
    : {
        opacity: revealProgress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 0.28, 0.16],
          extrapolate: "clamp",
        }),
        transform: [
          {
            scale: revealProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.76, 1.08],
              extrapolate: "clamp",
            }),
          },
        ],
      };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      <Animated.View style={[styles.avatarSection, avatarRevealStyle]}>
        <Animated.View pointerEvents="none" style={[styles.avatarAura, auraStyle]} />

        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Image
              source={require("../../assets/images/profile_avatar.png")}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </View>

        <Animated.View style={[styles.matchBadge, badgeRevealStyle]}>
          <Text style={styles.matchText}>{confidencePct}% MATCH</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.heroSection, heroRevealStyle]}>
        <Text style={styles.overline}>{copy.signatureOverline}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </Animated.View>

      {theoryPreview ? (
        <Animated.View style={theoryRevealStyle}>
          <SurfaceCard>
            <View style={styles.whyHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={palette.primary}
              />
              <Text style={styles.whyHeading}>{copy.whyHeading}</Text>
            </View>
            <Text style={styles.whyBody}>{theoryPreview}</Text>
            <Pressable
              accessibilityLabel="Open analysis method breakdown"
              accessibilityRole="button"
              style={styles.theoryLink}
              onPress={() =>
                router.push({
                  pathname: "/analysis/theory",
                  params: sessionId ? { sessionId } : undefined,
                })
              }
            >
              <Text style={styles.theoryLinkText}>{copy.whyLink}</Text>
              <MaterialIcons
                name="arrow-forward"
                size={16}
                color={palette.primary}
              />
            </Pressable>
          </SurfaceCard>
        </Animated.View>
      ) : null}

      {matchPair.shouldSuggestSecondary ? (
        <Animated.View style={secondaryRevealStyle}>
          <SurfaceCard>
            <View style={styles.whyHeader}>
              <MaterialIcons name="layers" size={20} color={palette.primary} />
              <Text style={styles.whyHeading}>{copy.closeSecondMatch}</Text>
            </View>
            <Text style={styles.secondaryMatchBody}>
              Your current score is {confidencePct}%, so this result is close
              enough to compare with {matchPair.secondary.seasonTitle}. Review
              the second lane before locking in new near-face colors.
            </Text>
            <View style={styles.secondaryActions}>
              <PrimaryButton
                label={copy.secondGuide}
                variant="secondary"
                href={{
                  pathname: "/style-guide",
                  params: { variant: "secondary" },
                }}
              />
              <PrimaryButton
                label={copy.secondOccasion}
                variant="secondary"
                href={{
                  pathname: "/occasion-guide",
                  params: { variant: "secondary" },
                }}
              />
            </View>
          </SurfaceCard>
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.swatchSection, primarySectionStyle]}>
        <View style={styles.swatchHeaderRow}>
          <Text style={styles.swatchSectionTitle}>{copy.bestOnYou}</Text>
          <Text style={styles.swatchSectionLabel}>{copy.primaryTones}</Text>
        </View>
        <View style={styles.swatchRow}>
          {primarySwatches.map((name, index) => (
            <Animated.View
              key={`${name}-${index}`}
              style={buildRevealStyle(
                revealProgress,
                0.58 + index * 0.06,
                0.84 + index * 0.06,
                10,
                0.94,
              )}
            >
              <ColorSwatch name={name} swatchSize={primarySwatchSize} />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.swatchSection, avoidSectionStyle]}>
        <View style={styles.swatchHeaderRow}>
          <Text style={styles.swatchSectionTitle}>{copy.useWithCare}</Text>
          <Text style={styles.swatchSectionLabel}>{copy.coolTones}</Text>
        </View>
        <View style={styles.swatchRow}>
          {avoidSwatches.map((name, index) => (
            <Animated.View
              key={`${name}-${index}`}
              style={buildRevealStyle(
                revealProgress,
                0.72 + index * 0.05,
                0.92 + index * 0.05,
                10,
                0.95,
              )}
            >
              <ColorSwatch
                name={name}
                swatchSize={secondarySwatchSize}
                subduedLabel
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <Animated.View style={buildRevealStyle(revealProgress, 0.8, 1, 12)}>
          <PrimaryButton
            label={copy.openStyleGuide}
            icon="style"
            href="/style-guide"
          />
        </Animated.View>
        <Animated.View style={buildRevealStyle(revealProgress, 0.86, 1, 12)}>
          <PrimaryButton
            label={copy.openOccasionGuide}
            icon="auto-awesome"
            variant="secondary"
            href="/occasion-guide"
          />
        </Animated.View>
        <Animated.View style={buildRevealStyle(revealProgress, 0.92, 1, 12)}>
          <PrimaryButton
            label={copy.shopYourTones}
            icon="shopping-bag"
            href="/(tabs)/discover"
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...type.sectionHeader,
    color: palette.charcoal,
    letterSpacing: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  centeredFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  errorText: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
    position: "relative",
    paddingTop: spacing.sm,
  },
  avatarAura: {
    position: "absolute",
    top: 0,
    width: 176,
    height: 176,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.canvas,
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: palette.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  matchBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    marginTop: -spacing.md,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchText: {
    ...type.caption,
    color: palette.onPrimary,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  overline: {
    ...type.overline,
    color: palette.primary,
  },
  heroTitle: {
    ...type.hero,
    color: palette.charcoal,
    textAlign: "center",
    fontSize: 26,
    lineHeight: 32,
    maxWidth: 320,
  },

  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  whyHeading: {
    ...type.sectionHeader,
    color: palette.charcoal,
    fontSize: 14,
  },
  whyBody: {
    ...type.body,
    color: palette.muted,
    marginBottom: spacing.md,
  },
  theoryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  theoryLinkText: {
    ...type.label,
    color: palette.primary,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  secondaryMatchBody: {
    ...type.body,
    color: palette.charcoal,
  },
  secondaryActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  swatchSection: {
    marginTop: spacing.xl,
  },
  swatchHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  swatchSectionTitle: {
    ...type.h3,
    color: palette.charcoal,
  },
  swatchSectionLabel: {
    ...type.overline,
    color: palette.muted,
    fontSize: 12,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
