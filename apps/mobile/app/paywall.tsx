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
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Plan data                                                         */
/* ------------------------------------------------------------------ */

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
    badge: "MOST POPULAR",
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "For fashion professionals",
    price: "$19.99",
    perMonth: true,
  },
];

const features: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: "all-inclusive",
    title: "UNLIMITED COLOR CHECKS",
    description:
      "Analyze every outfit, fabric, and makeup swatch without limits.",
  },
  {
    icon: "visibility",
    title: "ADVANCED CONTRAST ANALYSIS",
    description:
      "Deep dive into value and chroma matching for your specific skin undertones.",
  },
  {
    icon: "smart-toy",
    title: "PERSONAL STYLIST AI CHAT",
    description:
      "24/7 access to your digital concierge for instant fashion advice.",
  },
  {
    icon: "trending-up",
    title: "EXCLUSIVE TREND REPORTS",
    description:
      "Stay ahead with monthly palettes curated for your unique seasonal type.",
  },
];

/* ------------------------------------------------------------------ */
/*  Paywall Screen                                                    */
/* ------------------------------------------------------------------ */

export default function PaywallScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
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
      if (result === "CANCELLED" || result === "ERROR" || result === "NOT_PRESENTED") {
        return;
      }
    }

    setPreviewPlan(selectedPlan);
    Alert.alert("Plan updated", `Your app is now using the ${selectedPlan.toUpperCase()} experience.`);
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
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close membership screen"
          accessibilityRole="button"
          style={styles.closeButton}
          onPress={handleClose}
        >
          <MaterialIcons name="close" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>MEMBERSHIP</Text>
        <View style={styles.headerSpacer} />
      </View>

      <SurfaceCard tone="muted">
        <View style={[styles.membershipIntro, isWide && styles.membershipIntroWide]}>
          <View style={styles.membershipCopy}>
            <Text style={styles.heroOverline}>EDITORIAL MEMBERSHIP</Text>
            <Text style={styles.heroHeadline}>
              Train your closet around a
              <Text style={styles.heroHeadlineItalic}> stable palette</Text>
            </Text>
            <Text style={styles.masterBody}>
              Access professional-grade seasonal analysis, clearer shopping decisions, and a more consistent visual identity across every outfit.
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
                source={require("../assets/images/paywall_hero.png")}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.heroFrameSmall}>
              <Text style={styles.heroFrameLabel}>What changes after upgrade</Text>
              <Text style={styles.heroFrameText}>
                More scans, deeper contrast guidance, and a feed that stays anchored to your saved result.
              </Text>
            </View>
          </View>
        </View>
      </SurfaceCard>

      {/* ---- Feature list ---- */}
      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureMarker}>
              <Text style={styles.featureMarkerText}>{`${index + 1}`.padStart(2, "0")}</Text>
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

      {/* ---- Plan selection ---- */}
      <View style={styles.planSection}>
        <Text style={styles.planSectionHeader}>SELECT YOUR EXPERIENCE</Text>

        <View accessibilityRole="radiogroup" style={styles.planList}>
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlan;
            const isFeatured = Boolean(plan.badge);

            return (
              <Pressable
                accessibilityLabel={`${plan.name}, ${plan.price}${plan.perMonth ? " per month" : ""}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={plan.id}
                style={[
                  styles.planRow,
                  isFeatured && styles.planRowFeatured,
                  isSelected && styles.planRowSelected,
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
                      <Text style={styles.planPeriod}>PER MONTH</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ---- CTA ---- */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          label="Start 7-Day Free Trial"
          onPress={handleStartTrial}
        />

        <Text style={styles.finePrint}>
          After the trial, ToneMatch Plus is $119.99/year. Cancel anytime in
          your account settings.
        </Text>

        {/* Footer links */}
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
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...type.sectionHeader,
    color: palette.ink,
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
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
    maxWidth: 360,
    lineHeight: 22,
  },
  membershipIntro: {
    gap: spacing.lg,
  },
  membershipIntroWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  membershipCopy: {
    flex: 1.1,
    gap: spacing.sm,
  },
  membershipMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  membershipVisualColumn: {
    flex: 0.9,
    gap: spacing.md,
  },
  heroFrameLarge: {
    minHeight: 240,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: palette.accentSoft,
  },
  heroFrameSmall: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroFrameLabel: {
    ...type.sectionHeader,
    color: palette.primary,
  },
  heroFrameText: {
    ...type.body,
    color: palette.charcoal,
  },

  /* Features */
  featureList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  featureMarker: {
    minWidth: 54,
    gap: spacing.xs,
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
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  featureDesc: {
    ...type.body,
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },

  /* Plan selection */
  planSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  planSectionHeader: {
    ...type.overline,
    color: palette.muted,
    paddingHorizontal: spacing.sm,
    letterSpacing: 3,
  },
  planList: {
    gap: 12,
  },
  planRow: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    backgroundColor: palette.canvas,
    overflow: "visible",
    position: "relative",
  },
  planRowFeatured: {
    borderWidth: 2,
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },
  planRowSelected: {
    borderColor: palette.primary,
    borderWidth: 2,
  },
  planRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  planBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -52 }],
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    zIndex: 1,
  },
  planBadgeText: {
    ...type.overline,
    fontSize: 12,
    color: palette.onPrimary,
    letterSpacing: 2,
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planName: {
    ...type.label,
    fontSize: 16,
    color: palette.ink,
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
    fontSize: 12,
    color: palette.muted,
    letterSpacing: 1,
  },

  /* CTA */
  ctaSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },
  finePrint: {
    ...type.caption,
    fontSize: 12,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  footerLink: {
    ...type.caption,
    fontSize: 12,
    color: palette.primary,
  },
  footerDivider: {
    ...type.caption,
    color: palette.clay,
  },
});
