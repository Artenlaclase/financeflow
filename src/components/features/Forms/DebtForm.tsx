"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../../contexts/FinanceContext';

interface DebtFormProps {
  open: boolean;
  onClose: () => void;
}

export default function DebtForm({ open, onClose }: DebtFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
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

    if (!amount || !description || !dueDate) {
      setError('Por favor completa todos los campos requeridos');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'debts'), {
        amount: parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
        paid: false,
        createdAt: new Date()
      });

      // Reset form
      setAmount('');
      setDescription('');
      setDueDate('');
      
      // Refresh data and close modal
      refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la deuda');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setDueDate('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Deuda</DialogTitle>
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

          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            margin="normal"
            multiline
            rows={2}
            placeholder="Ej: Tarjeta de crédito, préstamo personal, etc."
          />

          <TextField
            label="Fecha de vencimiento"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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
