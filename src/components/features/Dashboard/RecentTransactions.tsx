"use client";

import { useState } from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import { MoreVert, Edit, Delete } from '@mui/icons-material';
import { useFinance } from '../../../contexts/FinanceContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useMonthlyReset } from '../../../hooks/useMonthlyReset';
import { deleteTransaction, Transaction } from '../../../lib/firebaseUtils';
import ConfirmationDialog from '../../shared/ConfirmationDialog';
import EditTransactionDialog from './EditTransactionDialog';
import { formatDateForDisplay, safeDate } from '../../../lib/dateUtils';

export default function RecentTransactions() {
  const { recentTransactions } = useFinance();
  const { user } = useAuth();
  const { currentMonth, currentYear } = useMonthlyReset();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtrar transacciones del mes actual
  const currentMonthTransactions = recentTransactions.filter(transaction => {
    if (!transaction?.date) return false;
    const transactionDate = safeDate(transaction.date);
    if (!transactionDate) return false;
    const transactionMonth = transactionDate.getMonth();
    const transactionYear = transactionDate.getFullYear();
    return transactionMonth === currentMonth && transactionYear === currentYear;
  }).sort((a, b) => {
    const aDate = safeDate(a.date)?.getTime() ?? 0;
    const bDate = safeDate(b.date)?.getTime() ?? 0;
    return bDate - aDate; // más recientes primero
  });

  // Debug log para ver las transacciones
  console.log('RecentTransactions - Current transactions:', recentTransactions);
  console.log('RecentTransactions - Current month transactions:', currentMonthTransactions);
  console.log('RecentTransactions - User:', user);
  console.log('RecentTransactions - Transactions length:', recentTransactions?.length || 0);
  console.log('RecentTransactions - Current month length:', currentMonthTransactions?.length || 0);
  console.log('RecentTransactions - Detailed transactions:', currentMonthTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
    fullData: t
  })));
  console.log('RecentTransactions - Menu state:', { 
    anchorEl: Boolean(anchorEl), 
    selectedTransaction: selectedTransaction?.id,
    deleteDialogOpen,
    editDialogOpen 
  });

  if (!user) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transacciones Recientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Usuario no autenticado
        </Typography>
      </Paper>
    );
  }

  if (!currentMonthTransactions || currentMonthTransactions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transacciones del Mes Actual
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay transacciones en el mes actual
        </Typography>
      </Paper>
    );
  }

  const formatDate = (date: any) => {
    return formatDateForDisplay(date);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, transaction: any) => {
    console.log('handleMenuClick called');
    console.log('Transaction selected for menu:', transaction);
    
    // Validar que la transacción tiene los datos necesarios
    if (!transaction || !transaction.id) {
      console.error('Invalid transaction for menu:', transaction);
      setError('Error: Transacción no válida');
      return;
    }
    
    console.log('Setting anchor and selected transaction');
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    console.log('handleEdit called with transaction:', selectedTransaction);
    if (selectedTransaction) {
      setTransactionToEdit(selectedTransaction);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteClick = () => {
    console.log('handleDeleteClick called with transaction:', selectedTransaction);
    if (selectedTransaction) {
      setTransactionToDelete(selectedTransaction);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    console.log('handleDeleteConfirm called');
    console.log('User:', user);
    console.log('Transaction to delete:', transactionToDelete);

    if (!user) {
      console.error('No user authenticated');
      setError('Error: Usuario no autenticado');
      return;
    }

    if (!transactionToDelete) {
      console.error('No transaction selected for deletion');
      setError('Error: No se ha seleccionado ninguna transacción para eliminar');
      return;
    }

    if (!transactionToDelete.id) {
      console.error('Transaction has no ID:', transactionToDelete);
      setError('Error: La transacción no tiene un ID válido');
      return;
    }

    if (!transactionToDelete.type || (transactionToDelete.type !== 'income' && transactionToDelete.type !== 'expense' && transactionToDelete.type !== 'compra')) {
      console.error('Invalid transaction type:', transactionToDelete.type);
      setError('Error: Tipo de transacción no válido');
      return;
    }    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to delete transaction:', {
        userId: user.uid,
        transactionId: transactionToDelete.id,
        type: transactionToDelete.type,
        amount: transactionToDelete.amount,
        description: transactionToDelete.description
      });
      
      await deleteTransaction(user.uid, transactionToDelete.id, transactionToDelete.type);
      
      console.log('Transaction deleted successfully');
      
      // Los listeners de Firestore actualizarán automáticamente los datos
      // No necesitamos llamar refreshData() manualmente
      
      // Mostrar mensaje de éxito
      const tipoTexto = transactionToDelete.type === 'income' ? 'Ingreso' : 
                        transactionToDelete.type === 'compra' ? 'Compra' : 'Gasto';
      setSuccess(`${tipoTexto} eliminado correctamente`);
      
      // Limpiar estados
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      setSelectedTransaction(null);
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError((error as Error).message || 'Error al eliminar la transacción');
      // No cerrar el diálogo en caso de error para que el usuario pueda intentar de nuevo
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
    setSelectedTransaction(null);
    setError(null);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setTransactionToEdit(null);
    setSelectedTransaction(null);
    setError(null);
  };

  const handleTestFirestore = async () => {
    if (!user) {
      console.error('No user authenticated');
      setError('Usuario no autenticado');
      return;
    }

    try {
      console.log('Testing Firestore connection...');
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase/config');
      
      // Probar lectura de gastos
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      console.log('Expenses found:', expensesSnapshot.size);
      
      // Probar lectura de ingresos
      const incomeRef = collection(db, 'users', user.uid, 'income');
      const incomeSnapshot = await getDocs(incomeRef);
      console.log('Income found:', incomeSnapshot.size);
      
      setSuccess(`Firestore conectado: ${expensesSnapshot.size} gastos, ${incomeSnapshot.size} ingresos`);
    } catch (error) {
      console.error('Firestore test error:', error);
      setError('Error de conexión con Firestore: ' + (error as Error).message);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Paper sx={{ 
      p: 3,
      width: '100%',
      mx: { xs: 'auto', md: 0 },
      maxWidth: { xs: 'calc(100vw - 32px)', md: 'none' }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography variant="h6" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Transacciones del Mes Actual
        </Typography>
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleTestFirestore}
              disabled={loading}
            >
              Test DB
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Debug: Mostrar información de las transacciones */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', fontSize: '0.8rem' }}>
          <Typography variant="caption">
            Debug: {currentMonthTransactions.length} transacciones del mes actual
          </Typography>
          <br />
          <Typography variant="caption">
            Usuario: {user?.email || 'No autenticado'}
          </Typography>
        </Box>
      )}
      
  {/* Contenedor scrollable que muestra aprox. 4 filas por defecto */}
  <Box sx={{ width: '100%', maxHeight: 320, overflowY: 'auto', pr: 1 }}>
  <List sx={{ width: '100%' }}>
        {currentMonthTransactions.map((transaction: any, index: number) => {
          // Validar datos de la transacción antes de renderizar
          const isValidTransaction = transaction && transaction.id && transaction.type && typeof transaction.amount === 'number';
          
          if (!isValidTransaction) {
            console.warn('Invalid transaction data:', transaction);
            return null;
          }
          
          return (
            <Box key={`${transaction.type}-${transaction.id}-${index}`}>
              <ListItem sx={{ 
                px: 0,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1, sm: 0 }
              }}>
                <ListItemText
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'auto' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Typography variant="body1" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        {transaction.description || transaction.category || 'Sin descripción'}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        justifyContent: { xs: 'center', sm: 'flex-end' },
                        flexWrap: 'wrap'
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: transaction.type === 'income' ? 'success.main' : 'error.main'
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={transaction.type === 'income' ? 'Ingreso' : 
                                 transaction.type === 'compra' ? 'Compra' : 'Gasto'}
                          size="small"
                          color={transaction.type === 'income' ? 'success' : 'error'}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            console.log('Menu button clicked for transaction:', transaction);
                            handleMenuClick(e, transaction);
                          }}
                          disabled={loading}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'action.hover' 
                            }
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        textAlign: { xs: 'center', sm: 'left' },
                        display: 'block',
                        mt: { xs: 1, sm: 0.5 }
                      }}
                    >
                      {formatDate(transaction.date)}
                    </Typography>
                  }
                />
              </ListItem>
              {index < currentMonthTransactions.length - 1 && <Divider />}
            </Box>
          );
        })}
      </List>
  </Box>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          console.log('Menu closing');
          handleMenuClose();
        }}
      >
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Edit MenuItem clicked');
            handleEdit();
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Delete MenuItem clicked');
            handleDeleteClick();
            handleMenuClose();
          }} 
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Confirmar Eliminación"
        message={selectedTransaction ? 
          `¿Estás seguro de que quieres eliminar ${selectedTransaction.type === 'income' ? 'este ingreso' : 'este gasto'}? Esta acción no se puede deshacer.

Descripción: ${selectedTransaction.description || selectedTransaction.category || 'Sin descripción'}
Monto: $${(selectedTransaction.amount || 0).toLocaleString()}` 
          : 'Error: No se pudo cargar la información de la transacción'
        }
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText={loading ? "Eliminando..." : "Eliminar"}
        confirmColor="error"
        loading={loading}
      />

      {/* Diálogo de edición */}
      <EditTransactionDialog
        open={editDialogOpen}
        transaction={transactionToEdit}
        onClose={handleEditClose}
      />

      {/* Notificaciones */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
