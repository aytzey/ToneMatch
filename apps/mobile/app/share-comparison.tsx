import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Share Comparison Screen                                            */
/* ------------------------------------------------------------------ */

export default function ShareComparisonScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    // Share logic would go here
  };

  const handleUnlock = () => {
    router.push("/paywall");
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={palette.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>TONEMATCH</Text>
          <Text style={styles.headerSubtitle}>Digital Atelier</Text>
        </View>
        <Pressable
          onPress={handleShare}
          style={styles.shareCircle}
          hitSlop={8}
        >
          <MaterialIcons name="share" size={18} color={palette.primary} />
        </Pressable>
      </View>

      {/* ---- Summary Title ---- */}
      <View style={styles.summaryArea}>
        {/* Match Score Pill */}
        <View style={styles.matchPill}>
          <MaterialIcons name="verified" size={16} color={palette.primary} />
          <Text style={styles.matchPillText}>MATCH SCORE 98%</Text>
        </View>

        <Text style={styles.summaryHeading}>
          Your Seasonal Essence:{" "}
          <Text style={styles.summaryHighlight}>Rich & Radiant</Text>
        </Text>
        <Text style={styles.summarySubtitle}>Deep Autumn Palette Selection</Text>
      </View>

      {/* ---- Before Card ---- */}
      <View style={styles.beforeCard}>
        <Image source={require("../assets/images/portrait_cool.png")} style={styles.beforePlaceholder} resizeMode="cover" />

        {/* Top-left badge */}
        <View style={styles.beforeBadge}>
          <MaterialIcons name="cancel" size={14} color={palette.red} />
          <Text style={styles.beforeBadgeText}>MUTED & COOL (WRONG)</Text>
        </View>

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          style={styles.cardGradient}
        >
          <Text style={styles.cardOverlayText}>
            The cool blue undertone creates a sallow effect and washes out your
            natural warmth.
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
          <Image source={require("../assets/images/portrait_warm.png")} style={styles.afterPlaceholder} resizeMode="cover" />

          {/* Top-left badge */}
          <View style={styles.afterBadge}>
            <MaterialIcons
              name="check-circle"
              size={14}
              color={palette.surface}
            />
            <Text style={styles.afterBadgeText}>DEEP & WARM (RIGHT)</Text>
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={styles.cardGradient}
          >
            <Text style={styles.cardOverlayText}>
              Copper tones harmonize with your melanin levels, creating a
              luminous, healthy glow.
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* ---- Analysis Grid ---- */}
      <View style={styles.analysisGrid}>
        <View style={styles.analysisCard}>
          <Text style={styles.analysisOverline}>UNDERTONE</Text>
          <Text style={styles.analysisValue}>Golden-Copper</Text>
        </View>
        <View style={styles.analysisCard}>
          <Text style={styles.analysisOverline}>CONTRAST</Text>
          <Text style={styles.analysisValue}>High/Rich</Text>
        </View>
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

const styles = StyleSheet.create({
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
    width: 40,
    height: 40,
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
    fontSize: 9,
    color: palette.muted,
    letterSpacing: 2,
  },
  shareCircle: {
    width: 40,
    height: 40,
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
    fontSize: 11,
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
    backgroundColor: "#6b9ac4",
  },
  beforeBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(0,0,0,0.80)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  beforeBadgeText: {
    ...type.overline,
    fontSize: 9,
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
    backgroundColor: "#b87332",
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
    fontSize: 9,
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
    backgroundColor: palette.primaryMuted,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  analysisOverline: {
    ...type.overline,
    fontSize: 9,
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
