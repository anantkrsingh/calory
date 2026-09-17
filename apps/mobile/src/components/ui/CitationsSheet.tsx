import type { Citation } from '@fitness/types';
import { ExternalLink, X } from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CitationsSheetRef = {
  present: (citations: Citation[], title?: string) => void;
};

/**
 * Shared bottom sheet for "where did this number come from" — opened from an
 * (i) button next to AI-generated content (a diet meal, a chat reply) that
 * cited real web sources. One instance per screen; present() swaps its
 * content rather than mounting a sheet per item.
 *
 * Deliberately built on RN's own `Modal` rather than the `TrueSheet` native
 * sheet used everywhere else in the app (AddPortionSheet, LoginSheet, …) —
 * this one is plain content with no drag-to-resize needs, so a lighter,
 * dependency-free slide-up panel is enough.
 */
function CitationsSheetComponent(_props: unknown, ref: React.Ref<CitationsSheetRef>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [title, setTitle] = useState('Sources');

  useImperativeHandle(ref, () => ({
    present: (nextCitations, nextTitle) => {
      setCitations(nextCitations);
      setTitle(nextTitle ?? 'Sources');
      setVisible(true);
    },
  }));

  const close = useCallback(() => setVisible(false), []);

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close sources"
        style={styles.backdrop}
        onPress={close}
      />

      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three },
        ]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <View style={styles.header}>
          <ThemedText fontWeight="700" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={close}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.backgroundElement,
                opacity: pressed ? Pressed.opacity : 1,
              },
            ]}>
            <X color={theme.textSecondary} size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Real sources the AI referenced for these numbers.
        </ThemedText>

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {citations.map((citation, index) => (
            <Pressable
              key={`${citation.url}-${index}`}
              accessibilityRole="link"
              accessibilityLabel={citation.title}
              onPress={() => openUrl(citation.url)}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: theme.border,
                  opacity: pressed ? Pressed.opacity : 1,
                },
              ]}>
              <View style={styles.rowCopy}>
                <ThemedText numberOfLines={2} style={styles.rowTitle}>
                  {citation.title}
                </ThemedText>
                <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.rowUrl}>
                  {citation.url}
                </ThemedText>
              </View>
              <ExternalLink color={Brand.accent} size={16} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export const CitationsSheet = forwardRef(CitationsSheetComponent);

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom: 0,
    left: 0,
    maxHeight: '75%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: Spacing.three,
    width: 36,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    marginTop: Spacing.three,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  rowUrl: {
    fontSize: 12,
  },
});
