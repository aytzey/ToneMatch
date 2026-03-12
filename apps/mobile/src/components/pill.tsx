import { StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/src/theme/spacing";
import { useThemedStyles } from "@/src/theme/use-themed-styles";
import { type } from "@/src/theme/type";

export function Pill({ label, subtle = false }: { label: string; subtle?: boolean }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.base, subtle ? styles.subtle : styles.default]}>
      <Text style={[styles.label, subtle ? styles.subtleLabel : styles.defaultLabel]}>{label}</Text>
    </View>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    default: {
      backgroundColor: palette.primarySoft,
    },
    subtle: {
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.border,
    },
    label: {
      ...type.caption,
    },
    defaultLabel: {
      color: palette.primary,
    },
    subtleLabel: {
      color: palette.muted,
    },
  });
