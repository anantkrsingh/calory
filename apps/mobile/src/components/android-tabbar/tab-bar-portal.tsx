import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';

export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

type TabBarPropsSetter = Dispatch<SetStateAction<TabBarProps | null>>;

const TabBarPropsContext = createContext<TabBarPropsSetter | null>(null);

export function TabBarPropsProvider({
  value,
  children,
}: {
  value: TabBarPropsSetter;
  children: ReactNode;
}) {
  return (
    <TabBarPropsContext.Provider value={value}>{children}</TabBarPropsContext.Provider>
  );
}

export function useSetTabBarProps(): TabBarPropsSetter {
  const setter = useContext(TabBarPropsContext);
  if (!setter) {
    throw new Error('useSetTabBarProps must be used within TabBarPropsProvider');
  }
  return setter;
}
