import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Pill } from "@/src/components/pill";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { buildEditorialStory } from "@/src/lib/style-story";
import { runQuickCheck } from "@/src/lib/tonematch-api";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";
import type { QuickCheckView } from "@/src/types/tonematch";

/* ------------------------------------------------------------------ */
/*  Suggested-usage config                                             */
/* ------------------------------------------------------------------ */
const SUGGESTED_USAGE: { icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { icon: "face", label: "BEST NEAR FACE" },
  { icon: "layers", label: "GREAT AS LAYER" },
  { icon: "grid-view", label: "BOTTOM PIECES" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */
export default function QuickCheckScreen() {
  const router = useRouter();
  const { data: profile } = useStyleProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckView | null>(null);
  const story = buildEditorialStory(profile);

  /* Pick image from camera or library then run analysis */
  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Library access required",
        "Allow photo access so we can analyze the item against your saved palette.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (response.canceled || !response.assets[0]) {
        return;
      }

      const quickCheck = await runQuickCheck(response.assets[0]);
      setResult(quickCheck);
    } catch (error) {
      Alert.alert(
        "Check could not be completed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* Derive verdict helpers */
  const isGoodFit =
    result?.clothingCheck?.verdict === "matches" ||
    result?.clothingCheck?.verdict?.toLowerCase().includes("match") ||
    result?.label?.toLowerCase().includes("good");

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={palette.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Quick Check</Text>
        {/* Spacer to center title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Upload Area (before result) ────────────────────────── */}
      {!result && !loading && (
        <View style={styles.uploadArea}>
          <View style={styles.cameraIconCircle}>
            <MaterialIcons name="add-a-photo" size={48} color={palette.primary} />
          </View>

          <Text style={styles.uploadTitle}>Upload Product Photo</Text>
          <Text style={styles.uploadBody}>
            Upload one product image and we will check how well it fits your{" "}
            {story.seasonTitle} result, with extra weight on{" "}
            {story.paletteLead.slice(0, 2).join(" and ")}.
          </Text>

          <PrimaryButton
            label="Upload Image"
            icon="file-upload"
            onPress={handlePick}
            disabled={loading}
          />
        </View>
      )}

      {/* ── Loading state ──────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingCopy}>Analyzing your image...</Text>
        </View>
      )}

      {/* ── Result ─────────────────────────────────────────────── */}
      {result && result.clothingCheck && (
        <>
          {/* Analysis Result Card */}
          <SurfaceCard>
            <Text style={styles.overline}>ANALYSIS RESULT</Text>

            <View style={styles.matchRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isGoodFit ? palette.green : palette.amber },
                ]}
              />
              <Text style={styles.matchTitle}>
                Match Status:{" "}
                {isGoodFit ? "Good Fit" : result.clothingCheck.verdict}
              </Text>
              <View style={{ flex: 1 }} />
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={palette.primary}
              />
            </View>

            <Text style={styles.explanationText}>
              {result.clothingCheck.explanation}
            </Text>

            {/* Visible color pills */}
            {result.clothingCheck.visible_colors.length > 0 && (
              <View style={styles.pillRow}>
                {result.clothingCheck.visible_colors.map((c) => (
                  <Pill key={c} label={c} />
                ))}
              </View>
            )}
          </SurfaceCard>

          {/* Suggested Usage */}
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedLabel}>Suggested Usage</Text>
            <View style={styles.suggestedRow}>
              {SUGGESTED_USAGE.map((item) => (
                <View key={item.label} style={styles.suggestedItem}>
                  <View style={styles.suggestedAccent} />
                  <View style={styles.suggestedIconWrap}>
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={palette.primary}
                    />
                  </View>
                  <Text style={styles.suggestedItemLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Suggestion text from API */}
          {result.clothingCheck.suggestion ? (
            <View style={styles.suggestionBox}>
              <MaterialIcons
                name="lightbulb-outline"
                size={18}
                color={palette.muted}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.suggestionText}>
                {result.clothingCheck.suggestion}
              </Text>
            </View>
          ) : null}

          {/* Detail card */}
          <SurfaceCard>
            <Text style={styles.detailSectionTitle}>Details</Text>
            <Text style={styles.detailBody}>{result.reason}</Text>
            <View style={styles.metaRow}>
              <Pill label={result.colorFamily} />
              <Pill
                label={`${Math.round(result.score * 100)}% match`}
                subtle
              />
              <Pill
                label={`${Math.round(result.confidence * 100)}% confidence`}
                subtle
              />
            </View>
          </SurfaceCard>

          {/* Action buttons */}
          <View style={styles.actionStack}>
            <PrimaryButton
              label="Save to Wardrobe"
              icon="checkroom"
              onPress={() => {
                router.push("/(tabs)/wardrobe");
              }}
            />

            <PrimaryButton
              label="See similar better matches"
              icon="search"
              variant="ghost"
              onPress={() => {
                router.push("/(tabs)/discover");
              }}
            />
          </View>

          {/* Re-check button */}
          <PrimaryButton
            label="Check Another Item"
            icon="add-a-photo"
            variant="secondary"
            onPress={() => {
              setResult(null);
            }}
          />
        </>
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerTitle: {
    ...type.h2,
    color: palette.charcoal,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },

  /* Upload area */
  uploadArea: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  cameraIconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  uploadTitle: {
    ...type.h2,
    color: palette.charcoal,
    textAlign: "center",
  },
  uploadBody: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  /* Loading */
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingCopy: {
    ...type.body,
    color: palette.muted,
  },

  /* Analysis result card internals */
  overline: {
    ...type.overline,
    color: palette.muted,
    marginBottom: spacing.md,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  matchTitle: {
    ...type.h3,
    color: palette.charcoal,
  },
  explanationText: {
    ...type.body,
    color: palette.muted,
    lineHeight: 22,
  },
  pillRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  /* Suggested usage */
  suggestedSection: {
    gap: spacing.md,
  },
  suggestedLabel: {
    ...type.sectionHeader,
    color: palette.muted,
  },
  suggestedRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  suggestedItem: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    flex: 1,
  },
  suggestedAccent: {
    width: 28,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
  },
  suggestedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestedItemLabel: {
    ...type.caption,
    color: palette.muted,
    textAlign: "center",
    letterSpacing: 0.8,
  },

  /* Suggestion box */
  suggestionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: palette.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  suggestionText: {
    ...type.caption,
    color: palette.muted,
    flex: 1,
    fontStyle: "italic",
  },

  /* Detail card */
  detailSectionTitle: {
    ...type.h3,
    color: palette.charcoal,
    marginBottom: spacing.sm,
  },
  detailBody: {
    ...type.body,
    color: palette.muted,
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  /* Actions */
  actionStack: {
    gap: spacing.sm,
  },
});
