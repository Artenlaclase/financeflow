'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'compra';
  amount: number;
  category: string;
  date: any; // Firebase Timestamp o Date
  description?: string;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook especializado para obtener transacciones del usuario
 * Realiza una sola query a Firestore y luego filtra en cliente
 */
export const useTransactions = (): UseTransactionsResult => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.time('📊 Fetch transactions');

      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactionsList: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));

      logger.timeEnd('📊 Fetch transactions');
      logger.log('📊 Found transactions:', transactionsList.length);

      setTransactions(transactionsList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('❌ Error fetching transactions:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
};
