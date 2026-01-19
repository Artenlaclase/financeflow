'use client';

/**
 * Hooks especializados para cachear datos de Analytics
 * 
 * FASE 3: Advanced Caching para Analytics
 * - Caché de cálculos complejos
 * - Revalidación inteligente
 * - Deduplicación por período y año
 * 
 * Uso:
 * const { summary, isLoading } = useSWRAnalyticsSummary('thisMonth', 2026);
 */

import { useSWRWithStore } from './useSWRWithStore';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalyticsSummary } from './useAnalyticsHelpers';
import { useTransactions } from './useTransactions';

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  numberOfTransactions: number;
}

export interface CategoryBreakdown {
  [category: string]: {
    amount: number;
    percentage: number;
    count: number;
  };
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

/**
 * Hook para cachear resumen de analytics
 * Combina datos de transacciones con cálculos agregados
 */
export function useSWRAnalyticsSummary(
  period: string,
  year: number
) {
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const key =
    user?.uid && period && year
      ? `analytics-summary-${user.uid}-${period}-${year}`
      : null;

  const { data, isLoading, error, mutate } = useSWRWithStore<AnalyticsSummary>(
    key,
    async () => {
      // Calcular summary basado en transacciones
      const yearTransactions = transactions?.filter(t => {
        const txYear = new Date(t.date).getFullYear();
        return txYear === year;
      }) || [];

      const income = yearTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = yearTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
        numberOfTransactions: yearTransactions.length,
      } as AnalyticsSummary;
    },
    {
      dedupingInterval: 180000, // 3 minutos
      focusThrottleInterval: 600000, // 10 minutos
      keepPreviousData: true,
    }
  );

  return {
    summary: data || {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      savingsRate: 0,
      numberOfTransactions: 0,
    },
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para cachear desglose por categoría
 */
export function useSWRCategoryBreakdown(
  category: 'income' | 'expense',
  year: number
) {
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const key =
    user?.uid && category && year
      ? `analytics-category-${user.uid}-${category}-${year}`
      : null;

  const { data, isLoading, error } = useSWRWithStore<CategoryBreakdown>(
    key,
    async () => {
      // Filtrar transacciones del año
      const yearTransactions = transactions?.filter((t) => {
        const txYear = new Date(t.date).getFullYear();
        return txYear === year && t.type === category;
      }) || [];

      // Agrupar por categoría
      const breakdown: CategoryBreakdown = {};
      let total = 0;

      yearTransactions.forEach((tx) => {
        const cat = tx.category;
        if (!breakdown[cat]) {
          breakdown[cat] = { amount: 0, percentage: 0, count: 0 };
        }
        breakdown[cat].amount += tx.amount;
        breakdown[cat].count += 1;
        total += tx.amount;
      });

      // Calcular porcentajes
      Object.keys(breakdown).forEach((catKey) => {
        breakdown[catKey as keyof CategoryBreakdown].percentage =
          total > 0 ? (breakdown[catKey as keyof CategoryBreakdown].amount / total) * 100 : 0;
      });

      return breakdown;
    },
    {
      dedupingInterval: 180000,
      focusThrottleInterval: 600000,
    }
  );

  return {
    breakdown: data || {},
    isLoading,
    error,
    total: Object.values(data || {}).reduce((sum, cat) => sum + cat.amount, 0),
  };
}

/**
 * Hook para cachear tendencias mensuales
 */
export function useSWRMonthlyTrends(year: number) {
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const key = user?.uid && year ? `analytics-trends-${user.uid}-${year}` : null;

  const { data, isLoading, error } = useSWRWithStore<MonthlyTrend[]>(
    key,
    async () => {
      const trends: MonthlyTrend[] = [];
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
      ];

      for (let month = 0; month < 12; month++) {
        const monthTransactions = transactions?.filter((t) => {
          const date = new Date(t.date);
          return (
            date.getFullYear() === year && date.getMonth() === month
          );
        }) || [];

        const income = monthTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        trends.push({
          month: monthNames[month],
          income,
          expenses,
          balance: income - expenses,
        });
      }

      return trends;
    },
    {
      dedupingInterval: 180000,
      focusThrottleInterval: 900000, // 15 minutos
    }
  );

  return {
    trends: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook para cachear comparación año a año
 */
export function useSWRYearComparison(
  currentYear: number,
  previousYear: number
) {
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const key =
    user?.uid && currentYear && previousYear
      ? `analytics-year-compare-${user.uid}-${currentYear}-${previousYear}`
      : null;

  const { data, isLoading } = useSWRWithStore(
    key,
    async () => {
      const currentYearData = transactions?.filter(
        (t) => new Date(t.date).getFullYear() === currentYear
      ) || [];

      const previousYearData = transactions?.filter(
        (t) => new Date(t.date).getFullYear() === previousYear
      ) || [];

      return {
        current: {
          income: currentYearData
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
          expenses: currentYearData
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        },
        previous: {
          income: previousYearData
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
          expenses: previousYearData
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        },
      };
    },
    {
      dedupingInterval: 300000, // 5 minutos
      focusThrottleInterval: 900000,
    }
  );

  return {
    comparison: data,
    isLoading,
  };
}
