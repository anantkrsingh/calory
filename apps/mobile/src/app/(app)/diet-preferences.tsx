import { DietCuisine, DietType } from '@fitness/types';
import type { GenerateDietPlanInput } from '@fitness/validation';
import { useRouter } from 'expo-router';
import { Check, Minus, Plus, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  LinearTransition,
  ZoomIn,
  ZoomOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getErrorMessage } from '@/api/errors';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { resolveFontFamily } from '@/components/ui/Text';
import { LIMITS } from '@/constants/app';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRegenerateDietPlan } from '@/queries/diet-plans.queries';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);
const CHIP_ANIMATION_MS = 200;

const DIET_TYPE_OPTIONS: { value: DietType; label: string }[] = [
  { value: DietType.Veg, label: 'Veg' },
  { value: DietType.NonVeg, label: 'Non-Veg' },
  { value: DietType.Vegan, label: 'Vegan' },
];

const CUISINE_OPTIONS: { value: DietCuisine | undefined; label: string }[] = [
  { value: undefined, label: 'Auto-detect' },
  { value: DietCuisine.Indian, label: 'Indian' },
  { value: DietCuisine.Italian, label: 'Italian' },
  { value: DietCuisine.Chinese, label: 'Chinese' },
  { value: DietCuisine.Continental, label: 'Continental' },
  { value: DietCuisine.Mexican, label: 'Mexican' },
  { value: DietCuisine.American, label: 'American' },
];

/** Vegan is exclusive of every other diet type — picking it clears the rest,
 * and picking anything else drops it. At least one type stays selected. */
function toggleDietType(current: DietType[], value: DietType): DietType[] {
  if (value === DietType.Vegan) {
    return current.includes(DietType.Vegan) ? current : [DietType.Vegan];
  }

  const withoutVegan = current.filter((type) => type !== DietType.Vegan);
  const next = withoutVegan.includes(value)
    ? withoutVegan.filter((type) => type !== value)
    : [...withoutVegan, value];

  return next.length > 0 ? next : current;
}

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** A selectable pill whose background, label color and checkmark all
 * animate together on toggle, instead of snapping instantly. */
function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const theme = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: CHIP_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.backgroundElement, Brand.accent],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [theme.text, '#FFFFFF']),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      layout={LinearTransition.duration(CHIP_ANIMATION_MS)}
      style={[styles.optionPill, pillStyle]}>
      {selected ? (
        <Animated.View
          entering={ZoomIn.duration(CHIP_ANIMATION_MS)}
          exiting={ZoomOut.duration(CHIP_ANIMATION_MS)}>
          <Check size={16} color="#FFFFFF" />
        </Animated.View>
      ) : null}
      <AnimatedText style={[styles.optionLabel, labelStyle]}>{label}</AnimatedText>
    </AnimatedPressable>
  );
}

function parseExclusions(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length >= LIMITS.dietExcludedFood.min)
    .map((item) => item.slice(0, LIMITS.dietExcludedFood.max))
    .slice(0, LIMITS.dietExclusions.max);
}

/**
 * Collects the preferences behind "Create My Diet Plan" — diet types,
 * cuisine, foods to exclude, and meals per day — presented as its own modal
 * screen (see the `diet-preferences` entry in `(app)/_layout.tsx`), then
 * fires the same `regenerate` call the chat agent's tool uses and dismisses.
 */
export default function DietPreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const regenerate = useRegenerateDietPlan();

  const [dietTypes, setDietTypes] = useState<DietType[]>([DietType.NonVeg]);
  const [cuisine, setCuisine] = useState<DietCuisine | undefined>(undefined);
  const [excludeText, setExcludeText] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState<number>(LIMITS.dietMealsPerDay.default);

  const adjustMealsPerDay = (delta: number) => {
    setMealsPerDay((current) =>
      Math.min(
        LIMITS.dietMealsPerDay.max,
        Math.max(LIMITS.dietMealsPerDay.min, current + delta),
      ),
    );
  };

  const handleSubmit = async () => {
    const preferences: GenerateDietPlanInput = {
      dietTypes,
      cuisine,
      exclude: parseExclusions(excludeText),
      mealsPerDay,
    };

    try {
      await regenerate.mutateAsync(preferences);
      router.back();
    } catch (err) {
      Alert.alert(
        'Couldn’t start your plan',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  };

  return (
    <TabScreen
      appBar={false}
      header={
        <ScreenAppBar
          title="Diet Preferences"
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={() => router.back()}
              style={styles.iconButton}>
              <X color={theme.text} size={22} />
            </Pressable>
          }
        />
      }>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.scrollContent}
        bottomOffset={Spacing.four}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Tell us what you like and we’ll build a week of meals around it.
        </ThemedText>

        <Field label="Diet type">
          <View style={styles.chipRow}>
            {DIET_TYPE_OPTIONS.map(({ value, label }) => (
              <OptionChip
                key={value}
                label={label}
                selected={dietTypes.includes(value)}
                onPress={() => setDietTypes((current) => toggleDietType(current, value))}
              />
            ))}
          </View>
        </Field>

        <Field label="Cuisine">
          <View style={styles.chipRow}>
            {CUISINE_OPTIONS.map(({ value, label }) => (
              <OptionChip
                key={label}
                label={label}
                selected={cuisine === value}
                onPress={() => setCuisine(value)}
              />
            ))}
          </View>
        </Field>

        <Field label="Meals per day">
          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fewer meals per day"
              disabled={mealsPerDay <= LIMITS.dietMealsPerDay.min}
              onPress={() => adjustMealsPerDay(-1)}
              style={({ pressed }) => [
                styles.stepperButton,
                { backgroundColor: theme.backgroundElement },
                mealsPerDay <= LIMITS.dietMealsPerDay.min && styles.stepperButtonDisabled,
                pressed && Pressed,
              ]}>
              <Minus size={18} color={theme.text} />
            </Pressable>
            <ThemedText fontWeight="700" style={styles.stepperValue}>
              {mealsPerDay}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More meals per day"
              disabled={mealsPerDay >= LIMITS.dietMealsPerDay.max}
              onPress={() => adjustMealsPerDay(1)}
              style={({ pressed }) => [
                styles.stepperButton,
                { backgroundColor: theme.backgroundElement },
                mealsPerDay >= LIMITS.dietMealsPerDay.max && styles.stepperButtonDisabled,
                pressed && Pressed,
              ]}>
              <Plus size={18} color={theme.text} />
            </Pressable>
          </View>
        </Field>

        <Field label="Anything to exclude?">
          <TextInput
            value={excludeText}
            onChangeText={setExcludeText}
            placeholder="e.g. peanuts, shellfish (optional)"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            style={[
              styles.input,
              { backgroundColor: theme.backgroundElement, color: theme.text },
            ]}
          />
        </Field>

        <PrimaryButton
          label={regenerate.isPending ? 'Generating…' : 'Generate Plan'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={regenerate.isPending}
          style={styles.submitButton}
        />
      </KeyboardAwareScrollView>
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
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.four,
  },
  field: {
    marginBottom: Spacing.four,
  },
  fieldLabel: {
    marginBottom: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  optionLabel: {
    fontFamily: resolveFontFamily('ubuntu', '500', false),
    fontSize: 14,
    lineHeight: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontSize: 18,
    minWidth: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.two,
  },
});
