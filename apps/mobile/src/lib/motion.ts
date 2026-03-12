import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing, Platform } from "react-native";

export const motionEasing = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  settle: Easing.bezier(0.25, 1, 0.5, 1),
} as const;

export const motionUseNativeDriver = Platform.OS !== "web";

export function motionDuration(reducedMotion: boolean, duration: number) {
  return reducedMotion ? 1 : duration;
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReducedMotion(enabled);
        }
      })
      .catch(() => {
        // Keep the default branch if the platform cannot resolve the preference.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
