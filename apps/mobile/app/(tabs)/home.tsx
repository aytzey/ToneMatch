import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { hexForColorName } from "@/src/lib/color-name-hex";
import { buildEditorialStory } from "@/src/lib/style-story";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAnalysisHistory } from "@/src/features/style/use-analysis-history";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

function relativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

const DEFAULT_SWATCH_COLORS = [
  palette.swatch1,
  palette.swatch2,
  palette.swatch3,
  palette.swatch4,
];


const OCCASIONS = [
  {
    label: "The Office",
    bg: palette.accentSoft,
    image: require("@/assets/images/home_occasion_office.png"),
  },
  {
    label: "Date Night",
    bg: palette.clay,
    image: require("@/assets/images/home_occasion_date.png"),
  },
  {
    label: "Weekend",
    bg: palette.surfaceMuted,
    image: require("@/assets/images/home_occasion_weekend.png"),
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { data } = useStyleProfile();
  const { data: history } = useAnalysisHistory();
  const story = buildEditorialStory(data);
  const occasionCardWidth = Math.min(168, Math.max(140, width * 0.4));

  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split("@")[0] ??
    "there";
  const firstName = displayName.split(" ")[0];

  const analysisTitle = data?.summary?.title ?? "Your saved palette";
  const confidence = data?.confidence
    ? `${Math.round(data.confidence * 100)}%`
    : "No score";

  const swatchColors =
    data?.palette?.core && data.palette.core.length > 0
      ? data.palette.core.slice(0, 4).map((name) => hexForColorName(name))
      : DEFAULT_SWATCH_COLORS;
  const extraColorCount =
    data?.palette?.core && data.palette.core.length > 4
      ? data.palette.core.length - 4
      : 0;

  return (
    <Screen scrollable contentContainerStyle={styles.scrollContent}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Link href="/(tabs)/discover" asChild>
          <Pressable
            accessibilityLabel="Open discover"
            accessibilityRole="button"
            style={styles.headerIconWrap}
          >
            <MaterialIcons name="menu" size={24} color={palette.charcoal} />
          </Pressable>
        </Link>

        <Text style={styles.headerTitle}>TONEMATCH</Text>

        <Link href="/(tabs)/profile" asChild>
          <Pressable
            accessibilityRole="button"
            style={styles.headerAvatarWrap}
            accessibilityLabel="Open account"
          >
            <View style={styles.headerAvatarCircle}>
              <MaterialIcons
                name="account-circle"
                size={28}
                color={palette.primary}
              />
            </View>
          </Pressable>
        </Link>
      </View>

      {/* ---- Hero Card ---- */}
      <View style={styles.heroPadding}>
        <View style={styles.heroCard}>
          {/* Hero image background */}
          <Image
            source={require("@/assets/images/home_hero.png")}
            style={styles.heroImagePlaceholder}
            resizeMode="cover"
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", palette.overlayStrong]}
            locations={[0.2, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Hero content pinned to bottom */}
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Today for you</Text>
            <Text style={styles.heroHeadline}>
              Morning, {firstName}. {story.seasonTitle} guide is ready.
            </Text>
            <View style={styles.heroSubRow}>
              <View style={styles.heroAccentBar} />
              <Text style={styles.heroSubText}>
                {story.paletteLead.slice(0, 2).join(" + ")} are leading today
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ---- Last Analysis ---- */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>LAST ANALYSIS</Text>

        <View style={styles.analysisCard}>
          <View style={styles.analysisLeft}>
            <Text style={styles.analysisTitle}>{analysisTitle}</Text>
            <Text style={styles.analysisSub}>
              {history?.[0]?.createdAt
                ? `Analyzed ${relativeDate(history[0].createdAt)}`
                : "Latest analysis"}{" "}
              {"\u2022"} {confidence} Match
            </Text>

            <View style={styles.swatchRow}>
              {swatchColors.map((color, i) => (
                <View
                  key={`${color}-${i}`}
                  style={[styles.swatch, { backgroundColor: color }]}
                />
              ))}
              {extraColorCount > 0 && (
                <View style={styles.swatchMore}>
                  <Text style={styles.swatchMoreText}>+{extraColorCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Fabric thumbnail */}
          <Image
            source={require("@/assets/images/profile_avatar.png")}
            style={styles.analysisThumbnail}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* ---- Quick Actions ---- */}
      <View style={styles.quickActionsGrid}>
        <Link href="/(tabs)/scan" asChild>
          <Pressable
            accessibilityLabel="Start a new scan"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.quickActionPrimary,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="photo-camera" size={26} color={palette.onPrimary} />
            <Text style={styles.quickActionLabelWhite}>New Scan</Text>
          </Pressable>
        </Link>

        <Link href="/quick-check" asChild>
          <Pressable
            accessibilityLabel="Open quick check"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.quickActionSecondary,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="shopping-bag"
              size={26}
              color={palette.primary}
            />
            <Text style={styles.quickActionLabel}>Quick Check</Text>
          </Pressable>
        </Link>

        <Link href="/style-guide" asChild>
          <Pressable
            accessibilityLabel="Open style guides"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.quickActionSecondary,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="auto-awesome"
              size={26}
              color={palette.primary}
            />
            <Text style={styles.quickActionLabel}>Guides</Text>
          </Pressable>
        </Link>
      </View>

      {/* ---- Occasions ---- */}
      <View style={styles.occasionsSection}>
        <View style={styles.occasionsHeaderRow}>
          <Text style={styles.sectionHeader}>OCCASIONS</Text>
          <Link href="/occasion-guide" asChild>
            <Pressable
              accessibilityLabel="See all occasion guides"
              accessibilityRole="button"
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.occasionsScroll}
        >
          {OCCASIONS.map((item) => (
            <View
              key={item.label}
              style={[styles.occasionCard, { width: occasionCardWidth }]}
            >
              <Image
                source={item.image}
                style={[
                  styles.occasionImage,
                  { width: occasionCardWidth },
                  { backgroundColor: item.bg },
                ]}
                resizeMode="cover"
              />
              <Text style={styles.occasionLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom padding so content clears the tab bar */}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 0,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.canvas,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Manrope_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 1.5,
    color: palette.charcoal,
    textAlign: "center",
  },
  headerAvatarWrap: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------- Hero ---------- */
  heroPadding: {
    padding: spacing.md,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    aspectRatio: 4 / 5,
    minHeight: 260,
    position: "relative",
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.primary,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg - 4,
    gap: spacing.xs,
  },
  heroEyebrow: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.primary,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroHeadline: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.onDark,
    letterSpacing: -0.3,
  },
  heroSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroAccentBar: {
    width: 48,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
  },
  heroSubText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    fontWeight: "600",
    color: palette.onDarkMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* ---------- Section Header ---------- */
  sectionWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    ...type.sectionHeader,
    color: palette.charcoal,
    marginBottom: spacing.sm + 4,
  },

  /* ---------- Last Analysis Card ---------- */
  analysisCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    shadowColor: palette.ink,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  analysisLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  analysisTitle: {
    ...type.label,
    fontSize: 15,
    color: palette.charcoal,
  },
  analysisSub: {
    ...type.caption,
    color: palette.muted,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: spacing.sm,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: palette.surfaceTintLine,
  },
  swatchMore: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: palette.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchMoreText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    fontWeight: "600",
    color: palette.muted,
  },
  analysisThumbnail: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },

  /* ---------- Quick Actions ---------- */
  quickActionsGrid: {
    flexDirection: "row",
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickActionPrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  quickActionLabelWhite: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.charcoal,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  /* ---------- Occasions ---------- */
  occasionsSection: {
    paddingTop: spacing.sm,
  },
  occasionsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  occasionsScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  occasionCard: {
    gap: spacing.sm,
  },
  occasionImage: {
    aspectRatio: 5 / 6,
    minHeight: 180,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  occasionLabel: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
    color: palette.charcoal,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },

  /* ---------- Bottom Spacer ---------- */
  bottomSpacer: {
    height: 100,
  },
});
