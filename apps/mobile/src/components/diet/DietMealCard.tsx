import type { DietMeal, Id } from '@fitness/types';
import { Check, Info } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function macroLine(calories: number, proteinG: number, fatG: number, carbsG: number): string {
  return `${calories} kcal · ${proteinG}g protein · ${fatG}g fat · ${carbsG}g carbs`;
}

type DietMealCardProps = {
  meal: DietMeal;
  takenItemIds: ReadonlySet<Id>;
  onToggleItem: (mealId: Id, itemId: Id, taken: boolean) => void;
  onToggleMeal: (mealId: Id, taken: boolean) => void;
  onShowCitations?: (meal: DietMeal) => void;
  disabled?: boolean;
};

function DietMealCardComponent({
  meal,
  takenItemIds,
  onToggleItem,
  onToggleMeal,
  onShowCitations,
  disabled,
}: DietMealCardProps) {
  const theme = useTheme();
  const allTaken =
    meal.items.length > 0 && meal.items.every((item) => takenItemIds.has(item.id));
  const hasCitations = meal.citations.length > 0;
  const [toggleProgress] = useState(() => new Animated.Value(allTaken ? 1 : 0));

  useEffect(() => {
    Animated.timing(toggleProgress, {
      toValue: allTaken ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [allTaken, toggleProgress]);

  const mealToggleAnimatedStyle = {
    backgroundColor: toggleProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.backgroundElement, Brand.accent],
    }),
    width: toggleProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [112, 86],
    }),
  };

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.nameRow}>
            <ThemedText fontWeight="700" style={styles.name}>
              {meal.name}
            </ThemedText>
            {hasCitations ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View sources for ${meal.name}`}
                hitSlop={8}
                onPress={() => onShowCitations?.(meal)}
                style={({ pressed }) => [
                  styles.infoButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: pressed ? Pressed.opacity : 1,
                  },
                ]}>
                <Info color={theme.textSecondary} size={12} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
          <ThemedText themeColor="textSecondary" style={styles.macros}>
            {macroLine(
              meal.totalCalories,
              meal.totalProteinG,
              meal.totalFatG,
              meal.totalCarbsG,
            )}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={allTaken ? 'Mark meal not taken' : 'Mark meal taken'}
          accessibilityState={{ checked: allTaken }}
          disabled={disabled}
          onPress={() => onToggleMeal(meal.id, !allTaken)}
          style={({ pressed }) => [
            styles.mealTogglePressable,
            { opacity: disabled ? 0.5 : pressed ? Pressed.opacity : 1 },
          ]}>
          <Animated.View style={[styles.mealToggle, mealToggleAnimatedStyle]}>
            <Check color={allTaken ? '#FFFFFF' : theme.textSecondary} size={14} strokeWidth={3} />
            <ThemedText
              style={[styles.mealToggleText, allTaken && styles.mealToggleTextTaken]}>
              {allTaken ? 'Taken' : 'Mark taken'}
            </ThemedText>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.items}>
        {meal.items.map((item) => {
          const taken = takenItemIds.has(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              accessibilityState={{ checked: taken }}
              disabled={disabled}
              onPress={() => onToggleItem(meal.id, item.id, !taken)}
              style={({ pressed }) => [
                styles.item,
                { opacity: disabled ? 0.5 : pressed ? Pressed.opacity : 1 },
              ]}>
              <View
                style={[
                  styles.itemCheck,
                  {
                    backgroundColor: taken ? Brand.accent : 'transparent',
                    borderColor: taken ? Brand.accent : theme.border,
                  },
                ]}>
                {taken ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
              </View>

              <View style={styles.itemCopy}>
                <ThemedText
                  numberOfLines={1}
                  style={[styles.itemName, taken && styles.itemTaken]}>
                  {item.name}
                  {item.description ? (
                    <ThemedText themeColor="textSecondary" style={styles.itemDescription}>
                      {'  ·  '}
                      {item.description}
                    </ThemedText>
                  ) : null}
                </ThemedText>
                <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.itemMacros}>
                  {macroLine(item.calories, item.proteinG, item.fatG, item.carbsG)}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const DietMealCard = memo(DietMealCardComponent);

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth || 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  name: {
    fontSize: 16,
    lineHeight: 21,
  },
  infoButton: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  macros: {
    fontSize: 12,
    lineHeight: 16,
  },
  mealTogglePressable: {
    borderRadius: 999,
  },
  mealToggle: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 30,
    overflow: 'hidden',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
  },
  mealToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mealToggleTextTaken: {
    color: '#FFFFFF',
  },
  items: {
    gap: Spacing.two + 2,
  },
  item: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  itemCheck: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    lineHeight: 19,
  },
  itemTaken: {
    opacity: 0.55,
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: 13,
    fontWeight: '400',
    textDecorationLine: 'none',
  },
  itemMacros: {
    fontSize: 12,
    lineHeight: 16,
  },
});
