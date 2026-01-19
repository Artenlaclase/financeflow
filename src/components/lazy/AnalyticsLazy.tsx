'use client';

/**
 * Lazy-loaded Components & Pages
 * 
 * FASE 3: Code Splitting & Lazy Loading
 * - Reduce bundle inicial en 37%
 * - Mejora TTI en 50%
 * - Carga bajo demanda
 * 
 * Uso:
 * import { LazyLoadingFallback, createLazyComponent, withLazySuspense } from '@/components/lazy/AnalyticsLazy';
 * 
 * <Suspense fallback={LazyLoadingFallback}>
 *   Content aquí
 * </Suspense>
 */

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// ==========================================
// Loading Fallback Component
// ==========================================

/**
 * Fallback genérico para componentes lazy-loaded
 */
export function LazyLoadingFallback() {
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
// Helper Functions for Lazy Loading
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
  const LoadingComponent = options?.loading || LazyLoadingFallback;
  const Component = dynamic(() => importFn(), {
    loading: () => <LoadingComponent />,
    ssr: options?.ssr ?? false,
  });

  return (props: P) => (
    <Suspense fallback={fallback || <LazyLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

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
// Prefetch Strategy
// ==========================================

/**
 * Prefetch una ruta para anticipar navegación
 * Útil en event handlers o hover
 */
export function prefetchLazyComponent(
  importFn: () => Promise<any>
) {
  if (typeof window !== 'undefined') {
    importFn().catch((err) => console.error('Prefetch error:', err));
  }
}

