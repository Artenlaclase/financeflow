"use client";

import { Button, Box, Typography } from '@mui/material';
import { Add, AttachMoney, CreditCard } from '@mui/icons-material';

export default function QuickActions() {
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
          onClick={() => console.log('Add Income')}
        >
          Ingreso
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AttachMoney />}
          sx={{ minWidth: 120 }}
          onClick={() => console.log('Add Expense')}
        >
          Gasto
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<CreditCard />}
          sx={{ minWidth: 120 }}
          onClick={() => console.log('Add Debt')}
        >
          Deuda
        </Button>
      </Box>
    </Box>
  );
}
