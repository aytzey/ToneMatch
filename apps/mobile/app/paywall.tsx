import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { MetaPill } from "@/src/components/editorial-guide-primitives";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SurfaceCard } from "@/src/components/surface-card";
import { useSubscriptionState } from "@/src/features/billing/use-subscription-state";
import { useAppStore } from "@/src/store/app-store";
import { useAppTheme } from "@/src/theme/theme-provider";
import { useThemedStyles } from "@/src/theme/use-themed-styles";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

type PlanId = "free" | "plus" | "pro";

const plans: {
  id: PlanId;
  name: string;
  subtitle: string;
  price: string;
  perMonth?: boolean;
  badge?: string;
}[] = [
  {
    id: "free",
    name: "Free",
    subtitle: "Essential features",
    price: "$0",
  },
  {
    id: "plus",
    name: "ToneMatch Plus",
    subtitle: "Annual billing",
    price: "$9.99",
    perMonth: true,
    badge: "Most popular",
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "For fashion professionals",
    price: "$19.99",
    perMonth: true,
  },
] as const;

const features: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: "all-inclusive",
    title: "Unlimited color checks",
    description:
      "Analyze every outfit, fabric, and makeup swatch without limits.",
  },
  {
    icon: "visibility",
    title: "Advanced contrast analysis",
    description:
      "Go deeper on value, chroma, and undertone alignment before you shop.",
  },
  {
    icon: "smart-toy",
    title: "Personal stylist AI chat",
    description:
      "Get instant guidance when an outfit feels close but not quite stable.",
  },
  {
    icon: "trending-up",
    title: "Exclusive trend reports",
    description:
      "Stay aligned to your saved palette with monthly seasonal direction.",
  },
] as const;

export default function PaywallScreen() {
  const { width } = useWindowDimensions();
  const { palette } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isWide = width >= 960;
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus");
  const setPreviewPlan = useAppStore((state) => state.setPreviewPlan);
  const {
    presentPaywall,
    restorePurchases,
    revenueCatConfigured,
  } = useSubscriptionState();

  const handleClose = () => {
    router.back();
  };

  const handleStartTrial = async () => {
    if (revenueCatConfigured) {
      const result = await presentPaywall();
      if (
        result === "CANCELLED" ||
        result === "ERROR" ||
        result === "NOT_PRESENTED"
      ) {
        return;
      }
    }

    setPreviewPlan(selectedPlan);
    Alert.alert(
      "Plan updated",
      `Your app is now using the ${selectedPlan.toUpperCase()} experience.`,
    );
    router.back();
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? "Purchases restored" : "Nothing to restore",
      restored
        ? "Your subscription access has been refreshed."
        : "No previous purchases were found for this account.",
    );
  };

  return (
    <Screen
      accessibilityLabel="Membership screen"
      contentContainerStyle={styles.content}
      role="main"
      scrollable
    >
      <View style={styles.pageShell}>
        <View role="banner" style={styles.header}>
          <Pressable
            accessibilityLabel="Close membership screen"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.headerPressed,
            ]}
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color={palette.ink} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Membership
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <SurfaceCard tone="muted">
          <View style={[styles.membershipIntro, isWide && styles.membershipIntroWide]}>
            <View style={styles.membershipCopy}>
              <Text style={styles.heroOverline}>Editorial membership</Text>
              <Text accessibilityRole="header" style={styles.heroHeadline}>
                Train your closet around a
                <Text style={styles.heroHeadlineItalic}> stable palette</Text>
              </Text>
              <Text style={styles.masterBody}>
                Access deeper seasonal analysis, clearer shopping decisions, and
                a feed that stays anchored to your saved result instead of
                drifting every week.
              </Text>
              <View style={styles.membershipMeta}>
                <MetaPill label="7-day free trial" />
                <MetaPill label="Cancel anytime" tone="dark" />
                <MetaPill label="Analysis-led styling" />
              </View>
            </View>

            <View style={styles.membershipVisualColumn}>
              <View style={styles.heroFrameLarge}>
                <Image
                  accessibilityLabel="Preview of the premium editorial styling feed"
                  accessibilityRole="image"
                  source={require("../assets/images/paywall_hero.jpg")}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroFrameSmall}>
                <Text style={styles.heroFrameLabel}>What changes after upgrade</Text>
                <Text style={styles.heroFrameText}>
                  More scans, deeper contrast guidance, and a wardrobe feed that
                  stays disciplined around your saved result.
                </Text>
              </View>
            </View>
          </View>
        </SurfaceCard>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.benefitsColumn}>
            <SurfaceCard>
              <View
                accessibilityLabel="Membership benefits"
                role="region"
                style={styles.featureList}
              >
                <Text style={styles.sectionEyebrow}>What you unlock</Text>
                {features.map((feature, index) => (
                  <View key={feature.title} style={styles.featureRow}>
                    <View style={styles.featureMarker}>
                      <Text style={styles.featureMarkerText}>
                        {`${index + 1}`.padStart(2, "0")}
                      </Text>
                      <MaterialIcons
                        name={feature.icon}
                        size={18}
                        color={palette.primary}
                      />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDesc}>{feature.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </SurfaceCard>
          </View>

          <View style={styles.purchaseColumn}>
            <SurfaceCard>
              <View accessibilityRole="radiogroup" style={styles.planSection}>
                <Text style={styles.sectionEyebrow}>Select your experience</Text>
                <View style={styles.planList}>
                  {plans.map((plan) => {
                    const isSelected = plan.id === selectedPlan;
                    const isFeatured = Boolean(plan.badge);

                    return (
                      <Pressable
                        accessibilityLabel={`${plan.name}, ${plan.price}${plan.perMonth ? " per month" : ""}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        key={plan.id}
                        style={({ pressed }) => [
                          styles.planRow,
                          isFeatured && styles.planRowFeatured,
                          isSelected && styles.planRowSelected,
                          pressed && styles.planRowPressed,
                        ]}
                        onPress={() => setSelectedPlan(plan.id)}
                      >
                        {plan.badge ? (
                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{plan.badge}</Text>
                          </View>
                        ) : null}

                        <View style={styles.planRowInner}>
                          <View style={styles.planInfo}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                          </View>

                          <View style={styles.planPriceBlock}>
                            <Text style={styles.planPrice}>{plan.price}</Text>
                            {plan.perMonth ? (
                              <Text style={styles.planPeriod}>Per month</Text>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SurfaceCard>

            <SurfaceCard tone="default">
              <View accessibilityLabel="Membership checkout" role="region">
                <PrimaryButton
                  label="Start 7-Day Free Trial"
                  onPress={handleStartTrial}
                />

                <Text style={styles.finePrint}>
                  After the trial, ToneMatch Plus is $119.99/year. Cancel anytime
                  in your account settings.
                </Text>

                <View style={styles.footerLinks}>
                  <Pressable
                    accessibilityLabel="Restore purchases"
                    accessibilityRole="button"
                    onPress={handleRestore}
                  >
                    <Text style={styles.footerLink}>Restore Purchase</Text>
                  </Pressable>
                  <Text style={styles.footerDivider}>|</Text>
                  <Pressable
                    accessibilityLabel="Open Terms of Service"
                    accessibilityRole="link"
                    onPress={() => Linking.openURL("https://tonematch.app/terms")}
                  >
                    <Text style={styles.footerLink}>Terms of Service</Text>
                  </Pressable>
                  <Text style={styles.footerDivider}>|</Text>
                  <Pressable
                    accessibilityLabel="Open privacy policy"
                    accessibilityRole="link"
                    onPress={() => Linking.openURL("https://tonematch.app/privacy")}
                  >
                    <Text style={styles.footerLink}>Privacy</Text>
                  </Pressable>
                </View>
              </View>
            </SurfaceCard>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (palette: import("@/src/theme/palette").ThemePalette) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing.xxl,
    },
    pageShell: {
      alignSelf: "center",
      gap: spacing.lg,
      maxWidth: 1180,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      width: "100%",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    closeButton: {
      alignItems: "center",
      borderRadius: radius.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerPressed: {
      opacity: 0.84,
    },
    headerTitle: {
      ...type.sectionHeader,
      color: palette.ink,
      flex: 1,
      textAlign: "center",
    },
    headerSpacer: {
      width: 44,
    },
    membershipIntro: {
      gap: spacing.lg,
    },
    membershipIntroWide: {
      alignItems: "stretch",
      flexDirection: "row",
    },
    membershipCopy: {
      flex: 1.06,
      gap: spacing.sm,
      justifyContent: "center",
    },
    heroOverline: {
      ...type.overline,
      color: palette.primary,
      letterSpacing: 2.5,
    },
    heroHeadline: {
      ...type.displayHero,
      color: palette.ink,
    },
    heroHeadlineItalic: {
      fontFamily: "CormorantGaramond_600SemiBold_Italic",
      fontWeight: "600",
    },
    masterBody: {
      ...type.body,
      color: palette.muted,
      lineHeight: 22,
      maxWidth: 420,
    },
    membershipMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    membershipVisualColumn: {
      flex: 0.94,
      gap: spacing.md,
    },
    heroFrameLarge: {
      backgroundColor: palette.accentSoft,
      borderRadius: radius.xl,
      minHeight: 280,
      overflow: "hidden",
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      height: undefined,
      width: undefined,
    },
    heroFrameSmall: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    heroFrameLabel: {
      ...type.sectionHeader,
      color: palette.primary,
    },
    heroFrameText: {
      ...type.body,
      color: palette.charcoal,
      lineHeight: 21,
    },
    contentGrid: {
      gap: spacing.lg,
    },
    contentGridWide: {
      alignItems: "flex-start",
      flexDirection: "row",
    },
    benefitsColumn: {
      flex: 1.04,
    },
    purchaseColumn: {
      gap: spacing.lg,
      minWidth: 320,
    },
    sectionEyebrow: {
      ...type.overline,
      color: palette.muted,
      letterSpacing: 2.4,
      marginBottom: spacing.sm,
    },
    featureList: {
      gap: spacing.lg,
    },
    featureRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.md,
    },
    featureMarker: {
      gap: spacing.xs,
      minWidth: 54,
      paddingTop: 2,
    },
    featureMarkerText: {
      ...type.caption,
      color: palette.primary,
      letterSpacing: 1.2,
    },
    featureText: {
      flex: 1,
      gap: 2,
    },
    featureTitle: {
      ...type.label,
      color: palette.ink,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    featureDesc: {
      ...type.body,
      color: palette.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    planSection: {
      gap: spacing.md,
    },
    planList: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    planRow: {
      backgroundColor: palette.canvas,
      borderColor: palette.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      overflow: "visible",
      position: "relative",
    },
    planRowFeatured: {
      backgroundColor: palette.primaryMuted,
      borderColor: palette.primary,
      borderWidth: 2,
    },
    planRowSelected: {
      borderColor: palette.primary,
      borderWidth: 2,
    },
    planRowPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    planRowInner: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    planBadge: {
      alignSelf: "center",
      backgroundColor: palette.primary,
      borderRadius: radius.full,
      left: "50%",
      paddingHorizontal: 14,
      paddingVertical: 5,
      position: "absolute",
      top: -12,
      transform: [{ translateX: -52 }],
      zIndex: 1,
    },
    planBadgeText: {
      ...type.overline,
      color: palette.onPrimary,
      fontSize: 12,
      letterSpacing: 1.6,
      textTransform: "uppercase",
    },
    planInfo: {
      flex: 1,
      gap: 2,
    },
    planName: {
      ...type.label,
      color: palette.ink,
      fontSize: 16,
    },
    planSubtitle: {
      ...type.caption,
      color: palette.muted,
      fontStyle: "italic",
    },
    planPriceBlock: {
      alignItems: "flex-end",
      gap: 2,
    },
    planPrice: {
      ...type.h2,
      color: palette.ink,
    },
    planPeriod: {
      ...type.overline,
      color: palette.muted,
      fontSize: 12,
      letterSpacing: 1,
    },
    finePrint: {
      ...type.caption,
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: spacing.md,
      paddingHorizontal: spacing.sm,
      textAlign: "center",
    },
    footerLinks: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      justifyContent: "center",
      marginTop: spacing.md,
    },
    footerLink: {
      ...type.caption,
      color: palette.primary,
      fontSize: 12,
    },
    footerDivider: {
      ...type.caption,
      color: palette.clay,
    },
  });
