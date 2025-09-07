"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
    transactionExpensesTotal: 0
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

  const calculateMonthsInPeriod = (startDate: Date, endDate: Date, period: string, fixedItemStartDate?: Date) => {
    const now = new Date();
    
    // Si hay una fecha de inicio para el item fijo, usarla como referencia
    const effectiveStartDate = fixedItemStartDate && fixedItemStartDate > startDate 
      ? fixedItemStartDate 
      : startDate;
    
    // Para el año actual, solo contar hasta el mes actual o el mes final del período, lo que sea menor
    if (period === 'thisYear' && effectiveStartDate.getFullYear() === now.getFullYear()) {
      const currentMonth = now.getMonth();
      const startMonth = effectiveStartDate.getMonth();
      const endMonth = Math.min(endDate.getMonth(), currentMonth);
      
      // Si el item empezó después del período actual, no contar nada
      if (startMonth > endMonth) return 0;
      
      return Math.max(1, endMonth - startMonth + 1);
    }
    
    // Para otros casos, calcular normalmente considerando la fecha de inicio del item
    const yearDiff = endDate.getFullYear() - effectiveStartDate.getFullYear();
    const monthDiff = endDate.getMonth() - effectiveStartDate.getMonth();
    return Math.max(0, yearDiff * 12 + monthDiff + 1);
  };

  const fetchAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(selectedPeriod, selectedYear);
      console.log('📊 Analytics date range:', { startDate, endDate });

      // Consultar transacciones de la colección global
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );
      
      console.log('📊 Fetching transactions from global collection...');
      const transactionsSnapshot = await getDocs(transactionsQuery);
      console.log('📊 Found', transactionsSnapshot.size, 'total transactions');
      
      const incomeData: any[] = [];
      const expensesData: any[] = [];
      
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const transactionDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        
        // Para períodos de año completo, no filtrar por fecha aquí
        // Solo filtrar por año para incluir todos los meses
        if (selectedPeriod === 'thisYear' || selectedPeriod === 'custom') {
          if (transactionDate.getFullYear() === selectedYear) {
            if (data.type === 'income') {
              incomeData.push(data);
            } else if (data.type === 'expense' || data.type === 'compra') {
              expensesData.push(data);
            }
          }
        } else {
          // Para otros períodos, usar el filtrado por fecha original
          if (transactionDate >= startDate && transactionDate <= endDate) {
            if (data.type === 'income') {
              incomeData.push(data);
            } else if (data.type === 'expense' || data.type === 'compra') {
              expensesData.push(data);
            }
          }
        }
      });
      
      console.log('📊 Filtered transactions for period:', {
        income: incomeData.length,
        expenses: expensesData.length,
        period: selectedPeriod,
        dateRange: { startDate, endDate },
        selectedYear
      });

      // Calcular totales incluyendo datos del perfil financiero
      const transactionIncome = incomeData.reduce((sum: number, item: any) => sum + item.amount, 0);
      const transactionExpenses = expensesData.reduce((sum: number, item: any) => sum + item.amount, 0);
      
      // Calcular cuántos meses están incluidos en el período para los gastos/ingresos fijos
      const incomeMonthsInPeriod = calculateMonthsInPeriod(
        startDate, 
        endDate, 
        selectedPeriod, 
        profile?.incomeStartDate
      );
      const expensesMonthsInPeriod = calculateMonthsInPeriod(
        startDate, 
        endDate, 
        selectedPeriod, 
        profile?.expensesStartDate
      );
      
      // Agregar ingresos fijos del perfil (ingreso mensual * meses en el período)
      const fixedIncomeForPeriod = profile ? (profile.monthlyIncome * incomeMonthsInPeriod) : 0;
      
      // Agregar gastos fijos del perfil (gastos fijos mensuales * meses en el período)
      const fixedExpensesForPeriod = profile ? (profile.totalFixedExpenses * expensesMonthsInPeriod) : 0;
      
      // Totales finales
      const totalIncome = transactionIncome + fixedIncomeForPeriod;
      const totalExpenses = transactionExpenses + fixedExpensesForPeriod;
      const balance = totalIncome - totalExpenses;

      // Gastos por categoría incluyendo gastos fijos
      const expensesByCategory: { [key: string]: number } = {};
      expensesData.forEach((expense: any) => {
        const category = expense.category || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
      });

      // Agregar gastos fijos como categorías separadas si hay un perfil
      if (profile && fixedExpensesForPeriod > 0) {
        expensesByCategory['Vivienda (Fijo)'] = profile.fixedExpenses.housing * expensesMonthsInPeriod;
        expensesByCategory['Telefonía (Fijo)'] = profile.fixedExpenses.phone * expensesMonthsInPeriod;
        expensesByCategory['Internet (Fijo)'] = profile.fixedExpenses.internet * expensesMonthsInPeriod;
        expensesByCategory['Tarjetas de Crédito (Fijo)'] = profile.fixedExpenses.creditCards * expensesMonthsInPeriod;
        expensesByCategory['Préstamos (Fijo)'] = profile.fixedExpenses.loans * expensesMonthsInPeriod;
        expensesByCategory['Seguros (Fijo)'] = profile.fixedExpenses.insurance * expensesMonthsInPeriod;
      }

      // Datos mensuales
      const monthlyData: Array<{ month: string; income: number; expenses: number; balance: number }> = [];
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      // Determinar qué meses incluir según el período
      let monthsToInclude: number[] = [];
      if (selectedPeriod === 'thisYear' || selectedPeriod === 'custom') {
        // Para año completo, incluir todos los meses del año seleccionado
        monthsToInclude = Array.from({ length: 12 }, (_, i) => i);
      } else {
        // Para otros períodos, calcular los meses relevantes dentro del año seleccionado
        const monthStart = startDate.getMonth();
        const monthEnd = endDate.getMonth();
        const yearStart = startDate.getFullYear();
        const yearEnd = endDate.getFullYear();
        
        if (yearStart === yearEnd) {
          // Mismo año
          if (monthStart <= monthEnd) {
            monthsToInclude = Array.from({ length: monthEnd - monthStart + 1 }, (_, i) => monthStart + i);
          } else {
            // Caso de año cruzado (no debería pasar con mismo año)
            monthsToInclude = Array.from({ length: 12 }, (_, i) => i);
          }
        } else {
          // Años diferentes - incluir todos los meses del año seleccionado
          monthsToInclude = Array.from({ length: 12 }, (_, i) => i);
        }
      }

      console.log('📊 Months to include:', monthsToInclude);
      
      monthsToInclude.forEach(monthIndex => {
        const monthIncomes = incomeData.filter((item: any) => {
          const itemDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
          return itemDate.getMonth() === monthIndex && itemDate.getFullYear() === selectedYear;
        });
        const monthExpenses = expensesData.filter((item: any) => {
          const itemDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
          return itemDate.getMonth() === monthIndex && itemDate.getFullYear() === selectedYear;
        });
        
        console.log(`📊 Month ${monthIndex}:`, {
          incomes: monthIncomes.length,
          expenses: monthExpenses.length,
          year: selectedYear
        });
        
        const monthTransactionIncomeTotal = monthIncomes.reduce((sum: number, item: any) => sum + item.amount, 0);
        const monthTransactionExpenseTotal = monthExpenses.reduce((sum: number, item: any) => sum + item.amount, 0);
        
        // Agregar ingresos y gastos fijos mensuales del perfil
        const monthFixedIncome = profile ? profile.monthlyIncome : 0;
        const monthFixedExpenses = profile ? profile.totalFixedExpenses : 0;
        
        // Totales mensuales finales
        const monthIncomeTotal = monthTransactionIncomeTotal + monthFixedIncome;
        const monthExpenseTotal = monthTransactionExpenseTotal + monthFixedExpenses;
        
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
        transactionCount: incomeData.length + expensesData.length,
        fixedIncomeTotal: fixedIncomeForPeriod,
        fixedExpensesTotal: fixedExpensesForPeriod,
        transactionIncomeTotal: transactionIncome,
        transactionExpensesTotal: transactionExpenses
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
