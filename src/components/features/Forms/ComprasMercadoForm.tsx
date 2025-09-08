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
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ProductoCompra {
  nombre: string;
  marca?: string;
  precio: number;
  cantidad: number;
  unidad?: 'unidad' | 'peso' | 'litro';
  precioKilo?: number;
  precioLitro?: number;
  pesoTotal?: number;
  litrosTotal?: number;
  total: number;
}

interface ComprasMercadoFormProps {
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
  { value: 'Foresta', label: 'Foresta 🛒' },
  { value: 'San Roberto', label: 'San Roberto 🛒' },
  { value: 'Central', label: 'Central 🛒' },
  { value: 'otro', label: 'Otro (personalizar)' }
];

const ubicaciones = [
  { value: 'La Florida', label: 'La Florida 📍' },
  { value: 'Puente Alto', label: 'Puente Alto 📍' },
  { value: 'Maipú', label: 'Maipú 📍' },
  { value: 'Las Condes', label: 'Las Condes 📍' },
  { value: 'Providencia', label: 'Providencia 📍' },
  { value: 'Estación Central', label: 'Estación Central 📍' },
  // VI Región - Comunas
  { value: 'Rancagua', label: 'Rancagua 📍' },
  { value: 'Machalí', label: 'Machalí 📍' },
  { value: 'Graneros', label: 'Graneros 📍' },
  { value: 'Codegua', label: 'Codegua 📍' },
  { value: 'Doñihue', label: 'Doñihue 📍' },
  { value: 'Coltauco', label: 'Coltauco 📍' },
  { value: 'Coinco', label: 'Coinco 📍' },
  { value: 'Rengo', label: 'Rengo 📍' },
  { value: 'Requínoa', label: 'Requínoa 📍' },
  { value: 'Olivar', label: 'Olivar 📍' },
  { value: 'Mostazal', label: 'Mostazal 📍' },
  { value: 'San Vicente', label: 'San Vicente 📍' },
  { value: 'Pichidegua', label: 'Pichidegua 📍' },
  { value: 'Peumo', label: 'Peumo 📍' },
  { value: 'Las Cabras', label: 'Las Cabras 📍' },
  { value: 'San Fernando', label: 'San Fernando 📍' },
  { value: 'Chimbarongo', label: 'Chimbarongo 📍' },
  { value: 'Placilla', label: 'Placilla 📍' },
  { value: 'Nancagua', label: 'Nancagua 📍' },
  { value: 'Chépica', label: 'Chépica 📍' },
  { value: 'Santa Cruz', label: 'Santa Cruz 📍' },
  { value: 'Lolol', label: 'Lolol 📍' },
  { value: 'Pumanque', label: 'Pumanque 📍' },
  { value: 'Palmilla', label: 'Palmilla 📍' },
  { value: 'Peralillo', label: 'Peralillo 📍' },
  { value: 'Litueche', label: 'Litueche 📍' },
  { value: 'Rapel', label: 'Rapel 📍' },
  { value: 'Navidad', label: 'Navidad 📍' },
  { value: 'Pichilemu', label: 'Pichilemu 📍' }
  ,{ value: 'Melipilla', label: 'Melipilla 📍' }
];

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo 💵' },
  { value: 'debito', label: 'Débito 💳' },
  { value: 'credito', label: 'Crédito 💳' }
];

export default function ComprasMercadoForm({ open, onClose, onComplete }: ComprasMercadoFormProps) {
  const { user } = useAuth();
  const [supermercado, setSupermercado] = useState('');
  const [supermercadoPersonalizado, setSupermercadoPersonalizado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [cuotas, setCuotas] = useState('');
  const [fecha, setFecha] = useState<string>('');
  const [productos, setProductos] = useState<ProductoCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para nuevo producto
  const [nombreProducto, setNombreProducto] = useState('');
  const [marcaProducto, setMarcaProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('');
  const [unidadProducto, setUnidadProducto] = useState<'unidad' | 'peso' | 'litro'>('unidad');
  const [precioKiloProducto, setPrecioKiloProducto] = useState('');
  const [precioLitroProducto, setPrecioLitroProducto] = useState('');

  const agregarProducto = () => {
    if (!nombreProducto || !cantidadProducto) {
      setError('Completa el nombre y cantidad del producto');
      return;
    }

    const cantidad = parseFloat(cantidadProducto);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser un número válido mayor a 0');
      return;
    }

    let precio = 0;
    let total = 0;

    if (unidadProducto === 'peso') {
      if (!precioKiloProducto) {
        setError('Ingresa el precio por kilo');
        return;
      }
      const precioKilo = parseFloat(precioKiloProducto);
      if (isNaN(precioKilo) || precioKilo <= 0) {
        setError('El precio por kilo debe ser un número válido mayor a 0');
        return;
      }
      precio = precioKilo;
      total = Math.round(precioKilo * cantidad); // cantidad = kg, redondeado
    } else if (unidadProducto === 'litro') {
      if (!precioLitroProducto) {
        setError('Ingresa el precio por litro');
        return;
      }
      const precioLitro = parseFloat(precioLitroProducto);
      if (isNaN(precioLitro) || precioLitro <= 0) {
        setError('El precio por litro debe ser un número válido mayor a 0');
        return;
      }
      precio = precioLitro;
      total = Math.round(precioLitro * cantidad); // cantidad = litros, redondeado
    } else {
      if (!precioProducto) {
        setError('Ingresa el precio del producto');
        return;
      }
      const precioUnidad = parseFloat(precioProducto);
      if (isNaN(precioUnidad) || precioUnidad <= 0) {
        setError('El precio debe ser un número válido mayor a 0');
        return;
      }
      precio = precioUnidad;
      total = Math.round(precioUnidad * cantidad); // cantidad = unidades, redondeado
    }

    const nuevoProducto: ProductoCompra = {
      nombre: nombreProducto,
      ...(marcaProducto && { marca: marcaProducto }),
      precio,
      cantidad,
      unidad: unidadProducto,
      ...(unidadProducto === 'peso' && precioKiloProducto && {
        precioKilo: parseFloat(precioKiloProducto),
        pesoTotal: cantidad
      }),
      ...(unidadProducto === 'litro' && precioLitroProducto && {
        precioLitro: parseFloat(precioLitroProducto),
        litrosTotal: cantidad
      }),
      total
    };

    setProductos([...productos, nuevoProducto]);
    
    // Limpiar campos
    setNombreProducto('');
    setMarcaProducto('');
    setPrecioProducto('');
    setCantidadProducto('');
    setUnidadProducto('unidad');
    setPrecioKiloProducto('');
    setPrecioLitroProducto('');
    setError('');
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return Math.round(productos.reduce((total, producto) => total + producto.total, 0));
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

    if (metodoPago === 'credito') {
      const n = parseInt(cuotas || '0', 10);
      if (!n || n < 1) {
        setError('Ingresa el número de cuotas (mínimo 1)');
        return;
      }
    }

    // Validar supermercado personalizado
    if (supermercado === 'otro' && !supermercadoPersonalizado.trim()) {
      setError('Ingresa el nombre del supermercado personalizado');
      return;
    }

    setLoading(true);
    setError('');

  try {
      const totalCompra = calcularTotal();
      
      // Validar que el total sea un número válido
      if (isNaN(totalCompra) || totalCompra <= 0) {
        setError('Error en el cálculo del total. Verifica los precios y cantidades');
        setLoading(false);
        return;
      }
      
      const supermercadoFinal = supermercado === 'otro' ? supermercadoPersonalizado.trim() : supermercado;

      // Limpiar productos de valores undefined
      const productosLimpios = productos.map(producto => {
        const productoLimpio: any = {
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: producto.cantidad,
          unidad: producto.unidad,
          total: producto.total
        };
        
        // Solo agregar campos si tienen valores válidos
        if (producto.marca) productoLimpio.marca = producto.marca;
        if (producto.precioKilo) productoLimpio.precioKilo = producto.precioKilo;
        if (producto.precioLitro) productoLimpio.precioLitro = producto.precioLitro;
        if (producto.pesoTotal) productoLimpio.pesoTotal = producto.pesoTotal;
        if (producto.litrosTotal) productoLimpio.litrosTotal = producto.litrosTotal;
        
        return productoLimpio;
      });

      // Determinar fecha seleccionada (YYYY-MM-DD) como mediodía local
      let fechaCompraDate: Date = new Date();
      if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split('-').map((n) => parseInt(n, 10));
        fechaCompraDate = new Date(y, m - 1, d, 12, 0, 0, 0);
      }

      const transactionData = {
        type: 'expense',
        category: 'Supermercado', // Corregido: debe ser 'Supermercado' para compras detalladas
        subcategory: 'Supermercado',
        amount: totalCompra,
        description: `Compra en ${supermercadoFinal} - ${ubicacion}`,
        userId: user?.uid,
        supermercado: supermercadoFinal,
        ubicacion,
        metodoPago,
        ...(metodoPago === 'credito' && { installments: parseInt(cuotas, 10) }),
        productos: productosLimpios,
        detalleCompra: {
          productos: productosLimpios,
          supermercado: supermercadoFinal,
          ubicacion,
          metodoPago,
          ...(metodoPago === 'credito' && { installments: parseInt(cuotas, 10) }),
          total: totalCompra
        }, // Estructura compatible con historial
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(fechaCompraDate)
      };

      console.log('💾 Guardando transacción...', {
        totalCompra,
        supermercadoFinal,
        productosCount: productos.length,
        userId: user?.uid
      });
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      console.log('✅ Transacción guardada con ID:', docRef.id);

      // Guardar productos individuales en el historial de precios
      console.log('💾 Guardando productos en historial de precios...', {
        cantidadProductos: productos.length,
        productos: productos.map(p => ({ nombre: p.nombre, unidad: p.unidad, total: p.total }))
      });
      const productosHistorial = productos.map(producto => ({
        transactionId: docRef.id,
        userId: user?.uid,
        nombre: producto.nombre || '',
        marca: producto.marca || '',
        supermercado: supermercadoFinal,
        ubicacion: ubicacion || '',
        fecha: Timestamp.fromDate(fechaCompraDate),
        porPeso: producto.unidad === 'peso',
        porLitro: producto.unidad === 'litro',
        precio: Number(producto.precio) || 0,
        cantidad: Number(producto.cantidad) || 0,
        precioKilo: producto.precioKilo ? Number(producto.precioKilo) : null,
        peso: producto.pesoTotal ? Number(producto.pesoTotal) : null,
        precioLitro: producto.precioLitro ? Number(producto.precioLitro) : null,
        litros: producto.litrosTotal ? Number(producto.litrosTotal) : null,
        total: Math.round(Number(producto.total) || 0),
        metodoPago: metodoPago || '',
        createdAt: Timestamp.now()
      }));

      // Guardar todos los productos en paralelo
      const guardarPromises = productosHistorial.map((producto, index) => {
        console.log(`📦 Producto ${index + 1}:`, producto);
        return addDoc(collection(db, 'productos-historial'), producto);
      });
      
      const resultados = await Promise.all(guardarPromises);
      console.log('✅ Productos guardados en historial de precios:', {
        cantidad: productosHistorial.length,
        ids: resultados.map(r => r.id),
        timestamp: new Date().toISOString()
      });

      // Resetear formulario
      setSupermercado('');
      setSupermercadoPersonalizado('');
      setUbicacion('');
      setMetodoPago('');
  setProductos([]);
      setNombreProducto('');
      setMarcaProducto('');
      setPrecioProducto('');
      setCantidadProducto('');
      setUnidadProducto('unidad');
      setPrecioKiloProducto('');
      setPrecioLitroProducto('');
      setError('');
  setCuotas('');

      onComplete();
      console.log('🎉 Proceso completado - onComplete() llamado');
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      
      // Mostrar mensaje de error más específico
      if (error instanceof Error) {
        setError(`Error al guardar la compra: ${error.message}`);
      } else {
        setError('Error desconocido al guardar la compra. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      keepMounted={false}
      disableRestoreFocus
    >
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

          {/* Datos de la compra */}
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
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

            {metodoPago === 'credito' && (
              <TextField
                fullWidth
                label="Número de cuotas"
                type="number"
                value={cuotas}
                onChange={(e) => setCuotas(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
                required
              />
            )}
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
              
              <FormControl fullWidth>
                <InputLabel>Unidad</InputLabel>
                <Select
                  value={unidadProducto}
                  onChange={(e) => setUnidadProducto(e.target.value as 'unidad' | 'peso' | 'litro')}
                  label="Unidad"
                >
                  <MenuItem value="unidad">Por unidad 📦</MenuItem>
                  <MenuItem value="peso">Por peso (kg) ⚖️</MenuItem>
                  <MenuItem value="litro">Por litro (L) 🥤</MenuItem>
                </Select>
              </FormControl>

              {/* Campos dinámicos según la unidad */}
              {unidadProducto === 'unidad' && (
                <>
                  <TextField
                    label="Precio por unidad"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Cantidad (unidades)"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(e.target.value)}
                    fullWidth
                  />
                </>
              )}

              {unidadProducto === 'peso' && (
                <>
                  <TextField
                    label="Precio por kilo ($)"
                    type="number"
                    value={precioKiloProducto}
                    onChange={(e) => setPrecioKiloProducto(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Peso total (kg)"
                    type="number"
                    inputProps={{ step: "0.1" }}
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(e.target.value)}
                    fullWidth
                  />
                </>
              )}

              {unidadProducto === 'litro' && (
                <>
                  <TextField
                    label="Precio por litro ($)"
                    type="number"
                    value={precioLitroProducto}
                    onChange={(e) => setPrecioLitroProducto(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Litros totales (L)"
                    type="number"
                    inputProps={{ step: "0.1" }}
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(e.target.value)}
                    fullWidth
                  />
                </>
              )}

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
                      {producto.unidad === 'peso' 
                        ? `$${producto.precioKilo}/kg × ${producto.pesoTotal}kg = $${producto.total}`
                        : producto.unidad === 'litro' 
                        ? `$${producto.precioLitro}/L × ${producto.litrosTotal}L = $${producto.total}`
                        : `$${producto.precio} × ${producto.cantidad} unid = $${producto.total}`}
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
