"use client";

import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Alert,
  Box 
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface CompraSimpleFormProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompraSimpleForm({ open, onClose, onComplete }: CompraSimpleFormProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando guardado simple...');
    console.log('👤 Usuario:', user ? user.uid : 'No autenticado');
    console.log('📋 Datos:', { descripcion, monto });
    
    if (!descripcion || !monto) {
      const errorMsg = 'Por favor completa todos los campos';
      console.log('❌ Validación fallida:', errorMsg);
      setError(errorMsg);
      return;
    }

    if (!user) {
      const errorMsg = 'Usuario no autenticado';
      console.log('❌ Sin usuario:', errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📤 Preparando datos para Firebase...');
      
      const compraData = {
        type: 'expense',
        category: 'Supermercado',
        amount: parseFloat(monto),
        description: descripcion,
        date: Timestamp.now(),
        userId: user.uid,
        createdAt: Timestamp.now()
      };

      console.log('🔥 Datos a enviar:', compraData);
      console.log('🔥 Firebase db:', db);
      
      console.log('📡 Enviando a Firestore...');
      const docRef = await addDoc(collection(db, 'transactions'), compraData);
      
      console.log('✅ ¡Éxito! ID del documento:', docRef.id);
      setSuccess(`¡Compra guardada exitosamente! ID: ${docRef.id}`);
      
      // Limpiar formulario
      setDescripcion('');
      setMonto('');
      
      // Notificar al componente padre
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Código:', error?.code);
      console.error('❌ Mensaje:', error?.message);
      console.error('❌ Stack:', error?.stack);
      
      setError(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setSuccess('');
      setDescripcion('');
      setMonto('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        🛒 Prueba de Guardado Simple
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success">
                {success}
              </Alert>
            )}

            <TextField
              label="Descripción de la compra"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              fullWidth
              placeholder="Ej: Compra en supermercado"
              required
            />

            <TextField
              label="Monto (CLP)"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              fullWidth
              placeholder="Ej: 15000"
              required
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Compra'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
