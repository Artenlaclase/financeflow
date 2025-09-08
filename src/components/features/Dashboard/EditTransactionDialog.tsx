"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material';
import { Transaction, updateTransaction } from '../../../lib/firebaseUtils';
import { Timestamp } from 'firebase/firestore';
import { formatDateForInput, safeDate } from '../../../lib/dateUtils';
import { useAuth } from '../../../contexts/AuthContext';

interface EditTransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const expenseCategories = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Servicios',
  'Otro'
];

const incomeCategories = [
  'Salario',
  'Freelance',
  'Negocio',
  'Inversiones',
  'Bonos',
  'Otro'
];

export default function EditTransactionDialog({ 
  open, 
  transaction, 
  onClose 
}: EditTransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategory(transaction.category || '');
      setDescription(transaction.description || '');
      
      // Formatear fecha para input date
      let dateValue = '';
      if (transaction.date) {
        dateValue = formatDateForInput(transaction.date);
      }
      setDate(dateValue);
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user || !transaction) {
      setError('Error: Datos de usuario o transacción no válidos');
      setLoading(false);
      return;
    }

    if (!amount || !category) {
      setError('Por favor completa todos los campos requeridos');
      setLoading(false);
      return;
    }

    try {
      // Convertir YYYY-MM-DD a fecha local al mediodía para evitar desfases por zona horaria
      let finalDate: Date | null = null;
      if (date) {
        const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.test(date);
        if (ymdMatch) {
          const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
          finalDate = new Date(y, m - 1, d, 12, 0, 0, 0);
        } else {
          finalDate = safeDate(date);
        }
      }

      await updateTransaction(user.uid, transaction.id, transaction.type, {
        amount: parseFloat(amount),
        category,
        description,
        date: finalDate ? Timestamp.fromDate(finalDate) : undefined
      });

      // Los listeners de Firestore actualizarán automáticamente los datos
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const categories = transaction?.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      keepMounted={false}
      disableRestoreFocus
    >
      <DialogTitle>
        Editar {transaction?.type === 'income' ? 'Ingreso' : 'Gasto'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Monto"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />

            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Categoría"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Fecha"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
