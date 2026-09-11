import type { Id, LoggedPortion } from '@fitness/types';
import { Plus, X } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ExtrasCardProps = {
  entries: LoggedPortion[];
  onAdd: () => void;
  onRemove: (entryId: Id) => void;
  disabled?: boolean;
};

/**
 * Anything eaten that was not on the plan. Collapses to a single "Add
 * something else" row when empty, so it costs nothing visually for users who
 * follow their plan exactly.
 */
function ExtrasCardComponent({
  entries,
  onAdd,
  onRemove,
  disabled,
}: ExtrasCardProps) {
  const theme = useTheme();
  const total = entries.reduce((sum, entry) => sum + entry.calories, 0);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      {entries.length > 0 ? (
        <>
          <View style={styles.header}>
            <ThemedText fontWeight="700" style={styles.title}>
              Also eaten
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.total}>
              {total} kcal
            </ThemedText>
          </View>

          <View style={styles.entries}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryCopy}>
                  <ThemedText numberOfLines={1} style={styles.entryName}>
                    {formatQuantity(entry.quantity)} {entry.unit} · {entry.name}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.entryMacros}>
                    {entry.calories} kcal · {entry.proteinG}g protein
                  </ThemedText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${entry.name}`}
                  disabled={disabled}
                  onPress={() => onRemove(entry.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.remove,
                    {
                      backgroundColor: theme.backgroundElement,
                      opacity: disabled ? 0.4 : pressed ? Pressed.opacity : 1,
                    },
                  ]}>
                  <X size={13} color={theme.textSecondary} strokeWidth={2.5} />
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add food that was not on your plan"
        onPress={onAdd}
        style={({ pressed }) => [
          styles.add,
          { opacity: pressed ? Pressed.opacity : 1 },
        ]}>
        <Plus size={16} color={Brand.accent} strokeWidth={2.5} />
        <ThemedText style={[styles.addText, { color: Brand.accent }]}>
          {entries.length > 0 ? 'Add more' : 'Add something else you ate'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

/** Drops the trailing `.0` so whole portions read as "2", not "2.0". */
function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth || 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
  },
  total: {
    fontSize: 13,
  },
  entries: {
    gap: Spacing.two,
  },
  entry: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  entryCopy: {
    flex: 1,
    gap: 1,
  },
  entryName: {
    fontSize: 14,
  },
  entryMacros: {
    fontSize: 12,
  },
  remove: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  add: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  addText: {
    fontSize: 14,
  },
});

export const ExtrasCard = memo(ExtrasCardComponent);
