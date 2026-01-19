'use client';

/**
 * Índice centralizado de todos los stores de Zustand
 * Importa desde aquí para evitar imports relativos
 */

export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthStatus,
  type AuthState
} from './authStore';

export {
  useFinanceStore,
  selectBalance,
  selectIncome,
  selectExpenses,
  selectTransactions,
  selectRecentTransactions,
  selectFinanceLoading,
  selectFinanceError,
  selectFinanceSummary,
  selectExpensesByCategory,
  selectTransactionsByMonth,
  type Transaction,
  type FinanceState
} from './financeStore';

export {
  useUserProfileStore,
  selectUserProfile,
  selectFinanceProfile,
  selectUserProfileLoading,
  selectUserProfileError,
  selectUserBasicInfo,
  selectFinanceSettings,
  selectHasFinanceSetup,
  type UserProfile,
  type FinanceProfile,
  type UserProfileState
} from './userProfileStore';
