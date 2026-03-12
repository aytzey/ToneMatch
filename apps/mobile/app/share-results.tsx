import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

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
/*  Data                                                               */
/* ------------------------------------------------------------------ */

export default function ShareResultsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { data: profile } = useStyleProfile();
  const story = buildEditorialStory(profile);
  const swatches = profile?.palette.core.slice(0, 5).map((color) => hexForColorName(color)) ?? [
    palette.primary,
    palette.red,
    palette.green,
    palette.swatch2,
    palette.swatch1,
  ];
  const attributePills: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
  }[] = [
    { icon: "device-thermostat", label: story.undertoneLabel },
    { icon: "circle", label: story.contrastLabel },
    { icon: "water-drop", label: story.essenceTitle },
  ];

  const handleClose = () => {
    router.back();
  };

  const handleShare = async () => {
    await Share.share({
      message: `ToneMatch result: ${story.seasonTitle}. ${story.tagline} Leading colors: ${story.paletteLead.join(", ")}.`,
    });
  };

  return (
    <Screen
      scrollable
      role="main"
      accessibilityLabel="Share results screen"
      contentContainerStyle={styles.content}
    >
      {/* ---- Top Bar ---- */}
      <View style={styles.topBar}>
        <View role="banner" style={styles.logoRow}>
          <MaterialIcons name="auto-awesome" size={20} color={palette.primary} />
          <Text style={styles.logoText}>TONEMATCH</Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityLabel="Share palette summary"
            accessibilityRole="button"
            onPress={handleShare}
            style={styles.actionButton}
          >
            <MaterialIcons name="share" size={22} color={palette.ink} />
          </Pressable>
          <Pressable
            accessibilityLabel="Close share screen"
            accessibilityRole="button"
            onPress={handleClose}
            style={styles.actionButton}
          >
            <MaterialIcons name="close" size={22} color={palette.ink} />
          </Pressable>
        </View>
      </View>

      {/* ---- Portrait Section ---- */}
      <View style={styles.portraitWrapper}>
        <View style={styles.portrait}>
          <View style={styles.portraitGradient}>
            <View style={[styles.portraitGlow, { backgroundColor: swatches[0] }]} />
            <View style={[styles.portraitGlowSecondary, { backgroundColor: swatches[1] ?? swatches[0] }]} />
          </View>
          <View style={styles.portraitSwatchStack}>
            {swatches.slice(0, 4).map((color) => (
              <View key={color} style={[styles.portraitSwatch, { backgroundColor: color }]} />
            ))}
          </View>

          {/* Match Score Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeOverline}>MATCH SCORE</Text>
            <Text style={styles.matchBadgeValue}>
              {profile ? `${Math.round(profile.confidence * 100)}%` : "Live"}
            </Text>
          </View>
        </View>
      </View>

      {/* ---- Title Area ---- */}
      <View style={styles.titleArea}>
        <Text accessibilityRole="header" style={styles.seasonTitle}>
          {story.seasonTitle}
        </Text>
        <View style={styles.titleDivider} />
        <Text style={styles.paletteOverline}>SIGNATURE PALETTE</Text>
      </View>

      {/* ---- Palette Swatches ---- */}
      <View style={styles.swatchSection}>
        <View style={styles.swatchRow}>
          {swatches.map((color, index) => (
            <View
              key={color}
              style={[
                styles.swatch,
                { backgroundColor: color, marginLeft: index === 0 ? 0 : -10 },
              ]}
            />
          ))}
        </View>
        <View style={styles.swatchLabelBlock}>
          <Text style={styles.swatchOverline}>SEASONAL ESSENCE</Text>
          <Text style={styles.swatchTitle}>{story.essenceTitle}</Text>
        </View>
      </View>

      {/* ---- Attribute Pills ---- */}
      <View style={styles.pillRow}>
        {attributePills.map((pill) => (
          <View key={pill.label} style={styles.attributePill}>
            <MaterialIcons name={pill.icon} size={14} color={palette.primary} />
            <Text style={styles.attributePillLabel}>{pill.label}</Text>
          </View>
        ))}
      </View>

      {/* ---- Quote Box ---- */}
      <SurfaceCard style={styles.quoteBox} tone="muted">
        <Text style={styles.quoteText}>{`"${profile?.summary.description || story.tagline}"`}</Text>
      </SurfaceCard>

      {/* ---- Footer CTA ---- */}
      <View style={styles.footer}>
        <View style={styles.footerSwatchGrid}>
          {swatches.slice(0, 4).map((color, index) => (
            <View
              key={`${color}-${index}`}
              style={[styles.footerSwatch, { backgroundColor: color }]}
            />
          ))}
        </View>
        <View style={styles.footerTextBlock}>
          <Text style={styles.footerOverline}>LATEST RESULT SAVED</Text>
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerUrl}>{story.paletteLead.slice(0, 2).join(" / ")}</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={palette.primary}
            />
          </View>
        </View>
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

  /* Top Bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logoText: {
    ...type.sectionHeader,
    color: palette.primary,
    letterSpacing: 2,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Portrait */
  portraitWrapper: {
    marginBottom: spacing.lg,
  },
  portrait: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: palette.surface,
    position: "relative",
    elevation: 8,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  portraitGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.charcoal,
  },
  portraitGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 120,
    top: 36,
    left: 24,
    opacity: 0.85,
  },
  portraitGlowSecondary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 100,
    bottom: 20,
    right: 16,
    opacity: 0.65,
  },
  portraitSwatchStack: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
  },
  portraitSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: palette.surfaceTintLine,
  },
  matchBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: palette.surfaceTintSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  matchBadgeOverline: {
    ...type.overline,
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 1.5,
  },
  matchBadgeValue: {
    ...type.h2,
    fontSize: 24,
    color: palette.primary,
    lineHeight: 28,
  },

  /* Title Area */
  titleArea: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  seasonTitle: {
    ...type.hero,
    color: palette.ink,
    fontStyle: "italic",
  },
  titleDivider: {
    width: 48,
    height: 1,
    backgroundColor: palette.primaryAccent,
  },
  paletteOverline: {
    ...type.overline,
    color: palette.muted,
    letterSpacing: 3,
  },

  /* Palette Swatches */
  swatchSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: palette.surface,
  },
  swatchLabelBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  swatchOverline: {
    ...type.overline,
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 2,
  },
  swatchTitle: {
    ...type.h3,
    color: palette.primary,
  },

  /* Attribute Pills */
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: "center",
  },
  attributePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attributePillLabel: {
    ...type.caption,
    color: palette.primary,
    fontSize: 12,
  },

  /* Quote Box */
  quoteBox: {
    marginBottom: spacing.lg,
  },
  quoteText: {
    ...type.body,
    color: palette.ink,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
  },

  /* Footer CTA */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  footerSwatchGrid: {
    width: 56,
    height: 56,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  footerSwatch: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
  },
  footerTextBlock: {
    flex: 1,
    gap: 2,
  },
  footerOverline: {
    ...type.overline,
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 2,
  },
  footerLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerUrl: {
    ...type.h3,
    color: palette.primary,
  },
  });
