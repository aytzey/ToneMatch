import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { TextField } from "@/src/components/text-field";
import { useAuth } from "@/src/features/auth/use-auth";
import { useAppCopy } from "@/src/providers/copy-provider";
import { useAppStore } from "@/src/store/app-store";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

export default function AuthScreen() {
  const router = useRouter();
  const copy = useAppCopy().auth;
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
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.title}>{copy.automaticSignInHeading}</Text>
        <SurfaceCard tone="accent">
          <Text style={styles.sectionTitleAccent}>{copy.automaticSignInTitle}</Text>
          <Text style={styles.copyAccent}>{copy.automaticSignInBody}</Text>
          <ActivityIndicator color={palette.surface} style={styles.loader} />
        </SurfaceCard>
      </Screen>
    );
  }

  const submit = async () => {
    if (!email || !password) {
      Alert.alert(copy.missingDetailsTitle, copy.missingDetailsBody);
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
          Alert.alert(copy.accountCreatedTitle, copy.accountCreatedBody);
        }
      }
    } catch (error) {
      Alert.alert(
        copy.signInErrorTitle,
        error instanceof Error ? error.message : copy.genericError,
      );
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
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.title}>{copy.title}</Text>

      <SurfaceCard tone={backendConfigured ? "default" : "accent"}>
        <Text style={[styles.sectionTitle, !backendConfigured && styles.sectionTitleAccent]}>
          {backendConfigured ? copy.readyTitle : copy.setupTitle}
        </Text>
        <Text style={[styles.copy, !backendConfigured && styles.copyAccent]}>
          {backendConfigured
            ? copy.readyBody
            : copy.setupBody}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <View style={styles.switchRow}>
          <PrimaryButton
            label={copy.signIn}
            onPress={() => setMode("sign-in")}
            variant={mode === "sign-in" ? "primary" : "secondary"}
          />
          <PrimaryButton
            label={copy.createAccount}
            onPress={() => setMode("sign-up")}
            variant={mode === "sign-up" ? "primary" : "secondary"}
          />
        </View>

        <View style={styles.form}>
          <TextField
            label={copy.emailLabel}
            value={email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={copy.emailPlaceholder}
          />
          <TextField
            label={copy.passwordLabel}
            value={password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            onChangeText={setPassword}
            placeholder={copy.passwordPlaceholder}
          />
        </View>

        <PrimaryButton
          label={
            pending
              ? copy.working
              : mode === "sign-in"
                ? copy.signIn
                : copy.createAccount
          }
          onPress={submit}
          disabled={pending || !backendConfigured}
        />
      </SurfaceCard>

      <PrimaryButton
        label={copy.continueInPreview}
        onPress={openPreview}
        variant="ghost"
      />
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
