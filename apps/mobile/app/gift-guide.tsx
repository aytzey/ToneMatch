import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { GuideHeader, MetaPill } from "@/src/components/editorial-guide-primitives";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useCatalogFeed } from "@/src/features/catalog/use-catalog-feed";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { hexForColorName } from "@/src/lib/color-name-hex";
import { buildEditorialStory } from "@/src/lib/style-story";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

type GiftCard = {
  id: string;
  title: string;
  price: string;
  tone: string;
  imageBg: string;
  image: number;
  note: string;
  accent: string;
};

const GIFT_IMAGES = [
  require("@/assets/images/gift_hero.png"),
  require("@/assets/images/gift_silk_gold.png"),
  require("@/assets/images/gift_cashmere_silver.png"),
] as const;

export default function GiftGuideScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { data: profile } = useStyleProfile();
  const { data: feed } = useCatalogFeed();
  const story = buildEditorialStory(profile);
  const [selectedTone, setSelectedTone] = useState("analysis-match");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const tones = [
    { id: "analysis-match", label: story.seasonTitle },
    { id: "near-face", label: "Near face" },
    { id: "evening", label: "Evening gifts" },
  ];

  const baseCards = (feed ?? []).slice(0, 4);
  const giftCards: GiftCard[] =
    baseCards.length > 0
      ? baseCards.map((item, index) => ({
          id: item.id,
          title: item.title,
          price: item.price || "$0",
          tone: story.seasonTitle,
          imageBg: hexForColorName(
            profile?.palette.core[index % (profile?.palette.core.length || 1)] ?? "Petrol",
          ),
          image: GIFT_IMAGES[index % GIFT_IMAGES.length],
          note:
            item.reason ||
            `Chosen because ${story.paletteLead.slice(0, 2).join(" and ")} are carrying your current result.`,
          accent: hexForColorName(story.paletteLead[index % story.paletteLead.length] ?? "Petrol"),
        }))
      : [
          {
            id: "gift-fallback-1",
            title: "Warm silk scarf",
            price: "$84",
            tone: story.seasonTitle,
            imageBg: hexForColorName(story.paletteLead[0] ?? "Petrol"),
            image: GIFT_IMAGES[1],
            note: `A reliable near-face gift when you want the palette to feel intentional instead of generic.`,
            accent: hexForColorName(story.paletteLead[0] ?? "Petrol"),
          },
          {
            id: "gift-fallback-2",
            title: "Soft evening knit",
            price: "$118",
            tone: story.seasonTitle,
            imageBg: hexForColorName(story.paletteLead[1] ?? "Olive"),
            image: GIFT_IMAGES[2],
            note: `A grounded gift option for colder months and lower-effort dressing days.`,
            accent: hexForColorName(story.paletteLead[1] ?? "Olive"),
          },
        ];

  const filteredCards = giftCards.filter((card, index) => {
    if (selectedTone === "near-face") {
      return index % 2 === 0;
    }

    if (selectedTone === "evening") {
      return index % 2 === 1;
    }

    return true;
  });

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <GuideHeader title="GIFT EDIT" onBack={() => router.back()} />

      <View style={[styles.giftLead, isWide && styles.giftLeadWide]}>
        <SurfaceCard tone="muted" style={styles.giftManifesto}>
          <Text style={styles.introOverline}>Gift with palette logic</Text>
          <Text style={styles.introTitle}>Choose pieces that feel personal on first wear.</Text>
          <Text style={styles.introBody}>
            This edit filters gifts through the same undertone and contrast logic used by your analysis, so the result feels considered instead of decorative.
          </Text>
          <View style={styles.metaRow}>
            <MetaPill label={story.seasonTitle} />
            <MetaPill label={story.undertoneLabel} tone="dark" />
            <MetaPill label={story.contrastLabel} />
          </View>
          <View style={styles.introNoteCard}>
            <Text style={styles.introNoteLabel}>Best use</Text>
            <Text style={styles.introNoteText}>
              Focus on scarves, knits, jewelry, and small leather goods that repeat the palette without feeling too literal.
            </Text>
          </View>
        </SurfaceCard>

        <View style={styles.giftPreviewColumn}>
          <View style={styles.introImageCard}>
            <Image source={GIFT_IMAGES[0]} style={styles.introImage} resizeMode="cover" />
          </View>
          <View style={styles.giftPaletteStrip}>
            {story.paletteLead.slice(0, 3).map((tone) => (
              <View key={tone} style={styles.giftPaletteTile}>
                <View
                  style={[
                    styles.giftPaletteSwatch,
                    { backgroundColor: hexForColorName(tone) },
                  ]}
                />
                <Text style={styles.giftPaletteLabel}>{tone}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gift filters</Text>
        <Text style={styles.sectionTag}>Touch-friendly</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {tones.map((tone) => {
          const isSelected = tone.id === selectedTone;

          return (
            <Pressable
              accessibilityLabel={tone.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={tone.id}
              onPress={() => setSelectedTone(tone.id)}
              style={[
                styles.toneChip,
                isSelected ? styles.toneChipSelected : styles.toneChipDefault,
              ]}
            >
              <Text
                style={[
                  styles.toneChipText,
                  isSelected ? styles.toneChipTextSelected : styles.toneChipTextDefault,
                ]}
              >
                {tone.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.cardColumn}>
        {filteredCards.map((card) => {
          const isSaved = savedIds.includes(card.id);

          return (
            <SurfaceCard key={card.id} tone="default">
              <View style={[styles.giftCard, isWide && styles.giftCardWide]}>
                <View style={[styles.giftImageWrap, { backgroundColor: card.imageBg }]}>
                  <Image source={card.image} style={styles.giftImage} resizeMode="cover" />
                </View>

                <View style={styles.giftContent}>
                  <View style={styles.giftHeader}>
                    <View style={styles.giftHeaderCopy}>
                      <Text style={styles.giftEyebrow}>Recommended for {card.tone}</Text>
                      <Text style={styles.giftTitle}>{card.title}</Text>
                      <Text style={styles.giftPrice}>{card.price}</Text>
                    </View>
                    <Pressable
                      accessibilityLabel={isSaved ? `Remove ${card.title} from saved gifts` : `Save ${card.title}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSaved }}
                      onPress={() =>
                        setSavedIds((current) =>
                          current.includes(card.id)
                            ? current.filter((id) => id !== card.id)
                            : [...current, card.id],
                        )
                      }
                      style={styles.saveButton}
                    >
                      <MaterialIcons
                        name={isSaved ? "favorite" : "favorite-border"}
                        size={22}
                        color={isSaved ? palette.primary : palette.charcoal}
                      />
                    </Pressable>
                  </View>

                  <View style={[styles.noteBox, { borderLeftColor: card.accent }]}>
                    <Text style={styles.noteLabel}>Why it works</Text>
                    <Text style={styles.noteText}>{card.note}</Text>
                  </View>
                </View>
              </View>
            </SurfaceCard>
          );
        })}
      </View>

      <View style={[styles.buttonGroup, isWide && styles.buttonGroupWide]}>
        <PrimaryButton label="Shop matched pieces" icon="shopping-bag" href="/(tabs)/discover" />
        <PrimaryButton
          label="Open wardrobe"
          icon="checkroom"
          variant="secondary"
          href="/(tabs)/wardrobe"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  giftLead: {
    gap: spacing.md,
  },
  giftLeadWide: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  giftManifesto: {
    flex: 1.1,
    gap: spacing.sm,
  },
  giftPreviewColumn: {
    flex: 0.9,
    gap: spacing.md,
  },
  introShell: {
    gap: spacing.lg,
  },
  introShellWide: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  introCopy: {
    flex: 1.1,
    gap: spacing.sm,
  },
  introOverline: {
    ...type.overline,
    color: palette.primary,
  },
  introTitle: {
    ...type.displayHero,
    color: palette.charcoal,
  },
  introBody: {
    ...type.body,
    color: palette.charcoal,
    fontSize: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  introVisualColumn: {
    flex: 0.9,
    gap: spacing.md,
  },
  introImageCard: {
    minHeight: 220,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  introImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  introNoteCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  introNoteLabel: {
    ...type.sectionHeader,
    color: palette.primary,
  },
  introNoteText: {
    ...type.body,
    color: palette.charcoal,
  },
  giftPaletteStrip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.md,
  },
  giftPaletteTile: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  giftPaletteSwatch: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
  },
  giftPaletteLabel: {
    ...type.caption,
    color: palette.charcoal,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionTitle: {
    ...type.displaySection,
    color: palette.charcoal,
  },
  sectionTag: {
    ...type.caption,
    color: palette.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  toneChip: {
    borderRadius: radius.full,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toneChipSelected: {
    backgroundColor: palette.primary,
  },
  toneChipDefault: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  toneChipText: {
    ...type.label,
    fontSize: 13,
  },
  toneChipTextSelected: {
    color: palette.onPrimary,
  },
  toneChipTextDefault: {
    color: palette.charcoal,
  },
  cardColumn: {
    gap: spacing.lg,
  },
  giftCard: {
    gap: spacing.lg,
  },
  giftCardWide: {
    flexDirection: "row",
  },
  giftImageWrap: {
    minHeight: 220,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  giftImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  giftContent: {
    flex: 1,
    gap: spacing.md,
  },
  giftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  giftHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  giftEyebrow: {
    ...type.overline,
    color: palette.primary,
  },
  giftTitle: {
    ...type.displayTitle,
    color: palette.charcoal,
  },
  giftPrice: {
    ...type.label,
    color: palette.primary,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  noteBox: {
    backgroundColor: palette.primaryMuted,
    borderLeftWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteLabel: {
    ...type.caption,
    color: palette.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteText: {
    ...type.body,
    color: palette.charcoal,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  buttonGroupWide: {
    flexDirection: "row",
  },
});
