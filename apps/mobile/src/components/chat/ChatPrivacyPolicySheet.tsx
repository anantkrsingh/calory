import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { visible: boolean; loading?: boolean; onAgree: () => void };

export function ChatPrivacyPolicySheet({ visible, loading, onAgree }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <ThemedText type="subtitle">Chat privacy</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.copy}>
            To personalize your coach, Fit Crate sends your chat messages and relevant fitness profile data to its AI providers. They process it to return your response. You can stop using chat at any time.
          </ThemedText>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://caloryfitness.netlify.app/chat-privacy')}>
            <ThemedText style={styles.link}>Read the Chat Privacy Policy</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => setChecked((value) => !value)} style={styles.checkRow}>
            <View style={[styles.checkbox, { borderColor: checked ? Brand.accent : theme.border, backgroundColor: checked ? Brand.accent : 'transparent' }]}>
              {checked ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <ThemedText style={styles.checkText}>I understand and agree to this Chat Privacy Policy.</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!checked || loading} onPress={onAgree} style={[styles.button, { backgroundColor: checked ? Brand.accent : theme.border, opacity: loading ? 0.6 : 1 }]}>
            <ThemedText style={styles.buttonText}>{loading ? 'Saving…' : 'Agree and continue'}</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.three },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: Spacing.one },
  copy: { fontSize: 15, lineHeight: 22 },
  link: { color: Brand.accent, textDecorationLine: 'underline' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, fontSize: 14, lineHeight: 19 },
  button: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
