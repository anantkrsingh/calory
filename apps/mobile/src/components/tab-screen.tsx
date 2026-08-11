import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/app-bar';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type TabScreenProps = PropsWithChildren<{
  /**
   * Profile opts out — you are already looking at the account the avatar links to.
   * With no bar, the content column takes the top inset itself.
   */
  appBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

/**
 * The shell every tab screen sits in: full-bleed `AppBar`, then a centered content
 * column capped at `MaxContentWidth` and cleared of the native tab bar.
 *
 * The bar has to live outside that column — inside it, the column's horizontal
 * padding and top inset would leave the bar floating in from all three edges.
 */
export function TabScreen({ children, appBar = true, contentStyle }: TabScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      {appBar ? <AppBar /> : null}

      <SafeAreaView
        edges={appBar ? ['left', 'right'] : ['top', 'left', 'right']}
        style={styles.row}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    // paddingBottom: BottomTabInset + Spacing.three,
  },
});
