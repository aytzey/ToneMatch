import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAnalysisHistory } from "@/src/features/style/use-analysis-history";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { hexForColorName } from "@/src/lib/color-name-hex";
import { buildEditorialStory } from "@/src/lib/style-story";
import { useAppTheme } from "@/src/theme/theme-provider";
import { useThemedStyles } from "@/src/theme/use-themed-styles";
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

type QuickAction = {
  href: "/(tabs)/scan" | "/quick-check" | "/style-guide";
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  accessibilityLabel: string;
  tone: "primary" | "secondary";
};

const OCCASIONS = [
  {
    label: "The Office",
    image: require("@/assets/images/home_occasion_office.jpg"),
  },
  {
    label: "Date Night",
    image: require("@/assets/images/home_occasion_date.jpg"),
  },
  {
    label: "Weekend",
    image: require("@/assets/images/home_occasion_weekend.jpg"),
  },
] as const;

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/(tabs)/scan",
    icon: "photo-camera",
    label: "New Scan",
    accessibilityLabel: "Start a new scan",
    tone: "primary",
  },
  {
    href: "/quick-check",
    icon: "shopping-bag",
    label: "Quick Check",
    accessibilityLabel: "Open quick check",
    tone: "secondary",
  },
  {
    href: "/style-guide",
    icon: "auto-awesome",
    label: "Guides",
    accessibilityLabel: "Open style guides",
    tone: "secondary",
  },
] as const;

function buildShadowStyle(color: string, opacity: number, y = 12, blur = 28) {
  return Platform.select({
    web: {
      boxShadow: `0px ${y}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    },
    default: {
      elevation: 4,
      shadowColor: color,
      shadowOpacity: opacity,
      shadowOffset: { width: 0, height: y / 3 },
      shadowRadius: blur / 3,
    },
  });
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useStyleProfile();
  const { data: history } = useAnalysisHistory();
  const story = buildEditorialStory(data);

  const isTablet = width >= 720;
  const isDesktop = width >= 1080;
  const occasionCardWidth = isDesktop
    ? Math.min(232, Math.max(180, (width - spacing.xl * 2 - spacing.md * 2) / 3))
    : Math.min(180, Math.max(144, width * 0.42));

  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split("@")[0] ??
    "there";
  const firstName = displayName.split(" ")[0];

  const analysisTitle = data?.summary?.title ?? "Your saved palette";
  const confidence = data?.confidence
    ? `${Math.round(data.confidence * 100)}%`
    : "No score";

  const fallbackSwatches = [
    palette.swatch1,
    palette.swatch2,
    palette.swatch3,
    palette.swatch4,
  ];
  const swatchColors =
    data?.palette?.core && data.palette.core.length > 0
      ? data.palette.core.slice(0, 4).map((name) => hexForColorName(name))
      : fallbackSwatches;
  const extraColorCount =
    data?.palette?.core && data.palette.core.length > 4
      ? data.palette.core.length - 4
      : 0;

  return (
    <Screen
      accessibilityLabel="Home screen"
      contentContainerStyle={styles.content}
      role="main"
      scrollable
    >
      <View style={styles.pageShell}>
        <View role="banner" style={styles.header}>
          <Pressable
            accessibilityLabel="Open discover"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/discover")}
            style={({ pressed }) => [
              styles.headerIconWrap,
              pressed && styles.headerActionPressed,
            ]}
          >
            <MaterialIcons name="menu" size={24} color={palette.charcoal} />
          </Pressable>

          <Text accessibilityRole="header" style={styles.headerTitle}>
            TONEMATCH
          </Text>

          <Pressable
            accessibilityLabel="Open account"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => [
              styles.headerAvatarWrap,
              pressed && styles.headerActionPressed,
            ]}
          >
            <View style={styles.headerAvatarCircle}>
              <MaterialIcons
                name="account-circle"
                size={28}
                color={palette.primary}
              />
            </View>
          </Pressable>
        </View>

        <View style={[styles.editorialGrid, isDesktop && styles.editorialGridDesktop]}>
          <View style={styles.heroColumn}>
            <View
              accessibilityLabel={`Editorial portrait for today's ${story.seasonTitle} direction`}
              accessibilityRole="image"
              role="region"
              style={[styles.heroCard, isTablet && styles.heroCardTablet]}
            >
              <Image
                accessibilityLabel={`Editorial portrait for today's ${story.seasonTitle} direction`}
                accessibilityRole="image"
                source={require("@/assets/images/home_hero.jpg")}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", palette.overlayStrong]}
                locations={[0.12, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>Today for you</Text>
                <Text accessibilityRole="header" style={styles.heroHeadline}>
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

          <View style={[styles.sideRail, isDesktop && styles.sideRailDesktop]}>
            <View
              accessibilityLabel="Latest saved analysis"
              role="region"
              style={[styles.analysisCard, buildShadowStyle(palette.ink, 0.08)]}
            >
              <View style={styles.analysisIntro}>
                <Text style={styles.sectionHeader}>Last analysis</Text>
                <Text style={styles.analysisTitle}>{analysisTitle}</Text>
                <Text style={styles.analysisSub}>
                  {history?.[0]?.createdAt
                    ? `Analyzed ${relativeDate(history[0].createdAt)}`
                    : "Latest analysis"}{" "}
                  {"\u2022"} {confidence} Match
                </Text>
              </View>

              <View style={styles.analysisBottomRow}>
                <View style={styles.swatchRow}>
                  {swatchColors.map((color, index) => (
                    <View
                      key={`${color}-${index}`}
                      style={[styles.swatch, { backgroundColor: color }]}
                    />
                  ))}
                  {extraColorCount > 0 ? (
                    <View style={styles.swatchMore}>
                      <Text style={styles.swatchMoreText}>+{extraColorCount}</Text>
                    </View>
                  ) : null}
                </View>

                <Image
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  source={require("@/assets/images/profile_avatar.jpg")}
                  style={styles.analysisThumbnail}
                  resizeMode="cover"
                />
              </View>
            </View>

            <View
              accessibilityLabel="Primary actions"
              role="region"
              style={styles.quickActionsSection}
            >
              <Text style={styles.sectionHeader}>Next move</Text>
              <View style={styles.quickActionsGrid}>
                {QUICK_ACTIONS.map((action, index) => {
                  const isPrimary = action.tone === "primary";
                  const cardStyle = isPrimary
                    ? styles.quickActionPrimary
                    : styles.quickActionSecondary;

                  return (
                    <Pressable
                      key={action.label}
                      accessibilityLabel={action.accessibilityLabel}
                      accessibilityRole="button"
                      onPress={() => router.push(action.href)}
                      style={({ pressed }) => [
                        styles.quickActionBase,
                        index === 0 && styles.quickActionLead,
                        cardStyle,
                        isPrimary &&
                          buildShadowStyle(palette.primary, 0.18, 14, 28),
                        pressed && styles.quickActionPressed,
                      ]}
                    >
                      <MaterialIcons
                        name={action.icon}
                        size={28}
                        color={isPrimary ? palette.onPrimary : palette.primary}
                      />
                      <Text
                        style={[
                          styles.quickActionLabel,
                          isPrimary && styles.quickActionLabelInverted,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View
          accessibilityLabel="Occasion guides"
          role="region"
          style={styles.occasionsSection}
        >
          <View style={styles.occasionsHeaderRow}>
            <Text accessibilityRole="header" style={styles.sectionHeader}>
              Occasions
            </Text>
            <Pressable
              accessibilityLabel="See all occasion guides"
              accessibilityRole="button"
              onPress={() => router.push("/occasion-guide")}
              style={({ pressed }) => [
                styles.seeAllButton,
                pressed && styles.headerActionPressed,
              ]}
            >
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {isDesktop ? (
            <View style={styles.desktopOccasionGrid}>
              {OCCASIONS.map((item) => (
                <View
                  key={item.label}
                  style={[styles.occasionCard, { width: occasionCardWidth }]}
                >
                  <Image
                    accessibilityLabel={`${item.label} styling preview`}
                    accessibilityRole="image"
                    source={item.image}
                    style={[styles.occasionImage, { width: occasionCardWidth }]}
                    resizeMode="cover"
                  />
                  <Text style={styles.occasionLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : (
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
                    accessibilityLabel={`${item.label} styling preview`}
                    accessibilityRole="image"
                    source={item.image}
                    style={[styles.occasionImage, { width: occasionCardWidth }]}
                    resizeMode="cover"
                  />
                  <Text style={styles.occasionLabel}>{item.label}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (palette: import("@/src/theme/palette").ThemePalette) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing.xxl,
    },
    pageShell: {
      alignSelf: "center",
      gap: spacing.lg,
      maxWidth: 1200,
      width: "100%",
    },
    header: {
      alignItems: "center",
      backgroundColor: palette.canvas,
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    headerIconWrap: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerAvatarWrap: {
      alignItems: "flex-end",
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerAvatarCircle: {
      alignItems: "center",
      backgroundColor: palette.primarySoft,
      borderRadius: radius.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerActionPressed: {
      opacity: 0.84,
    },
    headerTitle: {
      color: palette.charcoal,
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 1.5,
      textAlign: "center",
    },
    editorialGrid: {
      gap: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    editorialGridDesktop: {
      alignItems: "stretch",
      flexDirection: "row",
    },
    heroColumn: {
      flex: 1.1,
    },
    heroCard: {
      aspectRatio: 6 / 5,
      borderRadius: radius.xl,
      minHeight: 320,
      overflow: "hidden",
      position: "relative",
    },
    heroCardTablet: {
      minHeight: 380,
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.primary,
    },
    heroContent: {
      bottom: 0,
      gap: spacing.xs,
      left: 0,
      padding: spacing.lg,
      position: "absolute",
      right: 0,
    },
    heroEyebrow: {
      color: palette.primary,
      fontFamily: "Manrope_700Bold",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.8,
      textTransform: "uppercase",
    },
    heroHeadline: {
      color: palette.onDark,
      fontSize: 28,
      fontFamily: "Manrope_700Bold",
      fontWeight: "700",
      letterSpacing: -0.4,
      lineHeight: 34,
      maxWidth: 520,
    },
    heroSubRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    heroAccentBar: {
      backgroundColor: palette.primary,
      borderRadius: radius.full,
      height: 4,
      width: 56,
    },
    heroSubText: {
      color: palette.onDarkMuted,
      fontFamily: "Manrope_600SemiBold",
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    sideRail: {
      gap: spacing.lg,
    },
    sideRailDesktop: {
      flex: 0.84,
      maxWidth: 420,
    },
    analysisCard: {
      backgroundColor: palette.surface,
      borderColor: palette.borderLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
    analysisIntro: {
      gap: spacing.xs,
    },
    sectionHeader: {
      ...type.sectionHeader,
      color: palette.charcoal,
      marginBottom: spacing.xs,
    },
    analysisTitle: {
      ...type.label,
      color: palette.charcoal,
      fontSize: 16,
    },
    analysisSub: {
      ...type.caption,
      color: palette.muted,
      lineHeight: 18,
    },
    analysisBottomRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    swatchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    swatch: {
      borderColor: palette.surfaceTintLine,
      borderRadius: radius.full,
      borderWidth: 1.5,
      height: 24,
      width: 24,
    },
    swatchMore: {
      alignItems: "center",
      backgroundColor: palette.canvas,
      borderRadius: radius.full,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    swatchMoreText: {
      color: palette.muted,
      fontFamily: "Manrope_600SemiBold",
      fontSize: 12,
      fontWeight: "600",
    },
    analysisThumbnail: {
      backgroundColor: palette.accentSoft,
      borderColor: palette.border,
      borderRadius: radius.md,
      borderWidth: 1,
      height: 88,
      width: 88,
    },
    quickActionsSection: {
      gap: spacing.sm,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    quickActionBase: {
      alignItems: "center",
      borderRadius: radius.xl,
      justifyContent: "center",
      minHeight: 128,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
    },
    quickActionLead: {
      width: "100%",
    },
    quickActionPrimary: {
      backgroundColor: palette.primary,
    },
    quickActionSecondary: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      flex: 1,
      minWidth: 156,
    },
    quickActionPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    quickActionLabel: {
      color: palette.charcoal,
      fontFamily: "Manrope_700Bold",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.7,
      marginTop: spacing.sm,
      textAlign: "center",
      textTransform: "uppercase",
    },
    quickActionLabelInverted: {
      color: palette.onPrimary,
    },
    occasionsSection: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    occasionsHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    seeAllButton: {
      minHeight: 44,
      justifyContent: "center",
    },
    seeAll: {
      color: palette.primary,
      fontFamily: "Manrope_700Bold",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    occasionsScroll: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    desktopOccasionGrid: {
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      paddingBottom: spacing.lg,
    },
    occasionCard: {
      gap: spacing.sm,
    },
    occasionImage: {
      aspectRatio: 5 / 6,
      borderColor: palette.borderLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      minHeight: 200,
    },
    occasionLabel: {
      color: palette.charcoal,
      fontFamily: "Manrope_700Bold",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textAlign: "center",
      textTransform: "uppercase",
    },
  });
