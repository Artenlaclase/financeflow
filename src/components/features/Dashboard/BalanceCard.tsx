"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useFinance } from '../../../contexts/FinanceContext';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useMonthlyReset } from '../../../hooks/useMonthlyReset';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

interface FixedExpensePayment {
  housing: boolean;
  phone: boolean;
  internet: boolean;
  creditCards: boolean;
  loans: boolean;
  insurance: boolean;
}

export default function BalanceCard() {
  const { expenses, income } = useFinance();
  const { profile } = useFinanceProfile();
  const { user } = useAuth();
  const { currentMonth, currentYear } = useMonthlyReset();
  const [payments, setPayments] = useState<FixedExpensePayment>({
    housing: false,
    phone: false,
    internet: false,
    creditCards: false,
    loans: false,
    insurance: false
  });

  // Cargar estado de pagos del mes actual
  useEffect(() => {
    const loadMonthlyPayments = async () => {
      if (!user || !profile) return;

      try {
        const monthlyPaymentsRef = doc(db, 'users', user.uid, 'monthlyPayments', `${currentYear}-${currentMonth + 1}`);
        
        const docSnap = await getDoc(monthlyPaymentsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPayments({
            housing: data.housing || false,
            phone: data.phone || false,
            internet: data.internet || false,
            creditCards: data.creditCards || false,
            loans: data.loans || false,
            insurance: data.insurance || false
          });
        }
      } catch (err) {
        console.error('Error loading monthly payments:', err);
      }
    };

    loadMonthlyPayments();
  }, [user, profile, currentMonth, currentYear]);

  // Calcular gastos fijos pagados
  const paidFixedExpenses = profile ? Object.entries(payments).reduce((sum, [key, isPaid]) => {
    return sum + (isPaid ? profile.fixedExpenses[key as keyof typeof profile.fixedExpenses] : 0);
  }, 0) : 0;

  // Calcular gastos fijos pendientes
  const pendingFixedExpenses = profile ? profile.totalFixedExpenses - paidFixedExpenses : 0;

  // Calcular saldo actual: ingreso fijo mensual menos gastos fijos pendientes menos gastos variables
  const currentBalance = profile ? profile.monthlyIncome - pendingFixedExpenses - expenses : 0;

  // Obtener el nombre del mes actual
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card sx={{ minWidth: 275, mb: 2, textAlign: 'center' }}>
      <CardContent sx={{ py: 4 }}>
        <Typography variant="h5" component="div" gutterBottom color="text.secondary">
          💰 Saldo Disponible - {currentMonthName}
        </Typography>
        
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography 
            variant="h2" 
            color={currentBalance >= 0 ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'bold' }}
          >
            ${currentBalance.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ingreso fijo mensual: ${profile?.monthlyIncome.toLocaleString() || '0'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gastos fijos pendientes: ${pendingFixedExpenses.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gastos variables: ${expenses.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Chip 
            label={`Fijos pagados: $${paidFixedExpenses.toLocaleString()}`}
            color={paidFixedExpenses > 0 ? 'success' : 'default'}
            size="small"
          />
          <Chip 
            label={`Fijos pendientes: $${pendingFixedExpenses.toLocaleString()}`}
            color={pendingFixedExpenses > 0 ? 'warning' : 'success'}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {currentBalance >= 0 
            ? '✅ Estás dentro del presupuesto' 
            : '⚠️ Has excedido tu presupuesto'
          }
        </Typography>
      </CardContent>
    </Card>
  );
}
