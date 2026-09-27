import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ActivityLevel, FitnessGoal } from "@fitness/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Activity,
  Armchair,
  Bell,
  Check,
  ChevronRight,
  Dumbbell,
  FileText,
  Flame,
  Footprints,
  HeartPulse,
  LifeBuoy,
  type LucideIcon,
  Moon,
  PersonStanding,
  ShieldCheck,
  Target,
  TrendingDown,
  Trophy,
  User,
} from "lucide-react-native";
import { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { getErrorMessage } from "@/api/errors";
import { TabScreen } from "@/components/tab-screen";
import { ScreenAppBar } from "@/components/screen-app-bar";
import { ThemedText } from "@/components/themed-text";
import {
  DeleteAccountSheet,
  type DeleteAccountSheetRef,
} from "@/components/profile/DeleteAccountSheet";
import { PremiumUpsellCard } from "@/components/profile/PremiumUpsellCard";
import Chip from "@/components/ui/Chip";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { BottomTabInset, Brand, Pressed, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { displayNameOf, initialsOf } from "@/lib/user";
import { useUpdateProfile } from "@/queries/users.queries";
import { selectUser, useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";

const PRIVACY_POLICY_URL = "https://caloryfitness.netlify.app/privacy";
const TERMS_OF_SERVICE_URL = "https://caloryfitness.netlify.app/terms";

const AVATAR_SIZE = 64;
const HAIRLINE = StyleSheet.hairlineWidth || 1;

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Very active",
  very_active: "Extremely active",
};

const ACTIVITY_ICONS: Record<ActivityLevel, LucideIcon> = {
  sedentary: Armchair,
  light: Footprints,
  moderate: PersonStanding,
  active: Dumbbell,
  very_active: Flame,
};

const GOAL_OPTIONS: { id: FitnessGoal; label: string; Icon: LucideIcon }[] = [
  { id: "lose_weight", label: "Lose weight", Icon: TrendingDown },
  { id: "build_muscle", label: "Build muscle", Icon: Dumbbell },
  { id: "improve_fitness", label: "Improve fitness", Icon: HeartPulse },
  { id: "gain_strength", label: "Gain strength", Icon: Dumbbell },
  { id: "stay_healthy", label: "Stay healthy", Icon: HeartPulse },
  { id: "train_sport", label: "Train for sport", Icon: Trophy },
];

type MenuOption = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

type AccountOptionKey =
  | "profile"
  | "activity"
  | "goals"
  | "notifications"
  | "help";

type AccountMenuOption = {
  key: AccountOptionKey;
  icon: LucideIcon;
  label: string;
};

const ACCOUNT_OPTIONS: AccountMenuOption[] = [
  { key: "profile", icon: User, label: "Edit Profile" },
  { key: "activity", icon: Activity, label: "Activity level" },
  { key: "goals", icon: Target, label: "Fitness goals" },
  { key: "notifications", icon: Bell, label: "Notifications & permissions" },
  { key: "help", icon: LifeBuoy, label: "Help & Support" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore(selectUser);
  const clearAuth = useAuthStore((state) => state.clear);
  const updateProfile = useUpdateProfile();
  const isDarkMode = useColorScheme() === "dark";
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const deleteAccountSheetRef = useRef<DeleteAccountSheetRef>(null);
  const activitySheetRef = useRef<TrueSheet>(null);
  const goalsSheetRef = useRef<TrueSheet>(null);

  const [draftActivityLevel, setDraftActivityLevel] = useState<
    ActivityLevel | undefined
  >(user?.profile.activityLevel);
  const [draftGoals, setDraftGoals] = useState<FitnessGoal[]>(
    user?.profile.fitnessGoals ?? []
  );

  const openActivitySheet = useCallback(() => {
    setDraftActivityLevel(user?.profile.activityLevel);
    activitySheetRef.current?.present();
  }, [user?.profile.activityLevel]);

  const openGoalsSheet = useCallback(() => {
    setDraftGoals(user?.profile.fitnessGoals ?? []);
    goalsSheetRef.current?.present();
  }, [user?.profile.fitnessGoals]);

  const handleAccountOptionPress = (key: AccountOptionKey) => {
    switch (key) {
      case "profile":
        router.push("/edit-profile");
        break;
      case "activity":
        openActivitySheet();
        break;
      case "goals":
        openGoalsSheet();
        break;
      case "notifications":
        router.push("/notifications");
        break;
      case "help":
        router.push("/help");
        break;
    }
  };

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

  const handleSelectActivity = (level: ActivityLevel) => {
    setDraftActivityLevel(level);
  };

  const handleToggleGoal = (goal: FitnessGoal) => {
    setDraftGoals((current) =>
      current.includes(goal)
        ? current.filter((g) => g !== goal)
        : [...current, goal]
    );
  };

  const handleSaveActivity = async () => {
    if (!draftActivityLevel) {
      activitySheetRef.current?.dismiss();
      return;
    }
    try {
      await updateProfile.mutateAsync({
        profile: { activityLevel: draftActivityLevel },
      });
      activitySheetRef.current?.dismiss();
    } catch (err) {
      Alert.alert(
        "Couldn’t save",
        getErrorMessage(err, "Something went wrong. Try again.")
      );
    }
  };

  const handleSaveGoals = async () => {
    try {
      await updateProfile.mutateAsync({
        profile: { fitnessGoals: draftGoals },
      });
      goalsSheetRef.current?.dismiss();
    } catch (err) {
      Alert.alert(
        "Couldn’t save",
        getErrorMessage(err, "Something went wrong. Try again.")
      );
    }
  };

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

        <PremiumUpsellCard />

        {user ? (
          <View style={cardStyle}>
            {ACCOUNT_OPTIONS.map((option, index) => (
              <MenuRow
                key={option.label}
                icon={option.icon}
                label={option.label}
                onPress={() => handleAccountOptionPress(option.key)}
                showDivider={index < ACCOUNT_OPTIONS.length - 1}
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

      <TrueSheet
        ref={activitySheetRef}
        detents={["auto"]}
        dimmed
        dimmedDetentIndex={0}
        backgroundColor={theme.backgroundElement}
        cornerRadius={24}
        grabber={false}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Activity level</ThemedText>
              <Pressable
                disabled={updateProfile.isPending}
                onPress={() => void handleSaveActivity()}
                style={({ pressed }) => [
                  styles.doneButton,
                  { backgroundColor: Brand.accent },
                  (pressed || updateProfile.isPending) && Pressed,
                ]}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText fontWeight="bold" style={styles.doneButtonText}>
                    Done
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {ACTIVITY_LEVELS.map((level) => {
                const selected = draftActivityLevel === level;
                const Icon = ACTIVITY_ICONS[level];
                return (
                  <Chip
                    key={level}
                    label={ACTIVITY_LABELS[level]}
                    selected={selected}
                    onPress={() => handleSelectActivity(level)}
                    icon={
                      selected ? (
                        <Check size={18} color={Brand.accent} />
                      ) : (
                        <Icon size={18} color={theme.text} />
                      )
                    }
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </TrueSheet>

      <TrueSheet
        ref={goalsSheetRef}
        detents={["auto"]}
        dimmed
        dimmedDetentIndex={0}
        backgroundColor={theme.backgroundElement}
        cornerRadius={24}
        grabber={false}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Fitness goals</ThemedText>
              <Pressable
                disabled={updateProfile.isPending}
                onPress={() => void handleSaveGoals()}
                style={({ pressed }) => [
                  styles.doneButton,
                  { backgroundColor: Brand.accent },
                  (pressed || updateProfile.isPending) && Pressed,
                ]}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText fontWeight="bold" style={styles.doneButtonText}>
                    Done
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {GOAL_OPTIONS.map(({ id, label, Icon }) => {
                const selected = draftGoals.includes(id);
                return (
                  <Chip
                    key={id}
                    label={label}
                    selected={selected}
                    onPress={() => handleToggleGoal(id)}
                    icon={
                      selected ? (
                        <Check size={18} color={Brand.accent} />
                      ) : (
                        <Icon size={18} color={theme.text} />
                      )
                    }
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </TrueSheet>
    </TabScreen>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  showDivider = false,
}: MenuOption & { showDivider?: boolean }) {
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
  sheetContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.three,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  doneButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});

