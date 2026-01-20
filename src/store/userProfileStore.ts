'use client';

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { logger } from '@/lib/logger';

export interface UserProfile {
  userId: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FinanceProfile {
  userId: string;
  monthlyIncome: number;
  fixedExpenses: {
    housing: number;
    phone: number;
    internet: number;
    creditCards: number;
    loans: number;
    insurance: number;
  };
  incomeStartDate?: any;
  expensesStartDate?: any;
  currency: string;
  language: string;
}

export interface UserProfileState {
  // User Profile
  userProfile: UserProfile | null;
  
  // Finance Profile
  financeProfile: FinanceProfile | null;
  
  // Estado
  loading: boolean;
  error: string | null;

  // Acciones User Profile
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  clearUserProfile: () => void;

  // Acciones Finance Profile
  setFinanceProfile: (profile: FinanceProfile) => void;
  updateFinanceProfile: (updates: Partial<FinanceProfile>) => void;
  updateFixedExpenses: (expenses: Partial<FinanceProfile['fixedExpenses']>) => void;
  clearFinanceProfile: () => void;

  // General
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  userProfile: null,
  financeProfile: null,
  loading: false,
  error: null
};

export const useUserProfileStore = create<UserProfileState>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        // User Profile Actions
        setUserProfile: (profile: UserProfile) => {
          logger.log('👤 UserProfile: setUserProfile', profile.userId);
          set({ userProfile: profile });
        },

        updateUserProfile: (updates: Partial<UserProfile>) => {
          logger.log('✏️ UserProfile: updateUserProfile');
          set((state) => ({
            userProfile: state.userProfile
              ? { ...state.userProfile, ...updates }
              : null
          }));
        },

        clearUserProfile: () => {
          logger.log('🗑️ UserProfile: clearUserProfile');
          set({ userProfile: null });
        },

        // Finance Profile Actions
        setFinanceProfile: (profile: FinanceProfile) => {
          logger.log('💰 FinanceProfile: setFinanceProfile', profile.userId);
          set({ financeProfile: profile });
        },

        updateFinanceProfile: (updates: Partial<FinanceProfile>) => {
          logger.log('✏️ FinanceProfile: updateFinanceProfile');
          set((state) => ({
            financeProfile: state.financeProfile
              ? { ...state.financeProfile, ...updates }
              : null
          }));
        },

        updateFixedExpenses: (expenses: Partial<FinanceProfile['fixedExpenses']>) => {
          logger.log('💵 FinanceProfile: updateFixedExpenses');
          set((state) => ({
            financeProfile: state.financeProfile
              ? {
                  ...state.financeProfile,
                  fixedExpenses: {
                    ...state.financeProfile.fixedExpenses,
                    ...expenses
                  }
                }
              : null
          }));
        },

        clearFinanceProfile: () => {
          logger.log('🗑️ FinanceProfile: clearFinanceProfile');
          set({ financeProfile: null });
        },

        // General Actions
        setLoading: (loading: boolean) => {
          logger.log('⏳ UserProfile: setLoading', loading);
          set({ loading });
        },

        setError: (error: string | null) => {
          if (error) {
            logger.error('❌ UserProfile error:', error);
          }
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          logger.log('🔄 UserProfile: reset');
          set(INITIAL_STATE);
        }
      }),
      {
        name: 'user-profile-store',
        version: 1,
        // Persistir perfiles
        partialize: (state) => ({
          userProfile: state.userProfile,
          financeProfile: state.financeProfile
        })
      }
    )
  )
);

// Selectores optimizados
export const selectUserProfile = (state: UserProfileState) => state.userProfile;
export const selectFinanceProfile = (state: UserProfileState) => state.financeProfile;
export const selectUserProfileLoading = (state: UserProfileState) => state.loading;
export const selectUserProfileError = (state: UserProfileState) => state.error;

/**
 * Selector compuesto: información básica del usuario
 */
export const selectUserBasicInfo = (state: UserProfileState) => ({
  email: state.userProfile?.email,
  displayName: state.userProfile?.displayName,
  photoURL: state.userProfile?.photoURL
});

/**
 * Selector compuesto: configuración financiera
 */
export const selectFinanceSettings = (state: UserProfileState) => ({
  monthlyIncome: state.financeProfile?.monthlyIncome || 0,
  totalFixedExpenses:
    Object.values(state.financeProfile?.fixedExpenses || {}).reduce(
      (sum, val) => sum + val,
      0
    ) || 0,
  currency: state.financeProfile?.currency || 'CLP',
  language: state.financeProfile?.language || 'es'
});

/**
 * Selector: verificar si hay configuración financiera
 */
export const selectHasFinanceSetup = (state: UserProfileState) =>
  !!state.financeProfile && state.financeProfile.monthlyIncome > 0;

export default useUserProfileStore;
