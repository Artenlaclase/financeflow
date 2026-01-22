import { vi } from 'vitest';
import type { User } from 'firebase/auth';

/**
 * Utilidades para testing con Firebase
 */

export const createMockFirebaseTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0
});

export const createMockUser = (overrides?: Partial<User>): User => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString()
  },
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('test-token'),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
  ...overrides
} as User);

export const createMockTransaction = (overrides?: any) => ({
  id: 'txn-123',
  userId: 'test-user-123',
  type: 'expense',
  amount: 100,
  category: 'Alimentación',
  date: createMockFirebaseTimestamp(),
  description: 'Test transaction',
  createdAt: createMockFirebaseTimestamp(),
  ...overrides
});

export const createMockQuerySnapshot = (docs: any[] = []) => ({
  docs: docs.map(data => ({
    id: data.id || 'doc-id',
    data: () => data,
    exists: true,
    ref: {}
  })),
  size: docs.length,
  empty: docs.length === 0,
  forEach: vi.fn((callback: any) => docs.forEach(callback))
});

export const createMockDocumentSnapshot = (data: any = {}, exists = true) => ({
  id: data.id || 'doc-id',
  data: () => (exists ? data : undefined),
  exists: () => exists,
  ref: {},
  metadata: {
    hasPendingWrites: false,
    fromCache: false
  }
});

export const mockFirestoreQuery = (docs: any[] = []) => {
  const unsubscribe = vi.fn();
  const onSnapshot = vi.fn((callback: any) => {
    callback(createMockQuerySnapshot(docs));
    return unsubscribe;
  });
  return { onSnapshot, unsubscribe };
};

export const mockAuthStateChanged = (user: User | null = null) => {
  const unsubscribe = vi.fn();
  const onAuthStateChanged = vi.fn((callback: any) => {
    callback(user);
    return unsubscribe;
  });
  return { onAuthStateChanged, unsubscribe };
};

/**
 * Espera a que las promesas pendientes se resuelvan
 */
export const flushPromises = () => 
  new Promise(resolve => setImmediate(resolve));

/**
 * Espera un tiempo específico
 */
export const wait = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock de console para capturar logs
 */
export const mockConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log = vi.fn((...args: any[]) => {
    logs.push(args.join(' '));
  });

  console.error = vi.fn((...args: any[]) => {
    errors.push(args.join(' '));
  });

  console.warn = vi.fn((...args: any[]) => {
    warnings.push(args.join(' '));
  });

  return {
    logs,
    errors,
    warnings,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };
};
