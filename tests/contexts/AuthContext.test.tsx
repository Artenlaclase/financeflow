import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { createMockUser } from '../helpers/firebase';

// Mock Firebase Auth
vi.mock('firebase/auth');
vi.mock('@/lib/firebase/config', () => ({
  auth: { currentUser: null }
}));

describe('AuthContext', () => {
  const mockUser = createMockUser();
  let authStateCallback: ((user: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock onAuthStateChanged to capture callback
    (onAuthStateChanged as any).mockImplementation((_auth: any, callback: any) => {
      authStateCallback = callback;
      // Call immediately with null to simulate initial state
      callback(null);
      return vi.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    authStateCallback = null;
  });

  describe('useAuth hook', () => {
    it('should provide initial auth state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.resetPassword).toBe('function');
    });

    it('should update user when auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();

      // Simulate auth state change
      act(() => {
        if (authStateCallback) {
          authStateCallback(mockUser);
        }
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should set loading to false after initial auth check', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('login', () => {
    it('should call signInWithEmailAndPassword with correct params', async () => {
      (signInWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      (signInWithEmailAndPassword as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let resolveLogin: any;
      (signInWithEmailAndPassword as any).mockImplementation(() => 
        new Promise(resolve => { resolveLogin = resolve; })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const loginPromise = act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Should be loading during login
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve login
      resolveLogin({ user: mockUser });
      await loginPromise;

      // Should not be loading after login
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('register', () => {
    it('should call createUserWithEmailAndPassword with correct params', async () => {
      (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123');
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
    });

    it('should handle registration errors', async () => {
      const error = new Error('Email already exists');
      (createUserWithEmailAndPassword as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password123');
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should set loading state during registration', async () => {
      let resolveRegister: any;
      (createUserWithEmailAndPassword as any).mockImplementation(() => 
        new Promise(resolve => { resolveRegister = resolve; })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const registerPromise = act(async () => {
        await result.current.register('newuser@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      resolveRegister({ user: mockUser });
      await registerPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      (signOut as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      (signOut as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await expect(
        act(async () => {
          await result.current.logout();
        })
      ).rejects.toThrow('Logout failed');
    });

    it('should set loading state during logout', async () => {
      let resolveLogout: any;
      (signOut as any).mockImplementation(() => 
        new Promise(resolve => { resolveLogout = resolve; })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const logoutPromise = act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      resolveLogout();
      await logoutPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('resetPassword', () => {
    it('should call sendPasswordResetEmail with correct email', async () => {
      (sendPasswordResetEmail as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.resetPassword('user@example.com');
      });

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com'
      );
    });

    it('should handle password reset errors', async () => {
      const error = new Error('Email not found');
      (sendPasswordResetEmail as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await expect(
        act(async () => {
          await result.current.resetPassword('nonexistent@example.com');
        })
      ).rejects.toThrow('Email not found');
    });

    it('should not set loading state during password reset', async () => {
      (sendPasswordResetEmail as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const initialLoading = result.current.loading;

      await act(async () => {
        await result.current.resetPassword('user@example.com');
      });

      expect(result.current.loading).toBe(initialLoading);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribe = vi.fn();
      (onAuthStateChanged as any).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
