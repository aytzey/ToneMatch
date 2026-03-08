import { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { palette } from "@/src/theme/palette";

type ScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scrollable = false, contentContainerStyle }: ScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
});
