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
  Divider,
  Paper,
  IconButton,
  Grid,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Delete, ShoppingCart, Scale } from '@mui/icons-material';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../../contexts/FinanceContext';

interface ComprasMercadoFormProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ProductoCompra {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  porPeso: boolean;
  precioKilo?: number;
  peso?: number;
  total: number;
}

const comunasChile = [
  // Región Metropolitana
  'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 
  'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 
  'La Reina', 'Las Condes', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 
  'Melipilla', 'Ñuñoa', 'Padre Hurtado', 'Pedro Aguirre Cerda', 'Peñaflor', 
  'Peñalolén', 'Providencia', 'Puente Alto', 'Quilicura', 'Quinta Normal', 
  'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San Miguel', 
  'San Ramón', 'Santiago', 'Talagante', 'Vitacura',
  
  // VI Región - Libertador General Bernardo O'Higgins (alfabético)
  'Chépica', 'Chimbarongo', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue',
  'Graneros', 'La Estrella', 'Las Cabras', 'Litueche', 'Lolol', 'Machalí',
  'Malloa', 'Marchihue', 'Mostazal', 'Nancagua', 'Navidad', 'Olivar',
  'Palmilla', 'Paredones', 'Peralillo', 'Peumo', 'Pichidegua', 'Pichilemu',
  'Placilla', 'Pumanque', 'Quinta de Tilcoco', 'Rancagua', 'Rengo',
  'Requínoa', 'San Fernando', 'San Vicente', 'Santa Cruz'
].sort();

const supermercados = [
  'Jumbo', 'Lider', 'Santa Isabel', 'Tottus', 'Unimarc', 'Ekono',
  'Express de Lider', 'Acuenta', 'OK Market', 'Montserrat', 
  'La Foresta', 'San Roberto', 'Otro'
];

export default function ComprasMercadoForm({ open, onClose, onComplete }: ComprasMercadoFormProps) {
  const [supermercado, setSupermercado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [productos, setProductos] = useState<ProductoCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    cantidad: '',
    porPeso: false,
    precioKilo: '',
    peso: ''
  });

  const { user } = useAuth();
  const { refreshData } = useFinance();

  const calcularTotalProducto = () => {
    if (nuevoProducto.porPeso) {
      const precioKilo = parseFloat(nuevoProducto.precioKilo) || 0;
      const peso = parseFloat(nuevoProducto.peso) || 0;
      return precioKilo * peso;
    } else {
      const precio = parseFloat(nuevoProducto.precio) || 0;
      const cantidad = parseFloat(nuevoProducto.cantidad) || 0;
      return precio * cantidad;
    }
  };

  const agregarProducto = () => {
    if (!nuevoProducto.nombre) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (nuevoProducto.porPeso) {
      if (!nuevoProducto.precioKilo || !nuevoProducto.peso) {
        setError('Para productos por peso, ingresa el precio por kilo y el peso');
        return;
      }
    } else {
      if (!nuevoProducto.precio || !nuevoProducto.cantidad) {
        setError('Ingresa el precio y la cantidad del producto');
        return;
      }
    }

    const producto: ProductoCompra = {
      id: Date.now().toString(),
      nombre: nuevoProducto.nombre,
      precio: nuevoProducto.porPeso ? 0 : parseFloat(nuevoProducto.precio),
      cantidad: nuevoProducto.porPeso ? 0 : parseFloat(nuevoProducto.cantidad),
      porPeso: nuevoProducto.porPeso,
      precioKilo: nuevoProducto.porPeso ? parseFloat(nuevoProducto.precioKilo) : undefined,
      peso: nuevoProducto.porPeso ? parseFloat(nuevoProducto.peso) : undefined,
      total: calcularTotalProducto()
    };

    setProductos([...productos, producto]);
    setNuevoProducto({
      nombre: '',
      precio: '',
      cantidad: '',
      porPeso: false,
      precioKilo: '',
      peso: ''
    });
    setError('');
  };

  const eliminarProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const calcularTotalCompra = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supermercado || !ubicacion || productos.length === 0) {
      setError('Completa todos los campos requeridos y agrega al menos un producto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const compraData = {
        type: 'expense',
        category: 'Supermercado',
        amount: calcularTotalCompra(),
        description: `Compra en ${supermercado} - ${ubicacion}`,
        date: new Date(fecha),
        userId: user?.uid,
        detalleCompra: {
          supermercado,
          ubicacion,
          productos,
          totalProductos: productos.length,
          totalCompra: calcularTotalCompra()
        },
        createdAt: new Date()
      };

      await addDoc(collection(db, 'transactions'), compraData);
      refreshData();
      onComplete();
      
      // Reset form
      setSupermercado('');
      setUbicacion('');
      setFecha(new Date().toISOString().split('T')[0]);
      setProductos([]);
      setNuevoProducto({
        nombre: '',
        precio: '',
        cantidad: '',
        porPeso: false,
        precioKilo: '',
        peso: ''
      });

    } catch (error) {
      console.error('Error al guardar la compra:', error);
      setError('Error al guardar la compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart />
        Nueva Compra de Supermercado
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Información general de la compra */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información de la Compra
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Supermercado</InputLabel>
                  <Select
                    value={supermercado}
                    onChange={(e) => setSupermercado(e.target.value)}
                    label="Supermercado"
                  >
                    {supermercados.map((market) => (
                      <MenuItem key={market} value={market}>
                        {market}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    label="Comuna"
                  >
                    {comunasChile.map((comuna) => (
                      <MenuItem key={comuna} value={comuna}>
                        {comuna}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Agregar productos */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agregar Producto
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Nombre del producto"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={nuevoProducto.porPeso}
                      onChange={(e) => setNuevoProducto({ 
                        ...nuevoProducto, 
                        porPeso: e.target.checked,
                        precio: '',
                        cantidad: '',
                        precioKilo: '',
                        peso: ''
                      })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Scale fontSize="small" />
                      Por peso
                    </Box>
                  }
                />
              </Grid>

              {nuevoProducto.porPeso ? (
                <>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Precio por kg"
                      type="number"
                      value={nuevoProducto.precioKilo}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioKilo: e.target.value })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Peso (kg)"
                      type="number"
                      inputProps={{ step: 0.01 }}
                      value={nuevoProducto.peso}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, peso: e.target.value })}
                      InputProps={{ endAdornment: 'kg' }}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Precio unitario"
                      type="number"
                      value={nuevoProducto.precio}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Cantidad"
                      type="number"
                      value={nuevoProducto.cantidad}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Total"
                  value={`$${calcularTotalProducto().toLocaleString()}`}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>

              <Grid item xs={6} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={agregarProducto}
                  startIcon={<Add />}
                >
                  Agregar
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Lista de productos agregados */}
          {productos.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Productos agregados ({productos.length})
              </Typography>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {productos.map((producto) => (
                  <Box
                    key={producto.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
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
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {producto.porPeso ? (
                          <>
                            <Chip size="small" label={`${producto.peso}kg`} />
                            <Chip size="small" label={`$${producto.precioKilo}/kg`} />
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
                        color="error"
                        onClick={() => eliminarProducto(producto.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Total de la compra:
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${calcularTotalCompra().toLocaleString()}
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
