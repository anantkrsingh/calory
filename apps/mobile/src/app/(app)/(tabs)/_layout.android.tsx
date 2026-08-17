import { Tabs } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { useRef } from 'react';
import { StyleSheet, type View } from 'react-native';

import { AndroidTabbar } from '@/components/android-tabbar/AndroidTabbar';
import { TabBlurTargetProvider } from '@/components/android-tabbar/tab-blur-target';

/**
 * Android uses a custom floating pill tab bar. iOS keeps NativeTabs via `_layout.tsx`.
 * BlurTargetView wraps the navigator so the tab bar can blur screen content on SDK 31+.
 */
export default function AndroidTabLayout() {
  const blurTargetRef = useRef<View | null>(null);

  return (
    <TabBlurTargetProvider value={blurTargetRef}>
      <BlurTargetView ref={blurTargetRef} style={styles.root}>
        <Tabs
          tabBar={(props) => <AndroidTabbar {...props} />}
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
    </TabBlurTargetProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
