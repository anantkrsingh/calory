import type { Exercise } from '@fitness/types';
import { Play } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import {
  selectIsExerciseTimerRunning,
  useExerciseTimerStore,
} from '@/stores/exercise-timer.store';

type StartButtonProps = {
  exercise: Exercise;
};

const PILL_HEIGHT = 52;
const CHIP_INSET = Spacing.two;
const BUTTON_CONTENT_WIDTH = 72;

/**
 * The idle Start pill, local to the exercise detail screen. Pressing it
 * hands off to the global exercise-timer store — from then on the floating
 * bar in `(app)/_layout` (visible over every screen, so the timer survives
 * navigating away) owns the running state, ticking clock, and Stop button.
 * This button just hides itself while any timer is running, so there's
 * never a second, conflicting Start/Stop control on screen.
 */
export function StartStopButton({ exercise }: StartButtonProps) {
  const isRunning = useExerciseTimerStore(selectIsExerciseTimerRunning);
  const start = useExerciseTimerStore((state) => state.start);

  if (isRunning) return null;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Start ${exercise.name}`}
        hitSlop={8}
        onPress={() => start(exercise)}
        style={({ pressed }) => [styles.shadowWrap, pressed && Pressed]}>
        <View style={styles.container}>
          <View style={styles.buttonChip}>
            <Play color="#FFFFFF" size={18} fill="#FFFFFF" strokeWidth={2} />
            <ThemedText fontWeight="700" style={styles.buttonLabel}>
              Start
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  shadowWrap: {
    borderRadius: 999,
    elevation: 4,
    height: PILL_HEIGHT + CHIP_INSET * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Brand.ctaOutline,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: CHIP_INSET,
  },
  buttonChip: {
    alignItems: 'center',
    backgroundColor: Brand.ink,
    borderCurve: 'continuous',
    borderRadius: 999,
    flexDirection: 'row',
    gap: Spacing.two,
    height: PILL_HEIGHT,
    justifyContent: 'center',
    width: BUTTON_CONTENT_WIDTH + Spacing.five * 2,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
});
