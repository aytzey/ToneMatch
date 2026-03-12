import { useId } from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";
import { useAppTheme } from "@/src/theme/theme-provider";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function TextField({
  error,
  hint,
  label,
  required = false,
  style,
  ...props
}: TextFieldProps) {
  const fallbackId = useId().replace(/:/g, "");
  const inputId = props.nativeID ?? `field-${fallbackId}`;
  const labelId = `${inputId}-label`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text nativeID={labelId} style={styles.label}>
          {label}
        </Text>
        {required ? <Text style={styles.required}>Required</Text> : null}
      </View>
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityLabelledBy={labelId}
        nativeID={inputId}
        placeholderTextColor={palette.muted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? (
        <Text nativeID={errorId} style={styles.errorText}>
          {error}
        </Text>
      ) : hint ? (
        <Text nativeID={hintId} style={styles.hintText}>
          {hint}
        </Text>
      ) : null}
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
    labelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    label: {
      ...type.caption,
      color: palette.muted,
    },
    required: {
      ...type.caption,
      color: palette.subtle,
      letterSpacing: 0.7,
      textTransform: "uppercase",
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
    inputError: {
      backgroundColor: palette.dangerSoft,
      borderColor: palette.red,
    },
    hintText: {
      ...type.caption,
      color: palette.subtle,
      lineHeight: 18,
    },
    errorText: {
      ...type.caption,
      color: palette.red,
      lineHeight: 18,
    },
  });
