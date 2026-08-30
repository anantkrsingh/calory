import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppBar } from "@/components/app-bar";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";

type TabScreenProps = PropsWithChildren<{
  /**
   * Profile opts out — you are already looking at the account the avatar links to.
   * With no bar, the content column takes the top inset itself.
   */
  appBar?: boolean;
  /** Full-bleed header (e.g. ScreenAppBar). Takes the top safe area when set. */
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}>;

/**
 * The shell every tab screen sits in: full-bleed `AppBar`, then a centered content
 * column capped at `MaxContentWidth` and cleared of the native tab bar.
 *
 * The bar has to live outside that column — inside it, the column's horizontal
 * padding and top inset would leave the bar floating in from all three edges.
 */
export function TabScreen({
  children,
  appBar = true,
  header,
  contentStyle,
}: TabScreenProps) {
  const topChrome = appBar ? <AppBar /> : header ? header : null;

  return (
    <ThemedView style={styles.screen}>
      {topChrome}

      <View style={styles.row}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
});
