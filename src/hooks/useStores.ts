'use client';

/**
 * Hooks wrapper que usan los stores de Zustand
 * Proporcionan la misma API que los contextos antiguos
 * para permitir migración gradual
 */

import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectAuthError,
  selectAuthStatus
} from '@/store/authStore';

import {
  useFinanceStore,
  selectBalance,
  selectIncome,
  selectExpenses,
  selectFinanceSummary,
  selectRecentTransactions
} from '@/store/financeStore';

import {
  useUserProfileStore,
  selectUserProfile,
  selectFinanceProfile,
  selectFinanceSettings,
  selectHasFinanceSetup
} from '@/store/userProfileStore';

/**
 * Hook que replica la API de useAuth() del contexto antiguo
 * Usa selectores para evitar re-renders innecesarios
 */
export const useAuth = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const error = useAuthStore(selectAuthError);
  const { setUser, setLoading, setError, logout, clearError } = useAuthStore();

  return {
    user,
    isAuthenticated,
    error,
    loading: useAuthStore((state) => state.loading),
    setUser,
    setLoading,
    setError,
    logout,
    clearError
  };
};

/**
 * Hook que replica la API de useFinance() del contexto antiguo
 */
export const useFinance = () => {
  const summary = useFinanceStore(selectFinanceSummary);
  const recentTransactions = useFinanceStore(selectRecentTransactions);
  const loading = useFinanceStore((state) => state.loading);
  const error = useFinanceStore((state) => state.error);

  const {
    setTransactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    fetchTransactions,
    calculateTotals
  } = useFinanceStore();

  return {
    ...summary,
    recentTransactions,
    loading,
    error,
    setTransactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    fetchTransactions,
    calculateTotals
  };
};

/**
 * Hook que replica la API de useFinanceProfile() del contexto antiguo
 */
export const useFinanceProfile = () => {
  const profile = useUserProfileStore(selectFinanceProfile);
  const financeSettings = useUserProfileStore(selectFinanceSettings);
  const hasSetup = useUserProfileStore(selectHasFinanceSetup);

  const { setFinanceProfile, updateFinanceProfile, updateFixedExpenses } =
    useUserProfileStore();

  return {
    profile,
    ...financeSettings,
    hasSetup,
    setFinanceProfile,
    updateFinanceProfile,
    updateFixedExpenses
  };
};

/**
 * Hook que replica la API de useUserProfile() del contexto antiguo
 */
export const useUserProfile = () => {
  const profile = useUserProfileStore(selectUserProfile);
  const loading = useUserProfileStore((state) => state.loading);
  const error = useUserProfileStore((state) => state.error);

  const { setUserProfile, updateUserProfile, clearUserProfile } =
    useUserProfileStore();

  return {
    profile,
    loading,
    error,
    setUserProfile,
    updateUserProfile,
    clearUserProfile
  };
};
