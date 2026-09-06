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
  fetchCustomerInfo,
  fetchOfferings,
  hasActiveEntitlement,
  purchasePackage as purchasePackageRequest,
  restorePurchases as restorePurchasesRequest,
} from '@/lib/purchases';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class PurchasesQueries {
  static readonly root = ['purchases'] as const;

  static keys = {
    all: PurchasesQueries.root,
    offerings: () => [...PurchasesQueries.root, 'offerings'] as const,
    customerInfo: () => [...PurchasesQueries.root, 'customer-info'] as const,
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
}

/** The current offering's packages, straight from RevenueCat. `null` data
 * (rather than an error) means "unavailable" — unconfigured, offline, or
 * nothing set up in the dashboard yet — and should render as such. */
export function useOfferings(): UseQueryResult<PurchasesOfferings | null> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PurchasesQueries.offerings(isAuthenticated));
}

export function useCustomerInfo(): UseQueryResult<CustomerInfo | null> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PurchasesQueries.customerInfo(isAuthenticated));
}

/** The single flag the rest of the app should gate premium features on. */
export function useIsPro(): boolean {
  const { data } = useCustomerInfo();
  return hasActiveEntitlement(data);
}

export function usePurchasePackage(): UseMutationResult<CustomerInfo, Error, PurchasesPackage> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackageRequest(pkg),
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(PurchasesQueries.keys.customerInfo(), customerInfo);
    },
  });
}

export function useRestorePurchases(): UseMutationResult<CustomerInfo, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => restorePurchasesRequest(),
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(PurchasesQueries.keys.customerInfo(), customerInfo);
    },
  });
}
