import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/src/components/screen";
import { useCatalogFeed } from "@/src/features/catalog/use-catalog-feed";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { hexForColorName } from "@/src/lib/color-name-hex";
import {
  motionDuration,
  motionEasing,
  useReducedMotion,
} from "@/src/lib/motion";
import type {
  RecommendationCard,
  StyleExperience,
} from "@/src/types/tonematch";
import { palette } from "@/src/theme/palette";
import { spacing, radius } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

const FILTER_CHIPS = [
  { id: "analysis", label: "Analysis Match" },
  { id: "near-face", label: "Near Face" },
  { id: "statement", label: "Statement" },
];

const OCCASION_IMAGES = [
  require("@/assets/images/discover_office.png"),
  require("@/assets/images/discover_datenight.png"),
  require("@/assets/images/discover_smartcasual.png"),
] as const;

const PRODUCT_IMAGES = [
  require("@/assets/images/discover_product1.png"),
  require("@/assets/images/discover_product2.png"),
] as const;

type FilterChipProps = {
  index: number;
  isActive: boolean;
  label: string;
  onPress: () => void;
  reducedMotion: boolean;
  revealProgress: Animated.Value;
};

type FavoriteToggleButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
  reducedMotion: boolean;
};

type OccasionCard = {
  id: string;
  title: string;
  subtitle: string;
  image: (typeof OCCASION_IMAGES)[number];
};

function includesQuery(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false;
}

function matchesSearch(item: RecommendationCard, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [
    item.title,
    item.category,
    item.reason,
    item.description,
    item.colorFamily,
    item.merchantName,
  ].some((value) => includesQuery(value, query));
}

function matchesChip(item: RecommendationCard, activeChip: string) {
  if (activeChip === "near-face") {
    return ["top", "outerwear", "shirt", "accessory"].some((token) =>
      item.category.toLowerCase().includes(token),
    );
  }

  if (activeChip === "statement") {
    return (
      item.score >= 0.88 ||
      item.category.toLowerCase().includes("occasion")
    );
  }

  return true;
}

function buildOccasions(
  profile: StyleExperience | null | undefined,
  items: RecommendationCard[],
): OccasionCard[] {
  const paletteLead =
    profile?.palette.core.slice(0, 2).join(" and ") ?? "your palette";
  const workCount = items.filter((item) =>
    ["outerwear", "top", "shirt"].some((token) =>
      item.category.toLowerCase().includes(token),
    ),
  ).length;
  const eveningCount = items.filter(
    (item) =>
      item.category.toLowerCase().includes("occasion") || item.score >= 0.88,
  ).length;
  const weekendCount = Math.max(items.length - workCount - eveningCount, 0);

  return [
    {
      id: "office",
      title: "Work Layering",
      subtitle: `${Math.max(workCount, 1)} picks built around ${paletteLead}`,
      image: OCCASION_IMAGES[0],
    },
    {
      id: "evening",
      title: "After Dark",
      subtitle: `${Math.max(
        eveningCount,
        1,
      )} deeper options for ${profile?.contrast ?? "your contrast"}`,
      image: OCCASION_IMAGES[1],
    },
    {
      id: "weekend",
      title: "Weekend Reset",
      subtitle: `${Math.max(
        weekendCount,
        1,
      )} softer combinations without leaving your palette`,
      image: OCCASION_IMAGES[2],
    },
  ];
}

function buildHeroCopy(
  profile: StyleExperience | null | undefined,
  topPick?: RecommendationCard,
) {
  if (!profile) {
    return "Run an analysis to unlock a feed that is anchored to your skin undertone, contrast, and saved palette.";
  }

  const coreColors = profile.palette.core.slice(0, 3).join(", ");
  const avoidColors = profile.palette.avoid.slice(0, 2).join(", ");

  if (!topPick) {
    return `${profile.summary.description} The feed will prioritize ${coreColors} and push ${avoidColors} away from near-face pieces.`;
  }

  return `${topPick.reason} Right now the feed is weighting ${coreColors} above the neck and downranking ${avoidColors} for your ${profile.undertone} x ${profile.contrast} result.`;
}

function buildBadgeCopy(item: RecommendationCard) {
  if (item.score >= 0.9) {
    return "Direct palette hit";
  }

  if (item.score >= 0.8) {
    return "Works with support tones";
  }

  return "Use as a secondary piece";
}

function heroGradient(profile: StyleExperience | null | undefined) {
  if (!profile || profile.palette.core.length === 0) {
    return [palette.swatch1, palette.swatch2, palette.swatch3] as const;
  }

  const dynamic = profile.palette.core
    .slice(0, 3)
    .map((color) => hexForColorName(color));
  while (dynamic.length < 3) {
    dynamic.push(palette.primary);
  }

  return dynamic as [string, string, string];
}

function buildRevealStyle(
  progress: Animated.Value,
  start: number,
  end: number,
  distance = 16,
  scaleFrom = 1,
) {
  const transforms: {
    translateY?: Animated.AnimatedInterpolation<number>;
    scale?: Animated.AnimatedInterpolation<number>;
  }[] = [
    {
      translateY: progress.interpolate({
        inputRange: [start, end],
        outputRange: [distance, 0],
        extrapolate: "clamp",
      }),
    },
  ];

  if (scaleFrom !== 1) {
    transforms.unshift({
      scale: progress.interpolate({
        inputRange: [start, end],
        outputRange: [scaleFrom, 1],
        extrapolate: "clamp",
      }),
    });
  }

  return {
    opacity: progress.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    transform: transforms,
  };
}

function FilterChip({
  index,
  isActive,
  label,
  onPress,
  reducedMotion,
  revealProgress,
}: FilterChipProps) {
  const activeProgress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      activeProgress.setValue(isActive ? 1 : 0);
      return;
    }

    Animated.timing(activeProgress, {
      toValue: isActive ? 1 : 0,
      duration: motionDuration(reducedMotion, 220),
      easing: motionEasing.settle,
      useNativeDriver: true,
    }).start();
  }, [activeProgress, isActive, reducedMotion]);

  const chipMotionStyle = reducedMotion
    ? undefined
    : {
        transform: [
          {
            scale: activeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.04],
            }),
          },
          {
            translateY: activeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2],
            }),
          },
        ],
      };
  const iconMotionStyle = reducedMotion
    ? undefined
    : {
        transform: [
          {
            translateY: activeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -1],
            }),
          },
        ],
        opacity: activeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.72, 1],
        }),
      };

  return (
    <Animated.View
      style={[
        buildRevealStyle(
          revealProgress,
          0.18 + index * 0.05,
          0.38 + index * 0.05,
          12,
          0.96,
        ),
        chipMotionStyle,
      ]}
    >
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => [
          styles.chip,
          isActive ? styles.chipActive : styles.chipDefault,
          pressed && styles.chipPressed,
        ]}
      >
        <Text
          style={[
            styles.chipLabel,
            isActive ? styles.chipLabelActive : styles.chipLabelDefault,
          ]}
        >
          {label}
        </Text>
        <Animated.View style={iconMotionStyle}>
          <MaterialIcons
            name="expand-more"
            size={16}
            color={isActive ? palette.surface : palette.charcoal}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function FavoriteToggleButton({
  active,
  label,
  onPress,
  reducedMotion,
}: FavoriteToggleButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      halo.setValue(0);
      return;
    }

    if (active) {
      scale.setValue(0.9);
      halo.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.16,
            duration: 140,
            easing: motionEasing.enter,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 180,
            easing: motionEasing.settle,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(halo, {
            toValue: 1,
            duration: 140,
            easing: motionEasing.enter,
            useNativeDriver: true,
          }),
          Animated.timing(halo, {
            toValue: 0,
            duration: 220,
            easing: motionEasing.settle,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 100,
        easing: motionEasing.settle,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        easing: motionEasing.settle,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, halo, reducedMotion, scale]);

  const haloStyle = reducedMotion
    ? undefined
    : {
        opacity: halo.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.28],
        }),
        transform: [
          {
            scale: halo.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.28],
            }),
          },
        ],
      };
  const buttonStyle = reducedMotion
    ? undefined
    : {
        transform: [{ scale }],
      };

  return (
    <Pressable
      accessibilityLabel={active ? `Remove ${label} from saved picks` : `Save ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.favoritePressable,
        pressed && styles.favoritePressed,
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.favoriteHalo, haloStyle]} />
      <Animated.View style={[styles.favoriteButton, buttonStyle]}>
        <MaterialIcons
          name={active ? "favorite" : "favorite-border"}
          size={18}
          color={active ? palette.primary : palette.charcoal}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeChip, setActiveChip] = useState("analysis");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const reducedMotion = useReducedMotion();
  const profileQuery = useStyleProfile();
  const catalogQuery = useCatalogFeed();

  const revealProgress = useRef(new Animated.Value(0)).current;
  const searchFocus = useRef(new Animated.Value(0)).current;

  const profile = profileQuery.data ?? null;
  const feed = catalogQuery.data ?? [];
  const filteredFeed = feed
    .filter((item) => matchesSearch(item, searchText))
    .filter((item) => matchesChip(item, activeChip));
  const visibleFeed = filteredFeed.length > 0 ? filteredFeed : feed;
  const topPick = visibleFeed[0];
  const occasions = buildOccasions(profile, feed);
  const contentWidth = width - spacing.lg * 2;
  const occasionCardWidth = Math.min(172, Math.max(148, contentWidth * 0.44));
  const productCardWidth = Math.max(
    128,
    Math.min(220, (contentWidth - spacing.md) / 2),
  );
  const gradientColors = heroGradient(profile);
  const badgeLabel = profile
    ? `${profile.undertone.toUpperCase()} / ${profile.contrast.toUpperCase()}`
    : "NO ANALYSIS";
  const isLoading = profileQuery.isLoading || catalogQuery.isLoading;
  const visibleProducts = visibleFeed.slice(0, 6);

  useEffect(() => {
    if (reducedMotion) {
      revealProgress.setValue(1);
      return;
    }

    revealProgress.setValue(0);
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: 820,
      easing: motionEasing.enter,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, revealProgress]);

  useEffect(() => {
    Animated.timing(searchFocus, {
      toValue: isSearchFocused || searchText.length > 0 ? 1 : 0,
      duration: motionDuration(reducedMotion, 240),
      easing: motionEasing.settle,
      useNativeDriver: true,
    }).start();
  }, [isSearchFocused, reducedMotion, searchFocus, searchText.length]);

  const animateFilterReveal = () => {
    if (reducedMotion) {
      revealProgress.setValue(1);
      return;
    }

    revealProgress.setValue(0.56);
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: 340,
      easing: motionEasing.settle,
      useNativeDriver: true,
    }).start();
  };

  const handleReset = () => {
    animateFilterReveal();
    setSearchText("");
    setActiveChip("analysis");
  };

  const handleChipPress = (chipId: string) => {
    if (chipId === activeChip) {
      return;
    }

    animateFilterReveal();
    setActiveChip(chipId);
  };

  const heroImageStyle = reducedMotion
    ? undefined
    : {
        transform: [
          {
            scale: revealProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1.08, 1],
              extrapolate: "clamp",
            }),
          },
        ],
      };
  const heroTintStyle = reducedMotion
    ? undefined
    : {
        opacity: revealProgress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 0.82, 1],
          extrapolate: "clamp",
        }),
      };
  const searchShellStyle = reducedMotion
    ? undefined
    : {
        transform: [
          {
            scale: searchFocus.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.01],
            }),
          },
        ],
      };
  const searchGlowStyle = reducedMotion
    ? undefined
    : {
        opacity: searchFocus.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            scale: searchFocus.interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1.02],
            }),
          },
        ],
      };

  const headerContent = (
    <View style={styles.headerContent}>
      <Animated.View style={buildRevealStyle(revealProgress, 0.02, 0.16, 10)}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Discover</Text>
          <Pressable
            accessibilityLabel="Reset discover filters"
            accessibilityRole="button"
            onPress={handleReset}
            style={({ pressed }: { pressed: boolean }) => [
              styles.tuneButton,
              pressed && styles.tuneButtonPressed,
            ]}
          >
            <MaterialIcons name="tune" size={22} color={palette.primary} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.searchShell,
          buildRevealStyle(revealProgress, 0.08, 0.24, 10),
          searchShellStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.searchGlow, searchGlowStyle]}
        />
        <View
          style={[
            styles.searchBar,
            (isSearchFocused || searchText.length > 0) && styles.searchBarActive,
          ]}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={
              isSearchFocused || searchText.length > 0
                ? palette.primary
                : palette.subtle
            }
            style={styles.searchIcon}
          />
          <TextInput
            accessibilityLabel="Search products or palette colors"
            style={styles.searchInput}
            placeholder="Search products or palette colors"
            placeholderTextColor={palette.muted}
            value={searchText}
            onBlur={() => setIsSearchFocused(false)}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
          />
        </View>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTER_CHIPS.map((chip, index) => (
          <FilterChip
            key={chip.id}
            index={index}
            isActive={chip.id === activeChip}
            label={chip.label}
            onPress={() => handleChipPress(chip.id)}
            reducedMotion={reducedMotion}
            revealProgress={revealProgress}
          />
        ))}
      </ScrollView>

      <Animated.View
        style={[
          styles.sectionHeader,
          buildRevealStyle(revealProgress, 0.24, 0.38, 12),
        ]}
      >
        <Text style={styles.sectionTitle}>Today For You</Text>
        <Text style={styles.sectionBadge}>{badgeLabel}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.heroCard,
          buildRevealStyle(revealProgress, 0.3, 0.5, 20, 0.98),
        ]}
      >
        <Animated.Image
          source={require("@/assets/images/discover_hero.png")}
          style={[styles.heroImagePlaceholder, heroImageStyle]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            "transparent",
            `${gradientColors[0]}99`,
            `${gradientColors[1]}CC`,
            palette.overlayHeavy,
          ]}
          style={styles.heroGradient}
        />
        <Animated.View style={[styles.heroTint, heroTintStyle]}>
          <LinearGradient
            colors={[
              `${gradientColors[0]}66`,
              `${gradientColors[1]}22`,
              `${gradientColors[2]}11`,
            ]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.heroOverlay,
            buildRevealStyle(revealProgress, 0.36, 0.58, 12),
          ]}
        >
          <Text style={styles.heroOverline}>LATEST ANALYSIS FEED</Text>
          <Text style={styles.heroTitle}>
            {topPick?.title ?? profile?.summary.title ?? "Your personalized feed"}
          </Text>
          <Text style={styles.heroCopy}>{buildHeroCopy(profile, topPick)}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.signalCard,
          buildRevealStyle(revealProgress, 0.44, 0.62, 14),
        ]}
      >
        <Text style={styles.signalLabel}>WHY THESE PIECES ARE HERE</Text>
        <Text style={styles.signalCopy}>
          {profile
            ? `${profile.summary.description} The explore feed is currently anchored to ${profile.palette.core.slice(0, 4).join(", ")} and actively flags ${profile.palette.avoid.slice(0, 3).join(", ")} as lower-priority near-face colors.`
            : "Your feed will become analysis-aware after the first match."}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sectionHeader,
          buildRevealStyle(revealProgress, 0.5, 0.68, 12),
        ]}
      >
        <Text style={styles.sectionTitle}>Occasions</Text>
        <Text style={styles.viewAllText}>Feed aligned</Text>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.occasionsList}
      >
        {occasions.map((item, index) => (
          <Animated.View
            key={item.id}
            style={buildRevealStyle(
              revealProgress,
              0.56 + index * 0.06,
              0.78 + index * 0.06,
              14,
              0.97,
            )}
          >
            <View style={[styles.occasionCard, { width: occasionCardWidth }]}>
              <Image
                source={item.image}
                style={[styles.occasionImage, { width: occasionCardWidth }]}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.occasionTitle}>{item.title}</Text>
                <Text style={styles.occasionSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View style={buildRevealStyle(revealProgress, 0.68, 0.82, 12)}>
        <Text style={styles.sectionTitle}>Analysis-Matched Picks</Text>
      </Animated.View>
    </View>
  );

  const emptyState = (
    <Animated.View
      style={[styles.emptyState, buildRevealStyle(revealProgress, 0.74, 0.9, 12)]}
    >
      <Text style={styles.emptyTitle}>
        {isLoading ? "Building your feed" : "No matches in this filter"}
      </Text>
      <Text style={styles.emptyCopy}>
        {isLoading
          ? "We are matching your last analysis to available pieces."
          : "Try another chip or clear the search to see pieces that fit your analysis."}
      </Text>
    </Animated.View>
  );

  return (
    <Screen contentContainerStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={isLoading ? [] : visibleProducts}
        keyExtractor={(item: RecommendationCard) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyState}
        ListFooterComponent={<View style={styles.listFooter} />}
        ListHeaderComponent={headerContent}
        numColumns={2}
        renderItem={({ item: product, index }: { item: RecommendationCard; index: number }) => {
          const isLiked = likedIds.includes(product.id);

          return (
            <View style={[styles.productCell, { width: productCardWidth }]}>
              <Animated.View
                style={[
                  styles.productCard,
                  buildRevealStyle(
                    revealProgress,
                    0.76 + index * 0.04,
                    0.96 + index * 0.04,
                    14,
                    0.98,
                  ),
                ]}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={[
                      "transparent",
                      `${hexForColorName(
                        product.colorFamily ??
                          profile?.palette.core[0] ??
                          "Petrol",
                      )}55`,
                    ]}
                    style={styles.productTint}
                  />
                  <FavoriteToggleButton
                    active={isLiked}
                    label={product.title}
                    onPress={() => {
                      setLikedIds((current) =>
                        current.includes(product.id)
                          ? current.filter((id) => id !== product.id)
                          : [...current, product.id],
                      );
                    }}
                    reducedMotion={reducedMotion}
                  />
                </View>
                <View style={styles.productInfo}>
                  <View style={styles.productBadgeRow}>
                    <MaterialIcons
                      name="verified"
                      size={14}
                      color={palette.primary}
                    />
                    <Text style={styles.productBadgeText}>
                      {buildBadgeCopy(product)}
                    </Text>
                  </View>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <Text style={styles.productReason} numberOfLines={3}>
                    {product.reason || product.description}
                  </Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </View>
              </Animated.View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        columnWrapperStyle={styles.productRow}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  headerContent: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
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
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tuneButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  searchShell: {
    position: "relative",
  },
  searchGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    backgroundColor: palette.primarySoft,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  searchBarActive: {
    borderColor: palette.focusRing,
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
    borderColor: palette.border,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipLabel: {
    ...type.label,
    fontSize: 13,
  },
  chipLabelActive: {
    color: palette.onPrimary,
  },
  chipLabelDefault: {
    color: palette.charcoal,
  },
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
    fontSize: 12,
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
  heroCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    aspectRatio: 4 / 5,
    position: "relative",
    backgroundColor: palette.swatch1,
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTint: {
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
    fontSize: 12,
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
    color: palette.onDarkMuted,
    lineHeight: 22,
  },
  signalCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  signalLabel: {
    ...type.overline,
    color: palette.primary,
  },
  signalCopy: {
    ...type.body,
    color: palette.charcoal,
  },
  occasionsList: {
    gap: spacing.md,
  },
  occasionCard: {
    gap: spacing.sm,
  },
  occasionImage: {
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
  },
  occasionTitle: {
    ...type.label,
    color: palette.charcoal,
    fontWeight: "700",
  },
  occasionSubtitle: {
    ...type.caption,
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  productRow: {
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  productCell: {
    maxWidth: "48%",
  },
  productCard: {
    gap: spacing.sm,
  },
  productImageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.borderLight,
    position: "relative",
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
  },
  productTint: {
    ...StyleSheet.absoluteFillObject,
  },
  favoritePressable: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  favoritePressed: {
    transform: [{ scale: 0.94 }],
  },
  favoriteHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: palette.primaryHalo,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.surfaceTintStrong,
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
    fontSize: 12,
    color: palette.primary,
    fontWeight: "700",
  },
  productTitle: {
    ...type.label,
    fontSize: 13,
    color: palette.charcoal,
    fontWeight: "600",
  },
  productReason: {
    ...type.caption,
    color: palette.muted,
  },
  productPrice: {
    ...type.body,
    fontSize: 13,
    color: palette.charcoal,
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
  listFooter: {
    height: spacing.xl,
  },
});
