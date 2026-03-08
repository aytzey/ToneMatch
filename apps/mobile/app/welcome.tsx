import { LinearGradient } from "expo-linear-gradient";
import { Link, Redirect, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/src/components/glass-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAppStore } from "@/src/store/app-store";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

const highlights = [
  "Selfie ile kisisel renk paleti olustur",
  "Sana yakisan kiyafet ve renk onerileri al",
  "Gardrobunu akillica yonet",
];

export default function WelcomeScreen() {
  const router = useRouter();
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
    <Screen scrollable contentContainerStyle={styles.content}>
      <LinearGradient colors={[palette.canvas, palette.surface, palette.accentSoft]} style={styles.hero}>
        <Text style={styles.eyebrow}>ToneMatch</Text>
        <Text style={styles.title}>En iyi renklerini bul. Sonra gercek kiyafet kararina donustur.</Text>
        <Text style={styles.copy}>
          Selfie cekerek cilt alt tonunu analiz et, sana en cok yakisan renkleri kesfet ve gardrobunu buna gore
          sekillendir.
        </Text>
      </LinearGradient>

      <GlassCard>
        <Text style={styles.sectionTitle}>ToneMatch ile neler yapabilirsin</Text>
        <View style={styles.stack}>
          {highlights.map((item) => (
            <View key={item} style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard tone="dark">
        <Text style={styles.sectionTitleDark}>Nasil calisir</Text>
        <Text style={styles.copyDark}>
          Selfie cek, renk profilini olustur, sana ozel kombin onerilerini kesfet. Her adim mahremiyetini koruyarak
          calisiyor.
        </Text>
      </GlassCard>

      <PrimaryButton label="Hesabinla devam et" onPress={handleEnterApp} />
      <PrimaryButton label="Deneme modu" onPress={handlePreview} variant="secondary" />
      <Link href="/(tabs)/scan" style={styles.link}>
        Hemen kesfetmeye basla
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    ...type.label,
    color: palette.primary,
    textAlign: "center",
  },
});
