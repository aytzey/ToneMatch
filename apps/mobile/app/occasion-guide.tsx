import { router, useLocalSearchParams } from "expo-router";
import { Image, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";

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
} from "@/src/lib/editorial-guides";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

function PlaybookCard({
  occasion,
  wide,
}: {
  occasion: OccasionPlaybook;
  wide: boolean;
}) {
  return (
    <SurfaceCard tone="default">
      <View style={[styles.playbookIntro, wide && styles.playbookIntroWide]}>
        <View style={styles.playbookCopy}>
          <Text style={styles.playbookEyebrow}>{occasion.eyebrow}</Text>
          <Text style={styles.playbookTitle}>{occasion.title}</Text>
          <Text style={styles.playbookSubtitle}>{occasion.subtitle}</Text>
          <View style={styles.chipRow}>
            {occasion.palette.map((item) => (
              <ColorChip key={`${occasion.id}-${item}`} label={item} />
            ))}
          </View>
        </View>

        <View style={[styles.playbookVisual, { backgroundColor: occasion.backgroundColor }]}>
          <Image source={occasion.image} style={styles.playbookImage} resizeMode="cover" />
        </View>
      </View>

      <BulletList title="Anchor Pieces" items={occasion.anchorPieces} />
      <BulletList title="Outfit Formula" items={occasion.outfitFormula} />
      <BulletList title="Styling Moves" items={occasion.stylingMoves} />
      <BulletList title="Avoid" items={occasion.avoid} />

      <View style={styles.noteCard}>
        <Text style={styles.noteLabel}>Closing note</Text>
        <Text style={styles.noteBody}>{occasion.finishingNote}</Text>
      </View>
    </SurfaceCard>
  );
}

export default function OccasionGuideScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { data: profile } = useStyleProfile();
  const params = useLocalSearchParams<{ variant?: GuideVariant; focus?: string }>();
  const selectedVariant = params.variant === "secondary" ? "secondary" : "primary";
  const bundle = buildEditorialGuideBundle(profile, selectedVariant);

  const orderedOccasions = [...bundle.occasions].sort((a, b) => {
    if (!params.focus) {
      return 0;
    }

    if (a.id === params.focus) {
      return -1;
    }

    if (b.id === params.focus) {
      return 1;
    }

    return 0;
  });

  const hero = orderedOccasions[0];

  const handleShare = async () => {
    await Share.share({
      message: `${bundle.story.seasonTitle} occasion guide: ${hero.title}. ${bundle.story.tagline}`,
    });
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <GuideHeader
        title="OCCASION GUIDE"
        onBack={() => router.back()}
        onShare={handleShare}
      />

      <View style={styles.storyboard}>
        <View style={[styles.storyboardHero, { backgroundColor: hero.backgroundColor }]}>
          <Image source={hero.image} style={styles.storyboardImage} resizeMode="cover" />
          <View style={styles.storyboardRibbon}>
            <Text style={styles.introOverline}>Scenario playbooks</Text>
            <Text style={styles.storyboardTitle}>{hero.title}</Text>
            <Text style={styles.storyboardBody}>{hero.subtitle}</Text>
          </View>
        </View>

        <View style={[styles.storyboardMetaGrid, isWide && styles.storyboardMetaGridWide]}>
          <SurfaceCard tone="muted" style={styles.storyboardSummaryCard}>
            <Text style={styles.heroNoteLabel}>Why these occasions match</Text>
            <Text style={styles.heroNoteText}>{bundle.confidenceNote}</Text>
          </SurfaceCard>

          <SurfaceCard style={styles.storyboardMetaCard}>
            <View style={styles.metaRow}>
              <MetaPill label={bundle.confidenceLabel} />
              <MetaPill label={bundle.story.seasonTitle.toUpperCase()} tone="dark" />
              {selectedVariant === "secondary" ? <MetaPill label="2nd closest" /> : null}
            </View>
            <Text style={styles.storyboardMetaCopy}>{bundle.intro}</Text>
          </SurfaceCard>
        </View>
      </View>

      <SurfaceCard tone="default">
        <Text style={styles.sectionOverline}>Use this palette first</Text>
        <Text style={styles.sectionTitle}>Colors to hold closest to the face</Text>
        <Text style={styles.sectionBody}>{bundle.paletteNarrative}</Text>
        <View style={styles.chipRow}>
          {bundle.story.paletteLead.map((item) => (
            <ColorChip key={`lead-${item}`} label={item} />
          ))}
        </View>
      </SurfaceCard>

      {bundle.alternate ? (
        <SurfaceCard tone="default">
          <Text style={styles.sectionOverline}>Alternate route</Text>
          <Text style={styles.sectionTitle}>
            {bundle.alternate.story.seasonTitle} can work as a secondary lane
          </Text>
          <Text style={styles.sectionBody}>{bundle.alternate.reason}</Text>
          <View style={[styles.buttonGroup, isWide && styles.buttonGroupWide]}>
            <PrimaryButton
              label={
                selectedVariant === "secondary"
                  ? "Open primary occasion guide"
                  : "Open 2nd closest occasion guide"
              }
              variant="secondary"
              href={{
                pathname: "/occasion-guide",
                params: {
                  variant: selectedVariant === "secondary" ? "primary" : "secondary",
                },
              }}
            />
            <PrimaryButton
              label="See style guide"
              href={{ pathname: "/style-guide", params: { variant: selectedVariant } }}
            />
          </View>
        </SurfaceCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Playbooks</Text>
        <Text style={styles.sectionTag}>{bundle.story.undertoneLabel}</Text>
      </View>
      <Text style={styles.sectionLead}>
        Each occasion below uses the same logic the app applies to ranking,
        styling, and wardrobe notes, so the guidance stays stable across screens.
      </Text>

      <View style={styles.cardColumn}>
        {orderedOccasions.map((occasion) => (
          <PlaybookCard key={occasion.id} occasion={occasion} wide={isWide} />
        ))}
      </View>

      <View style={[styles.buttonGroup, isWide && styles.buttonGroupWide]}>
        <PrimaryButton
          label="Open style guide"
          icon="style"
          href={{ pathname: "/style-guide", params: { variant: selectedVariant } }}
        />
        <PrimaryButton
          label="Shop matched pieces"
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
  storyboard: {
    gap: spacing.md,
  },
  storyboardHero: {
    minHeight: 320,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  storyboardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  storyboardRibbon: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: palette.surfaceTintStrong,
    borderRadius: radius.xl,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  storyboardTitle: {
    ...type.displayHero,
    color: palette.charcoal,
  },
  storyboardBody: {
    ...type.body,
    color: palette.charcoal,
    fontSize: 16,
  },
  storyboardMetaGrid: {
    gap: spacing.md,
  },
  storyboardMetaGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  storyboardSummaryCard: {
    flex: 1,
  },
  storyboardMetaCard: {
    flex: 1,
    gap: spacing.md,
  },
  storyboardMetaCopy: {
    ...type.body,
    color: palette.charcoal,
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
  heroFrame: {
    minHeight: 220,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  heroNote: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  heroNoteLabel: {
    ...type.sectionHeader,
    color: palette.primary,
  },
  heroNoteText: {
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
  chipRow: {
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
    justifyContent: "space-between",
    alignItems: "baseline",
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
  playbookIntro: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  playbookIntroWide: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  playbookCopy: {
    flex: 1.1,
    gap: spacing.sm,
  },
  playbookEyebrow: {
    ...type.overline,
    color: palette.primary,
  },
  playbookTitle: {
    ...type.displayTitle,
    color: palette.charcoal,
  },
  playbookSubtitle: {
    ...type.body,
    color: palette.muted,
  },
  playbookVisual: {
    flex: 0.9,
    minHeight: 240,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  playbookImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  noteCard: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  noteLabel: {
    ...type.label,
    color: palette.charcoal,
  },
  noteBody: {
    ...type.body,
    color: palette.charcoal,
  },
});
