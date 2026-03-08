import { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

type TextFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
};

export function TextField({ label, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...type.caption,
    color: palette.muted,
  },
  input: {
    ...type.body,
    backgroundColor: palette.canvas,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    color: palette.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
