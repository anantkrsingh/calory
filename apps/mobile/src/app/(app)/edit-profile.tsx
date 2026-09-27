import { LIMITS, UNIT_CONVERSION } from '@/constants/app';
import type { Sex, UnitSystem } from '@fitness/types';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Camera,
  EyeOff,
  Mars,
  Venus,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { getErrorMessage } from '@/api/errors';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import DateOfBirthPicker, {
  type DateOfBirthPickerRef,
} from '@/components/ui/DateOfBirthPicker';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { initialsOf } from '@/lib/user';
import { useUpdateProfile, useUploadAvatar } from '@/queries/users.queries';
import { selectUser, useAuthStore } from '@/stores/auth.store';

const AVATAR_SIZE = 96;
const BADGE_SIZE = 32;
const HAIRLINE = StyleSheet.hairlineWidth || 1;

const SEX_OPTIONS: { value: Sex; label: string; Icon: LucideIcon }[] = [
  { value: 'male', label: 'Male', Icon: Mars },
  { value: 'female', label: 'Female', Icon: Venus },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', Icon: EyeOff },
];

const round = (value: number): number => Math.round(value * 10) / 10;

function heightToDisplay(cm: number, system: UnitSystem): number {
  return system === 'metric' ? round(cm) : round(cm / UNIT_CONVERSION.cmPerInch);
}

function heightToCm(value: number, system: UnitSystem): number {
  return system === 'metric' ? value : value * UNIT_CONVERSION.cmPerInch;
}

type Draft = {
  displayName: string;
  sex: Sex | undefined;
  dateOfBirth: string | undefined;
  heightCm: number | undefined;
  units: UnitSystem;
  notificationsEnabled: boolean;
};

function draftFromUser(user: ReturnType<typeof selectUser>): Draft {
  return {
    displayName: user?.profile.displayName ?? '',
    sex: user?.profile.sex,
    dateOfBirth: user?.profile.dateOfBirth,
    heightCm: user?.profile.heightCm,
    units: user?.preferences.units ?? 'metric',
    notificationsEnabled: user?.preferences.notificationsEnabled ?? false,
  };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const user = useAuthStore(selectUser);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const dobPickerRef = useRef<DateOfBirthPickerRef>(null);

  const [draft, setDraft] = useState<Draft>(() => draftFromUser(user));
  const patch = useCallback((next: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...next }));
  }, []);

  const heightDisplay =
    draft.heightCm === undefined ? '' : String(heightToDisplay(draft.heightCm, draft.units));

  const handleHeightChange = (text: string) => {
    if (text.trim() === '') {
      patch({ heightCm: undefined });
      return;
    }
    const parsed = Number.parseFloat(text);
    if (Number.isNaN(parsed)) return;
    patch({ heightCm: round(heightToCm(parsed, draft.units)) });
  };

  const handleUnitsChange = (units: UnitSystem) => {
    patch({ units });
  };

  const pickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access in Settings to change your avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    try {
      await uploadAvatar.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch (err) {
      Alert.alert(
        'Couldn’t update avatar',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [uploadAvatar]);

  const nameValid =
    draft.displayName.trim().length >= LIMITS.name.min &&
    draft.displayName.trim().length <= LIMITS.name.max;

  const save = useCallback(async () => {
    if (!nameValid) return;
    try {
      await updateProfile.mutateAsync({
        profile: {
          displayName: draft.displayName.trim(),
          sex: draft.sex,
          dateOfBirth: draft.dateOfBirth,
          heightCm: draft.heightCm,
        },
        preferences: {
          units: draft.units,
          notificationsEnabled: draft.notificationsEnabled,
        },
      });
      router.back();
    } catch (err) {
      Alert.alert(
        'Couldn’t save',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [draft, nameValid, router, updateProfile]);

  return (
    <TabScreen appBar={false} header={<ScreenAppBar title="Edit Profile" />}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.scrollContent}
        bottomOffset={Spacing.four}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          disabled={uploadAvatar.isPending}
          onPress={() => void pickAvatar()}
          style={styles.avatarRow}>
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
            {uploadAvatar.isPending ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.avatarBadge,
              { backgroundColor: Brand.accent, borderColor: theme.background },
            ]}>
            <Camera color="#FFFFFF" size={15} strokeWidth={2.4} />
          </View>
        </Pressable>

        <Field label="Name">
          <TextInput
            value={draft.displayName}
            onChangeText={(text) => patch({ displayName: text })}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={[
              styles.input,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
            ]}
          />
        </Field>

        <Field label="Sex">
          <View style={styles.pillRow}>
            {SEX_OPTIONS.map(({ value, label, Icon }) => {
              const selected = draft.sex === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => patch({ sex: value })}
                  style={[
                    styles.sexOption,
                    { backgroundColor: selected ? Brand.accent : theme.backgroundElement },
                  ]}>
                  <Icon size={18} color={selected ? '#FFFFFF' : theme.text} />
                  <ThemedText
                    type="small"
                    style={{ color: selected ? '#FFFFFF' : theme.text }}
                    numberOfLines={1}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Date of birth">
          <Pressable
            onPress={() => dobPickerRef.current?.present()}
            style={[
              styles.input,
              styles.dateInput,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText
              type="default"
              style={draft.dateOfBirth ? undefined : { color: theme.textSecondary }}>
              {draft.dateOfBirth ?? 'Select your date of birth'}
            </ThemedText>
          </Pressable>
        </Field>

        <Field label={`Height (${draft.units === 'imperial' ? 'in' : 'cm'})`}>
          <View style={styles.heightRow}>
            <TextInput
              value={heightDisplay}
              onChangeText={handleHeightChange}
              placeholder={draft.units === 'imperial' ? 'e.g., 69' : 'e.g., 175'}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
              style={[
                styles.input,
                styles.heightInput,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
              ]}
            />
            <SegmentedControl
              values={['Metric', 'Imperial']}
              selectedIndex={draft.units === 'metric' ? 0 : 1}
              onValueChange={(value) => handleUnitsChange(value.toLowerCase() as UnitSystem)}
              tintColor={Brand.accent}
              appearance={colorScheme}
              style={styles.segmentedControl}
            />
          </View>
        </Field>

        <PrimaryButton
          label={updateProfile.isPending ? 'Saving…' : 'Save changes'}
          disabled={!nameValid || updateProfile.isPending}
          onPress={() => {
            void save();
          }}
          style={styles.saveButton}
        />
      </KeyboardAwareScrollView>

      <DateOfBirthPicker
        ref={dobPickerRef}
        value={draft.dateOfBirth}
        onChange={(isoDate) => patch({ dateOfBirth: isoDate })}
      />
    </TabScreen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  avatarRow: {
    alignSelf: 'center',
    marginBottom: Spacing.five,
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
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 30,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginBottom: Spacing.four,
  },
  fieldLabel: {
    marginBottom: Spacing.two,
  },
  input: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    borderWidth: HAIRLINE,
    fontSize: 16,
    fontWeight: '500',
  },
  dateInput: {
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sexOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heightInput: {
    flex: 1,
  },
  segmentedControl: {
    width: 160,
    height: 40,
  },
  saveButton: {
    marginTop: Spacing.two,
  },
});
