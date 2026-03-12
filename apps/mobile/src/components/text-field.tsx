import { useId } from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";
import { useAppTheme } from "@/src/theme/theme-provider";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...props }: TextFieldProps) {
  const fallbackId = useId().replace(/:/g, "");
  const inputId = props.nativeID ?? `field-${fallbackId}`;
  const labelId = `${inputId}-label`;
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <Text nativeID={labelId} style={styles.label}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityLabelledBy={labelId}
        nativeID={inputId}
        placeholderTextColor={palette.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
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
      minHeight: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
  });
