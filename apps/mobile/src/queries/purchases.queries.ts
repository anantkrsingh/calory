import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

import {
  getActiveEntitlement,
  fetchCustomerInfo,
  fetchOfferings,
  hasActiveEntitlement,
  IAP_ENABLED,
  purchasePackage as purchasePackageRequest,
  restorePurchases as restorePurchasesRequest,
} from '@/lib/purchases';
import { plansService } from '@/services/plans.service';
import {
  subscriptionsService,
  type SyncSubscriptionResult,
} from '@/services/subscriptions.service';
import { AuthQueries } from '@/queries/auth.queries';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';
import { useDevPurchasesStore } from '@/stores/dev-purchases.store';
import type { Plan } from '@fitness/types';
import type { SyncSubscriptionInput } from '@fitness/validation';

export class PurchasesQueries {
  static readonly root = ['purchases'] as const;

  static keys = {
    all: PurchasesQueries.root,
    offerings: () => [...PurchasesQueries.root, 'offerings'] as const,
    customerInfo: () => [...PurchasesQueries.root, 'customer-info'] as const,
    plans: () => [...PurchasesQueries.root, 'api-plans'] as const,
  };

  static offerings(enabled: boolean) {
    return queryOptions({
      queryKey: PurchasesQueries.keys.offerings(),
      queryFn: fetchOfferings,
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }

  static customerInfo(enabled: boolean) {
    return queryOptions({
      queryKey: PurchasesQueries.keys.customerInfo(),
      queryFn: fetchCustomerInfo,
      enabled,
      staleTime: 60 * 1000,
    });
  }

  static plans(enabled: boolean) {
    return queryOptions({
      queryKey: PurchasesQueries.keys.plans(),
      queryFn: () => plansService.list(true),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

/** The current offering's packages, straight from RevenueCat. `null` data
 * (rather than an error) means "unavailable" — unconfigured, offline, or
 * nothing set up in the dashboard yet — and should render as such. */
export function useOfferings(): UseQueryResult<PurchasesOfferings | null> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PurchasesQueries.offerings(IAP_ENABLED && isAuthenticated));
}

export function useCustomerInfo(): UseQueryResult<CustomerInfo | null> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PurchasesQueries.customerInfo(IAP_ENABLED && isAuthenticated));
}

/** Fallback plans loaded straight from the API backend. */
export function useApiPlans(): UseQueryResult<Plan[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PurchasesQueries.plans(isAuthenticated));
}

/** The single flag the rest of the app should gate premium features on. */
export function useIsPro(): boolean {
  const devSimulateFree = useDevPurchasesStore((s) => s.devSimulateFree);
  const { data } = useCustomerInfo();
  const user = useAuthStore((s) => s.user);

  // In development mode, allow instant simulation of free-tier state
  if (__DEV__ && devSimulateFree) {
    return false;
  }

  const isRevenueCatPro = hasActiveEntitlement(data);
  const isBackendPro = Boolean(
    user?.planId && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date()),
  );
  return isRevenueCatPro || isBackendPro;
}

export function useSyncSubscription(): UseMutationResult<
  SyncSubscriptionResult,
  Error,
  SyncSubscriptionInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SyncSubscriptionInput) => subscriptionsService.sync(input),
    onSuccess: (result) => {
      if (result.user) {
        useAuthStore.getState().setUser(result.user);
        queryClient.setQueryData(AuthQueries.keys.me(), result.user);
      }
      if (__DEV__) {
        useDevPurchasesStore.getState().resetDevState();
      }
      void queryClient.invalidateQueries({ queryKey: PurchasesQueries.keys.customerInfo() });
      void queryClient.invalidateQueries({ queryKey: AuthQueries.keys.me() });
    },
  });
}

export function useCancelSubscription(): UseMutationResult<
  SyncSubscriptionResult,
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionsService.cancel(),
    onSuccess: (result) => {
      if (result.user) {
        useAuthStore.getState().setUser(result.user);
        queryClient.setQueryData(AuthQueries.keys.me(), result.user);
      }
      if (__DEV__) {
        useDevPurchasesStore.getState().setDevSimulateFree(true);
      }
      void queryClient.invalidateQueries({ queryKey: PurchasesQueries.keys.customerInfo() });
      void queryClient.invalidateQueries({ queryKey: AuthQueries.keys.me() });
    },
  });
}

export function usePurchasePackage(): UseMutationResult<CustomerInfo, Error, PurchasesPackage> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackageRequest(pkg),
    onSuccess: async (customerInfo, pkg) => {
      if (__DEV__) {
        useDevPurchasesStore.getState().resetDevState();
      }
      queryClient.setQueryData(PurchasesQueries.keys.customerInfo(), customerInfo);

      // Immediately sync active purchase to backend user profile
      try {
        const activeEntitlements = Object.keys(customerInfo.entitlements.active);
        const primaryEntitlement = getActiveEntitlement(customerInfo);
        const result = await subscriptionsService.sync({
          entitlementIds: activeEntitlements,
          storeProductId: pkg.product.identifier,
          expirationDate: primaryEntitlement?.expirationDate ?? null,
          isSandbox: primaryEntitlement?.isSandbox ?? false,
        });

        if (result.user) {
          useAuthStore.getState().setUser(result.user);
          queryClient.setQueryData(AuthQueries.keys.me(), result.user);
        }
      } catch (err) {
        if (__DEV__) console.warn('[purchases] backend sync failed', err);
      }
    },
  });
}

export function useRestorePurchases(): UseMutationResult<CustomerInfo, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => restorePurchasesRequest(),
    onSuccess: async (customerInfo) => {
      queryClient.setQueryData(PurchasesQueries.keys.customerInfo(), customerInfo);

      // Sync restored entitlements with backend
      try {
        const activeEntitlements = Object.keys(customerInfo.entitlements.active);
        const primaryEntitlement = getActiveEntitlement(customerInfo);
        const result = await subscriptionsService.sync({
          entitlementIds: activeEntitlements,
          expirationDate: primaryEntitlement?.expirationDate ?? null,
          isSandbox: primaryEntitlement?.isSandbox ?? false,
        });

        if (result.user) {
          useAuthStore.getState().setUser(result.user);
          queryClient.setQueryData(AuthQueries.keys.me(), result.user);
        }
      } catch (err) {
        if (__DEV__) console.warn('[purchases] restore backend sync failed', err);
      }
    },
  });
}
