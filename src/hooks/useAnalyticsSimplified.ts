"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceProfile } from '../contexts/FinanceProfileContext';

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: { [key: string]: number };
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  transactionCount: number;
  fixedIncomeTotal: number;
  fixedExpensesTotal: number;
  transactionIncomeTotal: number;
  transactionExpensesTotal: number;
  transactionDetails: {
    income: any[];
    expenses: any[];
  };
}

export const useAnalytics = (selectedPeriod: string, selectedYear: number) => {
  const { user } = useAuth();
  const { profile } = useFinanceProfile();
  const [data, setData] = useState<AnalyticsData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expensesByCategory: {},
    monthlyData: [],
    transactionCount: 0,
    fixedIncomeTotal: 0,
    fixedExpensesTotal: 0,
    transactionIncomeTotal: 0,
    transactionExpensesTotal: 0,
    transactionDetails: {
      income: [],
      expenses: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (period: string, year: number) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'thisMonth':
        // Ampliar temporalmente para debug - usar todo el año
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        console.log('🔍 DEBUG: Using full year instead of thisMonth for debugging');
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'thisYear':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      default:
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
    }

    return { startDate, endDate };
  };

  const fetchAnalyticsData = async () => {
    if (!user) {
      console.log('📊 No user found, skipping analytics');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Starting analytics fetch for user:', user.uid);
      console.log('📊 Finance profile:', profile);
      
      const { startDate, endDate } = getDateRange(selectedPeriod, selectedYear);
      console.log('📊 Analytics date range:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        period: selectedPeriod,
        year: selectedYear
      });

      // Consultar transacciones de la colección global
      console.log('📊 Querying transactions collection...');
      console.log('📊 User ID for query:', user.uid);
      
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      console.log('📊 Query completed. Found', transactionsSnapshot.size, 'total transactions');
      
      // Log all documents found
      console.log('📊 All documents in transactions collection for user:');
      transactionsSnapshot.docs.forEach((doc, index) => {
        const docData = doc.data();
        console.log(`  ${index + 1}. Doc ${doc.id}:`, {
          type: docData.type,
          amount: docData.amount,
          category: docData.category,
          date: docData.date,
          description: docData.description,
          userId: docData.userId
        });
      });
      
      const incomeData: any[] = [];
      const expensesData: any[] = [];
      
      transactionsSnapshot.docs.forEach(doc => {
        try {
          const data = doc.data();
          console.log('📊 Processing doc:', doc.id, 'Type:', data.type, 'Amount:', data.amount, 'Category:', data.category);
          
          let transactionDate: Date;
          if (data.date?.toDate) {
            transactionDate = data.date.toDate();
          } else if (data.date) {
            transactionDate = new Date(data.date);
          } else {
            console.warn('📊 Transaction without date:', doc.id);
            return;
          }
          
          // Verificar que la fecha es válida
          if (isNaN(transactionDate.getTime())) {
            console.warn('📊 Invalid date for transaction:', doc.id, data.date);
            return;
          }
          
          // Agregar la fecha parseada al objeto
          const transactionWithDate = {
            ...data,
            id: doc.id,
            date: transactionDate
          };
          
          // Filtrar por fecha
          const isInDateRange = transactionDate >= startDate && transactionDate <= endDate;
          console.log('📊 Date comparison for', doc.id, ':', {
            transactionDate: transactionDate.toISOString(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isInRange: isInDateRange
          });
          
          if (isInDateRange) {
            if (data.type === 'income') {
              incomeData.push(transactionWithDate);
              console.log('📊 Added income transaction:', doc.id, data.amount);
            } else if (data.type === 'expense') {
              expensesData.push(transactionWithDate);
              console.log('📊 Added expense transaction:', doc.id, data.amount, data.category);
            }
          } else {
            console.log('📊 Transaction outside date range:', doc.id, transactionDate.toISOString());
          }
        } catch (docError) {
          console.error('📊 Error processing document:', doc.id, docError);
        }
      });
      
      console.log('📊 Filtered transactions for period:', {
        income: incomeData.length,
        expenses: expensesData.length,
        period: selectedPeriod,
        dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      });

      // Log detalles de las transacciones para debug
      console.log('📊 Income transactions details:');
      incomeData.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Amount: $${item.amount}, Date: ${item.date.toISOString()}, Category: ${item.category || 'N/A'}, Description: ${item.description || 'N/A'}`);
      });
      
      console.log('📊 Expense transactions details:');
      expensesData.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Amount: $${item.amount}, Date: ${item.date.toISOString()}, Category: ${item.category || 'N/A'}, Description: ${item.description || 'N/A'}`);
      });

      // Calcular totales básicos de transacciones
      const transactionIncome = incomeData.reduce((sum: number, item: any) => {
        return sum + (item.amount || 0);
      }, 0);
      
      const transactionExpenses = expensesData.reduce((sum: number, item: any) => {
        return sum + (item.amount || 0);
      }, 0);
      
      // Agregar ingresos fijos del perfil si existen
      let fixedIncome = 0;
      if (profile?.monthlyIncome) {
        fixedIncome = profile.monthlyIncome;
        console.log('📊 Adding fixed income from profile:', fixedIncome);
      }
      
      // Agregar gastos fijos del perfil si existen
      let fixedExpenses = 0;
      if (profile?.totalFixedExpenses) {
        fixedExpenses = profile.totalFixedExpenses;
        console.log('📊 Adding fixed expenses from profile:', fixedExpenses);
      }
      
      console.log('📊 Calculated totals:', {
        transactionIncome,
        transactionExpenses,
        fixedIncome,
        fixedExpenses,
        profileMonthlyIncome: profile?.monthlyIncome,
        profileFixedExpenses: profile?.totalFixedExpenses
      });
      
      // Calcular gastos por categoría
      const expensesByCategory: { [key: string]: number } = {};
      
      // Agregar gastos de transacciones
      expensesData.forEach((expense: any) => {
        const category = expense.category || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
      });
      
      // Agregar gastos fijos del perfil por categoría
      if (profile?.fixedExpenses) {
        if (profile.fixedExpenses.housing > 0) {
          expensesByCategory['Vivienda'] = (expensesByCategory['Vivienda'] || 0) + profile.fixedExpenses.housing;
        }
        if (profile.fixedExpenses.phone > 0) {
          expensesByCategory['Teléfono'] = (expensesByCategory['Teléfono'] || 0) + profile.fixedExpenses.phone;
        }
        if (profile.fixedExpenses.internet > 0) {
          expensesByCategory['Internet'] = (expensesByCategory['Internet'] || 0) + profile.fixedExpenses.internet;
        }
        if (profile.fixedExpenses.creditCards > 0) {
          expensesByCategory['Tarjetas de Crédito'] = (expensesByCategory['Tarjetas de Crédito'] || 0) + profile.fixedExpenses.creditCards;
        }
        if (profile.fixedExpenses.loans > 0) {
          expensesByCategory['Préstamos'] = (expensesByCategory['Préstamos'] || 0) + profile.fixedExpenses.loans;
        }
        if (profile.fixedExpenses.insurance > 0) {
          expensesByCategory['Seguros'] = (expensesByCategory['Seguros'] || 0) + profile.fixedExpenses.insurance;
        }
        
        console.log('📊 Added fixed expenses to categories:', {
          housing: profile.fixedExpenses.housing,
          phone: profile.fixedExpenses.phone,
          internet: profile.fixedExpenses.internet,
          creditCards: profile.fixedExpenses.creditCards,
          loans: profile.fixedExpenses.loans,
          insurance: profile.fixedExpenses.insurance
        });
      }
      
      console.log('📊 Final expenses by category (including fixed):', expensesByCategory);
      
      // Calcular totales finales incluyendo ingresos y gastos fijos
      const totalIncome = transactionIncome + fixedIncome;
      const totalExpenses = transactionExpenses + fixedExpenses;
      const balance = totalIncome - totalExpenses;
      
      console.log('📊 Final totals:', {
        totalIncome,
        totalExpenses,
        balance,
        breakdown: {
          fixedIncome,
          fixedExpenses,
          transactionIncome,
          transactionExpenses
        }
      });

      // Crear datos mensuales básicos
      const monthlyData: Array<{
        month: string;
        income: number;
        expenses: number;
        balance: number;
      }> = [];

      // Por ahora crear datos simples para el mes actual
      const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      monthlyData.push({
        month: currentMonth,
        income: totalIncome,
        expenses: totalExpenses,
        balance: balance
      });

      const newData: AnalyticsData = {
        totalIncome,
        totalExpenses,
        balance,
        expensesByCategory,
        monthlyData,
        transactionCount: incomeData.length + expensesData.length,
        fixedIncomeTotal: fixedIncome,
        fixedExpensesTotal: fixedExpenses,
        transactionIncomeTotal: transactionIncome,
        transactionExpensesTotal: transactionExpenses,
        transactionDetails: {
          income: incomeData,
          expenses: expensesData
        }
      };
      
      console.log('📊 Setting new analytics data:', newData);
      setData(newData);
      
      console.log('📊 Analytics data updated successfully');

    } catch (error: any) {
      console.error('📊 Error fetching analytics data:', error);
      setError(error.message || 'Error al cargar los datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📊 useAnalytics effect triggered:', { user: user?.uid, selectedPeriod, selectedYear });
    fetchAnalyticsData();
  }, [user, selectedPeriod, selectedYear, profile]);

  return { data, loading, error, refetch: fetchAnalyticsData };
};

export default useAnalytics;
