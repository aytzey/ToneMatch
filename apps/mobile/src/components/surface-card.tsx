import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { radius, spacing } from "@/src/theme/spacing";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

type SurfaceCardProps = PropsWithChildren<{
  tone?: "default" | "muted" | "dark" | "accent";
  style?: StyleProp<ViewStyle>;
}>;

export function SurfaceCard({
  children,
  tone = "default",
  style,
}: SurfaceCardProps) {
  const styles = useThemedStyles(createStyles);

  return <View style={[styles.base, styles[tone], style]}>{children}</View>;
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
    },
    default: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
    },
    muted: {
      backgroundColor: palette.surfaceRaised,
      borderColor: palette.borderLight,
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
