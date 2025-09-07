"use client";

import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { formatDateForDisplay } from '../../../lib/dateUtils';

interface MonthlyTransactionsTableProps {
  selectedPeriod: string;
  selectedYear: number;
}

export default function MonthlyTransactionsTable({ selectedPeriod, selectedYear }: MonthlyTransactionsTableProps) {
  const { data, loading, error } = useAnalytics(selectedPeriod, selectedYear);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Combinar todas las transacciones del período (con valores por defecto seguros)
  const transactionDetails = data.transactionDetails || { income: [], expenses: [] };
  const incomes = transactionDetails.income || [];
  const expenses = transactionDetails.expenses || [];

  const allTransactions = [
    ...incomes.map(t => ({ ...t, type: 'income' })),
    ...expenses.map(t => ({ ...t, type: 'expense' }))
  ].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'compra':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Ingreso';
      case 'expense':
        return 'Gasto';
      case 'compra':
        return 'Compra';
      default:
        return type;
    }
  };

  const getMerchant = (t: any) => {
    return t.merchant || t.supermercado || t?.detalleCompra?.supermercado || '';
  };

  const getPaymentMethod = (t: any) => {
    // Aceptar tanto paymentMethod como metodoPago
    return t.paymentMethod || t.metodoPago || t?.detalleCompra?.metodoPago || '';
  };

  const getInstallments = (t: any) => {
    return t.installments || t?.detalleCompra?.installments || null;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        📋 Transacciones del Período
      </Typography>
      
      {allTransactions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No hay transacciones en este período
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Establecimiento</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTransactions.map((transaction, index) => (
                <TableRow key={`${transaction.type}-${index}`}>
                  <TableCell>
                    {formatDateForDisplay(transaction.date)}
                  </TableCell>
                  <TableCell>
                    {transaction.description || transaction.category || 'Sin descripción'}
                  </TableCell>
                  <TableCell>
                    {transaction.category || 'Sin categoría'}
                  </TableCell>
                  <TableCell>
                    {getMerchant(transaction) || '—'}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const method = getPaymentMethod(transaction);
                      const cuotas = getInstallments(transaction);
                      if (!method) return '—';
                      if (method === 'credito') {
                        return `Crédito${cuotas ? ` (${cuotas} cuotas)` : ''}`;
                      }
                      if (method === 'debito') return 'Débito';
                      if (method === 'efectivo') return 'Efectivo';
                      // fallback para otros valores
                      return String(method);
                    })()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeLabel(transaction.type)}
                      color={getTypeColor(transaction.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong> Total de transacciones:</strong> {allTransactions.length} | 
          <strong> Ingresos:</strong> {incomes.length} | 
          <strong> Gastos:</strong> {expenses.length}
        </Typography>
      </Box>
    </Paper>
  );
}
