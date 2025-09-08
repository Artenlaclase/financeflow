"use client";

import { useState } from 'react';
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
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { formatDateForDisplay } from '../../../lib/dateUtils';

interface MonthlyTransactionsTableProps {
  selectedPeriod: string;
  selectedYear: number;
  selectedMonth?: number;
}

export default function MonthlyTransactionsTable({ selectedPeriod, selectedYear, selectedMonth }: MonthlyTransactionsTableProps) {
  const { data, loading, error, refetch } = useAnalytics(selectedPeriod, selectedYear, selectedMonth);
  const [editing, setEditing] = useState<any | null>(null);
  const [merchant, setMerchant] = useState('');
  const [method, setMethod] = useState('');
  const [installments, setInstallments] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openEdit = (t: any) => {
    setEditing(t);
    setMerchant(getMerchant(t) || '');
    const pm = getPaymentMethod(t) || '';
    setMethod(pm);
    const ins = getInstallments(t);
    setInstallments(ins ? String(ins) : '');
  };

  const closeEdit = () => {
    setEditing(null);
    setMerchant('');
    setMethod('');
    setInstallments('');
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'transactions', editing.id);
      const update: any = {};
      // Persistir merchant a nivel raíz
      update.merchant = merchant || null;
      // Persistir método y cuotas a nivel raíz
      update.paymentMethod = method || null;
      if (method === 'credito') {
        const n = parseInt(installments || '0', 10);
        update.installments = n > 0 ? n : null;
      } else {
        update.installments = null;
      }
  await updateDoc(docRef, update);
  await refetch();
  closeEdit();
    } catch (e) {
      console.error('Error updating transaction:', e);
      setSaving(false);
    }
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
        <>
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Establecimiento</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTransactions.map((transaction, index) => (
                <TableRow key={('id' in transaction && transaction.id) ? transaction.id : `${transaction.type}-${index}`}>
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
                  <TableCell align="right">
                    {'id' in transaction && (
                      <>
                        <IconButton size="small" onClick={() => openEdit(transaction)} aria-label="Editar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => setToDelete(transaction)} 
                          aria-label="Eliminar"
                          sx={{ color: 'error.main', ml: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={!!editing} onClose={closeEdit} maxWidth="sm" fullWidth>
          <DialogTitle>Editar transacción</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nombre del establecimiento"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Método de pago</InputLabel>
                <Select value={method} label="Método de pago" onChange={(e) => setMethod(e.target.value)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="debito">Débito</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                </Select>
              </FormControl>
              {method === 'credito' && (
                <TextField
                  label="Número de cuotas"
                  type="number"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                  fullWidth
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEdit} disabled={saving}>Cancelar</Button>
            <Button onClick={saveEdit} variant="contained" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
          </Dialog>

          {/* Confirmación de eliminación */}
          <Dialog open={!!toDelete} onClose={() => { if (!deleting) { setToDelete(null); setDeleteError(null); } }}>
            <DialogTitle>Eliminar transacción</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ¿Seguro que deseas eliminar esta transacción? Esta acción no se puede deshacer.
              </Typography>
              {toDelete && (
                <Box sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                  <div><strong>Fecha:</strong> {formatDateForDisplay(toDelete.date)}</div>
                  <div><strong>Descripción:</strong> {toDelete.description || toDelete.category || 'Sin descripción'}</div>
                  <div><strong>Monto:</strong> {formatAmount(toDelete.amount)}</div>
                </Box>
              )}
              {deleteError && (
                <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { if (!deleting) { setToDelete(null); setDeleteError(null); } }} disabled={deleting}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!toDelete?.id) return;
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await deleteDoc(doc(db, 'transactions', toDelete.id));
                    await refetch();
                    setToDelete(null);
                  } catch (e: any) {
                    console.error('Error deleting transaction:', e);
                    setDeleteError(e?.message || 'Error al eliminar la transacción');
                  } finally {
                    setDeleting(false);
                  }
                }}
                color="error"
                variant="contained"
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
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
