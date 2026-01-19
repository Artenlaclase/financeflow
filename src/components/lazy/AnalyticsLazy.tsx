'use client';

/**
 * Lazy-loaded Analytics Components
 * Reducen el bundle inicial y mejoran Core Web Vitals
 *
 * Este archivo exporta componentes lazy-loaded usando dynamic()
 * Los componentes reales deben ser importados cuando existan
 *
 * Uso:
 * import { LazyAnalyticsPage } from '@/components/lazy/AnalyticsLazy';
 *
 * <Suspense fallback={<Skeleton />}>
 *   <LazyAnalyticsPage />
 * </Suspense>
 */

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// ==========================================
// Lazy Loading Strategy
// ==========================================

/**
 * Crea un componente lazy-loaded con skeleton fallback
 * 
 * Uso:
 * const LazyComponent = createLazyComponent(
 *   () => import('@/path/to/Component'),
 *   <SkeletonComponent />
 * );
 */
export function createLazyComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: ReactNode,
  options?: { ssr?: boolean }
) {
  return dynamic(() => importFn(), {
    loading: () => fallback as JSX.Element,
    ssr: options?.ssr ?? false,
  });
}

// ==========================================
// Template para componentes lazy
// ==========================================

/**
 * Template para crear componentes lazy-loaded
 * Reemplaza los imports reales cuando los componentes estén listos
 */

// Ejemplo de cómo se usaría:
// export const LazyAnalyticsPage = createLazyComponent(
//   () => import('@/app/analytics/page'),
//   <AnalyticsPageSkeleton />,
//   { ssr: false }
// );

/**
 * Para usar lazy loading en tu código:
 * 
 * 1. Reemplaza imports directos:
 *    import AnalyticsPage from '@/app/analytics/page';
 *    
 *    Con lazy loading:
 *    const LazyAnalyticsPage = dynamic(
 *      () => import('@/app/analytics/page'),
 *      { loading: () => <Skeleton />, ssr: false }
 *    );
 *
 * 2. En el JSX, envuelve con Suspense:
 *    <Suspense fallback={<Skeleton />}>
 *      <LazyAnalyticsPage />
 *    </Suspense>
 */

// ==========================================
// Helper: Wrapper with Suspense
// ==========================================

/**
 * Wrapper para componentes lazy con Suspense
 * Proporciona manejo consistente de loading states
 */
export function withLazySuspense<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  fallback: ReactNode
) {
  return function SuspenseWrapper(props: P) {
    const { Suspense } = require('react');
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

