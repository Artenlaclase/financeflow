"use client";

import { Card, CardContent, Typography, Box } from '@mui/material';
import { useFinance } from '../../../contexts/FinanceContext';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';

export default function BalanceCard() {
  const { expenses } = useFinance();
  const { profile } = useFinanceProfile();

  // Calcular saldo actual: saldo disponible menos gastos ingresados
  const currentBalance = profile ? profile.availableIncome - expenses : 0;

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Saldo Actual
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" color={currentBalance >= 0 ? 'success.main' : 'error.main'}>
            ${currentBalance.toFixed(2)}
          </Typography>
        </Box>
        {profile && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Disponible: ${profile.availableIncome.toLocaleString()} - Gastos: ${expenses.toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
