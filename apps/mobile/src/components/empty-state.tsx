import type { Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

export function EmptyState({
  title,
  copy,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  copy: string;
  ctaLabel?: string;
  ctaHref?: Href;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
      {ctaLabel ? <PrimaryButton label={ctaLabel} href={ctaHref} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...type.h3,
    color: palette.charcoal,
  },
  copy: {
    ...type.body,
    color: palette.muted,
  },
});
