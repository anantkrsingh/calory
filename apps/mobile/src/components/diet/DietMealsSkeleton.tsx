import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MEAL_CARD_COUNT = 3;
const ITEM_ROW_COUNT = 3;

/** Placeholder for a day's meal list, shown while that day's data is still
 * loading — confined to the list area (see `DietsScreen`) so switching days
 * or tabs never hides the mode switcher or week selector around it. Mirrors
 * `DietMealCard`'s shape (header + item rows) so the fade into real content
 * doesn't jump around, same convention as `DaySummarySkeleton`. */
export function DietMealsSkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Skeleton style={styles.title} />
      <View style={styles.list}>
        {Array.from({ length: MEAL_CARD_COUNT }, (_, cardIndex) => (
          <View key={cardIndex} style={[styles.card, { borderColor: theme.border }]}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Skeleton style={styles.name} />
                <Skeleton style={styles.macros} />
              </View>
              <Skeleton style={styles.toggle} />
            </View>

            <View style={styles.items}>
              {Array.from({ length: ITEM_ROW_COUNT }, (_, itemIndex) => (
                <View key={itemIndex} style={styles.item}>
                  <Skeleton style={styles.itemCheck} />
                  <View style={styles.itemCopy}>
                    <Skeleton style={styles.itemName} />
                    <Skeleton style={styles.itemMacros} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Placeholder for the Metrics tab's stat row, same shimmer convention. */
export function DietMetricsSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={styles.stat}>
          <Skeleton style={styles.statValue} />
          <Skeleton style={styles.statLabel} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  title: {
    height: 20,
    width: 140,
  },
  list: {
    gap: Spacing.three,
  },
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
    gap: 6,
  },
  name: {
    height: 16,
    width: '60%',
  },
  macros: {
    height: 12,
    width: '85%',
  },
  toggle: {
    borderRadius: 999,
    height: 26,
    width: 84,
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
    borderRadius: 8,
    height: 22,
    width: 22,
  },
  itemCopy: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    height: 14,
    width: '70%',
  },
  itemMacros: {
    height: 12,
    width: '45%',
  },
  statsRow: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    paddingVertical: Spacing.three,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  statValue: {
    height: 16,
    width: 40,
  },
  statLabel: {
    height: 12,
    width: 50,
  },
});
