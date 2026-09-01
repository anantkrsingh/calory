import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  FileText,
  LifeBuoy,
  type LucideIcon,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  User,
} from "lucide-react-native";
import { useRef } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { TabScreen } from "@/components/tab-screen";
import { ScreenAppBar } from "@/components/screen-app-bar";
import { ThemedText } from "@/components/themed-text";
import {
  DeleteAccountSheet,
  type DeleteAccountSheetRef,
} from "@/components/profile/DeleteAccountSheet";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { BottomTabInset, Brand, Pressed, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { displayNameOf, initialsOf } from "@/lib/user";
import { selectUser, useAuthStore } from "@/stores/auth.store";
import {
  selectIsDarkMode,
  useThemeStore,
} from "@/stores/theme.store";

const PRIVACY_POLICY_URL = "https://caloryfitness.netlify.app/privacy";
const TERMS_OF_SERVICE_URL = "https://caloryfitness.netlify.app/terms";

const AVATAR_SIZE = 64;
const HAIRLINE = StyleSheet.hairlineWidth || 1;

type MenuOption = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore(selectUser);
  const clearAuth = useAuthStore((state) => state.clear);
  const isDarkMode = useThemeStore(selectIsDarkMode);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const deleteAccountSheetRef = useRef<DeleteAccountSheetRef>(null);

  const accountOptions: MenuOption[] = [
    {
      icon: User,
      label: "Edit Profile",
      onPress: () => router.push("/edit-profile"),
    },
    { icon: Target, label: "Goals", onPress: () => router.push("/goals") },
    {
      icon: Bell,
      label: "Notifications",
      onPress: () => router.push("/notifications"),
    },
    {
      icon: SlidersHorizontal,
      label: "Units & Preferences",
      onPress: () => router.push("/preferences"),
    },
    {
      icon: LifeBuoy,
      label: "Help & Support",
      onPress: () => router.push("/help"),
    },
  ];

  const legalOptions: MenuOption[] = [
    {
      icon: ShieldCheck,
      label: "Privacy Policy",
      onPress: () => Linking.openURL(PRIVACY_POLICY_URL),
    },
    {
      icon: FileText,
      label: "Terms of Service",
      onPress: () => Linking.openURL(TERMS_OF_SERVICE_URL),
    },
  ];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
  ];

  return (
    <TabScreen
      appBar={false}
      header={<ScreenAppBar title="Profile" />}
      contentStyle={styles.content}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[cardStyle, styles.userCard]}>
          <View style={[styles.avatar, { backgroundColor: Brand.accent }]}>
            {user?.profile.avatarUrl ? (
              <Image
                source={{ uri: user.profile.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={150}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <ThemedText fontWeight="700" style={styles.avatarInitials}>
                {initialsOf(user)}
              </ThemedText>
            )}
          </View>

          <View style={styles.userInfo}>
            <ThemedText
              fontWeight="700"
              numberOfLines={1}
              style={styles.userName}
            >
              {user ? displayNameOf(user) : "Guest"}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
            >
              {user ? user.email : "Sign in to manage your profile."}
            </ThemedText>
          </View>
        </View>

        {user ? (
          <View style={cardStyle}>
            {accountOptions.map((option, index) => (
              <MenuRow
                key={option.label}
                {...option}
                showDivider={index < accountOptions.length - 1}
              />
            ))}
          </View>
        ) : null}

        <View style={cardStyle}>
          <View style={styles.row}>
            <Moon size={20} color={theme.text} strokeWidth={1.75} />
            <ThemedText
              fontWeight="regular"
              style={styles.rowLabel}
              numberOfLines={1}
            >
              Dark mode
            </ThemedText>
            <Switch
              accessibilityLabel="Toggle dark mode"
              value={isDarkMode}
              onValueChange={(enabled) =>
                setThemePreference(enabled ? "dark" : "light")
              }
              trackColor={{
                false: theme.backgroundSelected,
                true: Brand.accent,
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.backgroundSelected}
            />
          </View>
        </View>

        <View style={cardStyle}>
          {legalOptions.map((option, index) => (
            <MenuRow
              key={option.label}
              {...option}
              showDivider={index < legalOptions.length - 1}
            />
          ))}
        </View>

        {user ? (
          <View style={styles.dangerZone}>
            <PrimaryButton label="Logout" tone="danger" onPress={clearAuth} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete Account"
              onPress={() => deleteAccountSheetRef.current?.present()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteAccountButton,
                pressed && Pressed,
              ]}
            >
              <ThemedText
                type="small"
                fontWeight="600"
                style={styles.deleteAccountText}
              >
                Delete Account
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <DeleteAccountSheet ref={deleteAccountSheetRef} onDeleted={clearAuth} />
    </TabScreen>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  showDivider,
}: MenuOption & { showDivider: boolean }) {
  const theme = useTheme();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: "rgba(0, 0, 0, 0.06)" }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && Platform.OS === "ios"
            ? { backgroundColor: theme.backgroundSelected }
            : null,
        ]}
      >
        <Icon size={20} color={theme.text} strokeWidth={1.75} />
        <ThemedText
          fontWeight="regular"
          style={styles.rowLabel}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
        <ChevronRight
          size={18}
          color={theme.textSecondary}
          strokeWidth={1.75}
        />
      </Pressable>
      {showDivider ? (
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {},
  scrollContent: {
    gap: Spacing.three,
    marginTop: Spacing.four,
    paddingBottom: BottomTabInset + 40,
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: HAIRLINE,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitials: { color: "#FFFFFF", fontSize: 22 },
  userInfo: { flex: 1, gap: Spacing.half },
  userName: { fontSize: 17, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 52,
    paddingVertical: 13,
    paddingHorizontal: Spacing.three,
  },
  rowLabel: { flex: 1 },
  divider: {
    height: HAIRLINE,
    marginHorizontal: Spacing.three,
  },
  dangerZone: { gap: Spacing.three },
  deleteAccountButton: { alignSelf: "center", paddingVertical: Spacing.one },
  deleteAccountText: { color: Brand.accent },
});
