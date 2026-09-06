import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export type DietMode = 'today' | 'metrics' | 'plan';

const TABS: { key: DietMode; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'plan', label: 'Plan' },
];

const SLIDE_DURATION_MS = 280;
const TRACK_PADDING = Spacing.half;

// Deliberately fixed rather than theme-driven — a solid white track with a
// solid black active pill, the same in light and dark mode.
const TRACK_BACKGROUND = '#FFFFFF';
const PILL_BACKGROUND = '#000000';

type DietModeSwitcherProps = {
  activeMode: DietMode;
  onChange: (mode: DietMode) => void;
};

/**
 * The diet screen's top mode switcher — Today / Metrics / Plan — replacing
 * the usual `AppBar`. A solid black pill slides behind the active label,
 * animated the same way `WeekCaloriesStrip`'s selected-day pill is.
 */
export function DietModeSwitcher({ activeMode, onChange }: DietModeSwitcherProps) {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);

  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.key === activeMode));
  const segmentWidth =
    trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / TABS.length : 0;

  const translateX = useSharedValue(0);
  const isFirstPosition = useRef(true);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const target = activeIndex * segmentWidth;
    if (isFirstPosition.current) {
      translateX.value = target;
      isFirstPosition.current = false;
    } else {
      translateX.value = withTiming(target, {
        duration: SLIDE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, segmentWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.centeredRow}>
        <View
          style={[styles.track, { backgroundColor: TRACK_BACKGROUND }]}
          onLayout={handleLayout}>
          {segmentWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.pill, { backgroundColor: PILL_BACKGROUND }, pillStyle]}
            />
          ) : null}

          <View style={styles.row}>
            {TABS.map((tab) => {
              const selected = tab.key === activeMode;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected }}
                  onPress={() => onChange(tab.key)}
                  style={styles.segment}>
                  <ThemedText
                    fontWeight="700"
                    numberOfLines={1}
                    style={[styles.label, { color: selected ? '#FFFFFF' : '#000000' }]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  // Tablet support: keep the switcher within max width, same convention as
  // AppBar's `row`.
  centeredRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  track: {
    borderCurve: 'continuous',
    borderRadius: 999,
    padding: TRACK_PADDING,
    // A solid white track on a near-white light background needs its own
    // edge to read as a control — same soft shadow WeekCaloriesStrip's card
    // uses, rather than a border that would fight the pill's rounded ends.
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  },
  row: {
    flexDirection: 'row',
    zIndex: 1,
  },
  pill: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderCurve: 'continuous',
    borderRadius: 999,
    zIndex: 0,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 14,
  },
});
