import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  FileText,
  LifeBuoy,
  type LucideIcon,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  User,
} from 'lucide-react-native';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { displayNameOf, initialsOf } from '@/lib/user';
import { selectUser, useAuthStore } from '@/stores/auth.store';

// TODO: point these at the real legal pages once they exist.
const PRIVACY_POLICY_URL = 'https://example.com/privacy-policy';
const TERMS_OF_SERVICE_URL = 'https://example.com/terms';

const AVATAR_SIZE = 64;

type MenuOption = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const clearAuth = useAuthStore((state) => state.clear);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: call the real delete-account endpoint once it exists.
          },
        },
      ],
    );
  };

  const accountOptions: MenuOption[] = [
    { icon: User, label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { icon: Target, label: 'Goals', onPress: () => router.push('/goals') },
    { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications') },
    {
      icon: SlidersHorizontal,
      label: 'Units & Preferences',
      onPress: () => router.push('/preferences'),
    },
    { icon: LifeBuoy, label: 'Help & Support', onPress: () => router.push('/help') },
  ];

  const legalOptions: MenuOption[] = [
    { icon: ShieldCheck, label: 'Privacy Policy', onPress: () => Linking.openURL(PRIVACY_POLICY_URL) },
    { icon: FileText, label: 'Terms of Service', onPress: () => Linking.openURL(TERMS_OF_SERVICE_URL) },
  ];

  return (
    <TabScreen appBar={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView type="backgroundElement" style={[styles.card, styles.userCard]}>
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
            <ThemedText fontWeight="700" numberOfLines={1} style={styles.userName}>
              {user ? displayNameOf(user) : 'Guest'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {user ? user.email : 'Sign in to manage your profile.'}
            </ThemedText>
          </View>
        </ThemedView>

        {user && (
          <ThemedView type="backgroundElement" style={styles.card}>
            {accountOptions.map((option, index) => (
              <MenuRow key={option.label} {...option} showDivider={index < accountOptions.length - 1} />
            ))}
          </ThemedView>
        )}

        <ThemedView type="backgroundElement" style={styles.card}>
          {legalOptions.map((option, index) => (
            <MenuRow key={option.label} {...option} showDivider={index < legalOptions.length - 1} />
          ))}
        </ThemedView>

        {user && (
          <View style={styles.dangerZone}>
            <PrimaryButton label="Logout" tone="danger" onPress={clearAuth} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete Account"
              onPress={handleDeleteAccount}
              hitSlop={8}
              style={({ pressed }) => [styles.deleteAccountButton, pressed && Pressed]}>
              <ThemedText type="small" fontWeight="600" style={styles.deleteAccountText}>
                Delete Account
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );
}

function MenuRow({ icon: Icon, label, onPress, showDivider }: MenuOption & { showDivider: boolean }) {
  const theme = useTheme();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
        <Icon size={20} color={theme.text} />
        <ThemedText fontWeight="regular" style={styles.rowLabel} numberOfLines={1}>
          {label}
        </ThemedText>
        <ChevronRight size={18} color={theme.textSecondary} />
      </Pressable>
      {showDivider && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.four },
  scrollContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitials: { color: '#FFFFFF', fontSize: 22 },
  userInfo: { flex: 1, gap: Spacing.half },
  userName: { fontSize: 17, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowLabel: { flex: 1 },
  divider: { height: 1, marginHorizontal: Spacing.three },
  dangerZone: { gap: Spacing.three },
  deleteAccountButton: { alignSelf: 'center', paddingVertical: Spacing.one },
  deleteAccountText: { color: Brand.accent },
});
