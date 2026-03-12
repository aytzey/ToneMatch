import { LinearGradient } from "expo-linear-gradient";
import { Link, Redirect, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAppCopy } from "@/src/providers/copy-provider";
import { useAppStore } from "@/src/store/app-store";
import { spacing } from "@/src/theme/spacing";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

export default function WelcomeScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const copy = useAppCopy().welcome;
  const { isAuthenticated, isDevSingleUserMode, ready } = useAuth();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const enablePreviewMode = useAppStore((state) => state.enablePreviewMode);

  if (ready && isDevSingleUserMode) {
    return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/auth"} />;
  }

  const handleEnterApp = () => {
    completeOnboarding();
    router.replace("/auth");
  };

  const handlePreview = () => {
    completeOnboarding();
    enablePreviewMode();
    router.replace("/(tabs)/home");
  };

  return (
    <Screen
      scrollable
      role="main"
      accessibilityLabel="Welcome screen"
      contentContainerStyle={styles.content}
    >
      <LinearGradient colors={[palette.canvas, palette.surface, palette.accentSoft]} style={styles.hero}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          {copy.eyebrow}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.copy}>{copy.body}</Text>
      </LinearGradient>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>{copy.highlightsTitle}</Text>
        <View style={styles.stack}>
          {copy.highlights.map((item) => (
            <View key={item} style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard tone="dark">
        <Text style={styles.sectionTitleDark}>{copy.howItWorksTitle}</Text>
        <Text style={styles.copyDark}>{copy.howItWorksBody}</Text>
      </SurfaceCard>

      <PrimaryButton
        label={copy.continueWithAccount}
        onPress={handleEnterApp}
      />
      <PrimaryButton
        label={copy.previewMode}
        onPress={handlePreview}
        variant="secondary"
      />
      <Link href="/(tabs)/scan" style={styles.link}>
        {copy.startExploring}
      </Link>
    </Screen>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    hero: {
      borderRadius: 32,
      padding: spacing.xl,
      gap: spacing.md,
      minHeight: 280,
      justifyContent: "flex-end",
    },
    eyebrow: {
      ...type.overline,
      color: palette.muted,
    },
    title: {
      ...type.hero,
      color: palette.ink,
    },
    copy: {
      ...type.body,
      color: palette.muted,
    },
    sectionTitle: {
      ...type.h3,
      color: palette.ink,
      marginBottom: spacing.sm,
    },
    sectionTitleDark: {
      ...type.h3,
      color: palette.surface,
      marginBottom: spacing.sm,
    },
    copyDark: {
      ...type.body,
      color: palette.clay,
    },
    stack: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start",
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: palette.primary,
      marginTop: 7,
    },
    rowText: {
      ...type.body,
      color: palette.ink,
      flex: 1,
    },
    link: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600" as const,
      color: palette.primary,
      textAlign: "center" as const,
    },
  });
