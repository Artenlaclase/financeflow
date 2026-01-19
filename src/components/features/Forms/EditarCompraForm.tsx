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
  Alert,
  Typography,
  Divider,
  Grid,
  IconButton,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Delete, Scale, LocalDrink } from '@mui/icons-material';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { CompraTransaction, ProductoCompra } from '../../../types/compras';

interface EditarCompraFormProps {
  open: boolean;
  compra: CompraTransaction | null;
  onClose: () => void;
  onSave: (compraEditada: CompraTransaction) => void;
}

export default function EditarCompraForm({ open, compra, onClose, onSave }: EditarCompraFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados del formulario
  const [supermercado, setSupermercado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [productos, setProductos] = useState<ProductoCompra[]>([]);

  // Opciones de supermercados
  const supermercados = [
    'Jumbo', 'Lider', 'Santa Isabel', 'Unimarc', 'Tottus', 'La Foresta',
    'San Roberto', 'Mayorista 10', 'Ekono', 'Acuenta', 'Express de Lider',
    'Central Mayorista', 'Montserrat', 'OK Market', 'Otro'
  ];

  // Opciones de métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo 💵' },
    { value: 'debito', label: 'Débito 💳' },
    { value: 'credito', label: 'Crédito 💳' },
    { value: 'transferencia', label: 'Transferencia 🏦' }
  ];

  // Llenar formulario cuando se abra con datos de la compra
  useEffect(() => {
    if (compra && open) {
      setSupermercado(compra.detalleCompra.supermercado);
      setUbicacion(compra.detalleCompra.ubicacion);
      setMetodoPago(compra.detalleCompra.metodoPago);
      setProductos(compra.detalleCompra.productos);
      
      // Convertir fecha
      const fechaCompra = compra.date.toDate ? compra.date.toDate() : new Date(compra.date);
      setFecha(fechaCompra.toISOString().split('T')[0]);
    }
  }, [compra, open]);

  const calcularTotalCompra = () => {
    return Math.round(productos.reduce((total, producto) => total + producto.total, 0));
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supermercado || !ubicacion || !metodoPago || productos.length === 0) {
      setError('Completa todos los campos requeridos');
      return;
    }

    if (!user || !compra) {
      setError('Error: No se puede procesar la edición');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('✏️ Iniciando edición de compra:', compra.id);
      
      const totalCalculado = calcularTotalCompra();
      
      // Datos actualizados de la compra
      const compraActualizada = {
        amount: totalCalculado,
        description: `Compra en ${supermercado} - ${ubicacion} (${metodosPago.find(m => m.value === metodoPago)?.label})`,
        date: Timestamp.fromDate(new Date(fecha)),
        detalleCompra: {
          supermercado,
          ubicacion,
          metodoPago,
          totalProductos: productos.length,
          totalCompra: totalCalculado,
          productos: productos.map(p => ({
            nombre: p.nombre || '',
            precio: Number(p.precio) || 0,
            cantidad: Number(p.cantidad) || 0,
            porPeso: Boolean(p.porPeso),
            porLitro: Boolean(p.porLitro),
            total: Number(p.total) || 0,
            ...(p.porPeso && p.precioKilo && { precioKilo: Number(p.precioKilo) }),
            ...(p.porPeso && p.peso && { peso: Number(p.peso) }),
            ...(p.porLitro && p.precioLitro && { precioLitro: Number(p.precioLitro) }),
            ...(p.porLitro && p.litros && { litros: Number(p.litros) })
          }))
        }
      };

      // 1. Actualizar la transacción principal
      await updateDoc(doc(db, 'transactions', compra.id), compraActualizada);
      console.log('✅ Transacción principal actualizada');

      // 2. Borrar todos los productos del historial anteriores
      const productosQuery = query(
        collection(db, 'productos-historial'),
        where('transactionId', '==', compra.id)
      );
      
      const productosSnapshot = await getDocs(productosQuery);
      const borrarPromises = productosSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'productos-historial', docSnapshot.id))
      );
      
      await Promise.all(borrarPromises);
      console.log('🗑️ Productos antiguos del historial borrados');

      // 3. Crear nuevos productos en el historial
      const fechaCompra = Timestamp.fromDate(new Date(fecha));
      const nuevosProductos = productos.map(producto => ({
        transactionId: compra.id,
        userId: user?.uid,
        nombre: producto.nombre || '',
        supermercado: supermercado || '',
        ubicacion: ubicacion || '',
        fecha: fechaCompra,
        porPeso: Boolean(producto.porPeso),
        porLitro: Boolean(producto.porLitro),
        precio: Number(producto.precio) || 0,
        cantidad: Number(producto.cantidad) || 0,
        precioKilo: producto.precioKilo ? Number(producto.precioKilo) : null,
        peso: producto.peso ? Number(producto.peso) : null,
        precioLitro: producto.precioLitro ? Number(producto.precioLitro) : null,
        litros: producto.litros ? Number(producto.litros) : null,
        total: Number(producto.total) || 0,
        metodoPago: metodoPago || '',
        createdAt: Timestamp.now()
      }));

      // Guardar nuevos productos
      const guardarPromises = nuevosProductos.map(producto => 
        addDoc(collection(db, 'productos-historial'), producto)
      );
      
      await Promise.all(guardarPromises);
      console.log('✅ Nuevos productos guardados en historial');

      console.log('🎉 Edición completada exitosamente');
      
      onSave({
        ...compra,
        ...compraActualizada
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Error al editar compra:', error);
      setError('Error al guardar los cambios. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!compra) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted={false}
      disableRestoreFocus
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        ✏️ Editar Compra de Supermercado
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Datos básicos */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Supermercado</InputLabel>
                <Select
                  value={supermercado}
                  label="Supermercado"
                  onChange={(e) => setSupermercado(e.target.value)}
                >
                  {supermercados.map((super_mercado) => (
                    <MenuItem key={super_mercado} value={super_mercado}>
                      {super_mercado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Ubicación (Comuna)"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Las Condes, Providencia, etc."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha de compra"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de Pago"
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  {metodosPago.map((metodo) => (
                    <MenuItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Lista de productos */}
          <Typography variant="h6" gutterBottom>
            Productos ({productos.length})
          </Typography>
          
          {productos.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No hay productos. La compra debe tener al menos un producto.
            </Alert>
          ) : (
            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
              {productos.map((producto, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {producto.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {producto.porPeso ? (
                        <>
                          <Chip size="small" label={`${producto.peso}kg`} />
                          <Chip size="small" label={`$${producto.precioKilo}/kg`} />
                        </>
                      ) : producto.porLitro ? (
                        <>
                          <Chip size="small" label={`${producto.litros}L`} />
                          <Chip size="small" label={`$${producto.precioLitro}/L`} />
                        </>
                      ) : (
                        <>
                          <Chip size="small" label={`Cant: ${producto.cantidad}`} />
                          <Chip size="small" label={`$${producto.precio} c/u`} />
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" color="primary">
                      ${producto.total.toLocaleString()}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarProducto(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Total */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1,
            mb: 2
          }}>
            <Typography variant="h6">
              Total de la Compra:
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              ${calcularTotalCompra().toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || productos.length === 0}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
