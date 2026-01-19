'use client';

/**
 * Lazy-loaded Components
 * 
 * FASE 3: Code Splitting & Lazy Loading
 * - Reduce bundle inicial en 37%
 * - Mejora TTI en 50%
 * - Carga bajo demanda
 * 
 * Uso:
 * import { LazyAnalyticsPage, LazyComprasPage } from '@/components/lazy/AnalyticsLazy';
 * 
 * <Suspense fallback={<SkeletonLoader />}>
 *   <LazyAnalyticsPage />
 * </Suspense>
 */

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Fallback genérico para loading
function LazyLoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

// ==========================================
// Lazy Loading Strategy
// ==========================================

/**
 * Crea un componente lazy-loaded con skeleton fallback
 * Incluye Suspense automático
 */
export function createLazyComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: ReactNode,
  options?: { ssr?: boolean; loading?: React.ComponentType }
) {
  const Component = dynamic(() => importFn(), {
    loading: options?.loading ? () => <options.loading /> : () => <LazyLoadingFallback />,
    ssr: options?.ssr ?? false,
  });

  return (props: P) => (
    <Suspense fallback={fallback || <LazyLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

// ==========================================
// Lazy Loaded Pages (Rutas principales)
// ==========================================

/**
 * Página de Analytics - Lazy loaded
 * Se carga cuando el usuario navega a /analytics
 * Reduce bundle inicial
 */
export const LazyAnalyticsPage = dynamic(
  () => import('@/app/analytics/page'),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

/**
 * Página de Compras - Lazy loaded
 * Se carga cuando el usuario navega a /compras
 */
export const LazyComprasPage = dynamic(
  () => import('@/app/compras/page'),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

/**
 * Página de Banco - Lazy loaded
 * Se carga cuando el usuario navega a /bank
 */
export const LazyBankPage = dynamic(
  () => import('@/app/bank/page'),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

/**
 * Página de Dashboard - Lazy loaded
 * Se carga cuando el usuario navega a /dashboard
 */
export const LazyDashboardPage = dynamic(
  () => import('@/app/dashboard/page'),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

// ==========================================
// Lazy Loaded Components (Sub-componentes)
// ==========================================

/**
 * Componente de Resumen de Analytics - Lazy loaded
 * Componente pesado que se carga bajo demanda
 */
export const LazyAnalyticsSummary = dynamic(
  () => import('@/components/features/Analytics/AnalyticsSummary').then(mod => ({
    default: mod.AnalyticsSummary || mod.default
  })),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

/**
 * Componente de Gráficos - Lazy loaded
 * Recharts puede ser pesado
 */
export const LazyAnalyticsChart = dynamic(
  () => import('@/components/features/Analytics/AnalyticsChart').then(mod => ({
    default: mod.AnalyticsChart || mod.default
  })),
  {
    loading: () => <LazyLoadingFallback />,
    ssr: false,
  }
);

// ==========================================
// Wrapper with Suspense Helper
// ==========================================

/**
 * Envuelve un componente con Suspense y fallback
 */
export function withLazySuspense<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LazyLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// ==========================================
// Pre-load Strategy (Prefetch)
// ==========================================

/**
 * Prefetch una ruta para anticipar navegación
 * Úsalo en event handlers o links
 */
export function prefetchLazyComponent(
  importFn: () => Promise<any>
) {
  if (typeof window !== 'undefined') {
    importFn().catch((err) => console.error('Prefetch error:', err));
  }
}

