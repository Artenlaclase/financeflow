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
  Snackbar
} from '@mui/material';
import { MoreVert, Edit, Delete } from '@mui/icons-material';
import { useFinance } from '../../../contexts/FinanceContext';
import { useAuth } from '../../../contexts/AuthContext';
import { deleteTransaction, Transaction } from '../../../lib/firebaseUtils';
import ConfirmationDialog from '../../shared/ConfirmationDialog';
import EditTransactionDialog from './EditTransactionDialog';

export default function RecentTransactions() {
  const { recentTransactions, refreshData } = useFinance();
  const { user } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!recentTransactions || recentTransactions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transacciones Recientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay transacciones recientes
        </Typography>
      </Paper>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, transaction: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!user || !selectedTransaction) {
      setError('Error: Usuario o transacción no válida');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to delete transaction:', {
        userId: user.uid,
        transactionId: selectedTransaction.id,
        type: selectedTransaction.type
      });
      
      await deleteTransaction(user.uid, selectedTransaction.id, selectedTransaction.type);
      
      // Actualizar datos
      refreshData();
      
      // Mostrar mensaje de éxito
      setSuccess(`${selectedTransaction.type === 'income' ? 'Ingreso' : 'Gasto'} eliminado correctamente`);
      
      // Limpiar estados
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError((error as Error).message || 'Error al eliminar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
    setError(null);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedTransaction(null);
    setError(null);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Transacciones Recientes
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {recentTransactions.map((transaction: any, index: number) => (
          <Box key={`${transaction.type}-${transaction.id}-${index}`}>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {transaction.description || transaction.category || 'Sin descripción'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        label={transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        size="small"
                        color={transaction.type === 'income' ? 'success' : 'error'}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, transaction)}
                        disabled={loading}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(transaction.date)}
                  </Typography>
                }
              />
            </ListItem>
            {index < recentTransactions.length - 1 && <Divider />}
          </Box>
        ))}
      </List>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
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
        transaction={selectedTransaction}
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
