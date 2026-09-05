import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RING_SIZE = 96;
const EXERCISE_ROW_COUNT = 3;

/** Placeholder for the rings + exercises block on the home screen, shown
 * while a newly selected day's data is still loading. Mirrors that
 * layout's shape (ring cards, section title, a few exercise rows) so the
 * fade between skeleton and real content doesn't jump around. */
export function DaySummarySkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.ringsRow}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[styles.ringCard, { borderColor: theme.border }]}>
            <Skeleton style={styles.ring} />
            <Skeleton style={styles.ringLabel} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <View style={styles.list}>
          {Array.from({ length: EXERCISE_ROW_COUNT }, (_, i) => (
            <View key={i} style={[styles.row, { borderColor: theme.border }]}>
              <Skeleton style={styles.badge} />
              <View style={styles.copy}>
                <Skeleton style={styles.name} />
                <Skeleton style={styles.meta} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.four,
  },
  ringsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  ringCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  ring: {
    borderRadius: RING_SIZE / 2,
    height: RING_SIZE,
    width: RING_SIZE,
  },
  ringLabel: {
    height: 14,
    width: 80,
  },
  section: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  sectionTitle: {
    height: 20,
    width: 140,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  badge: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  name: {
    height: 15,
    width: '70%',
  },
  meta: {
    height: 13,
    width: '40%',
  },
});
