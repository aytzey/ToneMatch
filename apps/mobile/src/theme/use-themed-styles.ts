import { useMemo } from "react";

import {
  useAppTheme,
} from "@/src/theme/theme-provider";
import type { ThemePalette } from "@/src/theme/palette";

export function useThemedStyles<T>(factory: (palette: ThemePalette) => T): T {
  const { palette } = useAppTheme();

  return useMemo(() => factory(palette), [factory, palette]);
}
