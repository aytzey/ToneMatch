import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/src/components/glass-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { TextField } from "@/src/components/text-field";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAppStore } from "@/src/store/app-store";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

export default function AuthScreen() {
  const router = useRouter();
  const { backendConfigured, isAuthenticated, isDevSingleUserMode, ready, signInWithPassword, signUpWithPassword } =
    useAuth();
  const enablePreviewMode = useAppStore((state) => state.enablePreviewMode);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  if (ready && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (isDevSingleUserMode) {
    return (
      <Screen scrollable contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Giris</Text>
        <Text style={styles.title}>Hesabin hazirlaniyor...</Text>
        <GlassCard tone="accent">
          <Text style={styles.sectionTitleAccent}>Otomatik giris</Text>
          <Text style={styles.copyAccent}>
            Oturumun otomatik olarak aciliyor. Birkac saniye bekle.
          </Text>
          <ActivityIndicator color={palette.surface} style={styles.loader} />
        </GlassCard>
      </Screen>
    );
  }

  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Eksik alan", "Email ve sifre alanlarini doldur.");
      return;
    }

    setPending(true);
    try {
      if (mode === "sign-in") {
        await signInWithPassword(email, password);
        router.replace("/(tabs)/home");
      } else {
        const result = await signUpWithPassword(email, password);
        if (result.session) {
          router.replace("/(tabs)/home");
        } else {
          Alert.alert(
            "Hesap olusturuldu",
            "Hesabin basariyla olusturuldu. Email dogrulamasi gerekiyorsa mailini kontrol et."
          );
        }
      }
    } catch (error) {
      Alert.alert("Giris hatasi", error instanceof Error ? error.message : "Bilinmeyen bir hata olustu.");
    } finally {
      setPending(false);
    }
  };

  const openPreview = () => {
    enablePreviewMode();
    router.replace("/(tabs)/home");
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Giris</Text>
      <Text style={styles.title}>Hesabina giris yap veya hizlica goz at.</Text>

      <GlassCard tone={backendConfigured ? "light" : "accent"}>
        <Text style={[styles.sectionTitle, !backendConfigured && styles.sectionTitleAccent]}>
          {backendConfigured ? "Hesap sistemi hazir" : "Hesap sistemi ayarlaniyor"}
        </Text>
        <Text style={[styles.copy, !backendConfigured && styles.copyAccent]}>
          {backendConfigured
            ? "Email ve sifre ile giris yap veya yeni hesap olustur."
            : "Sunucu baglantisi henuz kurulmadi. Deneme modunu kullanabilirsin."}
        </Text>
      </GlassCard>

      <GlassCard>
        <View style={styles.switchRow}>
          <PrimaryButton
            label="Giris yap"
            onPress={() => setMode("sign-in")}
            variant={mode === "sign-in" ? "primary" : "secondary"}
          />
          <PrimaryButton
            label="Hesap olustur"
            onPress={() => setMode("sign-up")}
            variant={mode === "sign-up" ? "primary" : "secondary"}
          />
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="ornek@email.com"
          />
          <TextField
            label="Sifre"
            value={password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            onChangeText={setPassword}
            placeholder="En az 8 karakter"
          />
        </View>

        <PrimaryButton
          label={pending ? "Isleniyor..." : mode === "sign-in" ? "Giris yap" : "Hesap olustur"}
          onPress={submit}
          disabled={pending || !backendConfigured}
        />
      </GlassCard>

      <PrimaryButton label="Deneme modunda gez" onPress={openPreview} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  eyebrow: {
    ...type.overline,
    color: palette.muted,
  },
  title: {
    ...type.hero,
    color: palette.ink,
  },
  sectionTitle: {
    ...type.h3,
    color: palette.ink,
    marginBottom: spacing.xs,
  },
  sectionTitleAccent: {
    color: palette.surface,
  },
  copy: {
    ...type.body,
    color: palette.muted,
  },
  copyAccent: {
    color: palette.surface,
  },
  loader: {
    marginTop: spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
});
