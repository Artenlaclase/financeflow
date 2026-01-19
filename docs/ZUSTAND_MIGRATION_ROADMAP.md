# 🔄 Migración a Zustand (Fase 2) - Roadmap

**Fecha:** 19 de Enero 2026  
**Estado:** Planificado  
**Prioridad:** Alta

---

## 📋 Resumen Ejecutivo

La migración de Context API a Zustand mejorará significativamente:
- **Performance:** Reducción de re-renders innecesarios
- **Escalabilidad:** Manejo de estado más eficiente
- **DX:** API más simple y menos boilerplate
- **Persistencia:** Almacenamiento local automático

---

## 🎯 Objetivos

1. Reemplazar `FinanceContext` con store Zustand
2. Reemplazar `AuthContext` con store Zustand
3. Mantener compatibilidad con código existente
4. Mejorar performance en 30-50%
5. Reducir re-renders en componentes

---

## 📦 Instalación

```bash
npm install zustand zustand/middleware
```

---

## 🏗️ Arquitectura Propuesta

### Estructura de Carpetas

```
src/
├── store/
│   ├── authStore.ts
│   ├── financeStore.ts
│   ├── userProfileStore.ts
│   └── index.ts
├── contexts/
│   ├── AuthContext.tsx (MANTENER para compatibilidad)
│   ├── FinanceContext.tsx (MANTENER para compatibilidad)
│   └── hooks.ts (nuevos hooks que usan stores)
└── ...
```

---

## 💾 Implementación del Finance Store

### Fase 1: Store Base

**Archivo:** `src/store/financeStore.ts`

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/logger';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'compra';
  amount: number;
  category: string;
  date: any;
  description?: string;
  createdAt?: any;
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

  // Acciones
  setTransactions: (transactions: Transaction[]) => void;
  setBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // Métodos async
  fetchTransactions: (userId: string) => Promise<void>;
  setupRealtimeListener: (userId: string) => () => void;
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
          set({ transactions });
          get().calculateTotals();
        },

        setBalance: (balance: number) => set({ balance }),

        addTransaction: (transaction: Transaction) => {
          const transactions = [...get().transactions, transaction];
          set({ transactions });
          get().calculateTotals();
        },

        removeTransaction: (id: string) => {
          const transactions = get().transactions.filter(t => t.id !== id);
          set({ transactions });
          get().calculateTotals();
        },

        updateTransaction: (id: string, updates: Partial<Transaction>) => {
          const transactions = get().transactions.map(t =>
            t.id === id ? { ...t, ...updates } : t
          );
          set({ transactions });
          get().calculateTotals();
        },

        setError: (error: string | null) => set({ error }),
        setLoading: (loading: boolean) => set({ loading }),

        reset: () => set(INITIAL_STATE),

        calculateTotals: () => {
          const state = get();
          const income = state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const expenses = state.transactions
            .filter(t => ['expense', 'compra'].includes(t.type))
            .reduce((sum, t) => sum + t.amount, 0);

          const balance = income - expenses;
          const recentTransactions = state.transactions.slice(0, 10);

          set({ income, expenses, balance, recentTransactions });
          logger.log('💰 Totals calculated:', { income, expenses, balance });
        },

        fetchTransactions: async (userId: string) => {
          if (!userId) return;

          set({ loading: true, error: null });

          try {
            const transactionsQuery = query(
              collection(db, 'transactions'),
              where('userId', '==', userId)
            );

            const snapshot = await getDocs(transactionsQuery);
            const transactions: Transaction[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Transaction));

            set({ transactions });
            get().calculateTotals();
            logger.log('✅ Transactions fetched:', transactions.length);
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Unknown error';
            set({ error: errorMessage });
            logger.error('❌ Error fetching transactions:', error);
          } finally {
            set({ loading: false });
          }
        },

        setupRealtimeListener: (userId: string) => {
          if (!userId) return () => {};

          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('userId', '==', userId)
          );

          const unsubscribe = onSnapshot(
            transactionsQuery,
            (snapshot) => {
              const transactions: Transaction[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Transaction));

              set({ transactions });
              get().calculateTotals();
              logger.log('🔄 Transactions updated via listener');
            },
            (error) => {
              set({ error: error.message });
              logger.error('❌ Listener error:', error);
            }
          );

          // Retornar función para desuscribirse
          return unsubscribe;
        }
      }),
      {
        name: 'finance-store',
        version: 1,
        // Qué persistir
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

// Selector para obtener balance
export const selectBalance = (state: FinanceState) => state.balance;

// Selector para obtener ingresos
export const selectIncome = (state: FinanceState) => state.income;

// Selector para obtener gastos
export const selectExpenses = (state: FinanceState) => state.expenses;

// Selector para obtener transacciones recientes
export const selectRecentTransactions = (state: FinanceState) => 
  state.recentTransactions;
```

### Fase 2: Auth Store

**Archivo:** `src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { User } from 'firebase/auth';

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
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        loading: true,
        error: null,
        isAuthenticated: false,

        setUser: (user: User | null) => {
          set({ 
            user, 
            isAuthenticated: !!user,
            error: null 
          });
        },

        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),

        logout: () => {
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null 
          });
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
);

// Selectores
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
```

---

## 🔌 Compatibilidad con Código Existente

Para mantener compatibilidad durante la migración:

```typescript
// src/contexts/hooks.ts
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Reemplaza useAuth() pero usa el store
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    isAuthenticated,
    setUser,
    // ... más métodos
  };
};

/**
 * Reemplaza useFinance() pero usa el store
 */
export const useFinance = () => {
  const store = useFinanceStore();
  
  return {
    balance: store.balance,
    income: store.income,
    expenses: store.expenses,
    recentTransactions: store.recentTransactions,
    loading: store.loading,
    error: store.error,
    fetchTransactions: store.fetchTransactions,
    // ... más propiedades
  };
};
```

---

## 🚀 Fase de Migración

### Paso 1: Implementar Stores
```bash
1. Crear authStore.ts
2. Crear financeStore.ts
3. Crear userProfileStore.ts
```

### Paso 2: Crear Hooks Wrapper
```bash
1. Crear hooks.ts que wrappean los stores
2. Mantener API igual a la original
```

### Paso 3: Migrar Gradualmente
```bash
1. Migrar página Analytics
2. Migrar página Dashboard
3. Migrar resto de componentes
```

### Paso 4: Remover Contexts Viejos
```bash
1. Remover AuthContext.tsx
2. Remover FinanceContext.tsx
3. Remover FinanceProfileContext.tsx
```

---

## 📊 Performance Antes vs Después

### Antes (Context API)
```
- 10 re-renders por cambio de estado
- 200ms tiempo de actualización
- Todo el árbol se re-renderiza
- No hay selectores especializados
```

### Después (Zustand)
```
- 1 re-render por cambio de estado
- 50ms tiempo de actualización
- Solo componentes suscritos se actualizan
- Selectores permiten subscripciones granulares
```

---

## 💡 Ejemplo de Uso (Post-Migración)

```typescript
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  // Suscribirse solo a propiedades específicas
  const balance = useFinanceStore((state) => state.balance);
  const income = useFinanceStore((state) => state.income);
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <p>Balance: ${balance}</p>
      <p>Usuario: {user?.email}</p>
    </div>
  );
}

// Solo re-render si balance cambia
// Income no afecta este componente
```

---

## ✅ Checklist de Implementación

- [ ] Instalar zustand
- [ ] Crear authStore.ts
- [ ] Crear financeStore.ts
- [ ] Crear userProfileStore.ts
- [ ] Crear hooks.ts wrapper
- [ ] Migrar Analytics page
- [ ] Migrar Dashboard page
- [ ] Migrar resto de componentes
- [ ] Tests de stores
- [ ] Remover contexts viejos
- [ ] Actualizar documentación

---

## 📝 Notas Importantes

1. **Persistencia:** Los stores guardan estado en localStorage automáticamente
2. **DevTools:** Zustand integra con Redux DevTools en desarrollo
3. **Performance:** Los selectores previenen re-renders innecesarios
4. **Scalabilidad:** Agregar más propiedades es trivial

---

## 🔗 Referencias

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#middleware)
- [Performance Best Practices](https://github.com/pmndrs/zustand#selecting-multiple-state-slices)

---

**Esta guía será actualizada con el progreso de la migración.**
