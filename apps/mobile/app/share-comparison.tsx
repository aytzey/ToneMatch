import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { hexForColorName } from "@/src/lib/color-name-hex";
import { buildEditorialStory } from "@/src/lib/style-story";
import { spacing, radius } from "@/src/theme/spacing";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

/* ------------------------------------------------------------------ */
/*  Share Comparison Screen                                            */
/* ------------------------------------------------------------------ */

export default function ShareComparisonScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { data: profile } = useStyleProfile();
  const story = buildEditorialStory(profile);
  const rightColors = profile?.palette.core.slice(0, 2).map((color) => hexForColorName(color)) ?? [palette.primary, palette.swatch3];
  const wrongColors =
    profile?.palette.avoid.slice(0, 2).map((color) => hexForColorName(color)) ??
    [palette.swatch1, palette.swatch4];

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    await Share.share({
      message: `ToneMatch comparison: ${story.seasonTitle}. Best results came from ${story.paletteLead.join(", ")} instead of ${story.cautionLead.join(", ")}.`,
    });
  };

  const handleUnlock = () => {
    router.push("/paywall");
  };

  return (
    <Screen
      scrollable
      role="main"
      accessibilityLabel="Share comparison screen"
      contentContainerStyle={styles.content}
    >
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>TONEMATCH</Text>
          <Text style={styles.headerSubtitle}>Digital Atelier</Text>
        </View>
        <Pressable
          accessibilityLabel="Share comparison"
          accessibilityRole="button"
          onPress={handleShare}
          style={styles.shareCircle}
        >
          <MaterialIcons name="share" size={18} color={palette.primary} />
        </Pressable>
      </View>

      {/* ---- Summary Title ---- */}
      <View style={styles.summaryArea}>
        {/* Match Score Pill */}
        <View style={styles.matchPill}>
          <MaterialIcons name="verified" size={16} color={palette.primary} />
          <Text style={styles.matchPillText}>
            MATCH SCORE {profile ? `${Math.round(profile.confidence * 100)}%` : "LIVE"}
          </Text>
        </View>

        <Text accessibilityRole="header" style={styles.summaryHeading}>
          Your Seasonal Essence:{" "}
          <Text style={styles.summaryHighlight}>{story.essenceTitle}</Text>
        </Text>
        <Text style={styles.summarySubtitle}>{story.seasonTitle} Palette Selection</Text>
      </View>

      {/* ---- Before Card ---- */}
      <View style={styles.beforeCard}>
        <LinearGradient
          colors={[wrongColors[0], wrongColors[1] ?? wrongColors[0], palette.overlayStrong]}
          style={styles.beforePlaceholder}
        />
        <View style={styles.cardSwatchRail}>
          {wrongColors.map((color, index) => (
            <View key={`${color}-${index}`} style={[styles.cardSwatch, { backgroundColor: color }]} />
          ))}
        </View>

        {/* Top-left badge */}
        <View style={styles.beforeBadge}>
          <MaterialIcons name="cancel" size={14} color={palette.red} />
          <Text style={styles.beforeBadgeText}>{story.cautionLead.join(" + ")} (LOWER FIT)</Text>
        </View>

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={["transparent", palette.overlayMedium]}
          style={styles.cardGradient}
        >
          <Text style={styles.cardOverlayText}>
            {story.cautionLead.join(" and ")} are the caution colors currently most likely to flatten your face zone.
          </Text>
        </LinearGradient>
      </View>

      {/* ---- Separator ---- */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <View style={styles.separatorCircle}>
          <MaterialIcons name="auto-awesome" size={18} color={palette.primary} />
        </View>
        <View style={styles.separatorLine} />
      </View>

      {/* ---- After Card ---- */}
      <View style={styles.afterCardOuter}>
        <View style={styles.afterCard}>
          <LinearGradient
            colors={[rightColors[0], rightColors[1] ?? rightColors[0], palette.overlayMedium]}
            style={styles.afterPlaceholder}
          />
          <View style={styles.cardSwatchRail}>
            {rightColors.map((color, index) => (
              <View key={`${color}-${index}`} style={[styles.cardSwatch, { backgroundColor: color }]} />
            ))}
          </View>

          {/* Top-left badge */}
          <View style={styles.afterBadge}>
            <MaterialIcons
              name="check-circle"
              size={14}
              color={palette.surface}
            />
            <Text style={styles.afterBadgeText}>{story.paletteLead.join(" + ")} (BEST FIT)</Text>
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={["transparent", palette.overlayMedium]}
            style={styles.cardGradient}
          >
          <Text style={styles.cardOverlayText}>
            {profile?.summary.description || story.tagline}
          </Text>
        </LinearGradient>
      </View>
      </View>

      {/* ---- Analysis Grid ---- */}
      <View style={styles.analysisGrid}>
        <SurfaceCard style={styles.analysisCard} tone="muted">
          <Text style={styles.analysisOverline}>UNDERTONE</Text>
          <Text style={styles.analysisValue}>{story.undertoneLabel}</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.analysisCard} tone="muted">
          <Text style={styles.analysisOverline}>CONTRAST</Text>
          <Text style={styles.analysisValue}>{story.contrastLabel}</Text>
        </SurfaceCard>
      </View>

      {/* ---- CTA ---- */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          label="Unlock Your Full Palette"
          icon="arrow-forward"
          onPress={handleUnlock}
        />
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  headerBrand: {
    ...type.sectionHeader,
    color: palette.ink,
    letterSpacing: 2,
  },
  headerSubtitle: {
    ...type.overline,
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 2,
  },
  shareCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Summary Title */
  summaryArea: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  matchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  matchPillText: {
    ...type.overline,
    fontSize: 12,
    color: palette.primary,
    letterSpacing: 1.5,
  },
  summaryHeading: {
    ...type.h2,
    color: palette.ink,
    textAlign: "center",
  },
  summaryHighlight: {
    color: palette.primary,
  },
  summarySubtitle: {
    ...type.body,
    color: palette.muted,
    fontStyle: "italic",
    textAlign: "center",
  },

  /* Before Card */
  beforeCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
  },
  beforePlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  cardSwatchRail: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    gap: spacing.xs,
  },
  cardSwatch: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.surfaceTintLine,
  },
  beforeBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.overlayStrong,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  beforeBadgeText: {
    ...type.overline,
    fontSize: 12,
    color: palette.surface,
    letterSpacing: 1,
  },

  /* Card Gradient / Overlay (shared) */
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  cardOverlayText: {
    ...type.body,
    fontSize: 13,
    color: palette.surface,
    fontStyle: "italic",
    lineHeight: 20,
  },

  /* Separator */
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  separatorCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.sm,
  },

  /* After Card */
  afterCardOuter: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl + 2,
    padding: 2,
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  afterCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  afterPlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  afterBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  afterBadgeText: {
    ...type.overline,
    fontSize: 12,
    color: palette.surface,
    letterSpacing: 1,
  },

  /* Analysis Grid */
  analysisGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  analysisCard: {
    flex: 1,
  },
  analysisOverline: {
    ...type.overline,
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 2,
  },
  analysisValue: {
    ...type.h3,
    color: palette.ink,
  },

  /* CTA */
  ctaSection: {
    paddingVertical: spacing.sm,
  },
  });
