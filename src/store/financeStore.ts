'use client';

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/logger';
import { FirebaseDate } from '@/types/firebase';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'compra';
  amount: number;
  category: string;
  date: FirebaseDate;
  description?: string;
  createdAt?: FirebaseDate;
}

export interface FinanceState {
  // Estado
  transactions: Transaction[];
  balance: number;
  income: number;
  expenses: number;
  debts: Transaction[];
  recentTransactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Acciones síncronas
  setTransactions: (transactions: Transaction[]) => void;
  setBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  reset: () => void;

  // Métodos async
  fetchTransactions: (userId: string) => Promise<void>;
  calculateTotals: () => void;
}

const INITIAL_STATE = {
  transactions: [],
  balance: 0,
  income: 0,
  expenses: 0,
  debts: [],
  recentTransactions: [],
  loading: false,
  error: null
};

export const useFinanceStore = create<FinanceState>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        setTransactions: (transactions: Transaction[]) => {
          logger.log('💰 Finance: setTransactions', transactions.length);
          set({ transactions });
          get().calculateTotals();
        },

        setBalance: (balance: number) => {
          logger.log('💵 Finance: setBalance', balance);
          set({ balance });
        },

        addTransaction: (transaction: Transaction) => {
          logger.log('➕ Finance: addTransaction', transaction.id);
          const transactions = [...get().transactions, transaction];
          set({ transactions });
          get().calculateTotals();
        },

        removeTransaction: (id: string) => {
          logger.log('➖ Finance: removeTransaction', id);
          const transactions = get().transactions.filter((t) => t.id !== id);
          set({ transactions });
          get().calculateTotals();
        },

        updateTransaction: (id: string, updates: Partial<Transaction>) => {
          logger.log('✏️ Finance: updateTransaction', id);
          const transactions = get().transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          );
          set({ transactions });
          get().calculateTotals();
        },

        setError: (error: string | null) => {
          if (error) {
            logger.error('❌ Finance error:', error);
          }
          set({ error });
        },

        setLoading: (loading: boolean) => {
          logger.log('⏳ Finance: setLoading', loading);
          set({ loading });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          logger.log('🔄 Finance: reset');
          set(INITIAL_STATE);
        },

        calculateTotals: () => {
          const state = get();
          const income = state.transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const expenses = state.transactions
            .filter((t) => ['expense', 'compra'].includes(t.type))
            .reduce((sum, t) => sum + t.amount, 0);

          const balance = income - expenses;
          const recentTransactions = state.transactions.slice(0, 10);

          logger.log('📊 Finance: totals calculated', { income, expenses, balance });

          set({ income, expenses, balance, recentTransactions });
        },

        fetchTransactions: async (userId: string) => {
          if (!userId) {
            logger.warn('⚠️ Finance: fetchTransactions called without userId');
            return;
          }

          set({ loading: true, error: null });
          logger.log('📥 Finance: fetching transactions for user', userId);

          try {
            const transactionsQuery = query(
              collection(db, 'transactions'),
              where('userId', '==', userId)
            );

            const snapshot = await getDocs(transactionsQuery);
            const transactions: Transaction[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            } as Transaction));

            logger.log('✅ Finance: transactions fetched', transactions.length);

            set({ transactions });
            get().calculateTotals();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('❌ Finance: error fetching transactions', error);
            set({ error: errorMessage });
          } finally {
            set({ loading: false });
          }
        }
      }),
      {
        name: 'finance-store',
        version: 1,
        // Qué persistir: solo datos críticos
        partialize: (state) => ({
          transactions: state.transactions,
          balance: state.balance,
          income: state.income,
          expenses: state.expenses
        })
      }
    )
  )
);

// Selectores optimizados
export const selectBalance = (state: FinanceState) => state.balance;
export const selectIncome = (state: FinanceState) => state.income;
export const selectExpenses = (state: FinanceState) => state.expenses;
export const selectTransactions = (state: FinanceState) => state.transactions;
export const selectRecentTransactions = (state: FinanceState) =>
  state.recentTransactions;
export const selectFinanceLoading = (state: FinanceState) => state.loading;
export const selectFinanceError = (state: FinanceState) => state.error;

/**
 * Selector compuesto: devuelve resumen financiero
 */
export const selectFinanceSummary = (state: FinanceState) => ({
  balance: state.balance,
  income: state.income,
  expenses: state.expenses,
  transactionCount: state.transactions.length
});

/**
 * Selector para gráficos: gastos por categoría
 */
export const selectExpensesByCategory = (state: FinanceState) => {
  const expensesByCategory: Record<string, number> = {};
  state.transactions
    .filter((t) => ['expense', 'compra'].includes(t.type))
    .forEach((t) => {
      const category = t.category || 'Sin categoría';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount;
    });
  return expensesByCategory;
};

/**
 * Selector para transacciones de un mes específico
 */
export const selectTransactionsByMonth = (month: number, year: number) => (
  state: FinanceState
) => {
  return state.transactions.filter((t) => {
    const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
};

export default useFinanceStore;
