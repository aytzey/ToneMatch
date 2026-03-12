import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import {
  darkPalette,
  lightPalette,
  type ThemePalette,
} from "@/src/theme/palette";

type ThemeContextValue = {
  colorScheme: "light" | "dark";
  isDark: boolean;
  palette: ThemePalette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const colorScheme = systemScheme === "dark" ? "dark" : "light";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      isDark: colorScheme === "dark",
      palette: colorScheme === "dark" ? darkPalette : lightPalette,
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);

  if (value) {
    return value;
  }

  return {
    colorScheme: "light" as const,
    isDark: false,
    palette: lightPalette,
  };
}
