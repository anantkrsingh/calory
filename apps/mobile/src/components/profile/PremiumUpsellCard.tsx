import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BadgeCheck, ChevronRight, Crown } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { IAP_ENABLED } from '@/lib/purchases';
import { useIsPro } from '@/queries/purchases.queries';


import { selectUser, useAuthStore } from '@/stores/auth.store';

export function PremiumUpsellCard() {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore(selectUser);
  const isPro = useIsPro();

  if (!IAP_ENABLED) return null;

  const planTitle = isPro
    ? user?.planName
      ? `${user.planName} - Active`
      : 'Calory Pro - Active'
    : 'Upgrade to Calory Pro';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isPro ? 'Calory Pro is active' : 'Upgrade to Calory Pro'}
      onPress={() => router.push('/premium')}
      style={({ pressed }) => [styles.card, pressed && Pressed]}>
      <LinearGradient
        colors={['#FCE7A0', '#E8B33D', '#C0870F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}>
        <View style={[styles.inner, { backgroundColor: theme.surface }]}>
          {isPro ? (
            <BadgeCheck size={22} color={"#FCE7A0"} />
          ) : (
            <Crown size={22} color={"#FCE7A0"} />
          )}

          <View style={styles.textBlock}>
            <ThemedText fontWeight="700" style={styles.title}>
              {planTitle}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              {isPro
                ? 'Tap to manage your subscription & benefits'
                : 'Unlock AI diet plans, unlimited reps history & coach'}
            </ThemedText>
          </View>

          <ChevronRight size={20} color={theme.textSecondary} strokeWidth={2} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  border: {
    paddingTop:1.5,
    paddingHorizontal: Spacing.half,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
