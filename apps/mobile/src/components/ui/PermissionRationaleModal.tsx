import type { LucideIcon } from 'lucide-react-native';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HAIRLINE = StyleSheet.hairlineWidth || 1;

type PermissionRationaleModalProps = {
  visible: boolean;
  icon: LucideIcon;
  title: string;
  body: string;
  allowLabel?: string;
  denyLabel?: string;
  loading?: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
  onRequestClose: () => void;
};

export function PermissionRationaleModal({
  visible,
  icon: Icon,
  title,
  body,
  allowLabel = 'Allow',
  denyLabel = 'Deny',
  loading = false,
  onAllow,
  onDeny,
  onRequestClose,
}: PermissionRationaleModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />

        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
            <Icon color={Brand.accent} size={26} strokeWidth={2} />
          </View>

          <View style={styles.copy}>
            <ThemedText fontWeight="700" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.body}>
              {body}
            </ThemedText>
          </View>

          <View style={styles.actions}>
            {onDeny ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={denyLabel}
                disabled={loading}
                onPress={onDeny}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: theme.border },
                  pressed && !loading && Pressed,
                  loading && styles.disabled,
                ]}>
                <ThemedText fontWeight="700" style={styles.secondaryText}>
                  {denyLabel}
                </ThemedText>
              </Pressable>
            ) : null}

            {onAllow ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={allowLabel}
                disabled={loading}
                onPress={onAllow}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !loading && Pressed,
                  loading && styles.disabled,
                ]}>
                <ThemedText fontWeight="700" style={styles.primaryText}>
                  {loading ? 'Please wait...' : allowLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      default: {},
    }),
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.accent,
    paddingHorizontal: Spacing.two,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  secondaryText: {
    fontSize: 15,
    lineHeight: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
