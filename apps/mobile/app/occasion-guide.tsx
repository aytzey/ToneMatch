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

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Product = {
  id: string;
  title: string;
  price: string;
  imageBg: string;
  image: ImageSourcePropType;
};

type OccasionSection = {
  id: string;
  title: string;
  subtitle: string;
  heroBg: string;
  heroImage: ImageSourcePropType;
  eyebrow: string;
  heroTitle: string;
  products: Product[];
  quote: string;
};

const occasions: OccasionSection[] = [
  {
    id: "office",
    title: "Office Power",
    subtitle: "Commanding Neutrals",
    heroBg: "#2e3b23",
    heroImage: require("@/assets/images/occasion_office_hero.png"),
    eyebrow: "Featured Ensemble",
    heroTitle: "The Structured Authority",
    products: [
      {
        id: "blazer",
        title: "Forest Green Blazer",
        price: "$295",
        imageBg: "#3a4a2e",
        image: require("@/assets/images/occasion_office_product1.png"),
      },
      {
        id: "trousers",
        title: "Charcoal Trousers",
        price: "$180",
        imageBg: "#4a4a4a",
        image: require("@/assets/images/occasion_office_product2.png"),
      },
      {
        id: "pumps",
        title: "Mahogany Pumps",
        price: "$210",
        imageBg: "#6b3a2a",
        image: require("@/assets/images/occasion_office_product2.png"),
      },
    ],
    quote:
      "Deep greens and structured silhouettes channel authority while honouring the earthy warmth of your Deep Autumn palette.",
  },
  {
    id: "date",
    title: "Golden Hour Date",
    subtitle: "Luminous Silks",
    heroBg: "#b87332",
    heroImage: require("@/assets/images/occasion_date_hero.png"),
    eyebrow: "Evening Glow",
    heroTitle: "Copper Silk Radiance",
    products: [
      {
        id: "slip-dress",
        title: "Silk Slip Dress",
        price: "$240",
        imageBg: "#c9956a",
        image: require("@/assets/images/occasion_date_product1.png"),
      },
      {
        id: "gold-acc",
        title: "Gold Accessories",
        price: "$125",
        imageBg: "#d4a84b",
        image: require("@/assets/images/occasion_date_product2.png"),
      },
      {
        id: "heels",
        title: "Terracotta Heels",
        price: "$160",
        imageBg: "#b5644a",
        image: require("@/assets/images/occasion_date_product2.png"),
      },
    ],
    quote:
      "Copper and gold catch the light at golden hour, amplifying the natural warmth in your skin and creating an unforgettable glow.",
  },
  {
    id: "weekend",
    title: "Weekend Ease",
    subtitle: "Earthbound Textures",
    heroBg: "#c9a227",
    heroImage: require("@/assets/images/occasion_weekend_hero.png"),
    eyebrow: "Casual Luxe",
    heroTitle: "Mustard & Tobacco",
    products: [
      {
        id: "knit",
        title: "Mustard Knit",
        price: "$110",
        imageBg: "#c9a227",
        image: require("@/assets/images/occasion_weekend_product1.png"),
      },
      {
        id: "denim",
        title: "Warm Denim",
        price: "$145",
        imageBg: "#7a6a52",
        image: require("@/assets/images/occasion_weekend_product2.png"),
      },
      {
        id: "boots",
        title: "Tobacco Boots",
        price: "$225",
        imageBg: "#6b4226",
        image: require("@/assets/images/occasion_weekend_product2.png"),
      },
    ],
    quote:
      "Relaxed textures in mustard and tobacco create an effortless weekend look that stays perfectly in harmony with your warm undertones.",
  },
];

/* ------------------------------------------------------------------ */
/*  Occasion Guide Screen                                              */
/* ------------------------------------------------------------------ */

export default function OccasionGuideScreen() {
  const router = useRouter();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>ToneMatch Editorial</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIcon}>
            <MaterialIcons
              name="bookmark-border"
              size={24}
              color={palette.ink}
            />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <MaterialIcons name="share" size={22} color={palette.ink} />
          </Pressable>
        </View>
      </View>

      {/* ---- Title Section ---- */}
      <View style={styles.titleSection}>
        <Text style={styles.overline}>SEASON: DEEP AUTUMN</Text>
        <Text style={styles.heroTitle}>The Occasion Guide</Text>
        <Text style={styles.heroDescription}>
          Curated silhouettes and palettes specifically chosen to harmonize with
          your rich, warm, and dark undertones.
        </Text>
      </View>

      {/* ---- Occasion Sections ---- */}
      {occasions.map((section) => (
        <View key={section.id} style={styles.occasionSection}>
          {/* Section heading */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>

          {/* Hero look */}
          <View style={styles.heroLookContainer}>
            <Image
              source={section.heroImage}
              style={[
                styles.heroLookPlaceholder,
                { backgroundColor: section.heroBg },
              ]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                "transparent",
                "rgba(0,0,0,0.45)",
                "rgba(0,0,0,0.75)",
              ]}
              locations={[0.35, 0.65, 1]}
              style={styles.heroLookGradient}
            />
            <View style={styles.heroLookOverlay}>
              <Text style={styles.heroLookEyebrow}>{section.eyebrow}</Text>
              <Text style={styles.heroLookTitle}>{section.heroTitle}</Text>
              <View style={styles.shopLookButton}>
                <PrimaryButton label="Shop Look" onPress={() => {}} />
              </View>
            </View>
          </View>

          {/* Product scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {section.products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={product.image}
                  style={[
                    styles.productImage,
                    { backgroundColor: product.imageBg },
                  ]}
                  resizeMode="cover"
                />
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Why it works */}
          <View style={styles.whyBox}>
            <View style={styles.whyHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={16}
                color={palette.primary}
              />
              <Text style={styles.whyLabel}>Why it works</Text>
            </View>
            <Text style={styles.whyQuote}>{section.quote}</Text>
          </View>
        </View>
      ))}
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
    ...type.h2,
    fontStyle: "italic",
    color: palette.ink,
    textAlign: "center",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  /* Title section */
  titleSection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  overline: {
    ...type.overline,
    color: palette.primary,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroDescription: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },

  /* Occasion section */
  occasionSection: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionHeading: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...type.h2,
    color: palette.ink,
  },
  sectionSubtitle: {
    ...type.caption,
    color: palette.muted,
    fontStyle: "italic",
  },

  /* Hero look */
  heroLookContainer: {
    marginHorizontal: spacing.md,
    aspectRatio: 4 / 5,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  heroLookPlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  heroLookGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroLookOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroLookEyebrow: {
    ...type.overline,
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 2.5,
  },
  heroLookTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  shopLookButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },

  /* Product scroll */
  productScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  productCard: {
    width: 160,
    gap: spacing.xs,
  },
  productImage: {
    width: 160,
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
  },
  productTitle: {
    ...type.label,
    fontSize: 13,
    color: palette.ink,
    marginTop: spacing.xs,
  },
  productPrice: {
    ...type.caption,
    color: palette.primary,
  },

  /* Why it works box */
  whyBox: {
    marginHorizontal: spacing.md,
    backgroundColor: palette.primaryMuted,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
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
