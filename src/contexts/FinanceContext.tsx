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

  const setupListeners = () => {
    if (!user) {
      console.log('No user found, skipping listeners setup');
      return;
    }

    console.log('Setting up Firestore listeners for user:', user.uid);

    // Obtener transacciones de la colección global 'transactions' (incluye compras de supermercado)
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(20)
    );
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      console.log('Global transactions loaded:', snapshot.size, 'documents');
      
      let totalIncome = 0;
      let totalExpenses = 0;
      const allTransactions: Transaction[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const transaction: Transaction = {
          id: doc.id,
          type: data.type,
          amount: data.amount || 0,
          description: data.description || '',
          category: data.category || '',
          date: data.date
        };
        
        allTransactions.push(transaction);
        
        if (data.type === 'income') {
          totalIncome += data.amount || 0;
        } else if (data.type === 'expense') {
          totalExpenses += data.amount || 0;
        }
      });
      
      console.log('Processed transactions:', {
        total: allTransactions.length,
        income: totalIncome,
        expenses: totalExpenses,
        transactions: allTransactions
      });
      
      setIncome(totalIncome);
      setExpenses(totalExpenses);
      setRecentTransactions(allTransactions.slice(0, 10));
    }, (error) => {
      console.error('Error fetching transactions:', error);
      // En caso de error, mantener datos existentes
    });

    // Obtener ingresos (mantener para compatibilidad con datos existentes)
    const incomeQuery = query(
      collection(db, 'users', user.uid, 'income'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const legacyIncomeTotal = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      
      // Crear array de transacciones de ingresos legacy
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
      
      console.log('Legacy income transactions loaded:', incomeTransactions);
      
      // Solo actualizar si hay transacciones legacy
      if (incomeTransactions.length > 0) {
        setIncome(prev => prev + legacyIncomeTotal);
        setRecentTransactions(prev => {
          const combined = [...prev, ...incomeTransactions];
          return combined
            .sort((a, b) => {
              const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || Date.now());
              const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || Date.now());
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10);
        });
      }
    }, (error) => {
      console.log('Legacy income query error (expected if no legacy data):', error);
    });

    // Obtener gastos (mantener para compatibilidad con datos existentes)
    const expensesQuery = query(
      collection(db, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const legacyExpensesTotal = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      
      // Crear array de transacciones de gastos legacy
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
      
      console.log('Legacy expense transactions loaded:', expenseTransactions);
      
      // Solo actualizar si hay transacciones legacy
      if (expenseTransactions.length > 0) {
        setExpenses(prev => prev + legacyExpensesTotal);
        setRecentTransactions(prev => {
          const combined = [...prev, ...expenseTransactions];
          return combined
            .sort((a, b) => {
              const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || Date.now());
              const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || Date.now());
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10);
        });
      }
    }, (error) => {
      console.log('Legacy expenses query error (expected if no legacy data):', error);
    });

    // Obtener deudas
    const debtsQuery = query(
      collection(db, 'users', user.uid, 'debts'),
      where('paid', '==', false)
    );
    const unsubscribeDebts = onSnapshot(debtsQuery, (snapshot) => {
      setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.log('Debts query error (expected if no debts data):', error);
    });

    return () => {
      unsubscribeTransactions();
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

  const refreshData = () => {
    // Esta función reestablece los listeners lo que fuerza una actualización
    if (user) {
      setupListeners();
    }
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
    <FinanceContext.Provider value={{ balance, income, expenses, debts, recentTransactions, refreshData }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
