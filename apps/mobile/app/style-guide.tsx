import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  BulletList,
  ColorChip,
  GuideHeader,
  MetaPill,
} from "@/src/components/editorial-guide-primitives";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import {
  buildEditorialGuideBundle,
  type GuideVariant,
  type OccasionPlaybook,
  type StyleDirectionCard,
} from "@/src/lib/editorial-guides";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

function DirectionCard({
  card,
  wide,
}: {
  card: StyleDirectionCard;
  wide: boolean;
}) {
  return (
    <SurfaceCard tone="default">
      <View style={[styles.directionIntro, wide && styles.directionIntroWide]}>
        <View style={styles.directionCopy}>
          <Text style={styles.cardEyebrow}>{card.eyebrow}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          <View style={styles.cardPaletteRow}>
            {card.palette.map((item) => (
              <ColorChip key={`${card.id}-${item}`} label={item} />
            ))}
          </View>
        </View>

        <View style={[styles.directionVisual, { backgroundColor: card.backgroundColor }]}>
          <Image source={card.image} style={styles.directionImage} resizeMode="cover" />
          <View style={styles.directionCaption}>
            <Text style={styles.directionCaptionLabel}>Built for repeat wear</Text>
            <Text style={styles.directionCaptionText}>
              A stable formula you can reuse without drifting away from your result.
            </Text>
          </View>
        </View>
      </View>

      <BulletList title="Build The Look" items={card.formula} />
      <BulletList title="Styling Tips" items={card.stylingTips} />
      <BulletList title="Texture + Shape" items={card.textures} />
      <BulletList title="Finish It With" items={card.finishingTouches} />
      <BulletList title="Avoid" items={card.avoid} />
    </SurfaceCard>
  );
}

function OccasionPreview({
  item,
  variant,
  wide,
}: {
  item: OccasionPlaybook;
  variant: GuideVariant;
  wide: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open ${item.title} occasion playbook`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/occasion-guide",
          params: { focus: item.id, variant },
        })
      }
      style={({ pressed }: { pressed: boolean }) => [
        styles.previewCard,
        wide && styles.previewCardWide,
        pressed && styles.previewCardPressed,
      ]}
    >
      <View style={[styles.previewImageWrap, { backgroundColor: item.backgroundColor }]}>
        <Image source={item.image} style={styles.previewImage} resizeMode="cover" />
      </View>
      <View style={styles.previewContent}>
        <Text style={styles.previewEyebrow}>{item.eyebrow}</Text>
        <Text style={styles.previewTitle}>{item.title}</Text>
        <Text style={styles.previewSubtitle}>{item.subtitle}</Text>
        <View style={styles.previewFooter}>
          <Text style={styles.previewAction}>Open playbook</Text>
          <MaterialIcons name="arrow-forward" size={18} color={palette.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function StyleGuideScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { data: profile } = useStyleProfile();
  const params = useLocalSearchParams<{ variant?: GuideVariant }>();
  const selectedVariant = params.variant === "secondary" ? "secondary" : "primary";
  const bundle = buildEditorialGuideBundle(profile, selectedVariant);
  const heroCard = bundle.styleDirections[0];

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <GuideHeader title="STYLE GUIDE" onBack={() => router.back()} />

      <View style={[styles.masthead, isWide && styles.mastheadWide]}>
        <View
          style={[
            styles.mastheadFrame,
            isWide && styles.mastheadFrameWide,
            { backgroundColor: heroCard.backgroundColor },
          ]}
        >
          <Image source={heroCard.image} style={styles.mastheadImage} resizeMode="cover" />
          <View style={styles.mastheadOverlay}>
            <Text style={styles.introOverline}>Editorial blueprint</Text>
            <Text style={styles.mastheadTitle}>{bundle.story.seasonTitle}</Text>
            <Text style={styles.mastheadSummary}>{bundle.summary}</Text>
          </View>
        </View>

        <View style={styles.mastheadRail}>
          <SurfaceCard tone="default">
            <Text style={styles.sectionOverline}>Use this as your base lane</Text>
            <Text style={styles.sectionBody}>{bundle.intro}</Text>
            <View style={styles.metaRow}>
              <MetaPill label={bundle.confidenceLabel} />
              <MetaPill label={bundle.story.undertoneLabel} tone="dark" />
              <MetaPill label={bundle.story.contrastLabel} />
            </View>
          </SurfaceCard>

          <SurfaceCard tone="accent">
            <Text style={styles.mastheadAccentLabel}>Palette direction</Text>
            <Text style={styles.mastheadAccentBody}>{bundle.paletteNarrative}</Text>
          </SurfaceCard>
        </View>
      </View>

      <SurfaceCard tone="default">
        <Text style={styles.sectionOverline}>Working logic</Text>
        <Text style={styles.sectionTitle}>How to keep the styling stable</Text>
        <Text style={styles.sectionBody}>{bundle.confidenceNote}</Text>
        <View style={styles.colorGrid}>
          {bundle.story.paletteLead.map((item) => (
            <ColorChip key={`lead-${item}`} label={item} />
          ))}
          {bundle.story.cautionLead.map((item) => (
            <ColorChip key={`avoid-${item}`} label={item} />
          ))}
        </View>
      </SurfaceCard>

      {bundle.alternate ? (
        <SurfaceCard tone="default">
          <Text style={styles.sectionOverline}>Closest alternate</Text>
          <Text style={styles.sectionTitle}>
            {bundle.alternate.story.seasonTitle} is also worth reviewing
          </Text>
          <Text style={styles.sectionBody}>{bundle.alternate.reason}</Text>
          <View style={[styles.buttonGroup, isWide && styles.buttonGroupWide]}>
            <PrimaryButton
              label={selectedVariant === "secondary" ? "Open primary guide" : "Open 2nd closest guide"}
              variant="secondary"
              href={{
                pathname: "/style-guide",
                params: {
                  variant: selectedVariant === "secondary" ? "primary" : "secondary",
                },
              }}
            />
            <PrimaryButton
              label="See occasion playbooks"
              href={{
                pathname: "/occasion-guide",
                params: { variant: selectedVariant },
              }}
            />
          </View>
        </SurfaceCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Style directions</Text>
        <Text style={styles.sectionTag}>{bundle.story.undertoneLabel}</Text>
      </View>
      <Text style={styles.sectionLead}>
        These cards convert your result into repeatable outfits. The point is
        consistency, not costume.
      </Text>

      <View style={styles.cardColumn}>
        {bundle.styleDirections.map((card) => (
          <DirectionCard key={card.id} card={card} wide={isWide} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Occasion playbooks</Text>
        <Text style={styles.sectionTag}>{bundle.story.contrastLabel}</Text>
      </View>
      <Text style={styles.sectionLead}>
        Each playbook stays inside the same color logic so shopping, wardrobe
        planning, and getting dressed all tell the same story.
      </Text>

      <View style={[styles.previewGrid, isWide && styles.previewGridWide]}>
        {bundle.occasions.map((item) => (
          <OccasionPreview
            key={item.id}
            item={item}
            variant={selectedVariant}
            wide={isWide}
          />
        ))}
      </View>

      <View style={[styles.buttonGroup, isWide && styles.buttonGroupWide]}>
        <PrimaryButton
          label="Open occasion guide"
          icon="auto-awesome"
          href={{ pathname: "/occasion-guide", params: { variant: selectedVariant } }}
        />
        <PrimaryButton
          label="Shop your tones"
          icon="shopping-bag"
          variant="secondary"
          href="/(tabs)/discover"
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
  masthead: {
    gap: spacing.md,
  },
  mastheadWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  mastheadFrame: {
    minHeight: 300,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  mastheadFrameWide: {
    flex: 1.15,
  },
  mastheadImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  mastheadOverlay: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.xs,
    backgroundColor: palette.surfaceTintStrong,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  mastheadTitle: {
    ...type.displayHero,
    color: palette.charcoal,
  },
  mastheadSummary: {
    ...type.body,
    color: palette.charcoal,
  },
  mastheadRail: {
    flex: 0.9,
    gap: spacing.md,
  },
  mastheadAccentLabel: {
    ...type.sectionHeader,
    color: palette.onPrimary,
  },
  mastheadAccentBody: {
    ...type.body,
    color: palette.onPrimary,
  },
  introShell: {
    gap: spacing.lg,
  },
  introShellWide: {
    flexDirection: "row",
    alignItems: "stretch",
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
  introSupport: {
    ...type.body,
    color: palette.muted,
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
  sectionOverline: {
    ...type.overline,
    color: palette.primary,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...type.displaySection,
    color: palette.charcoal,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    ...type.body,
    color: palette.charcoal,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  buttonGroup: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  buttonGroupWide: {
    flexDirection: "row",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionHeaderTitle: {
    ...type.displaySection,
    color: palette.charcoal,
  },
  sectionTag: {
    ...type.caption,
    color: palette.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionLead: {
    ...type.body,
    color: palette.muted,
  },
  cardColumn: {
    gap: spacing.lg,
  },
  directionIntro: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  directionIntroWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  directionCopy: {
    flex: 1.1,
    gap: spacing.sm,
  },
  cardEyebrow: {
    ...type.overline,
    color: palette.primary,
  },
  cardTitle: {
    ...type.displayTitle,
    color: palette.charcoal,
  },
  cardSubtitle: {
    ...type.body,
    color: palette.muted,
  },
  cardPaletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  directionVisual: {
    flex: 0.9,
    borderRadius: radius.xl,
    minHeight: 248,
    overflow: "hidden",
    position: "relative",
  },
  directionImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  directionCaption: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: palette.surfaceTintStrong,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  directionCaptionLabel: {
    ...type.sectionHeader,
    color: palette.primary,
  },
  directionCaptionText: {
    ...type.caption,
    color: palette.charcoal,
  },
  previewGrid: {
    gap: spacing.md,
  },
  previewGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  previewCard: {
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 172,
    overflow: "hidden",
  },
  previewCardWide: {
    width: "48%",
  },
  previewCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  previewImageWrap: {
    aspectRatio: 4 / 3,
    overflow: "hidden",
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  previewContent: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  previewEyebrow: {
    ...type.overline,
    color: palette.primary,
  },
  previewTitle: {
    ...type.h2,
    color: palette.charcoal,
  },
  previewSubtitle: {
    ...type.body,
    color: palette.muted,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  previewAction: {
    ...type.label,
    color: palette.primary,
  },
});
