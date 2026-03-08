import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SWATCHES = ["#b87332", "#cc4e3c", "#355e3b", "#cc7722", "#5d2e1f"];

const ATTRIBUTE_PILLS: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}[] = [
  { icon: "device-thermostat", label: "Warm Undertone" },
  { icon: "circle", label: "High Contrast" },
  { icon: "water-drop", label: "Rich Saturation" },
];

/* ------------------------------------------------------------------ */
/*  Share Results Screen                                               */
/* ------------------------------------------------------------------ */

export default function ShareResultsScreen() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleShare = () => {
    // Share logic would go here
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Top Bar ---- */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <MaterialIcons name="auto-awesome" size={20} color={palette.primary} />
          <Text style={styles.logoText}>TONEMATCH</Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable onPress={handleShare} hitSlop={8}>
            <MaterialIcons name="share" size={22} color={palette.ink} />
          </Pressable>
          <Pressable onPress={handleClose} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={palette.ink} />
          </Pressable>
        </View>
      </View>

      {/* ---- Portrait Section ---- */}
      <View style={styles.portraitWrapper}>
        <View style={styles.portrait}>
          {/* Placeholder warm bg */}
          <Image source={require("../assets/images/portrait_warm.png")} style={styles.portraitPlaceholder} resizeMode="cover" />

          {/* Match Score Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeOverline}>MATCH SCORE</Text>
            <Text style={styles.matchBadgeValue}>98%</Text>
          </View>
        </View>
      </View>

      {/* ---- Title Area ---- */}
      <View style={styles.titleArea}>
        <Text style={styles.seasonTitle}>Deep Autumn</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.paletteOverline}>SIGNATURE PALETTE</Text>
      </View>

      {/* ---- Palette Swatches ---- */}
      <View style={styles.swatchSection}>
        <View style={styles.swatchRow}>
          {SWATCHES.map((color, index) => (
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
          <Text style={styles.swatchTitle}>Rich & Earthy</Text>
        </View>
      </View>

      {/* ---- Attribute Pills ---- */}
      <View style={styles.pillRow}>
        {ATTRIBUTE_PILLS.map((pill) => (
          <View key={pill.label} style={styles.attributePill}>
            <MaterialIcons name={pill.icon} size={14} color={palette.primary} />
            <Text style={styles.attributePillLabel}>{pill.label}</Text>
          </View>
        ))}
      </View>

      {/* ---- Quote Box ---- */}
      <View style={styles.quoteBox}>
        <Text style={styles.quoteText}>
          "Rich, earthy tones balance your golden warmth and bring out the
          intensity in your eyes."
        </Text>
      </View>

      {/* ---- Footer CTA ---- */}
      <View style={styles.footer}>
        {/* Fake QR placeholder */}
        <View style={styles.qrPlaceholder} />
        <View style={styles.footerTextBlock}>
          <Text style={styles.footerOverline}>DISCOVER YOUR COLOR</Text>
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerUrl}>tonematch.app</Text>
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

const styles = StyleSheet.create({
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
    gap: spacing.md,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  portraitPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#a67c52",
  },
  matchBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(255,255,255,0.70)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  matchBadgeOverline: {
    ...type.overline,
    fontSize: 8,
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
    backgroundColor: "rgba(184,115,50,0.40)",
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
    fontSize: 9,
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
    fontSize: 11,
  },

  /* Quote Box */
  quoteBox: {
    backgroundColor: palette.primaryMuted,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.10)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
  qrPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: palette.ink,
  },
  footerTextBlock: {
    flex: 1,
    gap: 2,
  },
  footerOverline: {
    ...type.overline,
    fontSize: 9,
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
