"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Checkbox, 
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useMonthlyReset } from '../../../hooks/useMonthlyReset';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

interface FixedExpensePayment {
  housing: boolean;
  phone: boolean;
  internet: boolean;
  creditCards: boolean;
  loans: boolean;
  insurance: boolean;
}

export default function FixedExpensesCard() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handlePaymentChange = async (expenseType: keyof FixedExpensePayment, checked: boolean) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const monthlyPaymentsRef = doc(db, 'users', user.uid, 'monthlyPayments', `${currentYear}-${currentMonth + 1}`);
      
      const newPayments = { ...payments, [expenseType]: checked };
      setPayments(newPayments);

      await updateDoc(monthlyPaymentsRef, {
        ...newPayments,
        lastUpdated: new Date()
      });

      const expenseNames = {
        housing: 'Vivienda',
        phone: 'Telefonía',
        internet: 'Internet',
        creditCards: 'Tarjetas de Crédito',
        loans: 'Préstamos',
        insurance: 'Seguros'
      };

      setSuccess(`${expenseNames[expenseType]} ${checked ? 'marcado como pagado' : 'marcado como pendiente'}`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Error al actualizar el estado del pago');
      // Revertir el cambio en caso de error
      setPayments(prev => ({ ...prev, [expenseType]: !checked }));
    } finally {
      setLoading(false);
    }
  };

  const getExpenseName = (key: keyof FixedExpensePayment) => {
    const names = {
      housing: 'Vivienda',
      phone: 'Telefonía',
      internet: 'Internet',
      creditCards: 'Tarjetas de Crédito',
      loans: 'Préstamos',
      insurance: 'Seguros'
    };
    return names[key];
  };

  const getExpenseAmount = (key: keyof FixedExpensePayment) => {
    if (!profile) return 0;
    return profile.fixedExpenses[key];
  };

  const totalPaid = Object.entries(payments).reduce((sum, [key, isPaid]) => {
    return sum + (isPaid ? getExpenseAmount(key as keyof FixedExpensePayment) : 0);
  }, 0);

  const totalFixed = profile ? profile.totalFixedExpenses : 0;
  const remainingAmount = totalFixed - totalPaid;

  if (!profile) {
    return null;
  }

  return (
    <>
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom color="text.secondary">
            💳 Gastos Fijos del Mes
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Fijo: ${totalFixed.toLocaleString()}
              </Typography>
              <Chip 
                label={`Pagado: $${totalPaid.toLocaleString()}`}
                color={totalPaid === totalFixed ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Pendiente: ${remainingAmount.toLocaleString()}
              </Typography>
              <Chip 
                label={`${Math.round((totalPaid / totalFixed) * 100)}% completado`}
                color={totalPaid === totalFixed ? 'success' : 'primary'}
                size="small"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(profile.fixedExpenses).map(([key, amount]) => {
              const expenseKey = key as keyof FixedExpensePayment;
              const isPaid = payments[expenseKey];
              const expenseName = getExpenseName(expenseKey);
              
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={isPaid}
                      onChange={(e) => handlePaymentChange(expenseKey, e.target.checked)}
                      disabled={loading}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: isPaid ? 'line-through' : 'none',
                          color: isPaid ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {expenseName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: isPaid ? 'success.main' : 'text.primary'
                        }}
                      >
                        ${amount.toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  sx={{ 
                    margin: 0,
                    '& .MuiFormControlLabel-label': { width: '100%' }
                  }}
                />
              );
            })}
          </Box>

          {totalPaid === totalFixed && totalFixed > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ¡Todos los gastos fijos han sido pagados este mes! 🎉
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
}
