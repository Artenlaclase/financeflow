"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from '../contexts/AuthContext';

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
}

export const useAnalytics = (selectedPeriod: string, selectedYear: number) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expensesByCategory: {},
    monthlyData: [],
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (period: string, year: number) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(selectedPeriod, selectedYear);

      // Obtener ingresos
      const incomeQuery = query(
        collection(db, 'users', user.uid, 'income'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const incomeSnapshot = await getDocs(incomeQuery);
      const incomeData = incomeSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          category: data.category || '',
          description: data.description || '',
          date: data.date.toDate()
        };
      });

      // Obtener gastos
      const expensesQuery = query(
        collection(db, 'users', user.uid, 'expenses'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          category: data.category || '',
          description: data.description || '',
          date: data.date.toDate()
        };
      });

      // Calcular totales
      const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = expensesData.reduce((sum, item) => sum + item.amount, 0);
      const balance = totalIncome - totalExpenses;

      // Gastos por categoría
      const expensesByCategory: { [key: string]: number } = {};
      expensesData.forEach(expense => {
        const category = expense.category || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
      });

      // Datos mensuales
      const monthlyData: Array<{ month: string; income: number; expenses: number; balance: number }> = [];
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      // Determinar qué meses incluir según el período
      let monthsToInclude: number[] = [];
      if (selectedPeriod === 'thisYear' || selectedPeriod === 'custom') {
        monthsToInclude = Array.from({ length: 12 }, (_, i) => i);
      } else {
        // Para otros períodos, calcular los meses relevantes
        const monthStart = startDate.getMonth();
        const monthEnd = endDate.getMonth();
        if (monthStart <= monthEnd) {
          monthsToInclude = Array.from({ length: monthEnd - monthStart + 1 }, (_, i) => monthStart + i);
        } else {
          // Caso de año cruzado
          monthsToInclude = [
            ...Array.from({ length: 12 - monthStart }, (_, i) => monthStart + i),
            ...Array.from({ length: monthEnd + 1 }, (_, i) => i)
          ];
        }
      }

      monthsToInclude.forEach(monthIndex => {
        const monthIncomes = incomeData.filter(item => item.date.getMonth() === monthIndex);
        const monthExpenses = expensesData.filter(item => item.date.getMonth() === monthIndex);
        
        const monthIncomeTotal = monthIncomes.reduce((sum, item) => sum + item.amount, 0);
        const monthExpenseTotal = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
        
        monthlyData.push({
          month: monthNames[monthIndex],
          income: monthIncomeTotal,
          expenses: monthExpenseTotal,
          balance: monthIncomeTotal - monthExpenseTotal
        });
      });

      setData({
        totalIncome,
        totalExpenses,
        balance,
        expensesByCategory,
        monthlyData,
        transactionCount: incomeData.length + expensesData.length
      });

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Error al cargar los datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, selectedPeriod, selectedYear]);

  return { data, loading, error, refetch: fetchAnalyticsData };
};
