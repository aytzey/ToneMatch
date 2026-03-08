import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/primary-button";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

export function FeedbackStrip({
  onSubmit,
}: {
  onSubmit: (signal: string) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = async (signal: string) => {
    try {
      await onSubmit(signal);
      setSelected(signal);
    } catch (error) {
      Alert.alert("Feedback error", error instanceof Error ? error.message : "Feedback kaydedilemedi.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Feedback</Text>
      <View style={styles.row}>
        <PrimaryButton
          label={selected === "fits_me" ? "Saved" : "Fits me"}
          onPress={() => handleSubmit("fits_me")}
          variant={selected === "fits_me" ? "primary" : "secondary"}
        />
        <PrimaryButton
          label={selected === "too_cool" ? "Saved" : "Too cool"}
          onPress={() => handleSubmit("too_cool")}
          variant={selected === "too_cool" ? "primary" : "ghost"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...type.caption,
    color: palette.muted,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
