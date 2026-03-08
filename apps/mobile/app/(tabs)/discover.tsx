import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/use-auth";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Placeholder data                                                   */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS = [
  { id: "color-family", label: "Color Family", selected: true },
  { id: "category", label: "Category", selected: false },
  { id: "budget", label: "Budget", selected: false },
];

const OCCASIONS = [
  {
    id: "office",
    title: "The Office",
    subtitle: "12 Styles found",
    image: require("@/assets/images/discover_office.png"),
  },
  {
    id: "date-night",
    title: "Date Night",
    subtitle: "8 Styles found",
    image: require("@/assets/images/discover_datenight.png"),
  },
  {
    id: "smart-casual",
    title: "Smart Casual",
    subtitle: "24 Styles found",
    image: require("@/assets/images/discover_smartcasual.png"),
  },
];

const TRENDING_PICKS = [
  {
    id: "1",
    title: "Wool Blend Overcoat",
    price: "$289.00",
    badge: "Matches your undertone",
    image: require("@/assets/images/discover_product1.png"),
  },
  {
    id: "2",
    title: "Silk Essential Shirt",
    price: "$145.00",
    badge: "Perfect for Autumns",
    image: require("@/assets/images/discover_product2.png"),
  },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function DiscoverScreen() {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [activeChip, setActiveChip] = useState("color-family");

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---------- Header ---------- */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Discover</Text>
        <Pressable style={styles.tuneButton}>
          <MaterialIcons name="tune" size={22} color={palette.primary} />
        </Pressable>
      </View>

      {/* ---------- Search Bar ---------- */}
      <View style={styles.searchBar}>
        <MaterialIcons
          name="search"
          size={20}
          color="rgba(184,115,50,0.60)"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or styles"
          placeholderTextColor={palette.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* ---------- Filter Chips ---------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = chip.id === activeChip;
          return (
            <Pressable
              key={chip.id}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipDefault]}
              onPress={() => setActiveChip(chip.id)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  isActive ? styles.chipLabelActive : styles.chipLabelDefault,
                ]}
              >
                {chip.label}
              </Text>
              <MaterialIcons
                name="expand-more"
                size={16}
                color={isActive ? palette.surface : palette.charcoal}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ---------- Today For You / Hero Card ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today For You</Text>
        <Text style={styles.sectionBadge}>DEEP AUTUMN</Text>
      </View>

      <View style={styles.heroCard}>
        <Image source={require("@/assets/images/discover_hero.png")} style={styles.heroImagePlaceholder} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(45,41,38,0.80)"]}
          style={styles.heroGradient}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroOverline}>LOOK OF THE DAY</Text>
          <Text style={styles.heroTitle}>The Copper Hour</Text>
          <Text style={styles.heroCopy}>
            Curated textures in burnt sienna and espresso to complement your
            rich undertones.
          </Text>
        </View>
      </View>

      {/* ---------- Occasions ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Occasions</Text>
        <Text style={styles.viewAllText}>View All</Text>
      </View>

      <FlatList
        data={OCCASIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.occasionsList}
        renderItem={({ item }) => (
          <View style={styles.occasionCard}>
            <Image
              source={item.image}
              style={styles.occasionImage}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.occasionTitle}>{item.title}</Text>
              <Text style={styles.occasionSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* ---------- Trending Picks ---------- */}
      <Text style={styles.sectionTitle}>Trending Picks</Text>

      <View style={styles.trendingGrid}>
        {TRENDING_PICKS.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productImageContainer}>
              <Image
                source={product.image}
                style={styles.productImage}
                resizeMode="cover"
              />
              <Pressable style={styles.favoriteButton}>
                <MaterialIcons
                  name="favorite"
                  size={18}
                  color={palette.charcoal}
                />
              </Pressable>
            </View>
            <View style={styles.productInfo}>
              <View style={styles.productBadgeRow}>
                <MaterialIcons
                  name="verified"
                  size={14}
                  color={palette.primary}
                />
                <Text style={styles.productBadgeText}>{product.badge}</Text>
              </View>
              <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...type.hero,
    color: palette.charcoal,
    fontStyle: "italic",
  },
  tuneButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.20)",
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.10)",
    paddingHorizontal: spacing.md,
    height: 52,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    fontSize: 14,
    color: palette.charcoal,
    padding: 0,
  },

  /* Filter chips */
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: palette.primary,
  },
  chipDefault: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.20)",
  },
  chipLabel: {
    ...type.label,
    fontSize: 13,
  },
  chipLabelActive: {
    color: palette.surface,
  },
  chipLabelDefault: {
    color: palette.charcoal,
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionTitle: {
    ...type.h2,
    color: palette.charcoal,
  },
  sectionBadge: {
    ...type.overline,
    fontSize: 10,
    color: palette.primary,
    fontWeight: "700",
    letterSpacing: 2,
  },
  viewAllText: {
    ...type.label,
    fontSize: 13,
    color: palette.primary,
    fontWeight: "600",
  },

  /* Hero card */
  heroCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    aspectRatio: 4 / 5,
    position: "relative",
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.swatch1,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroOverline: {
    ...type.overline,
    fontSize: 10,
    color: palette.primary,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: palette.surface,
    fontFamily: "Manrope_700Bold",
  },
  heroCopy: {
    ...type.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.80)",
    lineHeight: 22,
  },

  /* Occasions */
  occasionsList: {
    gap: spacing.md,
  },
  occasionCard: {
    width: 160,
    gap: spacing.sm,
  },
  occasionImage: {
    width: 160,
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.10)",
  },
  occasionTitle: {
    ...type.label,
    color: palette.charcoal,
    fontWeight: "700",
  },
  occasionSubtitle: {
    ...type.caption,
    fontSize: 11,
    color: palette.muted,
    marginTop: 2,
  },

  /* Trending picks */
  trendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  productCard: {
    width: "47%",
    gap: spacing.sm,
  },
  productImageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(184,115,50,0.05)",
    position: "relative",
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
  },
  favoriteButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    paddingHorizontal: 4,
    gap: 4,
  },
  productBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productBadgeText: {
    ...type.caption,
    fontSize: 11,
    color: palette.primary,
    fontWeight: "700",
  },
  productTitle: {
    ...type.label,
    fontSize: 13,
    color: palette.charcoal,
    fontWeight: "600",
  },
  productPrice: {
    ...type.body,
    fontSize: 13,
    color: palette.muted,
  },
});
