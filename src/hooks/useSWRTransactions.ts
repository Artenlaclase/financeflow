'use client';

/**
 * Hook especializado para cachear transacciones con SWR
 * 
 * FASE 3: Advanced Caching
 * - Deduplicación automática
 * - Revalidación en background
 * - Sincronización entre tabs
 * 
 * Uso:
 * const { transactions, isLoading, mutate } = useSWRTransactions(userId);
 * 
 * // Agregar transacción (optimista + revalidación)
 * await mutate(
 *   [...transactions, newTransaction],
 *   false // No revalidar inmediatamente
 * );
 */

import { useSWRWithStore } from './useSWRWithStore';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'compra' | 'debt';
  category: string;
  amount: number;
  description: string;
  date: Date | string;
  createdAt: Date | string;
  paymentMethod?: string;
  tags?: string[];
}

/**
 * Hook para cachear transacciones del usuario actual
 * Integrado con FinanceContext para datos en tiempo real
 */
export function useSWRTransactions() {
  const { user } = useAuth();
  const { recentTransactions } = useFinance();

  const { data, isLoading, error, mutate, refetch, isValidating } =
    useSWRWithStore<Transaction[]>(
      user?.uid ? `transactions-${user.uid}` : null,
      async () => {
        // Los datos reales vienen del context
        // SWR solo cachea y valida
        return recentTransactions || [];
      },
      {
        revalidateOnFocus: true,
        dedupingInterval: 60000, // 1 minuto
        focusThrottleInterval: 300000, // 5 minutos
        keepPreviousData: true,
        errorRetryCount: 3,
      }
    );

  return {
    transactions: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
    refetch,
    isEmpty: !data || data.length === 0,
  };
}

/**
 * Hook para cachear transacciones filtradas por categoría
 */
export function useSWRTransactionsByCategory(category: string | null) {
  const { user } = useAuth();
  const { recentTransactions } = useFinance();

  const { data, isLoading, error, mutate } = useSWRWithStore<Transaction[]>(
    user?.uid && category ? `transactions-${user.uid}-${category}` : null,
    async () => {
      return (
        recentTransactions?.filter((t) => t.category === category) || []
      );
    },
    {
      dedupingInterval: 120000,
      focusThrottleInterval: 600000,
    }
  );

  return {
    transactions: data || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para cachear transacciones de un rango de fechas
 */
export function useSWRTransactionsByDateRange(
  startDate: Date | null,
  endDate: Date | null
) {
  const { user } = useAuth();
  const { recentTransactions } = useFinance();

  const key =
    user?.uid && startDate && endDate
      ? `transactions-${user.uid}-${startDate.toISOString()}-${endDate.toISOString()}`
      : null;

  const { data, isLoading, error, mutate } = useSWRWithStore<Transaction[]>(
    key,
    async () => {
      if (!startDate || !endDate) return [];
      return (
        recentTransactions?.filter((t) => {
          const date = typeof t.date === 'string' ? new Date(t.date) : t.date;
          return date >= startDate && date <= endDate;
        }) || []
      );
    },
    {
      dedupingInterval: 120000,
    }
  );

  return {
    transactions: data || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para agregar transacción con optimista update
 */
export function useSWRAddTransaction() {
  const { transactions, mutate: mutateTransactions } = useSWRTransactions();

  const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    const transactionWithId = {
      ...newTransaction,
      id: `temp-${Date.now()}`,
    } as Transaction;

    // Update optimista
    const updatedTransactions = [...transactions, transactionWithId];

    try {
      await mutateTransactions(updatedTransactions, false);
      // En un caso real, aquí irías a la API/Firestore
      return transactionWithId;
    } catch (error) {
      // Rollback automático por SWR
      throw error;
    }
  };

  return {
    addTransaction,
  };
}

/**
 * Hook para cachear total de transacciones
 */
export function useSWRTransactionCount() {
  const { transactions, isLoading } = useSWRTransactions();

  return {
    count: transactions?.length || 0,
    isLoading,
    isEmpty: !transactions || transactions.length === 0,
  };
}
