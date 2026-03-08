import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { GlassCard } from "@/src/components/glass-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/use-auth";
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
  const [exporting, setExporting] = useState(false);

  /* ---------- handlers ---------- */

  const handleManagePlan = () => {
    router.push("/paywall");
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
        <Pressable style={styles.settingsButton}>
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
        <Text style={styles.userName}>Alex Rivers</Text>

        {/* Season chip */}
        <View style={styles.seasonChip}>
          <View style={styles.greenDot} />
          <Text style={styles.seasonChipText}>Deep Autumn Enthusiast</Text>
        </View>

        {/* Member since */}
        <Text style={styles.memberSince}>MEMBER SINCE SEP 2023</Text>
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
              <Text style={styles.promoTitle}>ToneMatch Plus</Text>
            </View>
            <Text style={styles.promoBody}>
              Your personal color consultant is active.
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

        <SettingsRow icon="notifications" label="Notifications" />
        <SettingsRow
          icon="translate"
          label="Language"
          value="English (US)"
        />
        <SettingsRow icon="help-outline" label="Support Center" showBorder={false} />
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
              Your biometric data and color profiles are encrypted and never
              sold to third parties.
            </Text>
          </View>
        </View>

        {/* Export row */}
        <Pressable style={styles.actionRow} onPress={handleExport}>
          <MaterialIcons
            name="file-download"
            size={22}
            color={palette.muted}
          />
          <Text style={styles.actionRowLabel}>Export My Color Data</Text>
        </Pressable>

        {/* Delete account row */}
        <Pressable style={styles.actionRow} onPress={handleDeleteAccount}>
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
  value,
  showBorder = true,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  showBorder?: boolean;
}) {
  return (
    <Pressable
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
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.05)",
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
    borderColor: "rgba(184, 115, 50, 0.20)",
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
    fontSize: 9,
    color: "#ffffff",
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
    backgroundColor: "rgba(184, 115, 50, 0.20)",
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
    color: "#ffffff",
  },
  promoBody: {
    ...type.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
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
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  /* Settings rows */
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
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
    paddingVertical: 14,
  },
  actionRowLabel: {
    ...type.label,
    color: palette.muted,
  },
  deleteText: {
    color: palette.red,
  },
});
