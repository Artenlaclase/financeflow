"use client";

import { Card, CardContent, Typography, Box } from '@mui/material';
import { useFinance } from '../../../contexts/FinanceContext';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';

export default function BalanceCard() {
  const { expenses } = useFinance();
  const { profile } = useFinanceProfile();

  // Calcular saldo actual: ingresos disponibles menos gastos reales
  const currentBalance = profile ? profile.availableIncome - expenses : 0;

  return (
    <Card sx={{ minWidth: 275, mb: 2, textAlign: 'center' }}>
      <CardContent sx={{ py: 4 }}>
        <Typography variant="h5" component="div" gutterBottom color="text.secondary">
          💰 Saldo Disponible
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
