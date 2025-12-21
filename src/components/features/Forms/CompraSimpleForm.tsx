"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Alert,
  Box,
  Autocomplete
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase/config';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

interface CompraSimpleFormProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompraSimpleForm({ open, onClose, onComplete }: CompraSimpleFormProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [cuotas, setCuotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localNombre, setLocalNombre] = useState('');
  const [locales, setLocales] = useState<string[]>([]);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const { user } = useAuth();

  // Cargar locales cuando el diálogo se abre y el usuario está autenticado
  useEffect(() => {
    if (open && user) {
      loadLocales();
    }
  }, [open, user]);

  // Función para cargar locales únicos del usuario
  const loadLocales = async () => {
    if (!user) return;
    
    setLoadingLocales(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('merchant', '!=', null)
      );
      
      const querySnapshot = await getDocs(q);
      const localesSet = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.merchant && typeof data.merchant === 'string') {
          localesSet.add(data.merchant);
        }
      });
      
      // Convertir a array y ordenar alfabéticamente
      const localesArray = Array.from(localesSet).sort();
      setLocales(localesArray);
    } catch (err) {
      console.error('Error al cargar locales:', err);
    } finally {
      setLoadingLocales(false);
    }
  };

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

    if (!metodoPago) {
      const errorMsg = 'Selecciona un método de pago';
      setError(errorMsg);
      return;
    }

    if (metodoPago === 'credito') {
      const n = parseInt(cuotas || '0', 10);
      if (!n || n < 1) {
        setError('Ingresa el número de cuotas (mínimo 1)');
        return;
      }
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
        ...(localNombre && { merchant: localNombre }),
        date: Timestamp.now(),
        userId: user.uid,
        createdAt: Timestamp.now(),
        paymentMethod: metodoPago,
        ...(metodoPago === 'credito' && { installments: parseInt(cuotas, 10) })
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
  setMetodoPago('');
  setCuotas('');
  setLocalNombre('');
      
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
  setMetodoPago('');
  setCuotas('');
  setLocalNombre('');
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

            <Autocomplete
              freeSolo
              options={locales}
              value={localNombre}
              onChange={(event, newValue) => {
                setLocalNombre(newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                setLocalNombre(newInputValue);
              }}
              loading={loadingLocales}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nombre del local/establecimiento (opcional)"
                  placeholder="Ej: Panadería Don Luis"
                  helperText={locales.length > 0 ? 'Selecciona uno existente o escribe uno nuevo' : 'No hay locales previos'}
                />
              )}
              noOptionsText="Sin opciones"
              loadingText="Cargando locales..."
            />

            <TextField
              label="Método de pago (efectivo, debito, credito)"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              fullWidth
              placeholder="efectivo | debito | credito"
              required
            />

            {metodoPago === 'credito' && (
              <TextField
                label="Número de cuotas"
                type="number"
                value={cuotas}
                onChange={(e) => setCuotas(e.target.value)}
                fullWidth
                inputProps={{ min: 1, step: 1 }}
                required
              />
            )}
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
