import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { useThemedStyles } from "@/src/theme/use-themed-styles";

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
  keyboardDismissMode?: "none" | "interactive" | "on-drag";
  edges?: Edge[];
}>;

export function Screen({
  children,
  scrollable = false,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  keyboardDismissMode = "on-drag",
  edges,
}: ScreenProps) {
  const styles = useThemedStyles(createStyles);

  if (scrollable) {
    return (
      <SafeAreaView edges={edges} style={styles.safe}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardDismissMode={keyboardDismissMode}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (palette: import("@/src/theme/palette").ThemePalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: palette.canvas,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
