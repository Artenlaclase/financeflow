"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { safeDate } from '../lib/dateUtils';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'compra';
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
    // Temporalmente simplificamos el query para verificar conectividad
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    
    console.log('🔍 Setting up transactions query...');
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      console.log('🔥 Global transactions loaded:', snapshot.size, 'documents');
      console.log('🔥 Raw transaction data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      let totalIncome = 0;
      let totalExpenses = 0;
      const allTransactions: Transaction[] = [];
      const unpaidDebts: any[] = [];
      
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
        
        // Calcular totales
        if (data.type === 'income') {
          totalIncome += data.amount || 0;
        } else if (data.type === 'expense' || data.type === 'compra') {
          totalExpenses += data.amount || 0;
        } else if (data.type === 'debt' && data.status !== 'paid') {
          // Procesar deudas no pagadas
          unpaidDebts.push({
            id: doc.id,
            amount: data.amount || 0,
            description: data.description || '',
            creditor: data.creditor || '',
            status: data.status || 'pending',
            date: data.date,
            paid: false
          });
        }
      });
      
      console.log('Processed transactions:', {
        total: allTransactions.length,
        income: totalIncome,
        expenses: totalExpenses,
        debts: unpaidDebts.length,
        transactions: allTransactions
      });
      
      // Ordenar todas las transacciones por fecha (más recientes primero)
      allTransactions.sort((a, b) => {
        const dateA = safeDate(a.date) || new Date(0);
        const dateB = safeDate(b.date) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setIncome(totalIncome);
      setExpenses(totalExpenses);
      setDebts(unpaidDebts);
      setRecentTransactions(allTransactions);
    }, (error) => {
      console.error('❌ Error fetching global transactions:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      // En caso de error, mantener datos existentes
    });

    // ✅ TODOS LOS DATOS AHORA VIENEN DE transactions/
    // Ya no necesitamos listeners separados para incomes/expenses/debts
    // La migración se ejecuta una vez desde el componente MigrationTool


    // ✅ MIGRACIÓN COMPLETADA
    // Listeners legacy removidos - todos los datos vienen de transactions/
    // La migración de datos legacy se ejecuta una vez desde el dashboard
    
    console.log('✅ All listeners configured from unified transactions/ collection');
    
    return () => {
      unsubscribeTransactions();
    };
  };

  // Función para actualizar transacciones recientes
  const updateRecentTransactions = (newTransactions: Transaction[], type: 'income' | 'expense') => {
    setRecentTransactions(prev => {
      // Filtrar las transacciones del tipo que se está actualizando
      const filtered = prev.filter(t => t.type !== type);
      
      // Combinar con las nuevas transacciones
      const combined = [...filtered, ...newTransactions];
      
      // Ordenar por fecha
      const sorted = combined
        .sort((a, b) => {
          const dateA = safeDate(a.date) || new Date(0);
          const dateB = safeDate(b.date) || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      
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
