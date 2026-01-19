'use client';

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { logger } from '@/lib/logger';

export interface AuthState {
  // Estado
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Acciones
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

const INITIAL_STATE = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        setUser: (user: User | null) => {
          logger.log('👤 Auth: setUser', user?.email);
          set({
            user,
            isAuthenticated: !!user,
            error: null,
            loading: false
          });
        },

        setLoading: (loading: boolean) => {
          logger.log('⏳ Auth: setLoading', loading);
          set({ loading });
        },

        setError: (error: string | null) => {
          logger.error('❌ Auth error:', error);
          set({ error });
        },

        logout: () => {
          logger.log('🚪 Auth: logout');
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            loading: false
          });
        },

        clearError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'auth-store',
        version: 1,
        // Solo persistir flag de autenticación, no datos del usuario
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
);

// Selectores optimizados para prevenir re-renders innecesarios
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAuthLoading = (state: AuthState) => state.loading;
export const selectAuthError = (state: AuthState) => state.error;

/**
 * Selector compuesto: devuelve solo lo necesario
 */
export const selectAuthStatus = (state: AuthState) => ({
  isAuthenticated: state.isAuthenticated,
  loading: state.loading,
  hasError: !!state.error
});

export default useAuthStore;
