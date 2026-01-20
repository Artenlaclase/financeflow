'use client';

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import {
  useAnalyticsSummary,
  useExpensesByCategory,
  useMonthlyTrends,
  useFilteredTransactions,
  MonthlySummary
} from './useAnalyticsHelpers';
import { useFinanceProfile } from '@/contexts/FinanceProfileContext';
import { logger } from '@/lib/logger';

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: Record<string, number>;
  monthlyData: MonthlySummary[];
  transactionCount: number;
  fixedIncomeTotal: number;
  fixedExpensesTotal: number;
  transactionIncomeTotal: number;
  transactionExpensesTotal: number;
  transactionDetails?: {
    income: any[];
    expenses: any[];
  };
}

/**
 * Hook principal de analytics - ahora refactorizado y optimizado
 * Compone los hooks especializados para obtener datos completos
 *
 * @param selectedPeriod - Período a analizar (thisMonth, lastMonth, thisYear, custom)
 * @param selectedYear - Año seleccionado
 * @param selectedMonth - Mes opcional para período custom (0-11)
 */
export const useAnalytics = (
  selectedPeriod: string,
  selectedYear: number,
  selectedMonth?: number
) => {
  const { profile } = useFinanceProfile();
  const { transactions, loading, error, refetch } = useTransactions();

  // Filtrar transacciones según período
  const filteredTransactions = useFilteredTransactions(
    transactions,
    selectedPeriod,
    selectedYear,
    selectedMonth
  );

  // Calcular resumen
  const summary = useAnalyticsSummary(filteredTransactions, selectedYear, {
    startDate: new Date(),
    endDate: new Date()
  });

  // Calcular gastos por categoría
  const expensesByCategory = useExpensesByCategory(filteredTransactions);

  // Calcular tendencias mensuales
  const monthlyData = useMonthlyTrends(filteredTransactions, selectedYear);

  // Calcular datos con gastos/ingresos fijos del perfil
  const data = useMemo(() => {
    logger.log('📊 Composing analytics data...');

    // Separar ingresos y gastos para detalles
    const incomeDetails = filteredTransactions.filter((t) => t.type === 'income');
    const expenseDetails = filteredTransactions.filter((t) =>
      ['expense', 'compra'].includes(t.type)
    );

    // Calcular ingresos y gastos fijos (si hay perfil)
    const fixedIncomeTotal = profile?.monthlyIncome || 0;
    const fixedExpensesTotal = profile?.totalFixedExpenses || 0;

    // Totales finales incluyendo fijos
    const totalIncome = summary.totalIncome + fixedIncomeTotal;
    const totalExpenses = summary.totalExpenses + fixedExpensesTotal;

    // Agregar categorías de gastos fijos al objeto
    const expensesByCategoryWithFixed: Record<string, number> = { ...expensesByCategory };
    if (profile && fixedExpensesTotal > 0) {
      if (profile.fixedExpenses.housing) {
        expensesByCategoryWithFixed['Vivienda (Fijo)'] = profile.fixedExpenses.housing;
      }
      if (profile.fixedExpenses.phone) {
        expensesByCategoryWithFixed['Telefonía (Fijo)'] = profile.fixedExpenses.phone;
      }
      if (profile.fixedExpenses.internet) {
        expensesByCategoryWithFixed['Internet (Fijo)'] = profile.fixedExpenses.internet;
      }
      if (profile.fixedExpenses.creditCards) {
        expensesByCategoryWithFixed['Tarjetas de Crédito (Fijo)'] = profile.fixedExpenses.creditCards;
      }
      if (profile.fixedExpenses.loans) {
        expensesByCategoryWithFixed['Préstamos (Fijo)'] = profile.fixedExpenses.loans;
      }
      if (profile.fixedExpenses.insurance) {
        expensesByCategoryWithFixed['Seguros (Fijo)'] = profile.fixedExpenses.insurance;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory: expensesByCategoryWithFixed,
      monthlyData,
      transactionCount: filteredTransactions.length,
      fixedIncomeTotal,
      fixedExpensesTotal,
      transactionIncomeTotal: summary.totalIncome,
      transactionExpensesTotal: summary.totalExpenses,
      transactionDetails: {
        income: incomeDetails,
        expenses: expenseDetails
      }
    } as AnalyticsData;
  }, [
    filteredTransactions,
    summary,
    expensesByCategory,
    monthlyData,
    profile
  ]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

/**
 * Hook optimizado para casos simples donde solo necesitas el resumen
 */
export const useAnalyticsSimplified = (
  selectedPeriod: string,
  selectedYear: number,
  selectedMonth?: number
) => {
  const { profile } = useFinanceProfile();
  const { transactions, loading, error } = useTransactions();

  const filteredTransactions = useFilteredTransactions(
    transactions,
    selectedPeriod,
    selectedYear,
    selectedMonth
  );

  const summary = useAnalyticsSummary(filteredTransactions, selectedYear, {
    startDate: new Date(),
    endDate: new Date()
  });

  return useMemo(() => {
    const fixedIncome = profile?.monthlyIncome || 0;
    const fixedExpenses = profile?.totalFixedExpenses || 0;

    return {
      totalIncome: summary.totalIncome + fixedIncome,
      totalExpenses: summary.totalExpenses + fixedExpenses,
      balance: summary.balance + fixedIncome - fixedExpenses,
      transactionCount: summary.transactionCount,
      loading,
      error
    };
  }, [summary, profile, loading, error]);
};
