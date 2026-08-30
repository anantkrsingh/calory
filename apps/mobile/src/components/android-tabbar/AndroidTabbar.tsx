import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ComponentProps, type RefObject } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type View as RNView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/android-tabbar/TabBarButton';
import {
  ANDROID_TAB_BAR_HEIGHT,
  ANDROID_TAB_BAR_MARGIN_BOTTOM,
} from '@/components/android-tabbar/constants';
import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

type AndroidTabbarProps = BottomTabBarProps & {
  blurTarget: RefObject<RNView | null>;
};

const DeviceWidth = Dimensions.get('window').width;

const TAB_BAR_HEIGHT = ANDROID_TAB_BAR_HEIGHT;
const HORIZONTAL_PADDING = 16;
const VERTICAL_PADDING = 8;
const PILL_TOP = 5;

export function AndroidTabbar({
  state,
  descriptors,
  navigation,
  blurTarget,
}: AndroidTabbarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [dimensions, setDimensions] = useState({
    height: TAB_BAR_HEIGHT,
    width: DeviceWidth - 32,
  });
  const [isDraggingState, setIsDraggingState] = useState(false);
  // Remount BlurView once the target has a native node (findNodeHandle needs it).
  const [blurReady, setBlurReady] = useState(() => Boolean(blurTarget.current));

  const buttonWidth = (dimensions.width + 50) / state.routes.length;
  const pillHeight = TAB_BAR_HEIGHT - VERTICAL_PADDING * 1.5;

  const tabPositionX = useSharedValue(buttonWidth * state.index);
  const dragX = useSharedValue(0);
  const isDragging = useSharedValue(0);

  useEffect(() => {
    if (blurReady) return;
    const id = requestAnimationFrame(() => {
      if (blurTarget.current) setBlurReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [blurTarget, blurReady]);

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  useEffect(() => {
    if (!isDraggingState) {
      tabPositionX.set(
        withTiming(buttonWidth * state.index, {
          duration: 100,
        }),
      );
    }
  }, [state.index, buttonWidth, isDraggingState, tabPositionX]);

  const navigateToTab = (index: number) => {
    const route = state.routes[index];
    if (route && index !== state.index) {
      navigation.navigate(route.name, route.params);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.set(1);
      runOnJS(setIsDraggingState)(true);
      dragX.set(tabPositionX.get());
    })
    .onUpdate((e) => {
      const newX = dragX.get() + e.translationX;
      const maxX = buttonWidth * (state.routes.length - 1);
      tabPositionX.set(Math.max(0, Math.min(maxX, newX)));
    })
    .onEnd(() => {
      isDragging.set(0);
      runOnJS(setIsDraggingState)(false);
      const currentIndex = Math.round(tabPositionX.get() / buttonWidth);
      const clampedIndex = Math.max(
        0,
        Math.min(state.routes.length - 1, currentIndex),
      );

      tabPositionX.set(
        withSpring(buttonWidth * clampedIndex, {
          damping: 20,
          stiffness: 300,
        }),
      );

      if (clampedIndex !== state.index) {
        runOnJS(navigateToTab)(clampedIndex);
      }
    });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    let offset = 0;
    switch (state.index) {
      case 0:
        offset = 5;
        break;
      case 1:
        offset = -10;
        break;
      case 2:
        offset = -26;
        break;
      case 3:
        offset = -43;
        break;
      case 4:
        offset = -60;
        break;
    }

    return {
      transform: [
        {
          translateX: tabPositionX.get() + offset,
        },
      ],
    };
  });

  const tabButtons = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : typeof options.title === 'string'
          ? options.title
          : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
      tabPositionX.set(
        withSpring(buttonWidth * index, {
          damping: 20,
          stiffness: 300,
        }),
      );

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TabBarButton
        key={route.key}
        onPress={onPress}
        onLongPress={onLongPress}
        isFocused={isFocused}
        routeName={route.name}
        label={label}
        style={styles.tabBarItem}
      />
    );
  });

  const barBody = (
    <>
      <Animated.View
        style={[
          styles.backgroundPill,
          {
            width: buttonWidth,
            height: pillHeight,
            backgroundColor: Brand.cream,
          },
          animatedBackgroundStyle,
        ]}
      />
      {tabButtons}
    </>
  );

  const barStyle = [
    styles.tabbar,
    {
      height: TAB_BAR_HEIGHT,
      paddingHorizontal: HORIZONTAL_PADDING,
      paddingVertical: VERTICAL_PADDING,
      borderColor: theme.border,
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <GestureDetector gesture={panGesture}>
        {blurReady ? (
          <BlurView
            key="blurred-tabbar"
            onLayout={onTabbarLayout}
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={100}
            tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
            blurReductionFactor={2}
            style={barStyle}>
            {barBody}
          </BlurView>
        ) : (
          <View onLayout={onTabbarLayout} style={[barStyle, { backgroundColor: theme.surface }]}>
            {barBody}
          </View>
        )}
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 40,
    marginHorizontal: 16,
    marginBottom: ANDROID_TAB_BAR_MARGIN_BOTTOM,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  backgroundPill: {
    position: 'absolute',
    borderRadius: 999,
    borderCurve: 'continuous',
    left: 1,
    top: PILL_TOP,
  },
  tabBarItem: {
    flex: 1,
  },
});
