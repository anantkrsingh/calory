import { Tabs } from 'expo-router';

import { AndroidTabbar } from '@/components/android-tabbar/AndroidTabbar';

/**
 * Android uses a custom floating pill tab bar. iOS keeps NativeTabs via `_layout.tsx`.
 */
export default function AndroidTabLayout() {
  return (
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
  );
}
