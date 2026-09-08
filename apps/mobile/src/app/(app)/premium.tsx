import { Redirect, useRouter, type Href } from 'expo-router';
import {
  BadgeCheck,
  ChefHat,
  Dumbbell,
  MessageCircle,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { PURCHASES_ERROR_CODE, type PurchasesError, type PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ENTITLEMENT_ID, hasActiveEntitlement, IAP_ENABLED } from '@/lib/purchases';
import {
  useCustomerInfo,
  useOfferings,
  usePurchasePackage,
  useRestorePurchases,
} from '@/queries/purchases.queries';

type PlanId = 'weekly' | 'monthly' | 'yearly';

const PLAN_META: Record<PlanId, { label: string; per: string; billedAs: string }> = {
  weekly: { label: 'Weekly', per: '/week', billedAs: 'weekly' },
  monthly: { label: 'Monthly', per: '/month', billedAs: 'monthly' },
  yearly: { label: 'Yearly', per: '/year', billedAs: 'annually' },
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

function detailTextFor(id: PlanId, pkg: PurchasesPackage): string {
  const { billedAs } = PLAN_META[id];
  const monthlyEquivalent =
    id === 'yearly' && pkg.product.pricePerMonthString
      ? ` (≈${pkg.product.pricePerMonthString}/month)`
      : '';
  return `${pkg.product.priceString} billed ${billedAs}${monthlyEquivalent}. Renews automatically until canceled — cancel anytime.`;
}

/** RevenueCat errors carry their own `message`; anything else (a plain JS
 * error, a rejected promise with no shape) falls back to a generic string. */
function messageFor(error: unknown, fallback: string): string {
  const purchasesError = error as Partial<PurchasesError> | undefined;
  return purchasesError?.message || fallback;
}

/**
 * "Calory Pro" paywall — the app's subscription upsell, presented as a modal
 * from anywhere (`router.push('/premium')`). Plans come straight from the
 * RevenueCat current offering (see `src/lib/purchases.ts`); an already-Pro
 * user sees their subscription status instead of the purchase flow.
 */
export default function PremiumScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PlanId | null>(null);

  const offeringsQuery = useOfferings();
  const customerInfoQuery = useCustomerInfo();
  const purchase = usePurchasePackage();
  const restore = useRestorePurchases();

  // IAP is off for this build — nothing reachable should ever land here
  // (the profile upsell is hidden too), but a stale nav state or deep link
  // could still route here directly, so bail before rendering any paywall.
  // (After the hooks above, never before — they must run unconditionally.)
  if (!IAP_ENABLED) return <Redirect href={'/(tabs)/profile' as Href} />;

  const isPro = hasActiveEntitlement(customerInfoQuery.data);
  const isLoading = offeringsQuery.isPending || customerInfoQuery.isPending;

  const offering = offeringsQuery.data?.current ?? null;
  const packagesByPlan: Partial<Record<PlanId, PurchasesPackage>> = {
    weekly: offering?.weekly ?? undefined,
    monthly: offering?.monthly ?? undefined,
    yearly: offering?.annual ?? undefined,
  };
  const availablePlans = (['yearly', 'monthly', 'weekly'] as PlanId[]).filter(
    (id) => packagesByPlan[id],
  );
  const effectiveSelected = selected ?? availablePlans[0] ?? null;
  const selectedPackage = effectiveSelected ? packagesByPlan[effectiveSelected] : undefined;

  const handleContinue = async () => {
    if (!selectedPackage || !effectiveSelected) return;

    try {
      const customerInfo = await purchase.mutateAsync(selectedPackage);
      if (hasActiveEntitlement(customerInfo)) {
        Alert.alert('Welcome to Calory Pro 🎉', 'Your subscription is now active.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch (error) {
      const code = (error as Partial<PurchasesError> | undefined)?.code;
      if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return;
      Alert.alert('Purchase failed', messageFor(error, 'Something went wrong. Try again.'));
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await restore.mutateAsync();
      if (hasActiveEntitlement(customerInfo)) {
        Alert.alert('Restored', 'Your Calory Pro subscription is active again.');
      } else {
        Alert.alert('Nothing to restore', 'We couldn’t find an active purchase for this account.');
      }
    } catch (error) {
      Alert.alert('Restore failed', messageFor(error, 'Something went wrong. Try again.'));
    }
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

        {isPro ? (
          <ProStatus customerInfo={customerInfoQuery.data} />
        ) : (
          <>
            <View style={styles.benefits}>
              {BENEFITS.map(({ icon, label }) => (
                <View key={label} style={styles.benefitRow}>
                  {icon}
                  <ThemedText style={styles.benefitLabel}>{label}</ThemedText>
                </View>
              ))}
            </View>

            {isLoading ? (
              <ActivityIndicator
                color={Brand.accent}
                style={styles.loading}
                accessibilityLabel="Loading plans"
              />
            ) : availablePlans.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.unavailableText}>
                Plans aren’t available right now — check back in a bit.
              </ThemedText>
            ) : (
              <>
                <View style={styles.plansRow}>
                  {(['monthly', 'yearly'] as PlanId[])
                    .filter((id) => packagesByPlan[id])
                    .map((id) => (
                      <PlanCard
                        key={id}
                        id={id}
                        pkg={packagesByPlan[id]!}
                        badge={id === 'yearly' ? 'BEST VALUE' : undefined}
                        selected={effectiveSelected === id}
                        onPress={() => setSelected(id)}
                      />
                    ))}
                </View>

                {packagesByPlan.weekly ? (
                  <PlanRow
                    id="weekly"
                    pkg={packagesByPlan.weekly}
                    selected={effectiveSelected === 'weekly'}
                    onPress={() => setSelected('weekly')}
                  />
                ) : null}

                <PrimaryButton
                  label={purchase.isPending ? 'Processing…' : 'Continue'}
                  onPress={() => {
                    void handleContinue();
                  }}
                  disabled={purchase.isPending || !selectedPackage}
                  style={styles.continueButton}
                />

                {effectiveSelected && selectedPackage ? (
                  <ThemedText themeColor="textSecondary" style={styles.detailText}>
                    {detailTextFor(effectiveSelected, selectedPackage)}
                  </ThemedText>
                ) : null}
              </>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            disabled={restore.isPending}
            onPress={() => {
              void handleRestore();
            }}>
            <ThemedText themeColor="textSecondary" style={styles.footerLink}>
              {restore.isPending ? 'Restoring…' : 'Restore'}
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

/** Shown instead of the plan picker once `ENTITLEMENT_ID` is already active —
 * renewal/expiry pulled straight from the entitlement RevenueCat returned. */
function ProStatus({ customerInfo }: { customerInfo: ReturnType<typeof useCustomerInfo>['data'] }) {
  const entitlement = customerInfo?.entitlements.active[ENTITLEMENT_ID];
  const expiresLabel = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.proStatus}>
      <View style={[styles.proBadge, { backgroundColor: Brand.teal }]}>
        <BadgeCheck size={28} color="#FFFFFF" />
      </View>
      <ThemedText fontWeight="700" style={styles.proTitle}>
        You’re on Calory Pro
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.proSubtitle}>
        {expiresLabel
          ? entitlement?.willRenew
            ? `Renews on ${expiresLabel}`
            : `Active until ${expiresLabel}`
          : 'Your subscription is active.'}
      </ThemedText>
      {customerInfo?.managementURL ? (
        <PrimaryButton
          label="Manage Subscription"
          onPress={() => Linking.openURL(customerInfo.managementURL!)}
          style={styles.continueButton}
        />
      ) : null}
    </View>
  );
}

type PlanCardProps = {
  id: PlanId;
  pkg: PurchasesPackage;
  badge?: string;
  selected: boolean;
  onPress: () => void;
};

/** One of the boxed plans (Monthly / Yearly) shown side by side. */
function PlanCard({ id, pkg, badge, selected, onPress }: PlanCardProps) {
  const theme = useTheme();
  const { label, per } = PLAN_META[id];

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
      {badge ? (
        <View style={[styles.planBadge, { backgroundColor: Brand.accent }]}>
          <ThemedText fontWeight="700" style={styles.planBadgeText}>
            {badge}
          </ThemedText>
        </View>
      ) : null}

      <ThemedText fontWeight="700" style={styles.planLabel}>
        {label}
      </ThemedText>
      <ThemedText fontWeight="700" style={styles.planPrice}>
        {pkg.product.priceString}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.planPer}>
        {per}
      </ThemedText>
    </Pressable>
  );
}

/** The full-width Weekly option, laid out as a single row below the boxed pair. */
function PlanRow({ id, pkg, selected, onPress }: PlanCardProps) {
  const theme = useTheme();
  const { label, per } = PLAN_META[id];

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
        {label}
      </ThemedText>
      <ThemedText fontWeight="700" style={styles.planPrice}>
        {pkg.product.priceString}
        <ThemedText themeColor="textSecondary" style={styles.planPer}>
          {' '}
          {per}
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
  loading: {
    marginVertical: Spacing.five,
  },
  unavailableText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: Spacing.five,
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
  proStatus: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  proBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  proTitle: {
    fontSize: 19,
    lineHeight: 24,
  },
  proSubtitle: {
    marginTop: Spacing.one,
    fontSize: 14,
    lineHeight: 20,
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
