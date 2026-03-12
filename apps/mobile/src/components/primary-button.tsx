import { MaterialIcons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";
import { useAppTheme } from "@/src/theme/theme-provider";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

type PrimaryButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function PrimaryButton({
  label,
  href,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
  accessibilityLabel,
  accessibilityHint,
}: PrimaryButtonProps) {
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const inner = (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole={href || onPress ? "button" : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={href ? undefined : onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={20}
          color={variant === "primary" ? palette.onPrimary : palette.primary}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {inner}
      </Link>
    );
  }

  return inner;
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
    button: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight: 52,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.45,
    },
    label: {
      ...type.label,
      fontSize: 15,
    },
    icon: {
      marginRight: spacing.sm,
    },
    primary: {
      backgroundColor: palette.primary,
    },
    secondary: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    primaryLabel: {
      color: palette.onPrimary,
    },
    secondaryLabel: {
      color: palette.charcoal,
    },
    ghostLabel: {
      color: palette.primary,
    },
  });
