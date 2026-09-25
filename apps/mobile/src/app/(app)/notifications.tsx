import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';
import { Bell, Footprints, type LucideIcon } from 'lucide-react-native';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenAppBar } from '@/components/screen-app-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PermissionRationaleModal } from '@/components/ui/PermissionRationaleModal';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getNotificationPermissionStatusAsync,
  registerForPushNotificationsAsync,
} from '@/lib/notifications';
import { setPermissionChoice } from '@/lib/permission-preferences';
import { useRegisterPushToken } from '@/queries';

type PermissionStatus = Notifications.PermissionStatus | 'unavailable' | null;
type PermissionKind = 'activity' | 'notifications';

const HAIRLINE = StyleSheet.hairlineWidth || 1;

async function readPermissionStatuses(): Promise<{
  activity: PermissionStatus;
  notifications: PermissionStatus;
}> {
  const [activityAvailable, activityPermission, notificationsPermission] =
    await Promise.all([
      Pedometer.isAvailableAsync().catch(() => false),
      Pedometer.getPermissionsAsync().catch(() => null),
      getNotificationPermissionStatusAsync(),
    ]);

  return {
    activity: activityAvailable
      ? (activityPermission?.status ?? null)
      : 'unavailable',
    notifications: notificationsPermission,
  };
}

export default function NotificationsScreen() {
  const registerPushToken = useRegisterPushToken();
  const [activityStatus, setActivityStatus] = useState<PermissionStatus>(null);
  const [notificationStatus, setNotificationStatus] =
    useState<PermissionStatus>(null);
  const [promptKind, setPromptKind] = useState<PermissionKind | null>(null);
  const [loadingKind, setLoadingKind] = useState<PermissionKind | null>(null);
  const [activityDeniedVisible, setActivityDeniedVisible] = useState(false);

  const refreshStatuses = useCallback(async () => {
    const statuses = await readPermissionStatuses();
    setActivityStatus(statuses.activity);
    setNotificationStatus(statuses.notifications);
  }, []);

  useEffect(() => {
    let active = true;
    void readPermissionStatuses().then((statuses) => {
      if (!active) return;
      setActivityStatus(statuses.activity);
      setNotificationStatus(statuses.notifications);
    });
    return () => {
      active = false;
    };
  }, []);

  const closePrompt = useCallback(() => {
    setPromptKind(null);
  }, []);

  const requestActivityPermission = useCallback(async () => {
    setPermissionChoice('activity', 'allowed');
    setLoadingKind('activity');

    const existing = await Pedometer.getPermissionsAsync().catch(() => null);
    if (existing?.status === 'denied') {
      await Linking.openSettings();
      setLoadingKind(null);
      setPromptKind(null);
      return;
    }

    const permission = await Pedometer.requestPermissionsAsync().catch(() => null);
    if (!permission?.granted) {
      setActivityDeniedVisible(true);
    }

    setLoadingKind(null);
    setPromptKind(null);
    await refreshStatuses();
  }, [refreshStatuses]);

  const requestNotificationPermission = useCallback(async () => {
    setPermissionChoice('notifications', 'allowed');
    setLoadingKind('notifications');

    const existing = await Notifications.getPermissionsAsync().catch(() => null);
    if (existing?.status === 'denied') {
      await Linking.openSettings();
      setLoadingKind(null);
      setPromptKind(null);
      return;
    }

    const result = await registerForPushNotificationsAsync();
    if (result) {
      registerPushToken.mutate(result);
    }

    setLoadingKind(null);
    setPromptKind(null);
    await refreshStatuses();
  }, [refreshStatuses, registerPushToken]);

  const denyPrompt = useCallback(() => {
    if (promptKind) {
      setPermissionChoice(promptKind, 'denied');
    }
    if (promptKind === 'activity') {
      setActivityDeniedVisible(true);
    }
    setPromptKind(null);
  }, [promptKind]);

  const promptConfig =
    promptKind === 'activity'
      ? {
          icon: Footprints,
          title: 'Allow activity tracking?',
          body:
            'Fit Crate uses your device step count to log daily footsteps, update your step ring, and keep calorie progress accurate. We only read steps for your fitness progress.',
          onAllow: requestActivityPermission,
          loading: loadingKind === 'activity',
        }
      : {
          icon: Bell,
          title: 'Allow notifications?',
          body:
            'Fit Crate uses notifications for workout reminders, progress updates, and important plan alerts. You can turn them off later in settings.',
          onAllow: requestNotificationPermission,
          loading: loadingKind === 'notifications',
        };

  return (
    <ThemedView style={styles.screen}>
      <ScreenAppBar title="Notifications & permissions" />
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <PermissionCard
            icon={Footprints}
            title="Activity tracking"
            body="Daily step tracking keeps your steps ring and calorie progress in sync."
            status={activityStatus}
            onPress={() => setPromptKind('activity')}
          />
          <PermissionCard
            icon={Bell}
            title="Notifications"
            body="Workout reminders and plan updates help you stay on track."
            status={notificationStatus}
            onPress={() => setPromptKind('notifications')}
          />
        </ScrollView>
      </SafeAreaView>

      <PermissionRationaleModal
        visible={promptKind !== null}
        icon={promptConfig.icon}
        title={promptConfig.title}
        body={promptConfig.body}
        allowLabel="Allow"
        denyLabel="Deny"
        loading={promptConfig.loading}
        onAllow={promptConfig.onAllow}
        onDeny={denyPrompt}
        onRequestClose={closePrompt}
      />
      <PermissionRationaleModal
        visible={activityDeniedVisible}
        icon={Footprints}
        title="Activity tracking is off"
        body="You will not be able to log your daily footsteps automatically while activity tracking is denied. You can return here anytime to allow it."
        allowLabel="Allow now"
        denyLabel="Got it"
        onAllow={() => {
          setActivityDeniedVisible(false);
          setPromptKind('activity');
        }}
        onDeny={() => setActivityDeniedVisible(false)}
        onRequestClose={() => setActivityDeniedVisible(false)}
      />
    </ThemedView>
  );
}

function PermissionCard({
  icon: Icon,
  title,
  body,
  status,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  status: PermissionStatus;
  onPress: () => void;
}) {
  const theme = useTheme();
  const granted = status === 'granted';
  const unavailable = status === 'unavailable' || Platform.OS === 'web';
  const statusText = unavailable
    ? 'Unavailable'
    : granted
      ? 'Allowed'
      : status === 'denied'
        ? 'Denied'
        : 'Not allowed';
  const buttonLabel = unavailable
    ? 'Unavailable'
    : granted
      ? 'Allowed'
      : status === 'denied'
        ? 'Open settings'
        : 'Allow';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Icon color={Brand.accent} size={24} strokeWidth={2} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardHeader}>
          <ThemedText fontWeight="700" style={styles.cardTitle}>
            {title}
          </ThemedText>
          <ThemedText
            type="small"
            fontWeight="700"
            style={[
              styles.status,
              {
                color: granted
                  ? Brand.accent
                  : unavailable
                    ? theme.textSecondary
                    : '#B45309',
              },
            ]}>
            {statusText}
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.cardBody}>
          {body}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${buttonLabel} ${title}`}
          disabled={granted || unavailable}
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                granted || unavailable ? theme.backgroundElement : Brand.accent,
            },
            pressed && !granted && !unavailable && Pressed,
          ]}>
          <ThemedText
            fontWeight="700"
            style={[
              styles.buttonText,
              { color: granted || unavailable ? theme.textSecondary : '#FFFFFF' },
            ]}>
            {buttonLabel}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    padding: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  status: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
