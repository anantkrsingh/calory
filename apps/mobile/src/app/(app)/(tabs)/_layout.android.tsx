import { BlurTargetView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, type View as RNView } from 'react-native';

import { AndroidTabbar } from '@/components/android-tabbar/AndroidTabbar';
import {
  TabBarPropsProvider,
  useSetTabBarProps,
  type TabBarProps,
} from '@/components/android-tabbar/tab-bar-portal';

/**
 * Captures React Navigation tab-bar props and publishes them so the bar can
 * render as a sibling of BlurTargetView (required for Android blur).
 */
function TabBarPropsSync(props: TabBarProps) {
  const setTabBarProps = useSetTabBarProps();
  const index = props.state.index;
  const routeKey = props.state.routes[index]?.key;

  useLayoutEffect(() => {
    setTabBarProps(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on tab identity only
  }, [index, routeKey, setTabBarProps]);

  useLayoutEffect(() => {
    return () => setTabBarProps(null);
  }, [setTabBarProps]);

  return null;
}

/**
 * Android floating tab bar. BlurTargetView wraps only the screens; the blur
 * tab bar is rendered beside it (Expo Android blur requires siblings).
 */
export default function AndroidTabLayout() {
  const blurTargetRef = useRef<RNView | null>(null);
  const [tabBarProps, setTabBarProps] = useState<TabBarProps | null>(null);

  return (
    <TabBarPropsProvider value={setTabBarProps}>
      <View style={styles.root}>
        <BlurTargetView ref={blurTargetRef} style={styles.target}>
          <Tabs
            tabBar={(props) => <TabBarPropsSync {...props} />}
            screenOptions={{
              headerShown: false,
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarLabel: 'Home',
              }}
            />
            <Tabs.Screen
              name="build"
              options={{
                title: 'Build',
                tabBarLabel: 'Build',
              }}
            />
            <Tabs.Screen
              name="chat"
              options={{
                title: 'Chat',
                tabBarLabel: 'Chat',
              }}
            />
            <Tabs.Screen
              name="diets"
              options={{
                title: 'Diets',
                tabBarLabel: 'Diets',
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarLabel: 'Profile',
              }}
            />
          </Tabs>
        </BlurTargetView>

        {tabBarProps ? (
          <AndroidTabbar {...tabBarProps} blurTarget={blurTargetRef} />
        ) : null}
      </View>
    </TabBarPropsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  target: {
    flex: 1,
  },
});
