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
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Season detection                                                    */
/* ------------------------------------------------------------------ */

type SeasonKey = "deep_autumn" | "cool_winter" | "warm_spring" | "cool_summer";

function detectSeason(undertone?: string, contrast?: string): SeasonKey {
  const u = (undertone ?? "").toLowerCase();
  const c = (contrast ?? "").toLowerCase();

  const isWarm =
    u.includes("warm") || u.includes("golden") || u.includes("autumn");
  const isCool =
    u.includes("cool") || u.includes("rose") || u.includes("winter");
  const isDeep = c.includes("deep") || c.includes("high");
  const isLight = c.includes("light") || c.includes("low");

  if (isWarm && isDeep) return "deep_autumn";
  if (isCool && isDeep) return "cool_winter";
  if (isWarm && !isDeep) return "warm_spring";
  if (isCool && !isDeep) return "cool_summer";

  // Olive leans autumn
  if (u.includes("olive")) return isDeep ? "deep_autumn" : "warm_spring";

  // Neutral: decide by contrast
  if (isDeep) return "deep_autumn";
  if (isLight) return "cool_summer";

  return "deep_autumn"; // fallback
}

/* ------------------------------------------------------------------ */
/*  Data types                                                          */
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

type SeasonData = {
  label: string;
  description: string;
  accentColor: string;
  occasions: OccasionSection[];
};

/* ------------------------------------------------------------------ */
/*  Season-specific content                                             */
/* ------------------------------------------------------------------ */

const SEASONS: Record<SeasonKey, SeasonData> = {
  /* ---- DEEP AUTUMN ---- */
  deep_autumn: {
    label: "DEEP AUTUMN",
    description:
      "Curated silhouettes and palettes specifically chosen to harmonize with your rich, warm, and deep undertones.",
    accentColor: "#b87332",
    occasions: [
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
    ],
  },

  /* ---- COOL WINTER ---- */
  cool_winter: {
    label: "COOL WINTER",
    description:
      "Bold, high-contrast pieces that complement your cool undertones and dramatic natural colouring.",
    accentColor: "#1B3A5C",
    occasions: [
      {
        id: "office",
        title: "Executive Edge",
        subtitle: "Sharp Contrasts",
        heroBg: "#1B2A49",
        heroImage: require("@/assets/images/seasons/winter_office_hero.jpg"),
        eyebrow: "Power Dressing",
        heroTitle: "Navy & Black Authority",
        products: [
          {
            id: "blazer",
            title: "Ink Navy Blazer",
            price: "$310",
            imageBg: "#1B3A5C",
            image: require("@/assets/images/seasons/winter_product1.jpg"),
          },
          {
            id: "trousers",
            title: "True Black Trousers",
            price: "$195",
            imageBg: "#1a1a1a",
            image: require("@/assets/images/seasons/winter_product2.jpg"),
          },
          {
            id: "accessories",
            title: "Silver Chain Belt",
            price: "$85",
            imageBg: "#8C92AC",
            image: require("@/assets/images/seasons/winter_product2.jpg"),
          },
        ],
        quote:
          "Clean lines in navy and black create striking contrast that mirrors your natural high-contrast colouring, commanding attention without effort.",
      },
      {
        id: "date",
        title: "Crimson Night",
        subtitle: "Statement Silks",
        heroBg: "#5C1A2A",
        heroImage: require("@/assets/images/seasons/winter_date_hero.jpg"),
        eyebrow: "Evening Drama",
        heroTitle: "Berry Silk & Silver",
        products: [
          {
            id: "dress",
            title: "Wine Silk Dress",
            price: "$280",
            imageBg: "#722F37",
            image: require("@/assets/images/seasons/winter_date_hero.jpg"),
          },
          {
            id: "jewelry",
            title: "Platinum Earrings",
            price: "$165",
            imageBg: "#C0C0C0",
            image: require("@/assets/images/seasons/winter_product1.jpg"),
          },
          {
            id: "heels",
            title: "Black Patent Heels",
            price: "$195",
            imageBg: "#1a1a1a",
            image: require("@/assets/images/seasons/winter_product2.jpg"),
          },
        ],
        quote:
          "Deep berry against your cool skin creates electric contrast, while platinum accessories amplify the icy clarity of your Winter palette.",
      },
      {
        id: "weekend",
        title: "Nordic Casual",
        subtitle: "Cool Textures",
        heroBg: "#4A5568",
        heroImage: require("@/assets/images/seasons/winter_weekend_hero.jpg"),
        eyebrow: "Off-Duty Cool",
        heroTitle: "Charcoal & Pure White",
        products: [
          {
            id: "knit",
            title: "Charcoal Cashmere",
            price: "$185",
            imageBg: "#36454F",
            image: require("@/assets/images/seasons/winter_weekend_hero.jpg"),
          },
          {
            id: "denim",
            title: "Dark Indigo Denim",
            price: "$165",
            imageBg: "#1B2838",
            image: require("@/assets/images/seasons/winter_product2.jpg"),
          },
          {
            id: "boots",
            title: "Black Leather Boots",
            price: "$275",
            imageBg: "#1a1a1a",
            image: require("@/assets/images/seasons/winter_product1.jpg"),
          },
        ],
        quote:
          "Charcoal cashmere and dark denim honour your cool undertones while keeping the weekend look effortlessly polished.",
      },
    ],
  },

  /* ---- WARM SPRING ---- */
  warm_spring: {
    label: "WARM SPRING",
    description:
      "Fresh, bright hues that echo the warmth and clarity in your complexion for a naturally radiant look.",
    accentColor: "#E07A5F",
    occasions: [
      {
        id: "office",
        title: "Fresh Authority",
        subtitle: "Warm Brights",
        heroBg: "#E8B4B8",
        heroImage: require("@/assets/images/seasons/spring_office_hero.jpg"),
        eyebrow: "Polished & Warm",
        heroTitle: "Blush Pink Power",
        products: [
          {
            id: "blazer",
            title: "Coral Pink Blazer",
            price: "$265",
            imageBg: "#E8829B",
            image: require("@/assets/images/seasons/spring_office_hero.jpg"),
          },
          {
            id: "trousers",
            title: "Cream Wide-Legs",
            price: "$155",
            imageBg: "#F5E6CC",
            image: require("@/assets/images/seasons/spring_product1.jpg"),
          },
          {
            id: "shoes",
            title: "Camel Loafers",
            price: "$175",
            imageBg: "#C19A6B",
            image: require("@/assets/images/seasons/spring_product1.jpg"),
          },
        ],
        quote:
          "A warm pink blazer channels quiet confidence while cream separates keep your Spring palette looking fresh and put-together.",
      },
      {
        id: "date",
        title: "Sunset Romance",
        subtitle: "Warm Florals",
        heroBg: "#E07A5F",
        heroImage: require("@/assets/images/seasons/spring_date_hero.jpg"),
        eyebrow: "Golden Hour",
        heroTitle: "Peach & Coral Glow",
        products: [
          {
            id: "dress",
            title: "Peach Midi Dress",
            price: "$220",
            imageBg: "#FFCBA4",
            image: require("@/assets/images/seasons/spring_date_hero.jpg"),
          },
          {
            id: "jewelry",
            title: "Rose Gold Hoops",
            price: "$95",
            imageBg: "#DAA520",
            image: require("@/assets/images/seasons/spring_product2.jpg"),
          },
          {
            id: "heels",
            title: "Nude Strappy Heels",
            price: "$145",
            imageBg: "#D2B48C",
            image: require("@/assets/images/seasons/spring_product1.jpg"),
          },
        ],
        quote:
          "Peach and coral mirror the warm glow in your skin, creating an effortlessly romantic look that feels like a permanent golden hour.",
      },
      {
        id: "weekend",
        title: "Garden Stroll",
        subtitle: "Soft Earth Tones",
        heroBg: "#87A96B",
        heroImage: require("@/assets/images/seasons/spring_weekend_hero.jpg"),
        eyebrow: "Easy Elegance",
        heroTitle: "Sage & Cream Layers",
        products: [
          {
            id: "knit",
            title: "Sage Linen Blouse",
            price: "$98",
            imageBg: "#87A96B",
            image: require("@/assets/images/seasons/spring_weekend_hero.jpg"),
          },
          {
            id: "denim",
            title: "Light Wash Denim",
            price: "$130",
            imageBg: "#B0C4DE",
            image: require("@/assets/images/seasons/spring_product1.jpg"),
          },
          {
            id: "shoes",
            title: "Tan Ankle Boots",
            price: "$195",
            imageBg: "#C19A6B",
            image: require("@/assets/images/seasons/spring_product2.jpg"),
          },
        ],
        quote:
          "Sage green and cream honour your warm undertones with a relaxed, natural palette that feels effortlessly chic.",
      },
    ],
  },

  /* ---- COOL SUMMER ---- */
  cool_summer: {
    label: "COOL SUMMER",
    description:
      "Soft, muted tones that enhance your gentle colouring without overpowering your naturally harmonious features.",
    accentColor: "#8C92AC",
    occasions: [
      {
        id: "office",
        title: "Quiet Confidence",
        subtitle: "Muted Elegance",
        heroBg: "#D5D0C8",
        heroImage: require("@/assets/images/seasons/summer_office_hero.jpg"),
        eyebrow: "Understated Power",
        heroTitle: "Soft Neutrals & Cream",
        products: [
          {
            id: "blazer",
            title: "Powder Grey Blazer",
            price: "$275",
            imageBg: "#B2BEB5",
            image: require("@/assets/images/seasons/summer_office_hero.jpg"),
          },
          {
            id: "trousers",
            title: "Dove Grey Trousers",
            price: "$165",
            imageBg: "#A0968E",
            image: require("@/assets/images/seasons/summer_product1.jpg"),
          },
          {
            id: "shoes",
            title: "Taupe Pumps",
            price: "$185",
            imageBg: "#8E8279",
            image: require("@/assets/images/seasons/summer_product1.jpg"),
          },
        ],
        quote:
          "Soft greys and muted creams let your natural colouring shine through, creating an effortlessly polished office look.",
      },
      {
        id: "date",
        title: "Lavender Dusk",
        subtitle: "Ethereal Softness",
        heroBg: "#B4A7D6",
        heroImage: require("@/assets/images/seasons/summer_date_hero.jpg"),
        eyebrow: "Dreamy Evening",
        heroTitle: "Dusty Blue & Silver",
        products: [
          {
            id: "dress",
            title: "Dusty Blue Dress",
            price: "$235",
            imageBg: "#6B9AC4",
            image: require("@/assets/images/seasons/summer_date_hero.jpg"),
          },
          {
            id: "jewelry",
            title: "Silver Drop Earrings",
            price: "$88",
            imageBg: "#C0C0C0",
            image: require("@/assets/images/seasons/summer_product2.jpg"),
          },
          {
            id: "heels",
            title: "Mauve Satin Heels",
            price: "$155",
            imageBg: "#C87F89",
            image: require("@/assets/images/seasons/summer_product2.jpg"),
          },
        ],
        quote:
          "Dusty blue and lavender tones echo the cool softness of your skin, creating an ethereal look that feels naturally beautiful.",
      },
      {
        id: "weekend",
        title: "Soft Saturday",
        subtitle: "Pastel Comfort",
        heroBg: "#CCCCFF",
        heroImage: require("@/assets/images/seasons/summer_weekend_hero.jpg"),
        eyebrow: "Relaxed Grace",
        heroTitle: "Powder & Periwinkle",
        products: [
          {
            id: "knit",
            title: "Powder Blue Knit",
            price: "$105",
            imageBg: "#B0E0E6",
            image: require("@/assets/images/seasons/summer_weekend_hero.jpg"),
          },
          {
            id: "denim",
            title: "Light Wash Denim",
            price: "$140",
            imageBg: "#89CFF0",
            image: require("@/assets/images/seasons/summer_product1.jpg"),
          },
          {
            id: "shoes",
            title: "Grey Suede Sneakers",
            price: "$165",
            imageBg: "#A0968E",
            image: require("@/assets/images/seasons/summer_product1.jpg"),
          },
        ],
        quote:
          "Soft pastels and muted blues honour your cool Summer palette, creating weekend ease that looks effortlessly put-together.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Occasion Guide Screen                                              */
/* ------------------------------------------------------------------ */

export default function OccasionGuideScreen() {
  const router = useRouter();
  const { data } = useStyleProfile();

  const seasonKey = detectSeason(data?.undertone, data?.contrast);
  const season = SEASONS[seasonKey];

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
        <Text
          style={[styles.overline, { color: season.accentColor }]}
        >
          SEASON: {season.label}
        </Text>
        <Text style={styles.heroTitle}>The Occasion Guide</Text>
        <Text style={styles.heroDescription}>{season.description}</Text>
      </View>

      {/* ---- Occasion Sections ---- */}
      {season.occasions.map((section) => (
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
          <View
            style={[
              styles.whyBox,
              { borderLeftColor: season.accentColor },
            ]}
          >
            <View style={styles.whyHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={16}
                color={season.accentColor}
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
