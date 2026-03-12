import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useSubscriptionState } from "@/src/features/billing/use-subscription-state";
import { useAuth } from "@/src/features/auth/use-auth";
import { useStyleProfile } from "@/src/features/style/use-style-profile";
import { buildEditorialStory } from "@/src/lib/style-story";
import { deleteAccountData, exportAccountData } from "@/src/lib/tonematch-api";
import { palette } from "@/src/theme/palette";
import { radius, spacing } from "@/src/theme/spacing";
import { type } from "@/src/theme/type";

/* ------------------------------------------------------------------ */
/*  Profile Screen — matches profile_style_signature design           */
/* ------------------------------------------------------------------ */

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: profile } = useStyleProfile();
  const { data: subscription } = useSubscriptionState();
  const [exporting, setExporting] = useState(false);
  const story = buildEditorialStory(profile);
  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split("@")[0] ??
    "ToneMatch Member";
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const memberSince = createdAt
    ? createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    : "RECENTLY";
  const planLabel = subscription?.plan ? `ToneMatch ${subscription.plan.toUpperCase()}` : "ToneMatch";

  /* ---------- handlers ---------- */

  const handleManagePlan = () => {
    router.push("/paywall");
  };

  const handleNotifications = () => {
    Alert.alert(
      "Notifications",
      "Notification controls will live here once push preferences are enabled."
    );
  };

  const handleLanguage = () => {
    Alert.alert(
      "Language",
      "The app is currently optimized for English. Additional language support is being expanded."
    );
  };

  const handleSupportCenter = async () => {
    await Linking.openURL("mailto:support@tonematch.app?subject=ToneMatch%20Support");
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportAccountData();
      Alert.alert("Export complete", "Your color data has been exported.");
    } catch (error) {
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "Could not export data."
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently remove your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccountData();
              await signOut();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Could not delete account."
              );
            }
          },
        },
      ]
    );
  };

  /* ---------- render ---------- */

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          accessibilityLabel="Open profile settings"
          accessibilityRole="button"
          style={styles.settingsButton}
          onPress={() => Alert.alert("Profile settings", "Notifications, language, privacy, and export controls are available in the sections below.")}
        >
          <MaterialIcons name="settings" size={24} color={palette.ink} />
        </Pressable>
      </View>

      {/* ---- Avatar + Identity ---- */}
      <View style={styles.identitySection}>
        {/* Avatar ring */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <Image
              source={require("../../assets/images/profile_avatar.png")}
              style={styles.avatar}
            />
          </View>
          {/* Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>VERIFIED PALETTE</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.userName}>{displayName}</Text>

        {/* Season chip */}
        <View style={styles.seasonChip}>
          <View style={styles.greenDot} />
          <Text style={styles.seasonChipText}>{story.seasonTitle}</Text>
        </View>

        {/* Member since */}
        <Text style={styles.memberSince}>MEMBER SINCE {memberSince}</Text>
      </View>

      {/* ---- ToneMatch Plus promo card ---- */}
      <View style={styles.promoCard}>
        {/* Decorative blur glow */}
        <View style={styles.promoGlow} />

        <View style={styles.promoContent}>
          <View style={styles.promoTextBlock}>
            <View style={styles.promoTitleRow}>
              <MaterialIcons
                name="workspace-premium"
                size={22}
                color={palette.primary}
              />
              <Text style={styles.promoTitle}>{planLabel}</Text>
            </View>
            <Text style={styles.promoBody}>
              {profile
                ? `${story.undertoneLabel} x ${story.contrastLabel} is active across your recommendations and wardrobe.`
                : "Your personal color consultant is active."}
            </Text>
            <PrimaryButton label="Manage Plan" onPress={handleManagePlan} />
          </View>

          <Image
            source={require("../../assets/images/paywall_hero.png")}
            style={styles.promoImage}
          />
        </View>
      </View>

      {/* ---- ACCOUNT EXPERIENCE ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACCOUNT EXPERIENCE</Text>

        <SettingsRow icon="notifications" label="Notifications" onPress={handleNotifications} />
        <SettingsRow
          icon="translate"
          label="Language"
          value="English (US)"
          onPress={handleLanguage}
        />
        <SettingsRow
          icon="help-outline"
          label="Support Center"
          onPress={handleSupportCenter}
          showBorder={false}
        />
      </View>

      {/* ---- DATA & PRIVACY ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>DATA & PRIVACY</Text>

        {/* Privacy & Trust card */}
        <View style={styles.privacyCard}>
          <MaterialIcons
            name="verified-user"
            size={22}
            color={palette.primary}
          />
          <View style={styles.privacyCardText}>
            <Text style={styles.privacyCardTitle}>Privacy & Trust</Text>
            <Text style={styles.privacyCardBody}>
              Your analysis snapshot, wardrobe fit notes, and color profile stay linked to your account and are never sold to third parties.
            </Text>
          </View>
        </View>

        {/* Export row */}
        <Pressable
          accessibilityLabel="Export my color data"
          accessibilityRole="button"
          accessibilityState={{ disabled: exporting }}
          disabled={exporting}
          style={[styles.actionRow, exporting && styles.actionRowDisabled]}
          onPress={handleExport}
        >
          <MaterialIcons
            name="file-download"
            size={22}
            color={palette.muted}
          />
          <Text style={styles.actionRowLabel}>
            {exporting ? "Exporting Color Data..." : "Export My Color Data"}
          </Text>
        </Pressable>

        {/* Delete account row */}
        <Pressable
          accessibilityLabel="Delete account"
          accessibilityRole="button"
          style={styles.actionRow}
          onPress={handleDeleteAccount}
        >
          <MaterialIcons
            name="no-accounts"
            size={22}
            color={palette.red}
          />
          <Text style={[styles.actionRowLabel, styles.deleteText]}>
            Delete Account
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings row component                                            */
/* ------------------------------------------------------------------ */

function SettingsRow({
  icon,
  label,
  onPress,
  value,
  showBorder = true,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  value?: string;
  showBorder?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.settingsRow, showBorder && styles.settingsRowBorder]}
    >
      <View style={styles.settingsRowLeft}>
        <MaterialIcons name={icon} size={22} color={palette.muted} />
        <Text style={styles.settingsRowLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value ? <Text style={styles.settingsRowValue}>{value}</Text> : null}
        <MaterialIcons name="chevron-right" size={22} color={palette.clay} />
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const AVATAR_SIZE = 128;
const RING_WIDTH = 4;

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...type.h2,
    color: palette.ink,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Identity */
  identitySection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatarRing: {
    width: AVATAR_SIZE + RING_WIDTH * 2,
    height: AVATAR_SIZE + RING_WIDTH * 2,
    borderRadius: (AVATAR_SIZE + RING_WIDTH * 2) / 2,
    borderWidth: RING_WIDTH,
    borderColor: palette.focusRing,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedBadgeText: {
    ...type.overline,
    fontSize: 12,
    color: palette.onPrimary,
    letterSpacing: 1.8,
  },
  userName: {
    ...type.h2,
    fontSize: 24,
    color: palette.ink,
    marginTop: spacing.sm,
  },
  seasonChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.green,
  },
  seasonChipText: {
    ...type.label,
    fontSize: 13,
    color: palette.primary,
  },
  memberSince: {
    ...type.overline,
    color: palette.muted,
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    fontStyle: "italic",
  },

  /* Promo card */
  promoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: palette.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  promoGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: palette.focusRing,
  },
  promoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  promoTextBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  promoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  promoTitle: {
    ...type.h3,
    fontSize: 18,
    color: palette.onDark,
  },
  promoBody: {
    ...type.body,
    fontSize: 14,
    color: palette.onDarkSoft,
  },
  promoImage: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    opacity: 0.8,
  },

  /* Sections */
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    ...type.sectionHeader,
    color: palette.ink,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },

  /* Settings rows */
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingVertical: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsRowLabel: {
    ...type.body,
    fontWeight: "500",
    color: palette.charcoal,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingsRowValue: {
    ...type.caption,
    color: palette.muted,
  },

  /* Privacy card */
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: palette.primaryMuted,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  privacyCardText: {
    flex: 1,
    gap: 4,
  },
  privacyCardTitle: {
    ...type.label,
    color: palette.ink,
  },
  privacyCardBody: {
    ...type.caption,
    color: palette.muted,
    lineHeight: 18,
  },

  /* Action rows */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingVertical: 12,
  },
  actionRowDisabled: {
    opacity: 0.55,
  },
  actionRowLabel: {
    ...type.label,
    color: palette.charcoal,
  },
  deleteText: {
    color: palette.red,
  },
});
