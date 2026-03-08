import { useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { GlassCard } from "@/src/components/glass-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Color swatch hex mapping                                           */
/* ------------------------------------------------------------------ */

const SWATCH_HEX: Record<string, string> = {
  rust: "#b87332",
  "deep olive": "#5d6146",
  "forest green": "#2d6a4f",
  "cool blue": "#6b9ac4",
  lavender: "#b4a7d6",
  burgundy: "#722f37",
  terracotta: "#c67d4a",
  mustard: "#c9a227",
  teal: "#367588",
  plum: "#6e3a5f",
  charcoal: "#36454f",
  cream: "#f5e6cc",
  gold: "#c9a227",
  coral: "#e07a5f",
  sage: "#87a96b",
};

function hexForName(name: string): string {
  return SWATCH_HEX[name.toLowerCase()] ?? palette.primary;
}

/* ------------------------------------------------------------------ */
/*  ColorSwatch local component                                        */
/* ------------------------------------------------------------------ */

type ColorSwatchProps = {
  name: string;
  size?: "large" | "small";
};

function ColorSwatch({ name, size = "large" }: ColorSwatchProps) {
  const isLarge = size === "large";
  const bg = hexForName(name);

  return (
    <View style={swatchStyles.wrapper}>
      <View
        style={[
          swatchStyles.rect,
          {
            backgroundColor: bg,
            width: isLarge ? 96 : 72,
            height: isLarge ? 96 : 72,
            borderRadius: radius.lg,
          },
        ]}
      />
      <Text
        style={[swatchStyles.label, !isLarge && swatchStyles.labelSmall]}
        numberOfLines={1}
      >
        {name.toUpperCase()}
      </Text>
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.sm,
  },
  rect: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    ...type.caption,
    color: palette.charcoal,
    letterSpacing: 1,
    fontSize: 10,
  },
  labelSmall: {
    color: palette.muted,
  },
});

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function AnalysisResultScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data, isLoading, error } = useStyleProfile();

  /* ---- Header ---- */
  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color={palette.charcoal} />
      </Pressable>

      <Text style={styles.headerTitle}>ANALYSIS REPORT</Text>

      <Pressable hitSlop={12}>
        <MaterialIcons name="share" size={22} color={palette.charcoal} />
      </Pressable>
    </View>
  );

  /* ---- Loading / error states ---- */
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

  /* ---- Derived values ---- */
  const confidencePct = Math.round((data.confidence ?? 0.98) * 100);
  const heroTitle =
    data.summary?.title ?? `${data.undertone} / ${data.contrast}`;
  const theoryItem = data.focusItems?.[0];

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      {/* ---- Circular avatar area with match badge ---- */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Image source={require("../../assets/images/profile_avatar.png")} style={{ width: 108, height: 108, borderRadius: 54 }} resizeMode="cover" />
          </View>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{confidencePct}% MATCH</Text>
        </View>
      </View>

      {/* ---- Hero title ---- */}
      <View style={styles.heroSection}>
        <Text style={styles.overline}>YOUR SIGNATURE PALETTE</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </View>

      {/* ---- Why this works card ---- */}
      {theoryItem ? (
        <GlassCard>
          <View style={styles.whyHeader}>
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={palette.primary}
            />
            <Text style={styles.whyHeading}>WHY THIS WORKS FOR YOU</Text>
          </View>
          <Text style={styles.whyBody}>
            {theoryItem.copy ?? data.summary?.description}
          </Text>
          <Pressable style={styles.theoryLink}>
            <Text style={styles.theoryLinkText}>DIVE INTO THE THEORY</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={palette.primary}
            />
          </Pressable>
        </GlassCard>
      ) : null}

      {/* ---- Best on you / PRIMARY TONES ---- */}
      <View style={styles.swatchSection}>
        <View style={styles.swatchHeaderRow}>
          <Text style={styles.swatchSectionTitle}>Best on you</Text>
          <Text style={styles.swatchSectionLabel}>PRIMARY TONES</Text>
        </View>
        <View style={styles.swatchRow}>
          {(data.palette.core.length > 0
            ? data.palette.core.slice(0, 3)
            : ["Rust", "Deep Olive", "Forest Green"]
          ).map((name) => (
            <ColorSwatch key={name} name={name} size="large" />
          ))}
        </View>
      </View>

      {/* ---- Use with care / COOL TONES ---- */}
      <View style={styles.swatchSection}>
        <View style={styles.swatchHeaderRow}>
          <Text style={styles.swatchSectionTitle}>Use with care</Text>
          <Text style={styles.swatchSectionLabel}>COOL TONES</Text>
        </View>
        <View style={styles.swatchRow}>
          {(data.palette.avoid.length > 0
            ? data.palette.avoid.slice(0, 2)
            : ["Cool Blue", "Lavender"]
          ).map((name) => (
            <ColorSwatch key={name} name={name} size="small" />
          ))}
        </View>
      </View>

      {/* ---- Action buttons ---- */}
      <View style={styles.actions}>
        <PrimaryButton
          label="SHOP YOUR TONES"
          icon="shopping-bag"
          href="/(tabs)/discover"
        />
        <PrimaryButton
          label="SAVE PALETTE"
          icon="bookmark-border"
          variant="secondary"
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
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  /* Header */
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

  /* Loading / error */
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

  /* Avatar */
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
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
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  /* Hero */
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  overline: {
    ...type.overline,
    color: palette.muted,
  },
  heroTitle: {
    ...type.hero,
    color: palette.charcoal,
    textAlign: "center",
    fontSize: 26,
    lineHeight: 32,
  },

  /* Why card */
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  whyHeading: {
    ...type.sectionHeader,
    color: palette.charcoal,
    fontSize: 12,
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

  /* Swatch sections */
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
    fontSize: 10,
  },
  swatchRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  /* Actions */
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
