'use client';

/**
 * Lazy-loaded Analytics Components
 * Reducen el bundle inicial y mejoran Core Web Vitals
 *
 * Uso:
 * import { LazyAnalyticsPage } from '@/components/lazy/AnalyticsLazy';
 *
 * <LazyAnalyticsPage />
 */

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { AnalyticsPageSkeleton } from '@/components/shared/Skeletons/AnalyticsSkeleton';

// Tipo para componentes lazy-loaded
type LazyComponentProps = Record<string, any>;

// ==========================================
// Analytics Page Components (Lazy)
// ==========================================

/**
 * Analytics Page completa - Lazy loaded
 * Se carga cuando el usuario navega a /analytics
 */
export const LazyAnalyticsPage = dynamic(
  () => import('@/app/analytics/page'),
  {
    loading: () => <AnalyticsPageSkeleton />,
    ssr: false, // No renderizar en servidor (datos son client-side)
  }
);

/**
 * Analytics Summary - Lazy loaded
 * Mejor si está debajo del fold en dashboard
 */
export const LazyAnalyticsSummary = dynamic(
  () =>
    import('@/components/features/Analytics/AnalyticsSummary').then(
      (mod) => mod.AnalyticsSummary
    ),
  {
    loading: () => (
      <div style={{ height: '200px', background: '#f5f5f5' }} />
    ),
    ssr: false,
  }
);

/**
 * Monthly Trend Chart - Lazy loaded
 * Gráfico pesado que puede esperar
 */
export const LazyMonthlyTrendChart = dynamic(
  () =>
    import(
      '@/components/features/Analytics/MonthlyTrendChart'
    ).then((mod) => mod.MonthlyTrendChart),
  {
    loading: () => <div style={{ height: '300px', background: '#f5f5f5' }} />,
    ssr: false,
  }
);

/**
 * Expenses by Category Chart - Lazy loaded
 * Pie chart pesado
 */
export const LazyExpensesByCategoryChart = dynamic(
  () =>
    import(
      '@/components/features/Analytics/ExpensesByCategoryChart'
    ).then((mod) => mod.ExpensesByCategoryChart),
  {
    loading: () => <div style={{ height: '300px', background: '#f5f5f5' }} />,
    ssr: false,
  }
);

/**
 * Year Comparison Dialog - Lazy loaded
 * Modal pesado que se abre bajo demanda
 */
export const LazyYearComparisonDialog = dynamic(
  () =>
    import('@/components/features/Analytics/YearComparisonDialog').then(
      (mod) => mod.YearComparisonDialog
    ),
  {
    loading: () => null, // Sin skeleton para modal
    ssr: false,
  }
);

/**
 * Transactions Table - Lazy loaded
 * Tabla pesada con muchas filas
 */
export const LazyMonthlyTransactionsTable = dynamic(
  () =>
    import(
      '@/components/features/Analytics/MonthlyTransactionsTable'
    ).then((mod) => mod.MonthlyTransactionsTable),
  {
    loading: () => <div style={{ height: '400px', background: '#f5f5f5' }} />,
    ssr: false,
  }
);

// ==========================================
// Bank Components (Lazy)
// ==========================================

/**
 * Bank Page - Lazy loaded
 * Integración con Fintoc (pesada)
 */
export const LazyBankPage = dynamic(
  () => import('@/app/bank/page'),
  {
    loading: () => <div style={{ height: '500px', background: '#f5f5f5' }} />,
    ssr: false,
  }
);

/**
 * Connect Bank Button - Lazy loaded
 * Componente que abre modal de conexión
 */
export const LazyConnectBankButton = dynamic(
  () =>
    import('@/components/features/Bank/ConnectBankButton').then(
      (mod) => mod.ConnectBankButton
    ),
  {
    loading: () => (
      <button disabled style={{ opacity: 0.5 }}>
        Conectando...
      </button>
    ),
    ssr: false,
  }
);

// ==========================================
// Compras Components (Lazy)
// ==========================================

/**
 * Compras Page - Lazy loaded
 * Página de compras de supermercado
 */
export const LazyComprasPage = dynamic(
  () => import('@/app/compras/page'),
  {
    loading: () => <div style={{ height: '500px', background: '#f5f5f5' }} />,
    ssr: false,
  }
);

// ==========================================
// Helper: Wrapper with Suspense
// ==========================================

/**
 * Wrapper para componentes lazy con Suspense
 * Proporciona manejo consistente de loading states
 */
export function withLazySuspense<P extends LazyComponentProps>(
  Component: ComponentType<P>,
  fallback: React.ReactNode
) {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
