import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useScanFlow } from "@/src/features/scan/use-scan-flow";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Quality check items                                                */
/* ------------------------------------------------------------------ */

const QUALITY_CHECKS: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}[] = [
  { icon: "wb-sunny", label: "Natural lighting detected" },
  { icon: "visibility", label: "Features clearly visible" },
  { icon: "filter-none", label: "No filters applied" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function ScanReviewScreen() {
  const router = useRouter();
  const { state, startAnalysis } = useScanFlow();

  const previewUri = state.previewUri;

  const handleBack = () => {
    router.back();
  };

  const handleAnalyze = () => {
    startAnalysis();
  };

  const handleRetake = () => {
    router.back();
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* -- Header -- */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={handleBack}
          hitSlop={12}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={palette.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Review</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* -- Selfie preview -- */}
      <View style={styles.previewContainer}>
        <Image
          source={
            previewUri
              ? { uri: previewUri }
              : require("../assets/images/scan_selfie.png")
          }
          style={styles.previewPlaceholder}
          resizeMode="cover"
        />

        {/* Quality status badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusBadgeLeft}>
            <MaterialIcons
              name="check-circle"
              size={28}
              color={palette.green}
            />
            <View style={styles.statusBadgeTextColumn}>
              <Text style={styles.statusOverline}>STATUS</Text>
              <Text style={styles.statusTitle}>High Quality</Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Good to go</Text>
          </View>
        </View>
      </View>

      {/* -- Quality check section -- */}
      <View style={styles.qualitySection}>
        <Text style={styles.qualitySectionTitle}>Quality Check</Text>

        <View style={styles.checkList}>
          {QUALITY_CHECKS.map((check) => (
            <View key={check.label} style={styles.checkRow}>
              <View style={styles.checkIconCircle}>
                <MaterialIcons
                  name={check.icon}
                  size={18}
                  color={palette.primary}
                />
              </View>
              <Text style={styles.checkLabel}>{check.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* -- CTA buttons -- */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          label="Analyze Now"
          onPress={handleAnalyze}
        />
        <PrimaryButton
          label="Retake Photo"
          variant="secondary"
          icon="replay"
          onPress={handleRetake}
        />
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
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },

  /* Selfie preview */
  previewContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: palette.border,
  },
  previewPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.clay,
  },

  /* Quality status badge */
  statusBadge: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: palette.surfaceTintStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadgeTextColumn: {
    gap: 2,
  },
  statusOverline: {
    ...type.overline,
    fontSize: 12,
    color: palette.primary,
    letterSpacing: 1.5,
  },
  statusTitle: {
    ...type.label,
    color: palette.charcoal,
    fontWeight: "700",
  },
  statusPill: {
    backgroundColor: palette.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusPillText: {
    ...type.caption,
    color: palette.green,
    fontWeight: "700",
  },

  /* Quality check section */
  qualitySection: {
    gap: spacing.md,
  },
  qualitySectionTitle: {
    ...type.h3,
    color: palette.charcoal,
    fontStyle: "italic",
  },
  checkList: {
    gap: spacing.md,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: {
    ...type.body,
    color: palette.charcoal,
    flex: 1,
  },

  /* CTA buttons */
  ctaSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
