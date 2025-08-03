import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from './AuthContext';

interface FinanceContextProps {
  balance: number;
  income: number;
  expenses: number;
  debts: any[];
  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextProps>({
  balance: 0,
  income: 0,
  expenses: 0,
  debts: [],
  refreshData: () => {}
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [debts, setDebts] = useState<any[]>([]);

  const refreshData = () => {
    if (!user) return;

    // Obtener ingresos
    const incomeQuery = query(collection(db, 'users', user.uid, 'income'));
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setIncome(total);
    });

    // Obtener gastos
    const expensesQuery = query(collection(db, 'users', user.uid, 'expenses'));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setExpenses(total);
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

  useEffect(() => {
    const unsubscribe = refreshData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    setBalance(income - expenses);
  }, [income, expenses]);

  return (
    <FinanceContext.Provider value={{ balance, income, expenses, debts, refreshData }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
