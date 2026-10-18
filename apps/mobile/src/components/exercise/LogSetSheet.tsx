import { useForm } from 'react-hook-form';
import { useFormField } from '@/hooks/use-form-field';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { getErrorMessage } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Pressed, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useLogExerciseSet } from '@/queries/workouts.queries';
import { useExerciseTimerStore } from '@/stores/exercise-timer.store';

const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';

type FieldKey = 'reps' | 'weightKg' | 'distanceM';

const FIELD_DEFS: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: 'reps', label: 'Reps', placeholder: 'e.g. 10' },
  { key: 'weightKg', label: 'Weight (kg)', placeholder: 'e.g. 60' },
  { key: 'distanceM', label: 'Distance (m)', placeholder: 'e.g. 1000' },
];

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Mounted once, globally (alongside `GlobalTimerBar`) — not per-screen —
 * since Stop can happen from anywhere the floating bar is visible, not just
 * the screen Start was pressed from. Presents itself reactively whenever the
 * exercise-timer store gets a `pendingLog` (set by `stop()`), rather than
 * being driven by an imperative ref from whichever screen is on top.
 *
 * Shows only the fields this exercise's `logFields` doesn't hide (duration is
 * already captured, and "sets" isn't asked for here — each Start-to-Stop
 * cycle is one set; logging another rep of it is just pressing Start again).
 * Saving hands the whole thing to `useLogExerciseSet`, which turns it into a
 * completed one-set workout.
 */
export function LogSetSheet() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const sheetRef = useRef<TrueSheet>(null);
  const logSet = useLogExerciseSet();

  const pendingLog = useExerciseTimerStore((state) => state.pendingLog);
  const clearPendingLog = useExerciseTimerStore(
    (state) => state.clearPendingLog,
  );

  const form = useForm<{
    values: Record<FieldKey, string>;
  }>({
    defaultValues: {
      values: { reps: '', weightKg: '', distanceM: '' },
    },
  });
  const { handleSubmit: submitForm, reset } = form;
  const [values, setValues] = useFormField(form, 'values', {
    validate: (value) => {
      const exercise = pendingLog?.exercise;
      if (!exercise) return true;
      for (const field of FIELD_DEFS) {
        if (exercise.logFields[field.key] === 'hidden') continue;
        const raw = value[field.key].trim();
        if (!raw) {
          if (exercise.logFields[field.key] === 'required') return `${field.label} is required for this exercise.`;
        } else if (!Number.isFinite(Number(raw)) || Number(raw) < 0) {
          return `${field.label} must be a valid number.`;
        }
      }
      return true;
    },
  });
  const [serverError, setFormError] = useState<string | null>(null);

  const validationError = form.formState.errors.values?.message;
  const formError = validationError ?? serverError;
  const fieldError = validationError ? FIELD_DEFS.find((field) => validationError.startsWith(field.label))?.key : undefined;

  const [formResetFor, setFormResetFor] = useState(pendingLog);
  if (pendingLog !== formResetFor) {
    setFormResetFor(pendingLog);
    setFormError(null);
  }

  // `pendingLog` changes identity each time `stop()` runs, so this fires once
  // per set to log.
  useEffect(() => {
    if (!pendingLog) return;
    reset({ values: { reps: '', weightKg: '', distanceM: '' } });
    logSet.reset();
    sheetRef.current?.present();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLog]);

  const exercise = pendingLog?.exercise ?? null;
  const timing = pendingLog?.timing ?? null;

  const fields = exercise
    ? FIELD_DEFS.filter((field) => exercise.logFields[field.key] !== 'hidden')
    : [];

  const handleChange = (key: FieldKey, text: string) => {
    form.clearErrors('values');
    setValues((prev) => ({ ...prev, [key]: text }));
    setFormError(null);
  };

  const handleCancel = () => {
    void sheetRef.current?.dismiss();
  };

  const handleSave = () => submitForm(async () => {
    if (!exercise || !timing) return;

    const parsed: Partial<Record<FieldKey, number>> = {};
    for (const field of fields) {
      const raw = values[field.key].trim();
      if (raw === '') continue;
      const num = Number(raw);
      parsed[field.key] = num;
    }

    try {
      await logSet.mutateAsync({
        exercise,
        startedAt: timing.startedAt,
        stoppedAt: timing.stoppedAt,
        durationSec: timing.durationSec,
        ...parsed,
      });
      await sheetRef.current?.dismiss();
    } catch (err) {
      setFormError(
        getErrorMessage(err, 'Could not save this set. Please try again.'),
      );
    }
  })();

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      dimmed
      dimmedDetentIndex={0}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
      onDidDismiss={clearPendingLog}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.sheetPadding}>
            <View style={[styles.card, { backgroundColor: theme.background }]}>
              <View style={styles.handle} />

              <ThemedText type="subtitle" style={styles.title}>
                Log Set
              </ThemedText>
              {timing ? (
                <ThemedText
                  type="small"
                  style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {exercise?.name} · {formatElapsed(timing.durationSec)}
                </ThemedText>
              ) : null}

              {fields.map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <ThemedText type="smallBold" style={styles.label}>
                    {field.label}
                    {exercise?.logFields[field.key] === 'optional'
                      ? ' (optional)'
                      : ''}
                  </ThemedText>
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(text) => handleChange(field.key, text)}
                    placeholder={field.placeholder}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderWidth: fieldError === field.key ? 1.5 : 0,
                        borderColor: '#ff3b30',
                      },
                    ]}
                  />
                </View>
              ))}

              {formError ? (
                <ThemedText type="small" style={styles.formError}>
                  {formError}
                </ThemedText>
              ) : null}

              <PrimaryButton
                label={logSet.isPending ? 'Saving...' : 'Save'}
                textStyle={{ color: isDark ? '#fff' : '#000' }}
                onPress={() => void handleSave()}
                disabled={logSet.isPending}
              />

              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && Pressed]}
                onPress={handleCancel}
                disabled={logSet.isPending}
                hitSlop={8}>
                <ThemedText
                  type="small"
                  fontWeight="600"
                  themeColor="textSecondary">
                  Discard
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TrueSheet>
  );
}

const styles = StyleSheet.create({
  sheetPadding: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE_COLOR,
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.four,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  input: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    fontSize: 16,
    fontWeight: '500',
  },
  formError: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
});
