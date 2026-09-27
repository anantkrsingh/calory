import { Redirect, useRouter, type Href } from 'expo-router';
import {
  Check,
  ChefHat,
  Dumbbell,
  MessageCircle,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getActiveEntitlement,
  hasActiveEntitlement,
  IAP_ENABLED,
} from '@/lib/purchases';
import {
  useApiPlans,
  useCancelSubscription,
  useCustomerInfo,
  useIsPro,
  useOfferings,
  usePurchasePackage,
  useRestorePurchases,
  useSyncSubscription,
} from '@/queries/purchases.queries';
import { selectUser, useAuthStore } from '@/stores/auth.store';

type PlanId = 'weekly' | 'monthly' | 'yearly';

const PLAN_META: Record<PlanId, { label: string; per: string; billedAs: string }> = {
  weekly: { label: 'Weekly', per: '/week', billedAs: 'weekly' },
  monthly: { label: 'Monthly', per: '/month', billedAs: 'monthly' },
  yearly: { label: 'Yearly', per: '/year', billedAs: 'annually' },
};

const BENEFITS: { icon: ReactNode; label: string }[] = [
  { icon: <ChefHat size={20} color={Brand.accent} />, label: 'Unlimited AI-generated diet plans' },
  { icon: <Dumbbell size={20} color={Brand.accent} />, label: 'Unlimited workout & exercise reps history' },
  { icon: <TrendingUp size={20} color={Brand.accent} />, label: 'Personal records & 1RM progression analytics' },
  { icon: <MessageCircle size={20} color={Brand.accent} />, label: 'Priority AI coach & workout recommendations' },
];

const LEGAL_LINKS: { label: string; url: string }[] = [
  { label: 'Terms', url: 'https://caloryfitness.netlify.app/terms' },
  { label: 'Privacy', url: 'https://caloryfitness.netlify.app/privacy' },
];

function detailTextFor(id: PlanId, pkg: PurchasesPackage): string {
  const { billedAs } = PLAN_META[id];
  const monthlyEquivalent =
    id === 'yearly' && pkg.product.pricePerMonthString
      ? ` (≈${pkg.product.pricePerMonthString}/month)`
      : '';
  return `${pkg.product.priceString} billed ${billedAs}${monthlyEquivalent}. Renews automatically until canceled - cancel anytime.`;
}

function messageFor(error: unknown, fallback: string): string {
  const purchasesError = error as Partial<PurchasesError> | undefined;
  return purchasesError?.message || fallback;
}

function calculateExpirationDate(durationInDays: number | null): string | null {
  if (!durationInDays) return null;
  return new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000).toISOString();
}

export default function PremiumScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(selectUser);
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [selectedApiPlanId, setSelectedApiPlanId] = useState<string | null>(null);

  const offeringsQuery = useOfferings();
  const customerInfoQuery = useCustomerInfo();
  const apiPlansQuery = useApiPlans();
  const purchase = usePurchasePackage();
  const restore = useRestorePurchases();
  const syncSubscription = useSyncSubscription();
  const cancelSubscription = useCancelSubscription();
  const isPro = useIsPro();
  const isLoading =
    offeringsQuery.isPending && (apiPlansQuery.isPending || !apiPlansQuery.data);

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

  // Fallback: active backend plans when RevenueCat offering is empty/unavailable
  const apiPlans = apiPlansQuery.data ?? [];
  const effectiveApiPlan =
    apiPlans.find((p) => p.id === selectedApiPlanId) ?? apiPlans[0] ?? null;

  const isProcessing =
    purchase.isPending ||
    restore.isPending ||
    syncSubscription.isPending ||
    cancelSubscription.isPending;

  const handleContinue = async () => {
    // 1. Native RevenueCat purchase flow if package available
    if (selectedPackage && effectiveSelected) {
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
      return;
    }

    // 2. Direct activation/sync flow for API plans (only allowed in development/sandbox)
    if (effectiveApiPlan) {
      if (!__DEV__) {
        Alert.alert(
          'Store Unavailable',
          'Could not connect to the Google Play / App Store. Please check your network connection and try again.',
        );
        return;
      }

      try {
        const entitlementIds =
          effectiveApiPlan.revenueCatEntitlementIds.length > 0
            ? effectiveApiPlan.revenueCatEntitlementIds
            : ['pro'];
        const durationInDays =
          effectiveApiPlan.durationDays ??
          (effectiveApiPlan.duration === 'yearly'
            ? 365
            : effectiveApiPlan.duration === 'monthly'
              ? 30
              : effectiveApiPlan.duration === 'weekly'
                ? 7
                : null);

        const expirationDate = calculateExpirationDate(durationInDays);

        const result = await syncSubscription.mutateAsync({
          entitlementIds,
          storeProductId: effectiveApiPlan.storeProductId ?? effectiveApiPlan.id,
          expirationDate,
          isSandbox: true,
        });

        if (result.success) {
          Alert.alert(
            `Welcome to ${effectiveApiPlan.name} 🎉`,
            'Your Pro subscription is now active.',
            [{ text: 'OK', onPress: () => router.back() }],
          );
        }
      } catch (error) {
        Alert.alert(
          'Activation failed',
          messageFor(error, 'Could not activate subscription. Try again.'),
        );
      }
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

  if (!IAP_ENABLED) return <Redirect href={'/(tabs)/profile' as Href} />;

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
          <View style={styles.badgeRowHeader}>
            <Sparkles size={18} color={Brand.accent} />
            <ThemedText fontWeight="700" style={styles.heroBadgeText}>
              PREMIUM ACCESS
            </ThemedText>
          </View>
          <ThemedText family="ubuntu" fontWeight="700" style={styles.title}>
            Calory Pro
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Unlimited AI coaching. Reps history. Complete nutrition.
          </ThemedText>
        </View>

        {isPro ? (
          <ProStatus
            customerInfo={customerInfoQuery.data}
            user={user}
            onManage={() => {
              const storeUrl =
                customerInfoQuery.data?.managementURL ||
                Platform.select({
                  ios: 'https://apps.apple.com/account/subscriptions',
                  android:
                    'https://play.google.com/store/account/subscriptions?package=com.calory.fitness',
                  default: 'https://play.google.com/store/account/subscriptions',
                });
              if (storeUrl) {
                Linking.openURL(storeUrl).catch(() => {
                  Alert.alert(
                    'Manage Subscription',
                    'Open the Google Play Store or App Store app on your device, then go to Subscriptions to manage or cancel.',
                  );
                });
              }
            }}
            onDevCancel={async () => {
              try {
                await cancelSubscription.mutateAsync();
                Alert.alert(
                  'Subscription Reset',
                  'Your account has been reset back to the Free plan for testing. Note: If you purchased a test subscription in Google Play, also cancel it in Google Play Store.',
                );
              } catch (err) {
                Alert.alert('Reset Failed', messageFor(err, 'Could not reset test subscription.'));
              }
            }}
            isCancelling={cancelSubscription.isPending}
          />
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
            ) : availablePlans.length > 0 ? (
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
                  label={isProcessing ? 'Processing…' : 'Continue'}
                  onPress={() => {
                    void handleContinue();
                  }}
                  disabled={isProcessing || !selectedPackage}
                  style={styles.continueButton}
                />

                {effectiveSelected && selectedPackage ? (
                  <ThemedText themeColor="textSecondary" style={styles.detailText}>
                    {detailTextFor(effectiveSelected, selectedPackage)}
                  </ThemedText>
                ) : null}
              </>
            ) : apiPlans.length > 0 ? (
              // API Plans Fallback
              <>
                <View style={styles.apiPlansGrid}>
                  {apiPlans.map((plan) => {
                    const isSelected = effectiveApiPlan?.id === plan.id;
                    return (
                      <Pressable
                        key={plan.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setSelectedApiPlanId(plan.id)}
                        style={[
                          styles.apiPlanCard,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                            borderColor: isSelected ? Brand.accent : theme.border,
                          },
                        ]}>
                        <View style={styles.apiPlanHeader}>
                          <ThemedText fontWeight="700" style={styles.apiPlanName}>
                            {plan.name}
                          </ThemedText>
                          {plan.duration === 'yearly' ? (
                            <View style={styles.badgePill}>
                              <ThemedText style={styles.badgePillText}>POPULAR</ThemedText>
                            </View>
                          ) : null}
                        </View>
                        <ThemedText fontWeight="700" style={styles.apiPlanPrice}>
                          {plan.price > 0 ? `${plan.currency} ${plan.price}` : 'Free'}
                          <ThemedText themeColor="textSecondary" style={styles.planPer}>
                            {` / ${plan.duration}`}
                          </ThemedText>
                        </ThemedText>
                        {plan.benefits.length > 0 ? (
                          <View style={styles.apiPlanBenefits}>
                            {plan.benefits.slice(0, 3).map((b, i) => (
                              <View key={i} style={styles.apiBenefitRow}>
                                <Check size={14} color={Brand.accent} />
                                <ThemedText type="small" numberOfLines={1}>
                                  {b}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <PrimaryButton
                  label={isProcessing ? 'Activating…' : `Get ${effectiveApiPlan?.name ?? 'Pro'}`}
                  onPress={() => {
                    void handleContinue();
                  }}
                  disabled={isProcessing || !effectiveApiPlan}
                  style={styles.continueButton}
                />
              </>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.unavailableText}>
                Plans aren’t available right now - check back in a bit.
              </ThemedText>
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
              {restore.isPending ? 'Restoring…' : 'Restore Purchases'}
            </ThemedText>
          </Pressable>
          {LEGAL_LINKS.map(({ label, url }) => (
            <View key={label} style={styles.footerItem}>
              <ThemedText themeColor="textSecondary" style={styles.footerDot}>
                ·
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => Linking.openURL(url)}>
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

/** Shown once user has active Pro access — pulled from RevenueCat or backend user plan. */
function ProStatus({
  customerInfo,
  user,
  onManage,
  onDevCancel,
  isCancelling,
}: {
  customerInfo: ReturnType<typeof useCustomerInfo>['data'];
  user: ReturnType<typeof selectUser>;
  onManage: () => void;
  onDevCancel: () => void;
  isCancelling: boolean;
}) {
  const theme = useTheme();
  const entitlement = getActiveEntitlement(customerInfo);
  const expirationDate = entitlement?.expirationDate || user?.planExpiresAt;
  const isSandbox = Boolean(entitlement?.isSandbox);

  let expiresLabel: string | null = null;
  if (expirationDate) {
    const expDate = new Date(expirationDate);
    const isToday = expDate.toDateString() === new Date().toDateString();
    if (isToday) {
      const timeStr = expDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      expiresLabel = isSandbox
        ? `Renews today at ${timeStr} (Google Play Sandbox test)`
        : `Renews today at ${timeStr}`;
    } else {
      expiresLabel = expDate.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  const storeProviderName = Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play';

  return (
    <View style={styles.proStatus}>
      {/* Premium Membership Card */}
      <View
        style={[
          styles.membershipCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.membershipHeader}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <ThemedText fontWeight="700" style={styles.statusPillText}>
              ACTIVE PRO
            </ThemedText>
          </View>
          <ThemedText themeColor="textSecondary" style={styles.storeBadgeText}>
            {storeProviderName}
          </ThemedText>
        </View>

        <ThemedText family="ubuntu" fontWeight="700" style={styles.membershipPlanName}>
          {user?.planName ? user.planName : 'Calory Pro'}
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.membershipExpiryText}>
          {expiresLabel ? `Renews / Active until ${expiresLabel}` : 'Unlimited active membership'}
        </ThemedText>

        <View style={styles.proMetrics}>
          <View style={styles.proMetricItem}>
            <Zap size={18} color={Brand.accent} />
            <ThemedText fontWeight="700">
              {user?.remainingCredits ?? 'Unlimited'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              AI Credits
            </ThemedText>
          </View>
          <View style={styles.proMetricItem}>
            <Dumbbell size={18} color={Brand.accent} />
            <ThemedText fontWeight="700">Unlimited</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Reps History
            </ThemedText>
          </View>
        </View>

        <View style={styles.membershipBenefits}>
          <View style={styles.membershipBenefitItem}>
            <Check size={16} color={Brand.accent} />
            <ThemedText style={styles.membershipBenefitLabel}>
              Unlimited AI diet & meal planning
            </ThemedText>
          </View>
          <View style={styles.membershipBenefitItem}>
            <Check size={16} color={Brand.accent} />
            <ThemedText style={styles.membershipBenefitLabel}>
              Unlimited workout & reps progression history
            </ThemedText>
          </View>
          <View style={styles.membershipBenefitItem}>
            <Check size={16} color={Brand.accent} />
            <ThemedText style={styles.membershipBenefitLabel}>
              Priority AI responses & cloud sync
            </ThemedText>
          </View>
        </View>

        <PrimaryButton
          label="Manage Subscription"
          onPress={onManage}
          textStyle={styles.manageButtonText}
          style={styles.membershipActionButton}
        />

        <ThemedText themeColor="textSecondary" style={styles.membershipFootnote}>
          To change payment methods, switch plans, or cancel, manage your subscription in {storeProviderName}.
        </ThemedText>
      </View>

      {/* Developer Sandbox Reset (visible only in __DEV__) */}
      {__DEV__ && (
        <View style={styles.devSandboxBox}>
          <ThemedText fontWeight="700" style={styles.devSandboxTitle}>
            🛠 DEVELOPER TESTING TOOLS
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.devSandboxText}>
            Development mode: Reset your account back to Free plan immediately to test paywall & purchase flows without waiting.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Alert.alert(
                'Reset Test Subscription?',
                'This will clear your active Pro status on the backend so you can test paywall and purchasing again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset to Free', style: 'destructive', onPress: onDevCancel },
                ],
              );
            }}
            disabled={isCancelling}
            style={({ pressed }) => [styles.devResetButton, pressed && Pressed]}>
            <ThemedText fontWeight="600" style={styles.devResetButtonText}>
              {isCancelling ? 'Resetting…' : 'Reset Test Subscription (Dev Only)'}
            </ThemedText>
          </Pressable>
        </View>
      )}
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
  manageButtonText: {
    fontSize: 17,
    lineHeight: 22,
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
  badgeRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 90, 36, 0.12)',
    marginBottom: Spacing.two,
  },
  heroBadgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: Brand.accent,
  },
  apiPlansGrid: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  apiPlanCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: Spacing.three,
  },
  apiPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  apiPlanName: {
    fontSize: 16,
  },
  badgePill: {
    backgroundColor: Brand.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  apiPlanPrice: {
    fontSize: 20,
    marginBottom: Spacing.two,
  },
  apiPlanBenefits: {
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth || 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: Spacing.two,
  },
  apiBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proMetrics: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginVertical: Spacing.four,
    width: '100%',
  },
  proMetricItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    gap: 4,
  },
  membershipCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.teal,
  },
  statusPillText: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: Brand.teal,
  },
  storeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  membershipPlanName: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  membershipExpiryText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  membershipBenefits: {
    borderTopWidth: StyleSheet.hairlineWidth || 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: Spacing.three,
    marginBottom: Spacing.four,
    gap: 10,
  },
  membershipBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membershipBenefitLabel: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  membershipActionButton: {
    marginBottom: Spacing.two,
  },
  membershipFootnote: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  devSandboxBox: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 90, 36, 0.3)',
    backgroundColor: 'rgba(239, 90, 36, 0.06)',
    marginBottom: Spacing.four,
    gap: Spacing.one,
  },
  devSandboxTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: Brand.accent,
  },
  devSandboxText: {
    fontSize: 12,
    lineHeight: 16,
  },
  devResetButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  devResetButtonText: {
    fontSize: 12,
    color: '#EF4444',
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
