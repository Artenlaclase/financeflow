import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { FinanceProvider, useFinance } from '@/contexts/FinanceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { onSnapshot } from 'firebase/firestore';
import { createMockUser, createMockTransaction, flushPromises } from '../helpers/firebase';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: { currentUser: null }
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

describe('FinanceContext', () => {
  const mockUser = createMockUser();
  let transactionsCallback: ((snapshot: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth to return authenticated user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn()
    });

    // Mock onSnapshot
    (onSnapshot as any).mockImplementation((_query: any, callback: any) => {
      transactionsCallback = callback;
      // Immediately call with empty snapshot
      callback({
        size: 0,
        docs: [],
        forEach: vi.fn()
      });
      return vi.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    transactionsCallback = null;
  });

  describe('useFinance hook', () => {
    it('should provide initial finance state', () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      expect(result.current.balance).toBe(0);
      expect(result.current.income).toBe(0);
      expect(result.current.expenses).toBe(0);
      expect(result.current.debts).toEqual([]);
      expect(result.current.recentTransactions).toEqual([]);
      expect(typeof result.current.refreshData).toBe('function');
    });

    it('should not setup listeners when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn()
      });

      renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      // onSnapshot should not be called with null user
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('transactions processing', () => {
    it('should calculate income from transactions', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const transactions = [
        createMockTransaction({ type: 'income', amount: 1000 }),
        createMockTransaction({ type: 'income', amount: 500 })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => t
            })),
            forEach: (callback: any) => transactions.forEach(t => callback({ id: t.id, data: () => t }))
          });
        }
      });

      await waitFor(() => {
        expect(result.current.income).toBe(1500);
      });
    });

    it('should calculate expenses from transactions', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const transactions = [
        createMockTransaction({ type: 'expense', amount: 300 }),
        createMockTransaction({ type: 'expense', amount: 200 }),
        createMockTransaction({ type: 'compra', amount: 150 })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => t
            })),
            forEach: (callback: any) => transactions.forEach(t => callback({ id: t.id, data: () => t }))
          });
        }
      });

      await waitFor(() => {
        expect(result.current.expenses).toBe(650);
      });
    });

    it('should store recent transactions', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const transactions = [
        createMockTransaction({ id: 'txn-1', type: 'income', amount: 1000 }),
        createMockTransaction({ id: 'txn-2', type: 'expense', amount: 500 })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => t
            })),
            forEach: (callback: any) => transactions.forEach(t => callback({ id: t.id, data: () => t }))
          });
        }
      });

      await waitFor(() => {
        expect(result.current.recentTransactions).toHaveLength(2);
        expect(result.current.recentTransactions[0].id).toBeDefined();
      });
    });

    it('should sort transactions by date (most recent first)', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-15');

      const transactions = [
        createMockTransaction({ 
          id: 'old-txn', 
          date: { toDate: () => oldDate } 
        }),
        createMockTransaction({ 
          id: 'new-txn', 
          date: { toDate: () => newDate } 
        })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => t
            })),
            forEach: (callback: any) => transactions.forEach(t => callback({ id: t.id, data: () => t }))
          });
        }
      });

      await waitFor(() => {
        const txns = result.current.recentTransactions;
        expect(txns[0].id).toBe('new-txn');
        expect(txns[1].id).toBe('old-txn');
      });
    });

    it('should handle transactions with missing amounts', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const transactions = [
        createMockTransaction({ type: 'income', amount: undefined }),
        createMockTransaction({ type: 'expense', amount: null })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => ({ ...t, amount: t.amount })
            })),
            forEach: (callback: any) => transactions.forEach(t => 
              callback({ id: t.id, data: () => ({ ...t, amount: t.amount }) })
            )
          });
        }
      });

      await waitFor(() => {
        expect(result.current.income).toBe(0);
        expect(result.current.expenses).toBe(0);
      });
    });

    it('should handle mixed transaction types', async () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      const transactions = [
        createMockTransaction({ type: 'income', amount: 2000 }),
        createMockTransaction({ type: 'expense', amount: 500 }),
        createMockTransaction({ type: 'compra', amount: 300 }),
        createMockTransaction({ type: 'income', amount: 1000 }),
        createMockTransaction({ type: 'expense', amount: 200 })
      ];

      act(() => {
        if (transactionsCallback) {
          transactionsCallback({
            size: transactions.length,
            docs: transactions.map(t => ({
              id: t.id,
              data: () => t
            })),
            forEach: (callback: any) => transactions.forEach(t => callback({ id: t.id, data: () => t }))
          });
        }
      });

      await waitFor(() => {
        expect(result.current.income).toBe(3000);
        expect(result.current.expenses).toBe(1000);
        expect(result.current.recentTransactions).toHaveLength(5);
      });
    });
  });

  describe('refreshData', () => {
    it('should provide refreshData function', () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      expect(typeof result.current.refreshData).toBe('function');
    });

    it('should not throw when calling refreshData', () => {
      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      expect(() => {
        result.current.refreshData();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle onSnapshot errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      (onSnapshot as any).mockImplementation((_query: any, callback: any, errorCallback: any) => {
        // Trigger error callback
        errorCallback(new Error('Firestore error'));
        return vi.fn();
      });

      const { result } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      await flushPromises();

      // Should maintain initial state on error
      expect(result.current.income).toBe(0);
      expect(result.current.expenses).toBe(0);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from Firestore listeners on unmount', () => {
      const unsubscribe = vi.fn();
      (onSnapshot as any).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useFinance(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AuthProvider>
        )
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
