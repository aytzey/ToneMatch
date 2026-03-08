import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";

type GlassCardProps = PropsWithChildren<{
  tone?: "light" | "dark" | "accent";
}>;

export function GlassCard({ children, tone = "light" }: GlassCardProps) {
  return <View style={[styles.base, toneStyles[tone]]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
});

const toneStyles = StyleSheet.create({
  light: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  dark: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  accent: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
});
