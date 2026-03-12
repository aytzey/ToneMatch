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
import { spacing } from "@/src/theme/spacing";
import { useThemedStyles } from "@/src/theme/use-themed-styles";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";

export default function AuthScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const copy = useAppCopy().auth;
  const { backendConfigured, isAuthenticated, isDevSingleUserMode, ready, signInWithPassword, signUpWithPassword } =
    useAuth();
  const enablePreviewMode = useAppStore((state) => state.enablePreviewMode);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [pending, setPending] = useState(false);

  if (ready && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (isDevSingleUserMode) {
    return (
      <Screen
        accessibilityLabel="Authentication screen"
        contentContainerStyle={styles.content}
        role="main"
        scrollable
      >
        <Text accessibilityRole="header" style={styles.eyebrow}>
          {copy.eyebrow}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.automaticSignInHeading}
        </Text>
        <SurfaceCard tone="accent">
          <Text style={styles.sectionTitleAccent}>{copy.automaticSignInTitle}</Text>
          <Text style={styles.copyAccent}>{copy.automaticSignInBody}</Text>
          <ActivityIndicator color={palette.surface} style={styles.loader} />
        </SurfaceCard>
      </Screen>
    );
  }

  const submit = async () => {
    const trimmedEmail = email.trim();
    const nextErrors: typeof errors = {};

    if (!trimmedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Use a valid email address.";
    }

    if (!password) {
      nextErrors.password =
        mode === "sign-up"
          ? "Create a password to continue."
          : "Enter your password.";
    } else if (mode === "sign-up" && password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      if (mode === "sign-in") {
        await signInWithPassword(trimmedEmail, password);
        router.replace("/(tabs)/home");
      } else {
        const result = await signUpWithPassword(trimmedEmail, password);
        if (result.session) {
          router.replace("/(tabs)/home");
        } else {
          Alert.alert(copy.accountCreatedTitle, copy.accountCreatedBody);
        }
      }
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error instanceof Error ? error.message : copy.genericError,
      }));
    } finally {
      setPending(false);
    }
  };

  const openPreview = () => {
    enablePreviewMode();
    router.replace("/(tabs)/home");
  };

  return (
    <Screen
      accessibilityLabel="Authentication screen"
      contentContainerStyle={styles.content}
      role="main"
      scrollable
    >
      <Text accessibilityRole="header" style={styles.eyebrow}>
        {copy.eyebrow}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>

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
            error={errors.email}
            hint="Use the address tied to your analysis history."
            label={copy.emailLabel}
            value={email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={(value) => {
              setEmail(value);
              setErrors((current) => ({ ...current, email: undefined, form: undefined }));
            }}
            placeholder={copy.emailPlaceholder}
            required
          />
          <TextField
            error={errors.password}
            hint={mode === "sign-up" ? "At least 8 characters." : undefined}
            label={copy.passwordLabel}
            value={password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: undefined, form: undefined }));
            }}
            placeholder={copy.passwordPlaceholder}
            required
          />
        </View>

        {errors.form ? (
          <Text accessibilityRole="alert" style={styles.formError}>
            {errors.form}
          </Text>
        ) : null}

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

const createStyles = (palette: import("@/src/theme/palette").ThemePalette) =>
  StyleSheet.create({
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
  formError: {
    ...type.caption,
    color: palette.red,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});
