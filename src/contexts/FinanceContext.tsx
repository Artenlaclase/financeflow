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
  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextProps>({
  balance: 0,
  income: 0,
  expenses: 0,
  debts: [],
  recentTransactions: [],
  refreshData: () => {}
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [debts, setDebts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const refreshData = () => {
    if (!user) return;

    let incomeTransactions: Transaction[] = [];
    let expenseTransactions: Transaction[] = [];

    // Obtener ingresos
    const incomeQuery = query(
      collection(db, 'users', user.uid, 'income'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setIncome(total);
      
      // Actualizar ingresos en transacciones
      incomeTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'income' as const,
        amount: doc.data().amount,
        description: doc.data().description,
        category: doc.data().category,
        date: doc.data().date
      }));
      
      updateRecentTransactions();
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
      
      // Actualizar gastos en transacciones
      expenseTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'expense' as const,
        amount: doc.data().amount,
        description: doc.data().description,
        category: doc.data().category,
        date: doc.data().date
      }));
      
      updateRecentTransactions();
    });

    // Función para actualizar transacciones recientes
    const updateRecentTransactions = () => {
      const combined = [...incomeTransactions, ...expenseTransactions];
      const sorted = combined
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
      
      setRecentTransactions(sorted);
    };

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

  useEffect(() => {
    const unsubscribe = refreshData();
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
    <FinanceContext.Provider value={{ balance, income, expenses, debts, recentTransactions, refreshData }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
