import { useState } from "react";
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { useAuth } from "@/src/features/auth/use-auth";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SCREEN_PADDING = spacing.lg;
const GRID_GAP = spacing.md;
const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING * 2 - GRID_GAP) / 2;

const PALETTE_SWATCHES = ["#5d1c1c", "#8b4513", "#b87332", "#2e3b23"] as const;

const TAB_FILTERS = [
  { id: "top-picks", label: "Top Picks" },
  { id: "recently-added", label: "Recently Added" },
  { id: "outerwear", label: "Outerwear" },
  { id: "knitwear", label: "Knitwear" },
];

type WardrobeItem = {
  id: string;
  title: string;
  fitPercent: number;
  tags: string[];
  color: string;
  image: ImageSourcePropType;
  quote?: string;
  fullWidth?: boolean;
  borderlineMatch?: boolean;
  stylingTip?: string;
};

const WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: "1",
    title: "Terracotta Overcoat",
    fitPercent: 98,
    tags: ["Earth Tone", "Wool"],
    color: palette.swatch2,
    image: require("../../assets/images/wardrobe_blazer.png"),
    quote: '"The undertone perfectly complements your skin\'s golden warmth."',
  },
  {
    id: "2",
    title: "Hunter Silk Blouse",
    fitPercent: 92,
    tags: ["Deep Green", "Silk"],
    color: palette.swatch3,
    image: require("../../assets/images/wardrobe_blouse.png"),
    quote: '"Rich saturation balances your contrast level beautifully."',
  },
  {
    id: "3",
    title: "Ribbed Charcoal Knit",
    fitPercent: 74,
    tags: ["Neutral"],
    color: palette.clay,
    image: require("../../assets/images/wardrobe_knit.png"),
    fullWidth: true,
    borderlineMatch: true,
    stylingTip:
      "This cool-toned gray may wash you out. Pair with a copper necklace or a burnt orange scarf to bring warmth back to your face.",
  },
  {
    id: "4",
    title: "Raw Indigo Denim",
    fitPercent: 88,
    tags: ["Blue-Black"],
    color: palette.swatch1,
    image: require("../../assets/images/wardrobe_skirt.png"),
    quote: '"The dark wash provides the necessary weight for Deep Autumn style."',
  },
  {
    id: "5",
    title: "Ochre Linen Shirt",
    fitPercent: 96,
    tags: ["Golden"],
    color: palette.primary,
    image: require("../../assets/images/wardrobe_blazer.png"),
    quote: '"A cornerstone color for your seasonal archetype."',
  },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function WardrobeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("top-picks");

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---------- Header ---------- */}
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
          <MaterialIcons name="search" size={24} color={palette.charcoal} />
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={18} color={palette.surface} />
          </View>
        </View>
      </View>

      {/* ---------- Profile / Current Palette ---------- */}
      <View style={styles.profileSection}>
        <Text style={styles.overline}>CURRENT PALETTE</Text>

        <View style={styles.paletteTitleRow}>
          <Text style={styles.paletteName}>Deep Autumn</Text>
          <View style={styles.swatchRow}>
            {PALETTE_SWATCHES.map((color, i) => (
              <View
                key={color}
                style={[
                  styles.swatchCircle,
                  { backgroundColor: color, zIndex: PALETTE_SWATCHES.length - i },
                  i > 0 && styles.swatchOverlap,
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.paletteDescription}>
          Warm, rich tones with high saturation. Avoid pastels and cool grays.
        </Text>
      </View>

      {/* ---------- Quick Actions ---------- */}
      <View style={styles.actionRow}>
        <View style={styles.actionButtonWrapper}>
          <PrimaryButton label="Add Item" icon="add-circle" />
        </View>
        <View style={styles.actionButtonWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.charcoalButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons
              name="auto-fix-high"
              size={20}
              color="#ffffff"
              style={styles.charcoalButtonIcon}
            />
            <Text style={styles.charcoalButtonLabel}>Build Outfit</Text>
          </Pressable>
        </View>
      </View>

      {/* ---------- Tab Filter Row (Underline style) ---------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TAB_FILTERS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
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

      {/* ---------- 2-Column Grid ---------- */}
      <View style={styles.grid}>
        {WARDROBE_ITEMS.map((item) => {
          if (item.fullWidth) {
            return (
              <View key={item.id} style={styles.gridItemFull}>
                {/* Image placeholder */}
                <View
                  style={[
                    styles.imagePlaceholderFull,
                    { backgroundColor: item.color },
                  ]}
                >
                  <Image
                    source={item.image}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  {/* Borderline Match badge */}
                  <View style={styles.borderlineBadge}>
                    <Text style={styles.borderlineBadgeText}>
                      {item.fitPercent}% FIT
                    </Text>
                    <Text style={styles.borderlineBadgeSub}>
                      Borderline Match
                    </Text>
                  </View>
                </View>

                {/* Card body */}
                <View style={styles.cardBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>

                  <View style={styles.tagRow}>
                    {item.tags.map((tag) => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Styling Tip */}
                  {item.stylingTip && (
                    <View style={styles.stylingTipBox}>
                      <View style={styles.stylingTipHeader}>
                        <MaterialIcons
                          name="lightbulb-outline"
                          size={14}
                          color={palette.primary}
                        />
                        <Text style={styles.stylingTipLabel}>Styling Tip</Text>
                      </View>
                      <Text style={styles.stylingTipText}>
                        {item.stylingTip}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }

          return (
            <View key={item.id} style={styles.gridItemHalf}>
              {/* Image placeholder */}
              <View
                style={[
                  styles.imagePlaceholderHalf,
                  { backgroundColor: item.color },
                ]}
              >
                <Image
                  source={item.image}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                {/* FIT badge */}
                <View style={styles.fitBadge}>
                  <Text style={styles.fitBadgeText}>
                    {item.fitPercent}% FIT
                  </Text>
                </View>
              </View>

              {/* Card body */}
              <View style={styles.cardBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>

                <View style={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {item.quote && (
                  <Text style={styles.quoteText}>{item.quote}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  content: {
    padding: SCREEN_PADDING,
    paddingBottom: 120,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---- Profile / Palette ---- */
  profileSection: {
    marginBottom: spacing.lg,
  },
  overline: {
    ...type.overline,
    color: palette.primary,
    marginBottom: spacing.xs,
  },
  paletteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  paletteName: {
    ...type.h2,
    color: palette.charcoal,
    marginRight: spacing.md,
  },
  swatchRow: {
    flexDirection: "row",
  },
  swatchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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

  /* ---- Quick Actions ---- */
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
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
    color: "#ffffff",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  /* ---- Tab Filter Row (Underline style) ---- */
  tabRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  tabItem: {
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

  /* ---- Grid ---- */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  /* Half-width card */
  gridItemHalf: {
    width: COLUMN_WIDTH,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  imagePlaceholderHalf: {
    width: "100%",
    aspectRatio: 3 / 4,
    position: "relative",
  },

  /* Full-width card */
  gridItemFull: {
    width: "100%",
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  imagePlaceholderFull: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },

  /* FIT badge (top-right, standard items) */
  fitBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fitBadgeText: {
    ...type.caption,
    fontSize: 10,
    fontStyle: "italic",
    color: palette.primary,
    fontWeight: "700",
  },

  /* Borderline match badge (full-width item) */
  borderlineBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: palette.charcoal,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: "flex-end",
  },
  borderlineBadgeText: {
    ...type.caption,
    fontSize: 10,
    fontStyle: "italic",
    color: "#ffffff",
    fontWeight: "700",
  },
  borderlineBadgeSub: {
    ...type.caption,
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    marginTop: 1,
  },

  /* Card body (shared between half / full) */
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
    fontSize: 10,
    color: palette.primary,
  },
  quoteText: {
    ...type.caption,
    fontStyle: "italic",
    color: palette.muted,
    fontSize: 11,
  },

  /* Styling Tip (full-width featured item) */
  stylingTipBox: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  stylingTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stylingTipLabel: {
    ...type.caption,
    color: palette.primary,
    fontWeight: "700",
  },
  stylingTipText: {
    ...type.caption,
    color: palette.muted,
    lineHeight: 18,
  },
});
