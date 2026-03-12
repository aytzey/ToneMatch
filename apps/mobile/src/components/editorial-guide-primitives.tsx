import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { hexForColorName } from "@/src/lib/color-name-hex";
import { radius, spacing } from "@/src/theme/spacing";
import { useAppTheme } from "@/src/theme/theme-provider";
import { type } from "@/src/theme/type";
import { useThemedStyles } from "@/src/theme/use-themed-styles";

export function GuideHeader({
  title,
  onBack,
  onShare,
}: {
  title: string;
  onBack: () => void;
  onShare?: () => void;
}) {
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.headerButton}
      >
        <MaterialIcons name="arrow-back" size={24} color={palette.charcoal} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {onShare ? (
        <Pressable
          accessibilityLabel={`Share ${title.toLowerCase()}`}
          accessibilityRole="button"
          onPress={onShare}
          style={styles.headerButton}
        >
          <MaterialIcons name="share" size={22} color={palette.charcoal} />
        </Pressable>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

export function MetaPill({
  label,
  tone = "light",
}: {
  label: string;
  tone?: "light" | "dark";
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.metaPill, tone === "dark" ? styles.metaPillDark : styles.metaPillLight]}>
      <Text
        numberOfLines={1}
        style={[
          styles.metaPillText,
          tone === "dark" ? styles.metaPillTextDark : styles.metaPillTextLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function ColorChip({ label }: { label: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.colorChip}>
      <View style={[styles.colorDot, { backgroundColor: hexForColorName(label) }]} />
      <Text numberOfLines={1} style={styles.colorChipText}>
        {label}
      </Text>
    </View>
  );
}

export function BulletList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.listBlock}>
      <Text style={styles.listTitle}>{title}</Text>
      <View style={styles.listItems}>
        {items.map((item) => (
          <View key={`${title}-${item}`} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (
  palette: import("@/src/theme/palette").ThemePalette,
) =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: spacing.md,
    },
    headerButton: {
      alignItems: "center",
      borderRadius: radius.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerTitle: {
      ...type.sectionHeader,
      color: palette.charcoal,
      letterSpacing: 2,
    },
    metaPill: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    metaPillLight: {
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderWidth: 1,
    },
    metaPillDark: {
      backgroundColor: palette.ink,
      borderColor: palette.ink,
      borderWidth: 1,
    },
    metaPillText: {
      ...type.caption,
      letterSpacing: 1,
    },
    metaPillTextLight: {
      color: palette.charcoal,
    },
    metaPillTextDark: {
      color: palette.onDark,
    },
    colorChip: {
      alignItems: "center",
      backgroundColor: palette.primaryMuted,
      borderColor: palette.border,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    colorDot: {
      borderRadius: radius.full,
      height: 12,
      width: 12,
    },
    colorChipText: {
      ...type.caption,
      color: palette.charcoal,
    },
    listBlock: {
      marginBottom: spacing.lg,
    },
    listTitle: {
      ...type.label,
      color: palette.charcoal,
      marginBottom: spacing.sm,
    },
    listItems: {
      gap: spacing.sm,
    },
    bulletRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
    },
    bulletDot: {
      backgroundColor: palette.primary,
      borderRadius: radius.full,
      flexShrink: 0,
      height: 6,
      marginTop: 7,
      width: 6,
    },
    bulletText: {
      ...type.body,
      color: palette.charcoal,
      flex: 1,
    },
  });
