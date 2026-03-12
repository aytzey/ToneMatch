import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from "@expo-google-fonts/cormorant-garamond";
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
import { ActivityIndicator, View, useColorScheme } from "react-native";

import { AppProviders } from "@/src/providers/app-providers";
import { darkPalette, lightPalette } from "@/src/theme/palette";
import { useAppTheme } from "@/src/theme/theme-provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
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

  const splashPalette = colorScheme === "dark" ? darkPalette : lightPalette;

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: splashPalette.canvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={splashPalette.primary} size="large" />
      </View>
    );
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const { isDark, palette } = useAppTheme();

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={palette.canvas}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.canvas },
          animation: "fade",
        }}
      />
    </>
  );
}
