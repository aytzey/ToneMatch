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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Tone = {
  label: string;
  id: string;
};

const tones: Tone[] = [
  { label: "Deep Autumn", id: "deep-autumn" },
  { label: "Cool Winter", id: "cool-winter" },
  { label: "Warm Spring", id: "warm-spring" },
  { label: "Light Summer", id: "light-summer" },
];

type GiftCard = {
  id: string;
  title: string;
  price: string;
  tone: string;
  imageBg: string;
  image: ImageSourcePropType;
  quote: string;
  borderAccent: string;
};

const giftCards: GiftCard[] = [
  {
    id: "silk-gold",
    title: "The Silk & Gold Set",
    price: "$245.00",
    tone: "Deep Autumn",
    imageBg: "#c9a882",
    image: require("@/assets/images/gift_silk_gold.png"),
    quote:
      "Warm metallics and silk textures mirror the richness of Deep Autumn's natural warmth, creating an effortlessly luxurious impression.",
    borderAccent: palette.primary,
  },
  {
    id: "cashmere-silver",
    title: "The Cashmere & Silver Set",
    price: "$380.00",
    tone: "Cool Winter",
    imageBg: "#8d8d8d",
    image: require("@/assets/images/gift_cashmere_silver.png"),
    quote:
      "Cool-toned silvers and plush cashmere reflect Cool Winter's clarity and depth, offering understated sophistication.",
    borderAccent: palette.clay,
  },
];

/* ------------------------------------------------------------------ */
/*  Gift Guide Screen                                                  */
/* ------------------------------------------------------------------ */

export default function GiftGuideScreen() {
  const router = useRouter();
  const [selectedTone, setSelectedTone] = useState("deep-autumn");

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => router.back()}>
          <MaterialIcons name="menu" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>TONEMATCH</Text>
        <Pressable style={styles.headerIcon}>
          <MaterialIcons
            name="shopping-bag"
            size={24}
            color={palette.ink}
          />
        </Pressable>
      </View>

      {/* ---- Hero Section ---- */}
      <View style={styles.heroContainer}>
        <Image source={require("@/assets/images/gift_hero.png")} style={styles.heroPlaceholder} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.80)"]}
          locations={[0.3, 0.7, 1]}
          style={styles.heroGradient}
        />
        <View style={styles.heroTextOverlay}>
          <Text style={styles.heroTitleLight}>
            The Art of{" "}
            <Text style={styles.heroTitleBold}>Giving</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Choose gifts that harmonize with their natural palette and elevate
            their everyday elegance.
          </Text>
        </View>
      </View>

      {/* ---- Tone Selection ---- */}
      <View style={styles.toneSection}>
        <View style={styles.toneSectionHeader}>
          <Text style={styles.toneSectionLabel}>Shop by Tone</Text>
          <Pressable>
            <Text style={styles.toneViewAll}>View All Palette Types</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toneChipRow}
        >
          {tones.map((tone) => {
            const isSelected = tone.id === selectedTone;
            return (
              <Pressable
                key={tone.id}
                style={[
                  styles.toneChip,
                  isSelected ? styles.toneChipSelected : styles.toneChipDefault,
                ]}
                onPress={() => setSelectedTone(tone.id)}
              >
                <Text
                  style={[
                    styles.toneChipText,
                    isSelected
                      ? styles.toneChipTextSelected
                      : styles.toneChipTextDefault,
                  ]}
                >
                  {tone.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ---- Gift Cards ---- */}
      <View style={styles.cardList}>
        {giftCards.map((card) => (
          <View key={card.id} style={styles.card}>
            {/* Image area */}
            <View style={styles.cardImageContainer}>
              <Image
                source={card.image}
                style={[
                  styles.cardImagePlaceholder,
                  { backgroundColor: card.imageBg },
                ]}
                resizeMode="cover"
              />
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>
                  Recommended for {card.tone}
                </Text>
              </View>
            </View>

            {/* Card info */}
            <View style={styles.cardInfo}>
              <View style={styles.cardInfoRow}>
                <View style={styles.cardInfoText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardPrice}>{card.price}</Text>
                </View>
                <Pressable style={styles.heartButton}>
                  <MaterialIcons
                    name="favorite-border"
                    size={22}
                    color={palette.muted}
                  />
                </Pressable>
              </View>

              {/* Why it works */}
              <View
                style={[
                  styles.whyBox,
                  { borderLeftColor: card.borderAccent },
                ]}
              >
                <Text style={styles.whyLabel}>Why it works</Text>
                <Text style={styles.whyQuote}>{card.quote}</Text>
              </View>
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
    paddingBottom: 120,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 4,
    textTransform: "uppercase",
    color: palette.ink,
    textAlign: "center",
    flex: 1,
  },

  /* Hero */
  heroContainer: {
    minHeight: 320,
    position: "relative",
    overflow: "hidden",
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#a67c52",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTitleLight: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "300",
    color: "#ffffff",
  },
  heroTitleBold: {
    fontWeight: "700",
    fontStyle: "italic",
  },
  heroDescription: {
    ...type.body,
    color: "rgba(255,255,255,0.90)",
    lineHeight: 22,
  },

  /* Tone Selection */
  toneSection: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  toneSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  toneSectionLabel: {
    ...type.h3,
    color: palette.ink,
  },
  toneViewAll: {
    ...type.caption,
    color: palette.primary,
  },
  toneChipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toneChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  toneChipSelected: {
    backgroundColor: palette.primary,
  },
  toneChipDefault: {
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  toneChipText: {
    ...type.label,
    fontSize: 13,
  },
  toneChipTextSelected: {
    color: "#ffffff",
  },
  toneChipTextDefault: {
    color: palette.charcoal,
  },

  /* Card list */
  cardList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },

  /* Individual card */
  card: {
    gap: spacing.md,
  },
  cardImageContainer: {
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  cardImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: "rgba(255,255,255,0.90)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  cardBadgeText: {
    ...type.caption,
    fontSize: 11,
    color: palette.charcoal,
  },

  /* Card info */
  cardInfo: {
    gap: spacing.md,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardInfoText: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...type.h3,
    color: palette.ink,
  },
  cardPrice: {
    ...type.label,
    color: palette.primary,
  },
  heartButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Why it works box */
  whyBox: {
    backgroundColor: palette.primaryMuted,
    borderLeftWidth: 4,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  whyLabel: {
    ...type.caption,
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  whyQuote: {
    ...type.body,
    fontSize: 14,
    fontStyle: "italic",
    color: palette.charcoal,
    lineHeight: 20,
  },
});
