import {
  createContext,
  useContext,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import type { View } from 'react-native';

const TabBlurTargetContext = createContext<RefObject<View | null> | null>(null);

export function TabBlurTargetProvider({
  value,
  children,
}: PropsWithChildren<{ value: RefObject<View | null> }>) {
  return (
    <TabBlurTargetContext.Provider value={value}>
      {children}
    </TabBlurTargetContext.Provider>
  );
}

export function useTabBlurTarget(): RefObject<View | null> | null {
  return useContext(TabBlurTargetContext);
}
