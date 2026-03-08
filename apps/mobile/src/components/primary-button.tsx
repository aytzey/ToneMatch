import { MaterialIcons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

type PrimaryButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function PrimaryButton({
  label,
  href,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
}: PrimaryButtonProps) {
  const inner = (
    <Pressable
      disabled={disabled}
      onPress={href ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={20} color={variant === "primary" ? "#fff" : palette.primary} style={{ marginRight: 8 }} /> : null}
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
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

const styles = StyleSheet.create({
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
});

const variantStyles = StyleSheet.create({
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
});

const labelStyles = StyleSheet.create({
  primary: {
    color: "#ffffff",
  },
  secondary: {
    color: palette.charcoal,
  },
  ghost: {
    color: palette.primary,
  },
});
