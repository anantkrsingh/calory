import { useRouter } from 'expo-router';
import { ChefHat, Dumbbell, MessageCircle, TrendingUp, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// TODO: swap for the real RevenueCat offering — `src/lib/purchases.ts` already
// configures the SDK and syncs identity, but no offering/package ids exist yet.
// Wire `handleContinue`/`handleRestore` up to `Purchases.getOfferings()` and
// `Purchases.purchasePackage`/`restorePurchases` once those are set up.
type PlanId = 'weekly' | 'monthly' | 'yearly';

type Plan = {
  id: PlanId;
  label: string;
  price: string;
  per: string;
  badge?: string;
  detail: string;
};

const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    price: '₹299',
    per: '/month',
    detail: '₹299 billed monthly. Renews automatically until canceled — cancel anytime.',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    price: '₹999',
    per: '/year',
    badge: 'BEST VALUE',
    detail:
      '₹999 billed annually (≈₹83/month). Renews automatically until canceled — cancel anytime.',
  },
  weekly: {
    id: 'weekly',
    label: 'Weekly',
    price: '₹79',
    per: '/week',
    detail: '₹79 billed weekly. Renews automatically until canceled — cancel anytime.',
  },
};

const BENEFITS: { icon: ReactNode; label: string }[] = [
  { icon: <ChefHat size={20} color={Brand.accent} />, label: 'Unlimited AI-generated diet plans' },
  { icon: <Dumbbell size={20} color={Brand.accent} />, label: 'Unlimited workout & set tracking' },
  { icon: <TrendingUp size={20} color={Brand.accent} />, label: 'Deeper progress analytics' },
  { icon: <MessageCircle size={20} color={Brand.accent} />, label: 'Priority AI coach chat' },
];

// TODO: point these at the real hosted pages once they exist.
const LEGAL_LINKS: { label: string; url: string }[] = [
  { label: 'Terms', url: 'https://example.com/terms' },
  { label: 'Privacy', url: 'https://example.com/privacy' },
  { label: 'Refund', url: 'https://example.com/refund' },
];

/**
 * "Calory Pro" paywall — the app's subscription upsell, presented as a modal
 * from anywhere (`router.push('/premium')`). Plan/price data is a static
 * placeholder (see the TODO above) until real RevenueCat offerings are wired in.
 */
export default function PremiumScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PlanId>('yearly');

  const plan = PLANS[selected];

  const handleContinue = () => {
    // Placeholder until purchase flow is wired up — see the TODO above.
    if (__DEV__) console.log('[premium] continue with plan', selected);
  };

  const handleRestore = () => {
    if (__DEV__) console.log('[premium] restore purchases');
  };

  return (
    <ThemedView style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + Spacing.two }]}>
        <X color={theme.text} size={22} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <View style={styles.hero}>
          <ThemedText family="ubuntu" fontWeight="700" style={styles.title}>
            Calory Pro
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Train hard. Track everything — unlocked.
          </ThemedText>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map(({ icon, label }) => (
            <View key={label} style={styles.benefitRow}>
              {icon}
              <ThemedText style={styles.benefitLabel}>{label}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.plansRow}>
          <PlanCard plan={PLANS.monthly} selected={selected === 'monthly'} onPress={() => setSelected('monthly')} />
          <PlanCard plan={PLANS.yearly} selected={selected === 'yearly'} onPress={() => setSelected('yearly')} />
        </View>

        <PlanRow plan={PLANS.weekly} selected={selected === 'weekly'} onPress={() => setSelected('weekly')} />

        <PrimaryButton label="Continue" onPress={handleContinue} style={styles.continueButton} />

        <ThemedText themeColor="textSecondary" style={styles.detailText}>
          {plan.detail}
        </ThemedText>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={handleRestore}>
            <ThemedText themeColor="textSecondary" style={styles.footerLink}>
              Restore
            </ThemedText>
          </Pressable>
          {LEGAL_LINKS.map(({ label, url }) => (
            <View key={label} style={styles.footerItem}>
              <ThemedText themeColor="textSecondary" style={styles.footerDot}>
                ·
              </ThemedText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => Linking.openURL(url)}>
                <ThemedText themeColor="textSecondary" style={styles.footerLink}>
                  {label}
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type PlanCardProps = {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
};

/** One of the two boxed plans (Monthly / Yearly) shown side by side. */
function PlanCard({ plan, selected, onPress }: PlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.planCard,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? Brand.accent : 'transparent',
        },
      ]}>
      {plan.badge ? (
        <View style={[styles.planBadge, { backgroundColor: Brand.accent }]}>
          <ThemedText fontWeight="700" style={styles.planBadgeText}>
            {plan.badge}
          </ThemedText>
        </View>
      ) : null}

      <ThemedText fontWeight="700" style={styles.planLabel}>
        {plan.label}
      </ThemedText>
      <ThemedText fontWeight="700" style={styles.planPrice}>
        {plan.price}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.planPer}>
        {plan.per}
      </ThemedText>
    </Pressable>
  );
}

/** The full-width Weekly option, laid out as a single row below the boxed pair. */
function PlanRow({ plan, selected, onPress }: PlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.planRow,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? Brand.accent : 'transparent',
        },
      ]}>
      <ThemedText fontWeight="700" style={styles.planLabel}>
        {plan.label}
      </ThemedText>
      <ThemedText fontWeight="700" style={styles.planPrice}>
        {plan.price}
        <ThemedText themeColor="textSecondary" style={styles.planPer}>
          {' '}
          {plan.per}
        </ThemedText>
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    left: Spacing.three,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: Spacing.one,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  benefits: {
    gap: Spacing.one,
    marginBottom: Spacing.five,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  benefitLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  plansRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  planCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  planLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  planPrice: {
    marginTop: Spacing.one,
    fontSize: 22,
    lineHeight: 28,
  },
  planPer: {
    fontSize: 13,
    lineHeight: 18,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
  },
  continueButton: {
    marginBottom: Spacing.two,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  footerDot: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    lineHeight: 18,
  },
});
