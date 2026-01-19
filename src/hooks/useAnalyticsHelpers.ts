'use client';

import { useMemo } from 'react';
import { Transaction } from './useTransactions';
import { MONTH_LABELS, TRANSACTION_TYPES } from '@/constants/analytics';
import { logger } from '@/lib/logger';

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Hook especializado para calcular resumen mensual de transacciones
 * Optimizado para memoización y reuso
 */
export const useAnalyticsSummary = (
  transactions: Transaction[],
  selectedYear: number,
  dateRange: DateRange
) => {
  return useMemo(() => {
    logger.time('📊 Calculate summary');

    const income = transactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => [TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.COMPRA].includes(t.type as any))
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    logger.timeEnd('📊 Calculate summary');
    logger.log('📊 Summary:', { income, expenses, balance });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance,
      transactionCount: transactions.length
    };
  }, [transactions]);
};

/**
 * Hook especializado para calcular gastos por categoría
 */
export const useExpensesByCategory = (transactions: Transaction[]) => {
  return useMemo(() => {
    logger.time('📊 Calculate expenses by category');

    const expenses = transactions.filter((t) =>
      [TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.COMPRA].includes(t.type as any)
    );

    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((expense) => {
      const category = expense.category || 'Sin categoría';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
    });

    logger.timeEnd('📊 Calculate expenses by category');
    logger.log('📊 Expenses by category:', expensesByCategory);

    return expensesByCategory;
  }, [transactions]);
};

/**
 * Hook especializado para calcular tendencias mensuales
 */
export const useMonthlyTrends = (
  transactions: Transaction[],
  selectedYear: number
) => {
  return useMemo(() => {
    logger.time('📊 Calculate monthly trends');

    const monthlyData: MonthlySummary[] = [];

    // Inicializar todos los meses del año
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthTransactions = transactions.filter((t) => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return date.getMonth() === monthIndex && date.getFullYear() === selectedYear;
      });

      const income = monthTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => [TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.COMPRA].includes(t.type as any))
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: MONTH_LABELS[monthIndex],
        income,
        expenses,
        balance: income - expenses
      });
    }

    logger.timeEnd('📊 Calculate monthly trends');
    return monthlyData;
  }, [transactions, selectedYear]);
};

/**
 * Hook especializado para filtrar transacciones por período
 */
export const useFilteredTransactions = (
  transactions: Transaction[],
  selectedPeriod: string,
  selectedYear: number,
  selectedMonth?: number
) => {
  return useMemo(() => {
    logger.time('📊 Filter transactions');

    const filtered = transactions.filter((t) => {
      const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (selectedPeriod === 'custom' && typeof selectedMonth === 'number') {
        return year === selectedYear && month === selectedMonth;
      }

      if (selectedPeriod === 'thisYear') {
        return year === selectedYear;
      }

      return true; // Otros períodos se filtran a nivel de query
    });

    logger.timeEnd('📊 Filter transactions');
    logger.log('📊 Filtered transactions:', filtered.length);

    return filtered;
  }, [transactions, selectedPeriod, selectedYear, selectedMonth]);
};
