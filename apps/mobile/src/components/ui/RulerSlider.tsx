import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TICK_WIDTH = 10;
const TICKS_HEIGHT = 48;
const LABEL_HEIGHT = 20;
const LABEL_WIDTH = 40;

interface RulerSliderProps {
  /** Smallest selectable value, in the same unit as `value`. */
  min: number;
  /** Largest selectable value, in the same unit as `value`. */
  max: number;
  /** Distance between adjacent ticks. */
  step: number;
  /** Every how many value-units a tick is drawn taller and labeled. */
  majorStep: number;
  value: number;
  onChange: (value: number) => void;
  unitLabel: string;
  formatValue?: (value: number) => string;
  accessibilityLabel: string;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;
const defaultFormat = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * A horizontally-scrolling tape-measure control: swipe to move the ruler under
 * a fixed center pointer, the tick nearest the pointer is the selected value.
 * Mirrors the height/weight pickers common in other fitness apps.
 */
export default function RulerSlider({
  min,
  max,
  step,
  majorStep,
  value,
  onChange,
  unitLabel,
  formatValue = defaultFormat,
  accessibilityLabel,
}: RulerSliderProps) {
  const theme = useTheme();
  const listRef = useRef<FlatList<number>>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [liveValue, setLiveValue] = useState(value);
  // Guards the sync-to-`value` effect from fighting the list right after we
  // ourselves reported a new value from a scroll — see the effect below.
  const lastReportedIndex = useRef<number | null>(null);

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => round1(min + i * step));
  }, [min, max, step]);

  const itemsPerMajor = Math.max(1, Math.round(majorStep / step));

  const indexForValue = (target: number) => {
    const clamped = Math.min(Math.max(target, min), max);
    return Math.min(Math.max(Math.round((clamped - min) / step), 0), ticks.length - 1);
  };

  // Keep the ruler positioned at `value` — but only when it changed for a
  // reason other than our own scroll handler reporting it a moment ago
  // (unit toggle, external reset, or first mount), so we don't yank the
  // list mid-gesture right after the user just set this value by hand.
  useEffect(() => {
    if (containerWidth === 0) return;
    const index = indexForValue(value);
    if (index === lastReportedIndex.current) return;
    lastReportedIndex.current = index;
    setLiveValue(ticks[index]);
    listRef.current?.scrollToOffset({ offset: index * TICK_WIDTH, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only on identity/range changes, not on our own reported value
  }, [containerWidth, min, max, step, ticks]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.min(
      Math.max(Math.round(event.nativeEvent.contentOffset.x / TICK_WIDTH), 0),
      ticks.length - 1,
    );
    setLiveValue(ticks[index]);
  };

  const commitFromOffset = (offsetX: number) => {
    const index = Math.min(Math.max(Math.round(offsetX / TICK_WIDTH), 0), ticks.length - 1);
    lastReportedIndex.current = index;
    setLiveValue(ticks[index]);
    onChange(ticks[index]);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const sidePadding = containerWidth > 0 ? containerWidth / 2 - TICK_WIDTH / 2 : 0;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.readout, { color: theme.text }]}>
        {formatValue(liveValue)}
        <Text style={[styles.readoutUnit, { color: theme.textSecondary }]}> {unitLabel}</Text>
      </Text>

      <View
        style={styles.track}
        onLayout={handleLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: liveValue }}
      >
        {containerWidth > 0 ? (
          <FlatList
            ref={listRef}
            data={ticks}
            horizontal
            keyExtractor={(_, index) => String(index)}
            getItemLayout={(_, index) => ({ length: TICK_WIDTH, offset: TICK_WIDTH * index, index })}
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: sidePadding }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => commitFromOffset(e.nativeEvent.contentOffset.x)}
            onScrollEndDrag={(e) => commitFromOffset(e.nativeEvent.contentOffset.x)}
            renderItem={({ item, index }) => (
              <Tick
                value={item}
                isMajor={index % itemsPerMajor === 0}
                formatValue={formatValue}
                theme={theme}
              />
            )}
            initialNumToRender={60}
            windowSize={5}
            removeClippedSubviews
          />
        ) : null}

        <View
          pointerEvents="none"
          style={[styles.pointer, { backgroundColor: Brand.accent }]}
        />
      </View>
    </View>
  );
}

function Tick({
  value,
  isMajor,
  formatValue,
  theme,
}: {
  value: number;
  isMajor: boolean;
  formatValue: (value: number) => string;
  theme: { text: string; textSecondary: string };
}) {
  return (
    <View style={styles.tickColumn}>
      <View style={styles.tickBarSlot}>
        <View
          style={[
            styles.tickBar,
            {
              height: isMajor ? 40 : 18,
              backgroundColor: isMajor ? theme.text : theme.textSecondary,
              opacity: isMajor ? 1 : 0.5,
            },
          ]}
        />
      </View>
      <View style={styles.tickLabelSlot}>
        {isMajor ? (
          <Text style={[styles.tickLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {formatValue(value)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  readout: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 12,
  },
  readoutUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    height: TICKS_HEIGHT + LABEL_HEIGHT,
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -1.5,
    width: 3,
    height: TICKS_HEIGHT + 6,
    borderRadius: 2,
  },
  tickColumn: {
    width: TICK_WIDTH,
    alignItems: 'center',
  },
  tickBarSlot: {
    height: TICKS_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tickBar: {
    width: 2,
    borderRadius: 1,
  },
  tickLabelSlot: {
    height: LABEL_HEIGHT,
    width: LABEL_WIDTH,
    marginLeft: -(LABEL_WIDTH - TICK_WIDTH) / 2,
    alignItems: 'center',
  },
  tickLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
