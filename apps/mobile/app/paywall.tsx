import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
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
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus");

  const handleClose = () => {
    router.back();
  };

  const handleStartTrial = () => {
    // Purchase logic would go here
    router.back();
  };

  const handleRestore = () => {
    // Restore purchases logic
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <MaterialIcons name="close" size={24} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>MEMBERSHIP</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ---- Hero Image ---- */}
      <View style={styles.heroContainer}>
        <Image
          source={require("../assets/images/paywall_hero.png")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(248,247,246,0.4)", palette.canvas]}
          style={styles.heroGradient}
        />
        {/* Hero text overlay */}
        <View style={styles.heroTextOverlay}>
          <Text style={styles.heroOverline}>THE SCIENCE OF STYLE</Text>
          <Text style={styles.heroHeadline}>
            Elevate Your{"\n"}
            <Text style={styles.heroHeadlineItalic}>Visual Identity</Text>
          </Text>
        </View>
      </View>

      {/* ---- Master your palette ---- */}
      <View style={styles.masterSection}>
        <Text style={styles.masterTitle}>Master your palette</Text>
        <Text style={styles.masterBody}>
          Access professional-grade seasonal analysis and personalized styling
          insights.
        </Text>
      </View>

      {/* ---- Feature list ---- */}
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <MaterialIcons
                name={feature.icon}
                size={22}
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

        <View style={styles.planList}>
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlan;
            const isFeatured = Boolean(plan.badge);

            return (
              <Pressable
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
          <Pressable onPress={handleRestore}>
            <Text style={styles.footerLink}>Restore Purchase</Text>
          </Pressable>
          <Text style={styles.footerDivider}>|</Text>
          <Pressable>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.footerDivider}>|</Text>
          <Pressable>
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
    width: 40,
    height: 40,
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

  /* Hero */
  heroContainer: {
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    overflow: "hidden",
    minHeight: 320,
    position: "relative",
    backgroundColor: palette.clay,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroOverline: {
    ...type.overline,
    color: palette.primary,
    letterSpacing: 2.5,
  },
  heroHeadline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "300",
    color: palette.ink,
  },
  heroHeadlineItalic: {
    fontWeight: "700",
    fontStyle: "italic",
  },

  /* Master your palette */
  masterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  masterTitle: {
    ...type.h2,
    color: palette.ink,
    textAlign: "center",
  },
  masterBody: {
    ...type.body,
    color: palette.muted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
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
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 9,
    color: "#ffffff",
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
    fontSize: 9,
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
    fontSize: 11,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  footerLink: {
    ...type.caption,
    fontSize: 12,
    color: "rgba(184, 115, 50, 0.7)",
  },
  footerDivider: {
    ...type.caption,
    color: palette.clay,
  },
});
