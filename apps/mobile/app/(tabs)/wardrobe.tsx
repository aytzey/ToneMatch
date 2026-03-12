import { useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Screen } from "@/src/components/screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { useWardrobeItems } from "@/src/features/wardrobe/use-wardrobe-items";
import { hexForColorName } from "@/src/lib/color-name-hex";
import type { StyleExperience, WardrobeItemView } from "@/src/types/tonematch";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

const ITEM_IMAGES = [
  require("../../assets/images/wardrobe_blazer.png"),
  require("../../assets/images/wardrobe_blouse.png"),
  require("../../assets/images/wardrobe_knit.png"),
  require("../../assets/images/wardrobe_skirt.png"),
] as const;

const TAB_FILTERS = [
  { id: "analysis-led", label: "Analysis Led" },
  { id: "strong-fit", label: "Strong Fit" },
  { id: "needs-support", label: "Needs Support" },
  { id: "to-add", label: "To Add" },
];

type WardrobeCard = {
  id: string;
  title: string;
  fitPercent: number;
  tags: string[];
  color: string;
  image: ImageSourcePropType;
  note: string;
  kind: "owned" | "add";
};

function buildPaletteName(profile: StyleExperience | null | undefined) {
  if (!profile) {
    return "No analysis yet";
  }

  return profile.summary.title.replace(/\s+/g, " ").trim();
}

function buildPaletteDescription(profile: StyleExperience | null | undefined) {
  if (!profile) {
    return "Run your first analysis to sync wardrobe guidance with your face, contrast, and saved palette.";
  }

  return `${profile.summary.description} Keep ${profile.palette.core.slice(0, 3).join(", ")} closest to the face, and push ${profile.palette.avoid.slice(0, 3).join(", ")} lower in the outfit or out of frame.`;
}

function buildWardrobeCards(
  profile: StyleExperience | null | undefined,
  wardrobeItems: WardrobeItemView[],
): WardrobeCard[] {
  const coreColors = profile?.palette.core ?? ["Petrol", "Ecru", "Olive"];
  const ownedCards = wardrobeItems.map((item, index) => ({
    id: item.id,
    title: item.name,
    fitPercent: Math.round(Number(item.fitScore ?? 0.78) * 100),
    tags: item.tags.slice(0, 3),
    color: hexForColorName(item.tags[0] ?? coreColors[index % coreColors.length]),
    image: ITEM_IMAGES[index % ITEM_IMAGES.length],
    note: item.note,
    kind: "owned" as const,
  }));

  const addCards = (profile?.recommendations ?? []).slice(0, 3).map((item, index) => ({
    id: `add-${item.id}`,
    title: item.title,
    fitPercent: Math.round(Number(item.score ?? 0.86) * 100),
    tags: [item.category, `Lead with ${coreColors[index % coreColors.length]}`],
    color: hexForColorName(coreColors[index % coreColors.length]),
    image: ITEM_IMAGES[(index + ownedCards.length) % ITEM_IMAGES.length],
    note: item.reason,
    kind: "add" as const,
  }));

  return [...ownedCards, ...addCards];
}

function filterCards(cards: WardrobeCard[], activeTab: string) {
  if (activeTab === "strong-fit") {
    return cards.filter((card) => card.fitPercent >= 85);
  }

  if (activeTab === "needs-support") {
    return cards.filter((card) => card.kind === "owned" && card.fitPercent < 85);
  }

  if (activeTab === "to-add") {
    return cards.filter((card) => card.kind === "add");
  }

  return cards;
}

function buildInsightCopy(profile: StyleExperience | null | undefined) {
  if (!profile) {
    return "Your analysis notes will appear here after the first match.";
  }

  const firstFocus = profile.focusItems[0]?.copy ?? profile.summary.description;
  return `${firstFocus} Right now the app is treating ${profile.palette.core[0]}, ${profile.palette.core[1]}, and ${profile.palette.core[2]} as your anchor colors when evaluating current and suggested wardrobe pieces.`;
}

export default function WardrobeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("analysis-led");
  const profileQuery = useStyleProfile();
  const wardrobeQuery = useWardrobeItems();

  const profile = profileQuery.data ?? null;
  const cards = buildWardrobeCards(profile, wardrobeQuery.data ?? []);
  const filteredCards = filterCards(cards, activeTab);
  const isLoading = profileQuery.isLoading || wardrobeQuery.isLoading;
  const swatches = profile?.palette.core.slice(0, 4) ?? ["Petrol", "Ecru", "Olive", "Warm Navy"];

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>TONEMATCH</Text>
          <MaterialIcons
            name="auto-awesome"
            size={18}
            color={palette.primary}
            style={styles.logoIcon}
          />
        </View>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityLabel="Search discover feed"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/discover")}
            style={styles.headerAction}
          >
            <MaterialIcons name="search" size={24} color={palette.charcoal} />
          </Pressable>
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <MaterialIcons name="person" size={18} color={palette.surface} />
          </Pressable>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.overline}>CURRENT PALETTE</Text>

        <View style={styles.paletteTitleRow}>
          <Text style={styles.paletteName}>{buildPaletteName(profile)}</Text>
          <View style={styles.swatchRow}>
            {swatches.map((color, index) => (
              <View
                key={`${color}-${index}`}
                style={[
                  styles.swatchCircle,
                  { backgroundColor: hexForColorName(color), zIndex: swatches.length - index },
                  index > 0 && styles.swatchOverlap,
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.paletteDescription}>{buildPaletteDescription(profile)}</Text>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionButtonWrapper}>
          <PrimaryButton label="Add Item" icon="add-circle" onPress={() => router.push("/quick-check")} />
        </View>
        <View style={styles.actionButtonWrapper}>
          <Pressable
            accessibilityLabel="Build an outfit guide"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.charcoalButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/occasion-guide")}
          >
            <MaterialIcons
              name="auto-fix-high"
              size={20}
              color={palette.onPrimary}
              style={styles.charcoalButtonIcon}
            />
            <Text style={styles.charcoalButtonLabel}>Build Outfit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>ANALYSIS-LED NOTE</Text>
        <Text style={styles.insightCopy}>{buildInsightCopy(profile)}</Text>
      </View>

      <View style={styles.cautionCard}>
        <Text style={styles.cautionLabel}>AVOID NEAR THE FACE</Text>
        <Text style={styles.cautionCopy}>
          {profile
            ? `${profile.palette.avoid.slice(0, 3).join(", ")} are currently the lowest-confidence colors for your face zone. If you keep them, treat them as base layers or move them below the waist.`
            : "Your caution colors will appear here after analysis."}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TAB_FILTERS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelDefault,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Syncing wardrobe</Text>
          <Text style={styles.emptyCopy}>
            We are aligning your pieces with the latest saved analysis.
          </Text>
        </View>
      ) : filteredCards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing in this lane yet</Text>
          <Text style={styles.emptyCopy}>
            Add wardrobe pieces or switch tabs to see analysis-led items to buy next.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsColumn}>
          {filteredCards.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemVisual, { backgroundColor: item.color }]}>
                <Image
                  source={item.image}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.fitBadge}>
                  <Text style={styles.fitBadgeText}>{item.fitPercent}% FIT</Text>
                </View>
                <View style={styles.kindBadge}>
                  <Text style={styles.kindBadgeText}>
                    {item.kind === "owned" ? "OWNED" : "ADD NEXT"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>

                <View style={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <View key={`${item.id}-${tag}`} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.noteText}>{item.note}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontFamily: "Manrope_800ExtraBold",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontStyle: "italic",
    color: palette.charcoal,
  },
  logoIcon: {
    marginLeft: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    gap: spacing.xs,
  },
  overline: {
    ...type.overline,
    color: palette.primary,
  },
  paletteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  paletteName: {
    ...type.h2,
    color: palette.charcoal,
    flexShrink: 1,
  },
  swatchRow: {
    flexDirection: "row",
  },
  swatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.canvas,
  },
  swatchOverlap: {
    marginLeft: -8,
  },
  paletteDescription: {
    ...type.body,
    color: palette.muted,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  charcoalButton: {
    backgroundColor: palette.charcoal,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 52,
  },
  charcoalButtonIcon: {
    marginRight: 8,
  },
  charcoalButtonLabel: {
    ...type.label,
    fontSize: 15,
    color: palette.onPrimary,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  insightCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  insightLabel: {
    ...type.overline,
    color: palette.primary,
  },
  insightCopy: {
    ...type.body,
    color: palette.charcoal,
  },
  cautionCard: {
    backgroundColor: palette.dangerSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cautionLabel: {
    ...type.overline,
    color: palette.red,
  },
  cautionCopy: {
    ...type.body,
    color: palette.charcoal,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  tabItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: palette.primary,
  },
  tabLabel: {
    ...type.label,
    fontSize: 14,
  },
  tabLabelActive: {
    color: palette.charcoal,
  },
  tabLabelDefault: {
    color: palette.muted,
  },
  cardsColumn: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
  },
  itemVisual: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  fitBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: palette.surfaceTintStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fitBadgeText: {
    ...type.caption,
    fontSize: 12,
    color: palette.primary,
    fontWeight: "700",
  },
  kindBadge: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: palette.overlayMedium,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  kindBadgeText: {
    ...type.caption,
    color: palette.surface,
    fontSize: 12,
    letterSpacing: 1,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemTitle: {
    ...type.label,
    color: palette.charcoal,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tagPill: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  tagPillText: {
    ...type.caption,
    fontSize: 12,
    color: palette.primary,
  },
  noteText: {
    ...type.body,
    color: palette.muted,
  },
  emptyState: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...type.label,
    color: palette.charcoal,
  },
  emptyCopy: {
    ...type.body,
    color: palette.muted,
  },
});
