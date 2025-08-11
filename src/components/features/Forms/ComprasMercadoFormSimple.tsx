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
  Alert,
  Typography,
  Paper,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

interface ProductoCompra {
  nombre: string;
  marca?: string;
  precio: number;
  cantidad: number;
  total: number;
}

interface ComprasMercadoFormSimpleProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const supermercados = [
  { value: 'Jumbo', label: 'Jumbo 🛒' },
  { value: 'Lider', label: 'Líder 🛒' },
  { value: 'Unimarc', label: 'Unimarc 🛒' },
  { value: 'Santa Isabel', label: 'Santa Isabel 🛒' },
  { value: 'Tottus', label: 'Tottus 🛒' },
  { value: 'otro', label: 'Otro (personalizar)' }
];

const ubicaciones = [
  { value: 'La Florida', label: 'La Florida 📍' },
  { value: 'Puente Alto', label: 'Puente Alto 📍' },
  { value: 'Maipú', label: 'Maipú 📍' },
  { value: 'Las Condes', label: 'Las Condes 📍' },
  { value: 'Providencia', label: 'Providencia 📍' },
  { value: 'Estación Central', label: 'Estación Central 📍' }
];

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo 💵' },
  { value: 'debito', label: 'Débito 💳' },
  { value: 'credito', label: 'Crédito 💳' }
];

export default function ComprasMercadoFormSimple({ open, onClose, onComplete }: ComprasMercadoFormSimpleProps) {
  const { user } = useAuth();
  const [supermercado, setSupermercado] = useState('');
  const [supermercadoPersonalizado, setSupermercadoPersonalizado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [productos, setProductos] = useState<ProductoCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para nuevo producto
  const [nombreProducto, setNombreProducto] = useState('');
  const [marcaProducto, setMarcaProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('');

  const agregarProducto = () => {
    if (!nombreProducto || !precioProducto || !cantidadProducto) {
      setError('Completa todos los campos del producto');
      return;
    }

    const precio = parseFloat(precioProducto);
    const cantidad = parseInt(cantidadProducto);
    const total = precio * cantidad;

    const nuevoProducto: ProductoCompra = {
      nombre: nombreProducto,
      marca: marcaProducto || undefined,
      precio,
      cantidad,
      total
    };

    setProductos([...productos, nuevoProducto]);
    
    // Limpiar campos
    setNombreProducto('');
    setMarcaProducto('');
    setPrecioProducto('');
    setCantidadProducto('');
    setError('');
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 FORM SUBMIT INICIADO');

    // Validación
    if (productos.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }

    if (!supermercado || !ubicacion || !metodoPago) {
      setError('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const totalCompra = calcularTotal();
      const supermercadoFinal = supermercado === 'otro' ? supermercadoPersonalizado : supermercado;

      const transactionData = {
        type: 'expense',
        category: 'Compras',
        subcategory: 'Supermercado',
        amount: totalCompra,
        description: `Compra en ${supermercadoFinal} - ${ubicacion}`,
        userId: user?.uid,
        supermercado: supermercadoFinal,
        ubicacion,
        metodoPago,
        productos,
        createdAt: Timestamp.now(),
        date: Timestamp.now()
      };

      console.log('💾 Guardando transacción...');
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      console.log('✅ Transacción guardada con ID:', docRef.id);

      // Resetear formulario
      setSupermercado('');
      setSupermercadoPersonalizado('');
      setUbicacion('');
      setMetodoPago('');
      setProductos([]);
      setError('');

      onComplete();
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      setError('Error al guardar la compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart />
        Nueva Compra de Supermercado (Versión Simple)
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Datos de la compra */}
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Supermercado</InputLabel>
              <Select
                value={supermercado}
                onChange={(e) => setSupermercado(e.target.value)}
                label="Supermercado"
              >
                {supermercados.map((super_) => (
                  <MenuItem key={super_.value} value={super_.value}>
                    {super_.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {supermercado === 'otro' && (
              <TextField
                fullWidth
                label="Nombre del supermercado"
                value={supermercadoPersonalizado}
                onChange={(e) => setSupermercadoPersonalizado(e.target.value)}
                required
              />
            )}

            <FormControl fullWidth required>
              <InputLabel>Ubicación</InputLabel>
              <Select
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                label="Ubicación"
              >
                {ubicaciones.map((ubic) => (
                  <MenuItem key={ubic.value} value={ubic.value}>
                    {ubic.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Método de pago</InputLabel>
              <Select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                label="Método de pago"
              >
                {metodosPago.map((metodo) => (
                  <MenuItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Agregar producto */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Agregar Producto
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <TextField
                label="Nombre del producto"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
                fullWidth
              />
              <TextField
                label="Marca (opcional)"
                value={marcaProducto}
                onChange={(e) => setMarcaProducto(e.target.value)}
                fullWidth
              />
              <TextField
                label="Precio"
                type="number"
                value={precioProducto}
                onChange={(e) => setPrecioProducto(e.target.value)}
                fullWidth
              />
              <TextField
                label="Cantidad"
                type="number"
                value={cantidadProducto}
                onChange={(e) => setCantidadProducto(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={agregarProducto} sx={{ alignSelf: 'end' }}>
                Agregar
              </Button>
            </Box>
          </Paper>

          {/* Lista de productos */}
          {productos.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Productos ({productos.length})
              </Typography>
              {productos.map((producto, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                  <Box>
                    <Typography variant="body1">
                      {producto.nombre} {producto.marca && `(${producto.marca})`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${producto.precio} × {producto.cantidad} = ${producto.total}
                    </Typography>
                  </Box>
                  <Button onClick={() => eliminarProducto(index)} color="error">
                    Eliminar
                  </Button>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '2px solid #ddd' }}>
                <Typography variant="h6">
                  Total de la compra:
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${calcularTotal().toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || productos.length === 0}
            startIcon={<ShoppingCart />}
          >
            {loading ? 'Guardando...' : 'Guardar Compra'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
