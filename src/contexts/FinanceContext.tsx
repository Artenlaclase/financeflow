"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  category?: string;
  date: any;
}

interface FinanceContextProps {
  balance: number;
  income: number;
  expenses: number;
  debts: any[];
  recentTransactions: Transaction[];
}

const FinanceContext = createContext<FinanceContextProps>({
  balance: 0,
  income: 0,
  expenses: 0,
  debts: [],
  recentTransactions: []
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [debts, setDebts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const setupListeners = () => {
    if (!user) {
      console.log('No user found, skipping listeners setup');
      return;
    }

    console.log('Setting up Firestore listeners for user:', user.uid);

    // Obtener ingresos
    const incomeQuery = query(
      collection(db, 'users', user.uid, 'income'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setIncome(total);
      
      // Crear array de transacciones de ingresos
      const incomeTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'income' as const,
          amount: data.amount || 0,
          description: data.description || '',
          category: data.category || '',
          date: data.date
        };
      });
      
      console.log('Income transactions loaded:', incomeTransactions);
      updateRecentTransactions(incomeTransactions, 'income');
    });

    // Obtener gastos
    const expensesQuery = query(
      collection(db, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setExpenses(total);
      
      // Crear array de transacciones de gastos
      const expenseTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'expense' as const,
          amount: data.amount || 0,
          description: data.description || '',
          category: data.category || '',
          date: data.date
        };
      });
      
      console.log('Expense transactions loaded:', expenseTransactions);
      updateRecentTransactions(expenseTransactions, 'expense');
    });

    // Obtener deudas
    const debtsQuery = query(
      collection(db, 'users', user.uid, 'debts'),
      where('paid', '==', false)
    );
    const unsubscribeDebts = onSnapshot(debtsQuery, (snapshot) => {
      setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeIncome();
      unsubscribeExpenses();
      unsubscribeDebts();
    };
  };

  // Función para actualizar transacciones recientes
  const updateRecentTransactions = (newTransactions: Transaction[], type: 'income' | 'expense') => {
    setRecentTransactions(prev => {
      // Filtrar las transacciones del tipo que se está actualizando
      const filtered = prev.filter(t => t.type !== type);
      
      // Combinar con las nuevas transacciones
      const combined = [...filtered, ...newTransactions];
      
      // Ordenar por fecha y limitar a 10
      const sorted = combined
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || Date.now());
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || Date.now());
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
      
      console.log('Updated recent transactions:', sorted);
      return sorted;
    });
  };

  useEffect(() => {
    const unsubscribe = setupListeners();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    // El balance ahora se calcula en el componente BalanceCard
    // basado en availableIncome - expenses
    setBalance(income - expenses);
  }, [income, expenses]);

  return (
    <FinanceContext.Provider value={{ balance, income, expenses, debts, recentTransactions }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
