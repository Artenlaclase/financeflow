"use client";

import { useState } from 'react';
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
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../../contexts/FinanceContext';

interface ExpenseFormProps {
  open: boolean;
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

export default function ExpenseForm({ open, onClose }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [installments, setInstallments] = useState('');
  const [merchant, setMerchant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { refreshData } = useFinance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('Debes estar autenticado');
      setLoading(false);
      return;
    }

    if (!amount || !category) {
      setError('Por favor completa todos los campos requeridos');
      setLoading(false);
      return;
    }

    if (!paymentMethod) {
      setError('Selecciona un método de pago');
      setLoading(false);
      return;
    }

    if (paymentMethod === 'credito') {
      const cuotasNum = parseInt(installments || '0', 10);
      if (!cuotasNum || cuotasNum < 1) {
        setError('Ingresa el número de cuotas (mínimo 1)');
        setLoading(false);
        return;
      }
    }

    try {
      // Convertir YYYY-MM-DD a Date local al mediodía para evitar desfase
      const [y, m, d] = date.split('-').map(n => parseInt(n, 10));
      const localNoon = new Date(y, (m - 1), d, 12, 0, 0, 0);

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'expense',
        amount: parseFloat(amount),
        category,
        description,
  ...(merchant && { merchant }),
        date: Timestamp.fromDate(localNoon),
        createdAt: Timestamp.now(),
        paymentMethod,
        ...(paymentMethod === 'credito' && { installments: parseInt(installments, 10) })
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
  setPaymentMethod('');
  setInstallments('');
  setMerchant('');
      
      // Refresh data and close modal
      refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  setPaymentMethod('');
  setInstallments('');
  setMerchant('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Gasto</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            label="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Categoría"
            >
              {expenseCategories.map((cat) => (
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
            margin="normal"
            multiline
            rows={2}
          />

          <TextField
            label="Nombre del local/establecimiento (opcional)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            fullWidth
            margin="normal"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Método de pago</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Método de pago"
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="debito">Débito</MenuItem>
              <MenuItem value="credito">Crédito</MenuItem>
            </Select>
          </FormControl>

          {paymentMethod === 'credito' && (
            <TextField
              label="Número de cuotas"
              type="number"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 1, step: 1 }}
            />
          )}

          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
