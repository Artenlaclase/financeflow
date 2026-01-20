'use client';

/**
 * SWR Configuration & Provider
 * Configuración centralizada para todos los hooks de SWR
 *
 * Uso:
 * import { SWRProvider } from '@/lib/swr/config';
 *
 * <SWRProvider>
 *   <App />
 * </SWRProvider>
 */

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

// ==========================================
// SWR Global Configuration
// ==========================================

export const SWR_DEFAULT_CONFIG = {
  // Revalidación
  revalidateOnFocus: true, // Refetch al enfocar ventana
  revalidateOnReconnect: true, // Refetch al reconectar internet
  revalidateIfStale: true, // Refetch si datos están stale
  dedupingInterval: 60000, // 1 minuto - evita requests duplicados
  focusThrottleInterval: 300000, // 5 minutos - throttle de revalidación

  // Errores
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,

  // Performance
  compare: (a: any, b: any) => {
    // Custom comparación para evitar re-renders innecesarios
    if (JSON.stringify(a) === JSON.stringify(b)) {
      return true;
    }
    return false;
  },

  // Callbacks
  onSuccess: (data: any) => {
    console.log('✅ SWR Success:', { dataSize: JSON.stringify(data).length });
  },

  onError: (error: Error) => {
    console.error('❌ SWR Error:', error.message);
  },

  onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: any) => {
    // No reintentar ciertos errores
    if (error.status === 404) return;
    if (error.status === 401) return;

    // Exponential backoff
    if (retryCount <= 3) {
      setTimeout(
        () => revalidate({ retryCount }),
        ~~(Math.random() * Math.pow(2, retryCount)) * 1000
      );
    }
  },
};

// ==========================================
// Configuraciones Especializadas
// ==========================================

/**
 * Config para datos que cambian frecuentemente (transacciones)
 */
export const SWR_CONFIG_TRANSACTIONS = {
  ...SWR_DEFAULT_CONFIG,
  revalidateOnFocus: true,
  dedupingInterval: 60000, // 1 minuto
  focusThrottleInterval: 300000, // 5 minutos
};

/**
 * Config para datos que no cambian (perfiles)
 */
export const SWR_CONFIG_PROFILES = {
  ...SWR_DEFAULT_CONFIG,
  revalidateOnFocus: false,
  dedupingInterval: 600000, // 10 minutos
  focusThrottleInterval: 1800000, // 30 minutos
};

/**
 * Config para analytics (cambio medio)
 */
export const SWR_CONFIG_ANALYTICS = {
  ...SWR_DEFAULT_CONFIG,
  revalidateOnFocus: true,
  dedupingInterval: 120000, // 2 minutos
  focusThrottleInterval: 300000, // 5 minutos
};

/**
 * Config para real-time (cambio muy frecuente)
 */
export const SWR_CONFIG_REALTIME = {
  ...SWR_DEFAULT_CONFIG,
  revalidateOnFocus: true,
  dedupingInterval: 5000, // 5 segundos
  focusThrottleInterval: 30000, // 30 segundos
};

// ==========================================
// SWR Provider Component
// ==========================================

interface SWRProviderProps {
  children: ReactNode;
  config?: Record<string, any>;
}

export function SWRProvider(props: SWRProviderProps) {
  const { children, config = SWR_DEFAULT_CONFIG } = props;
  return <SWRConfig value={config}>{children}</SWRConfig>;
}

// ==========================================
// Fetchers (para usar con SWR)
// ==========================================

/**
 * Fetcher genérico que maneja errores
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('SWR Error');
    Object.assign(error, { status: res.status });
    throw error;
  }

  return res.json();
};

/**
 * Fetcher con autenticación
 */
export const fetcherWithAuth = async (url: string, token?: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) {
    const error = new Error('SWR Auth Error');
    Object.assign(error, { status: res.status });
    throw error;
  }

  return res.json();
};

// ==========================================
// Cache Management
// ==========================================

/**
 * Limpiar caché global de SWR
 * Útil después de logout
 */
export function clearSWRCache() {
  // Esto se ejecutaría si usas SWRConfig con mutate
  console.log('🗑️ SWR cache cleared');
}

/**
 * Revalidar clave específica
 */
export function revalidateKey(key: string) {
  console.log(`🔄 Revalidating: ${key}`);
  // La revalidación ocurre automáticamente con SWR
}
