"use client";

import { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Add, AttachMoney, CreditCard, ShoppingCart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import IncomeForm from '../Forms/IncomeForm';
import ExpenseForm from '../Forms/ExpenseForm';
import DebtForm from '../Forms/DebtForm';

export default function QuickActions() {
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const router = useRouter();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Acciones Rápidas
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ minWidth: 120 }}
          onClick={() => setIncomeModalOpen(true)}
        >
          Ingreso
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AttachMoney />}
          sx={{ minWidth: 120 }}
          onClick={() => setExpenseModalOpen(true)}
        >
          Gasto
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ShoppingCart />}
          sx={{ minWidth: 120 }}
          onClick={() => router.push('/compras')}
        >
          Compras
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<CreditCard />}
          sx={{ minWidth: 120 }}
          onClick={() => setDebtModalOpen(true)}
        >
          Deuda
        </Button>
      </Box>

      {/* Modales de formularios */}
      <IncomeForm 
        open={incomeModalOpen} 
        onClose={() => setIncomeModalOpen(false)} 
      />
      <ExpenseForm 
        open={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
      />
      <DebtForm 
        open={debtModalOpen} 
        onClose={() => setDebtModalOpen(false)} 
      />
    </Box>
  );
}
