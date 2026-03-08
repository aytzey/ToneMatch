import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AppProviders } from "@/src/providers/app-providers";
import { palette } from "@/src/theme/palette";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  return (
    <AppProviders>
      <StatusBar style="dark" backgroundColor={palette.canvas} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.canvas },
          animation: "fade",
        }}
      />
    </AppProviders>
  );
}
