import { TrueSheet } from '@lodev09/react-native-true-sheet';
import type { IsoDate, PortionFood } from '@fitness/types';
import { Minus, Plus } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePortionFoods } from '@/queries/portions.queries';
import { useLogPortion } from '@/queries/diet-plans.queries';

export type AddPortionSheetRef = {
  present: () => void;
};

type AddPortionSheetProps = {
  date: IsoDate;
};

/** Quantities people actually use — half a katori is common, 3.5 rotis is not. */
const STEP = 0.5;
const MAX_QUANTITY = 10;

/**
 * Quick-add for food that was not on the plan. Portions are the unit people
 * already speak in — "2 roti", "1 katori dal" — so there is nothing to weigh,
 * search or type: tap +/- and save.
 */
function AddPortionSheetComponent(
  { date }: AddPortionSheetProps,
  ref: React.Ref<AddPortionSheetRef>,
) {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);

  const { data: foods, isLoading } = usePortionFoods();
  const logPortion = useLogPortion();

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useImperativeHandle(ref, () => ({
    present: () => {
      setQuantities({});
      void sheetRef.current?.present();
    },
  }));

  const selected = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0),
    [quantities],
  );

  const totalCalories = useMemo(() => {
    if (!foods) return 0;
    return selected.reduce((sum, [id, qty]) => {
      const food = foods.find((f) => f.id === id);
      return sum + (food ? Math.round(food.calories * qty) : 0);
    }, 0);
  }, [foods, selected]);

  const adjust = useCallback((id: string, delta: number) => {
    setQuantities((current) => {
      const next = Math.min(
        Math.max((current[id] ?? 0) + delta, 0),
        MAX_QUANTITY,
      );
      return { ...current, [id]: next };
    });
  }, []);

  const save = useCallback(async () => {
    try {
      // One request per food; the API snapshots macros per entry so they stay
      // independent and individually removable.
      for (const [portionId, quantity] of selected) {
        await logPortion.mutateAsync({ date, input: { portionId, quantity } });
      }
      await sheetRef.current?.dismiss();
    } catch (err) {
      Alert.alert(
        'Could not save',
        getErrorMessage(err, 'Something went wrong. Please try again.'),
      );
    }
  }, [selected, logPortion, date]);

  return (
    <TrueSheet
      ref={sheetRef}
      // A fraction of the screen: tall enough to scan the list, short enough
      // that today's plan stays visible behind it.
      detents={[0.6, 0.9]}
      dimmed
      dimmedDetentIndex={0}
      cornerRadius={20}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText fontWeight="700" style={styles.title}>
          Add what you ate
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Tap to add anything that wasn’t on your plan.
        </ThemedText>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}>
            {(foods ?? []).map((food) => (
              <PortionRow
                key={food.id}
                food={food}
                quantity={quantities[food.id] ?? 0}
                onAdjust={adjust}
              />
            ))}
          </ScrollView>
        )}

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <ThemedText fontWeight="700" style={styles.total}>
            {totalCalories} kcal
          </ThemedText>
          <PrimaryButton
            label={logPortion.isPending ? 'Adding…' : 'Add to today'}
            onPress={() => {
              void save();
            }}
            disabled={selected.length === 0 || logPortion.isPending}
            style={styles.cta}
          />
        </View>
      </View>
    </TrueSheet>
  );
}

function PortionRow({
  food,
  quantity,
  onAdjust,
}: {
  food: PortionFood;
  quantity: number;
  onAdjust: (id: string, delta: number) => void;
}) {
  const theme = useTheme();
  const isActive = quantity > 0;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowCopy}>
        <ThemedText numberOfLines={1} style={styles.rowName}>
          {food.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.rowMeta}>
          {food.calories} kcal per {food.unit}
          {food.gramsPerUnit ? ` · ~${food.gramsPerUnit}g` : ''}
        </ThemedText>
      </View>

      <View style={styles.stepper}>
        <Stepper
          icon={<Minus size={16} color={theme.text} strokeWidth={2.5} />}
          label={`Remove one ${food.unit} of ${food.name}`}
          disabled={quantity === 0}
          onPress={() => onAdjust(food.id, -STEP)}
        />
        <ThemedText
          fontWeight="700"
          style={[
            styles.quantity,
            { color: isActive ? Brand.accent : theme.textSecondary },
          ]}>
          {formatQuantity(quantity)}
        </ThemedText>
        <Stepper
          icon={<Plus size={16} color={theme.text} strokeWidth={2.5} />}
          label={`Add one ${food.unit} of ${food.name}`}
          disabled={quantity >= MAX_QUANTITY}
          onPress={() => onAdjust(food.id, STEP)}
        />
      </View>
    </View>
  );
}

function Stepper({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.stepperButton,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: disabled ? 0.35 : pressed ? Pressed.opacity : 1,
        },
      ]}>
      {icon}
    </Pressable>
  );
}

/** Drops the trailing `.0` so whole portions read as "2", not "2.0". */
function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  title: {
    fontSize: 20,
    paddingHorizontal: Spacing.four,
  },
  subtitle: {
    fontSize: 13,
    paddingHorizontal: Spacing.four,
    paddingTop: 2,
  },
  centered: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  list: {
    flex: 1,
    marginTop: Spacing.three,
  },
  listContent: {
    paddingBottom: Spacing.three,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 15,
  },
  rowMeta: {
    fontSize: 12,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stepperButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  quantity: {
    fontSize: 15,
    minWidth: 28,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  total: {
    fontSize: 17,
  },
  cta: {
    flex: 1,
  },
});

export const AddPortionSheet = forwardRef(AddPortionSheetComponent);
