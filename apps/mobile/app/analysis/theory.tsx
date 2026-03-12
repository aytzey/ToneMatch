import { useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GuideHeader } from "@/src/components/editorial-guide-primitives";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { buildStablePalette } from "@/src/lib/style-profile-normalizer";
import { generateStyleTheory } from "@/src/lib/tonematch-api";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

function MetaPill({
  label,
  tone = "dark",
}: {
  label: string;
  tone?: "dark" | "light";
}) {
  return (
    <View style={[styles.metaPill, tone === "light" ? styles.metaPillLight : styles.metaPillDark]}>
      <Text style={[styles.metaPillText, tone === "light" ? styles.metaPillTextLight : styles.metaPillTextDark]}>
        {label}
      </Text>
    </View>
  );
}

export default function AnalysisTheoryScreen() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { data: profile, isLoading, error } = useStyleProfile();

  const theoryQueryKey = useMemo(
    () =>
      profile
        ? [
            "style-theory",
            params.sessionId ?? "latest",
            profile.undertone,
            profile.contrast,
            profile.summary.title,
            profile.palette.core.join("|"),
            profile.palette.avoid.join("|"),
            profile.recommendations.map((item) => item.id).join("|"),
          ]
        : ["style-theory", "pending"],
    [params.sessionId, profile],
  );

  const theoryQuery = useQuery({
    queryKey: theoryQueryKey,
    queryFn: () => generateStyleTheory(profile!),
    enabled: Boolean(profile),
    staleTime: 1000 * 60 * 30,
  });

  const header = <GuideHeader title="ANALYSIS METHOD" onBack={() => router.back()} />;

  if (isLoading) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingTitle}>Loading your method note</Text>
          <Text style={styles.loadingBody}>
            Your result is being prepared before the implementation breakdown is generated.
          </Text>
        </View>
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <Text style={styles.errorTitle}>Method note is not available yet</Text>
          <Text style={styles.errorBody}>
            Open this page again after your analysis results have fully loaded.
          </Text>
        </View>
      </Screen>
    );
  }

  if (theoryQuery.isLoading || !theoryQuery.data) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        {header}
        <View style={styles.centeredFill}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingTitle}>Building your method breakdown</Text>
          <Text style={styles.loadingBody}>
            ToneMatch is turning your result into a long-form explanation of the actual analysis pipeline.
          </Text>
        </View>
      </Screen>
    );
  }

  const article = theoryQuery.data;
  const confidencePct = Math.round((profile.confidence ?? 0) * 100);
  const stable = buildStablePalette(profile.undertone, profile.contrast);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      <SurfaceCard tone="accent">
        <View style={styles.heroMetaRow}>
          <MetaPill label={`${confidencePct}% MATCH`} tone="light" />
          <MetaPill label={article.source === "ai" ? "AI METHOD" : "METHOD NOTES"} tone="light" />
        </View>

        <Text style={styles.heroOverline}>IMPLEMENTATION BREAKDOWN</Text>
        <Text style={styles.heroTitle}>{article.title}</Text>
        <Text style={styles.heroSubtitle}>{article.subtitle}</Text>
      </SurfaceCard>

      <View style={styles.profileBar}>
        <MetaPill label={stable.undertoneLabel.toUpperCase()} />
        <MetaPill label={stable.contrastLabel.toUpperCase()} />
      </View>

      <SurfaceCard>
        <Text style={styles.intro}>{article.intro}</Text>
      </SurfaceCard>

      <View style={styles.pullQuoteWrap}>
        <Text style={styles.pullQuoteMark}>“</Text>
        <Text style={styles.pullQuote}>{article.pullQuote}</Text>
      </View>

      {article.sections.map((section) => {
        const paragraphs = section.body
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);

        return (
          <SurfaceCard key={section.title}>
            <Text style={styles.sectionOverline}>SECTION</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {paragraphs.map((paragraph, index) => (
              <Text
                key={`${section.title}-${index}`}
                style={[
                  styles.sectionBody,
                  index < paragraphs.length - 1 ? styles.sectionBodySpaced : null,
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </SurfaceCard>
        );
      })}

      {article.examples.length > 0 ? (
        <SurfaceCard>
          <Text style={styles.sectionOverline}>IMPLEMENTATION EXAMPLES</Text>
          <View style={styles.examplesList}>
            {article.examples.map((example) => (
              <View key={example.title} style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>{example.title}</Text>
                <Text style={styles.exampleCopy}>{example.copy}</Text>
              </View>
            ))}
          </View>
        </SurfaceCard>
      ) : null}

      <SurfaceCard tone="dark">
        <Text style={styles.closingOverline}>FINAL TAKE</Text>
        <Text style={styles.closingBody}>{article.closing}</Text>
      </SurfaceCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  centeredFill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  loadingTitle: {
    ...type.h3,
    color: palette.charcoal,
  },
  loadingBody: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
  },
  errorTitle: {
    ...type.h3,
    color: palette.charcoal,
  },
  errorBody: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroOverline: {
    ...type.overline,
    color: palette.onDark,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...type.displayTitle,
    color: palette.onPrimary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...type.body,
    color: palette.onDark,
  },
  profileBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  metaPillDark: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  metaPillLight: {
    backgroundColor: palette.surfaceTintSubtle,
    borderColor: palette.surfaceTintLine,
  },
  metaPillText: {
    ...type.caption,
    letterSpacing: 1,
  },
  metaPillTextDark: {
    color: palette.charcoal,
  },
  metaPillTextLight: {
    color: palette.onPrimary,
  },
  intro: {
    ...type.body,
    color: palette.charcoal,
    fontSize: 16,
    lineHeight: 25,
  },
  pullQuoteWrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    gap: spacing.xs,
  },
  pullQuoteMark: {
    ...type.hero,
    color: palette.primary,
    lineHeight: 24,
  },
  pullQuote: {
    ...type.h3,
    color: palette.charcoal,
    lineHeight: 28,
  },
  sectionOverline: {
    ...type.overline,
    color: palette.primary,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...type.h2,
    color: palette.charcoal,
    marginBottom: spacing.md,
  },
  sectionBody: {
    ...type.body,
    color: palette.muted,
  },
  sectionBodySpaced: {
    marginBottom: spacing.md,
  },
  examplesList: {
    gap: spacing.md,
  },
  exampleCard: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  exampleTitle: {
    ...type.h3,
    color: palette.charcoal,
    marginBottom: spacing.xs,
  },
  exampleCopy: {
    ...type.body,
    color: palette.muted,
  },
  closingOverline: {
    ...type.overline,
    color: palette.onDark,
    marginBottom: spacing.sm,
  },
  closingBody: {
    ...type.body,
    color: palette.onPrimary,
  },
});
