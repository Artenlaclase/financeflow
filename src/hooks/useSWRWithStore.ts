'use client';

/**
 * Hook de integración entre SWR y Zustand
 * Proporciona caching automático, revalidación y sincronización con stores
 *
 * Ventajas sobre Zustand solo:
 * - Caching automático con deduplicación
 * - Revalidación inteligente (background refetch)
 * - Manejo de errores mejorado
 * - Sincronización automática entre pestañas
 *
 * Uso:
 * const { data, isLoading, error } = useSWRWithStore(
 *   'transactions',
 *   () => fetchTransactions(userId),
 *   { revalidateOnFocus: true }
 * )
 */

import useSWR, { SWRConfiguration } from 'swr';
import { logger } from '@/lib/logger';

interface UseSWRWithStoreOptions extends SWRConfiguration {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  storeKey?: string; // Clave para guardar en store
}

export function useSWRWithStore<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSWRWithStoreOptions = {}
) {
  const {
    onSuccess,
    onError,
    storeKey,
    revalidateOnFocus = true,
    dedupingInterval = 60000, // 1 minuto
    focusThrottleInterval = 300000, // 5 minutos
    ...swrConfig
  } = options;

  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    key ? fetcher : null,
    {
      revalidateOnFocus,
      dedupingInterval,
      focusThrottleInterval,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      ...swrConfig,
    }
  );

  // Log automático en desarrollo
  if (key) {
    logger.log(`🔄 SWR [${key}]:`, {
      isLoading,
      isError: !!error,
      dataExists: !!data,
    });
  }

  // Callbacks de éxito/error
  if (data && !error && onSuccess) {
    onSuccess(data);
  }

  if (error && onError) {
    onError(error);
  }

  return {
    data,
    isLoading,
    error,
    isValidating: isLoading && !data,
    mutate,
    refetch: () => mutate(),
  };
}

/**
 * Hook especializado para transacciones con SWR
 * Proporciona revalidación automática y deduplicación
 */
export function useSWRTransactions(
  userId: string | null,
  options?: UseSWRWithStoreOptions
) {
  return useSWRWithStore(
    userId ? `transactions-${userId}` : null,
    async () => {
      // La lógica real iría en el store
      // Esto es solo el wrapper
      return [];
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
      ...options,
    }
  );
}

/**
 * Hook especializado para datos de usuario con SWR
 */
export function useSWRUserProfile(
  userId: string | null,
  options?: UseSWRWithStoreOptions
) {
  return useSWRWithStore(
    userId ? `user-${userId}` : null,
    async () => {
      return null;
    },
    {
      revalidateOnFocus: false, // Usuario no cambia frecuentemente
      dedupingInterval: 300000, // 5 minutos
      focusThrottleInterval: 600000, // 10 minutos
      ...options,
    }
  );
}

/**
 * Hook especializado para analytics con SWR
 * Útil para cachear resultados de cálculos complejos
 */
export function useSWRAnalytics(
  userId: string | null,
  period: string,
  year: number,
  options?: UseSWRWithStoreOptions
) {
  const key =
    userId && period && year
      ? `analytics-${userId}-${period}-${year}`
      : null;

  return useSWRWithStore(
    key,
    async () => {
      // Cálculos de analytics
      return null;
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 120000, // 2 minutos (analytics puede cambiar)
      focusThrottleInterval: 300000, // 5 minutos
      ...options,
    }
  );
}
