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
import { Add, Delete, ShoppingCart, Scale, LocalDrink } from '@mui/icons-material';
import { addDoc, collection, Timestamp, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { guardarTransaccionSimple } from '../../../lib/firebaseSimple';
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
  marca?: string;
  precio: number;
  cantidad: number;
  porPeso: boolean;
  porLitro: boolean;
  precioKilo?: number;
  precioLitro?: number;
  peso?: number;
  litros?: number;
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

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo 💵', icon: '💵' },
  { value: 'debito', label: 'Débito 💳', icon: '💳' },
  { value: 'credito', label: 'Crédito 💳', icon: '💳' }
];

export default function ComprasMercadoForm({ open, onClose, onComplete }: ComprasMercadoFormProps) {
  const [supermercado, setSupermercado] = useState('');
  const [supermercadoPersonalizado, setSupermercadoPersonalizado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('');
  const [productos, setProductos] = useState<ProductoCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    marca: '',
    precio: '',
    cantidad: '',
    porPeso: false,
    porLitro: false,
    precioKilo: '',
    precioLitro: '',
    peso: '',
    litros: ''
  });

  const { user } = useAuth();
  const { refreshData } = useFinance();

  // Función auxiliar para manejar el guardado con reintentos
  const guardarConReintentos = async (data: any, maxIntentos = 3) => {
    let ultimoError;
    
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        console.log(`🔄 Intento ${intento}/${maxIntentos} de guardado...`);
        
        // Forzar reconexión de red antes de cada intento
        if (intento > 1) {
          console.log('🔌 Reiniciando conexión Firestore...');
          await disableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await enableNetwork(db);
        }
        
        // Intentar guardar con timeout más corto
        const savePromise = addDoc(collection(db, 'transactions'), data);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout en intento ${intento}`)), 8000)
        );
        
        const resultado = await Promise.race([savePromise, timeoutPromise]);
        console.log(`✅ Guardado exitoso en intento ${intento}`);
        return resultado;
        
      } catch (error: any) {
        console.error(`❌ Error en intento ${intento}:`, error.message);
        ultimoError = error;
        
        if (intento < maxIntentos) {
          console.log(`⏳ Esperando antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * intento));
        }
      }
    }
    
    throw ultimoError;
  };

  const calcularTotalProducto = () => {
    if (nuevoProducto.porPeso) {
      const precioKilo = parseFloat(nuevoProducto.precioKilo) || 0;
      const peso = parseFloat(nuevoProducto.peso) || 0;
      const total = precioKilo * peso;
      return Math.round(total); // Redondear al peso más cercano
    } else if (nuevoProducto.porLitro) {
      const precioLitro = parseFloat(nuevoProducto.precioLitro) || 0;
      const litros = parseFloat(nuevoProducto.litros) || 0;
      const total = precioLitro * litros;
      return Math.round(total); // Redondear al peso más cercano
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
    } else if (nuevoProducto.porLitro) {
      if (!nuevoProducto.precioLitro || !nuevoProducto.litros) {
        setError('Para productos por litro, ingresa el precio por litro y los litros');
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
      marca: nuevoProducto.marca || undefined,
      precio: nuevoProducto.porPeso ? parseFloat(nuevoProducto.precioKilo) : 
              nuevoProducto.porLitro ? parseFloat(nuevoProducto.precioLitro) : 
              parseFloat(nuevoProducto.precio),
      cantidad: nuevoProducto.porPeso ? parseFloat(nuevoProducto.peso) : 
                nuevoProducto.porLitro ? parseFloat(nuevoProducto.litros) : 
                parseFloat(nuevoProducto.cantidad),
      porPeso: nuevoProducto.porPeso,
      porLitro: nuevoProducto.porLitro,
      precioKilo: nuevoProducto.porPeso ? parseFloat(nuevoProducto.precioKilo) : undefined,
      precioLitro: nuevoProducto.porLitro ? parseFloat(nuevoProducto.precioLitro) : undefined,
      peso: nuevoProducto.porPeso ? parseFloat(nuevoProducto.peso) : undefined,
      litros: nuevoProducto.porLitro ? parseFloat(nuevoProducto.litros) : undefined,
      total: calcularTotalProducto()
    };

    console.log('🔍 DEBUG: Producto creado:', {
      tipo: nuevoProducto.porPeso ? 'Por peso' : nuevoProducto.porLitro ? 'Por litro' : 'Por unidad',
      porPeso: producto.porPeso,
      porLitro: producto.porLitro,
      precio: producto.precio,
      cantidad: producto.cantidad,
      precioLitro: producto.precioLitro,
      litros: producto.litros,
      total: producto.total
    });

    setProductos([...productos, producto]);
    limpiarFormularioProducto();
  };

  const eliminarProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const calcularTotalCompra = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
  };

  const limpiarFormularioProducto = () => {
    setNuevoProducto({
      nombre: '',
      marca: '',
      precio: '',
      cantidad: '',
      porPeso: false,
      porLitro: false,
      precioKilo: '',
      precioLitro: '',
      peso: '',
      litros: ''
    });
    setError('');
  };

  const tieneProductoPendiente = () => {
    return nuevoProducto.nombre.trim() !== '' || 
           nuevoProducto.marca.trim() !== '' ||
           nuevoProducto.precio.trim() !== '' ||
           nuevoProducto.cantidad.trim() !== '' ||
           nuevoProducto.precioKilo.trim() !== '' ||
           nuevoProducto.peso.trim() !== '' ||
           nuevoProducto.precioLitro.trim() !== '' ||
           nuevoProducto.litros.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀🚀🚀 INICIO handleSubmit - FORMULARIO ENVIADO 🚀🚀🚀');
    console.log('📋 Datos del formulario:', { supermercado, ubicacion, metodoPago, productosCount: productos.length });
    console.log('👤 Usuario:', user ? { uid: user.uid, email: user.email } : 'No autenticado');
    console.log('🔥 Firebase db object:', db);
    
    // VERIFICAR SI HAY UN PRODUCTO PENDIENTE DE AGREGAR
    // Solo mostrar advertencia si hay campos llenos, pero permitir continuar
    if (tieneProductoPendiente()) {
      console.log('⚠️ Advertencia: Hay campos de producto sin agregar');
      setError('Advertencia: Tienes campos de producto sin agregar. ¿Quieres continuar sin agregarlos?');
      // No hacer return aquí - permitir que continúe el guardado
    }
    
    if (!supermercado || !ubicacion || !metodoPago || productos.length === 0) {
      const errorMsg = 'Completa todos los campos requeridos y agrega al menos un producto';
      console.log('❌ Validación fallida:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Validar supermercado personalizado si es necesario
    if (supermercado === 'Otro' && !supermercadoPersonalizado.trim()) {
      const errorMsg = 'Por favor ingresa el nombre del supermercado';
      console.log('❌ Validación fallida:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Filtrar productos válidos (no null, undefined o vacíos)
    const productosValidos = productos.filter(p => p && typeof p === 'object' && p.nombre);
    
    console.log('📊 Productos en array total:', productos.length);
    console.log('📊 Productos válidos (filtrados):', productosValidos.length);
    
    if (productosValidos.length === 0) {
      setError('No hay productos válidos para guardar');
      return;
    }
    
    // Actualizar el array de productos con solo los válidos
    if (productosValidos.length !== productos.length) {
      console.log('🧹 Limpiando productos inválidos del array');
      setProductos(productosValidos);
      // Re-ejecutar la validación con productos limpios
      setTimeout(() => handleSubmit(e), 100);
      return;
    }

    if (!user) {
      setError('Debes estar autenticado para guardar una compra');
      return;
    }

    // Validar que todos los productos tengan datos válidos
    console.log('🔍 Validando productos:', productosValidos);
    console.log('🔍 Cantidad de productos por tipo:', {
      porPeso: productosValidos.filter(p => p.porPeso).length,
      porLitro: productosValidos.filter(p => p.porLitro).length,
      porUnidad: productosValidos.filter(p => !p.porPeso && !p.porLitro).length
    });
    
    const productosInvalidos = productosValidos.filter(p => {
      const nombreVacio = !p.nombre.trim();
      const totalInvalido = isNaN(p.total) || p.total <= 0;
      
      // Para productos por peso, validar precioKilo y peso
      // Para productos por litro, validar precioLitro y litros
      // Para productos por unidad, validar precio y cantidad
      let precioInvalido = false;
      let cantidadInvalida = false;
      
      if (p.porPeso) {
        precioInvalido = !p.precioKilo || isNaN(p.precioKilo) || p.precioKilo <= 0;
        cantidadInvalida = !p.peso || isNaN(p.peso) || p.peso <= 0;
      } else if (p.porLitro) {
        precioInvalido = !p.precioLitro || isNaN(p.precioLitro) || p.precioLitro <= 0;
        cantidadInvalida = !p.litros || isNaN(p.litros) || p.litros <= 0;
      } else {
        precioInvalido = isNaN(p.precio) || p.precio <= 0;
        cantidadInvalida = isNaN(p.cantidad) || p.cantidad <= 0;
      }
      
      const esInvalido = nombreVacio || precioInvalido || cantidadInvalida || totalInvalido;
      
      if (esInvalido) {
        console.log('❌ Producto inválido encontrado:', {
          producto: p,
          nombreVacio,
          precioInvalido,
          cantidadInvalida,
          totalInvalido,
          esPorPeso: p.porPeso,
          esPorLitro: p.porLitro
        });
      }
      
      return esInvalido;
    });

    console.log('Total productos inválidos:', productosInvalidos.length);

    if (productosInvalidos.length > 0) {
      setError(`Hay ${productosInvalidos.length} producto(s) con datos inválidos. Revisa los precios y cantidades.`);
      return;
    }

    setLoading(true);
    setError('');

    console.log('✅ Validaciones pasadas. Iniciando guardado...');
    console.log('Usuario:', user.uid);
    console.log('Datos de compra:', { supermercado, ubicacion, metodoPago, productos: productosValidos.length });
    console.log('Total de la compra:', calcularTotalCompra());

    try {
      console.log('Iniciando guardado de compra...');
      console.log('Productos a guardar:', productosValidos);
      console.log('Usuario:', user?.uid);

      // Guardar la transacción principal con reintentos
      const totalCompraCalculado = productosValidos.reduce((total, producto) => total + producto.total, 0);
      const nombreSupermercado = supermercado === 'Otro' ? supermercadoPersonalizado : supermercado;
      
      // Datos ultra-simplificados para evitar cualquier problema
      const compraData = {
        type: 'expense',
        category: 'Supermercado',
        amount: totalCompraCalculado,
        description: `Compra ${nombreSupermercado} - ${ubicacion}`,
        date: Timestamp.fromDate(new Date(fecha)),
        userId: user?.uid,
        createdAt: Timestamp.now()
      };

      console.log('Guardando transacción principal...');
      console.log('Datos a enviar a Firestore:', compraData);
      
      try {
        const transactionRef = await guardarTransaccionSimple(compraData);
        console.log('✅ Transacción guardada exitosamente con ID:', (transactionRef as any)?.id);
      } catch (transactionError) {
        console.error('❌ Error al guardar con método simple:', transactionError);
        throw transactionError;
      }

      // Comentar temporalmente el guardado del historial para evitar problemas de índices
      // TODO: Habilitar cuando se resuelvan los problemas de índices en Firebase
      /*
      // Guardar cada producto en el historial de precios solo si hay productos
      if (productosValidos.length > 0) {
        console.log('Preparando productos para historial... Total productos:', productosValidos.length);
        const fechaCompra = Timestamp.fromDate(new Date(fecha));
        
        const productosHistorial = productosValidos.map((producto, index) => {
          const productoHistorial = {
            transactionId: transactionRef.id,
            userId: user?.uid,
            nombre: producto.nombre || '',
            marca: producto.marca || '',
            supermercado: nombreSupermercado || '',
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
          };
          console.log(`Producto ${index + 1} preparado:`, productoHistorial);
          return productoHistorial;
        });

        console.log('🔄 Iniciando guardado de productos en historial...');
        // Guardar productos uno por uno para mejor control de errores
        for (let i = 0; i < productosHistorial.length; i++) {
          try {
            console.log(`Guardando producto ${i + 1}/${productosHistorial.length}...`);
            await addDoc(collection(db, 'productos-historial'), productosHistorial[i]);
            console.log(`✅ Producto ${i + 1}/${productosHistorial.length} guardado exitosamente`);
          } catch (productoError) {
            console.error(`❌ Error guardando producto ${i + 1}:`, productoError);
            // Continúa con el siguiente producto en lugar de fallar toda la operación
          }
        }
        console.log('✅ Guardado de productos en historial completado');
      } else {
        console.log('⚠️ No hay productos para guardar en historial');
      }
      */

      console.log('🎉 Guardado completado exitosamente');
      refreshData();
      onComplete();
      
      // Reset form
      setSupermercado('');
      setSupermercadoPersonalizado('');
      setUbicacion('');
      setFecha(new Date().toISOString().split('T')[0]);
      setMetodoPago('');
      setProductos([]);
      setNuevoProducto({
        nombre: '',
        marca: '',
        precio: '',
        cantidad: '',
        porPeso: false,
        porLitro: false,
        precioKilo: '',
        precioLitro: '',
        peso: '',
        litros: ''
      });

    } catch (error: any) {
      console.error('❌ Error detallado al guardar la compra:', error);
      console.error('Tipo de error:', typeof error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Mostrar error específico al usuario
      if (error?.message?.includes('Timeout')) {
        setError('La operación tardó demasiado tiempo. Verifica tu conexión a internet e intenta nuevamente.');
        setLoading(false);
        return;
      } else if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        setError('Error de configuración de base de datos. Se requiere crear un índice en Firebase. Contacta al administrador.');
        setLoading(false);
        return;
      } else if (error?.code === 'permission-denied') {
        setError('No tienes permisos para guardar esta compra. Verifica tu autenticación.');
        setLoading(false);
        return;
      } else if (error?.code === 'unavailable') {
        setError('Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.');
        setLoading(false);
        return;
      }
      
      // Intentar guardado de emergencia más simple
      try {
        console.log('Intentando guardado de emergencia...');
        const totalCompraSimple = productosValidos.reduce((total, producto) => total + producto.total, 0);
        const nombreSupermercado = supermercado === 'Otro' ? supermercadoPersonalizado : supermercado;
        
        // Datos mínimos para guardar
        const compraDataEmergencia = {
          type: 'expense',
          category: 'Supermercado',
          amount: totalCompraSimple,
          description: `Compra ${nombreSupermercado}`,
          userId: user?.uid,
          createdAt: Timestamp.now()
        };
        
        console.log('Datos de emergencia a enviar:', compraDataEmergencia);
        
        // Un solo intento directo sin reintentos para el fallback
        await guardarTransaccionSimple(compraDataEmergencia);
        console.log('✅ Guardado de emergencia exitoso');
        console.log('Guardado simplificado exitoso');
        refreshData();
        onComplete();
        
        // Reset form
        setSupermercado('');
        setSupermercadoPersonalizado('');
        setUbicacion('');
        setFecha(new Date().toISOString().split('T')[0]);
        setMetodoPago('');
        setProductos([]);
        setNuevoProducto({
          nombre: '',
          marca: '',
          precio: '',
          cantidad: '',
          porPeso: false,
          porLitro: false,
          precioKilo: '',
          precioLitro: '',
          peso: '',
          litros: ''
        });
        
        return; // Salir exitosamente
      } catch (fallbackError: any) {
        console.error('❌ Error CRÍTICO en guardado simplificado:', fallbackError);
        console.error('Tipo de error:', typeof fallbackError);
        console.error('Error code:', fallbackError?.code);
        console.error('Error message:', fallbackError?.message);
        console.error('Error stack:', fallbackError?.stack);
      }
      
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

      <form onSubmit={(e) => {
        console.log('📝 FORM onSubmit activado');
        try {
          handleSubmit(e);
        } catch (error) {
          console.error('❌ Error en handleSubmit:', error);
        }
      }}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Guardando compra...</strong> Por favor espera, esto puede tardar unos segundos.
              <br />
              <Typography variant="caption">
                Si la operación falla, presiona "Reconectar Firebase" antes de intentar nuevamente.
              </Typography>
            </Alert>
          )}

          {/* Debug info - Solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
              <strong>Debug:</strong> Estado del formulario de producto: 
              Nombre: "{nuevoProducto.nombre}", 
              Marca: "{nuevoProducto.marca}", 
              Precio: "{nuevoProducto.precio}", 
              Cantidad: "{nuevoProducto.cantidad}"
              {(nuevoProducto.nombre || nuevoProducto.marca || nuevoProducto.precio || nuevoProducto.cantidad) && 
                <span style={{ color: 'red' }}> ← HAY CAMPOS PENDIENTES</span>
              }
            </Alert>
          )}

          {/* Información general de la compra */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información de la Compra
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
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

              {/* Campo personalizado para supermercado */}
              {supermercado === 'Otro' && (
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nombre del supermercado"
                    value={supermercadoPersonalizado}
                    onChange={(e) => setSupermercadoPersonalizado(e.target.value)}
                    required
                    placeholder="Ej: Supermercado Local"
                  />
                </Grid>
              )}

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    label="Método de Pago"
                  >
                    {metodosPago.map((metodo) => (
                      <MenuItem key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
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
                  required
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Marca (opcional)"
                  value={nuevoProducto.marca}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
                  placeholder="Ej: Nestlé"
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
                        peso: '',
                        porLitro: false,
                        precioLitro: '',
                        litros: ''
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

              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={nuevoProducto.porLitro}
                      onChange={(e) => setNuevoProducto({ 
                        ...nuevoProducto, 
                        porLitro: e.target.checked,
                        precio: '',
                        cantidad: '',
                        precioLitro: '',
                        litros: '',
                        porPeso: false,
                        precioKilo: '',
                        peso: ''
                      })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalDrink fontSize="small" />
                      Por litro
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
              ) : nuevoProducto.porLitro ? (
                <>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Precio por litro"
                      type="number"
                      value={nuevoProducto.precioLitro}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioLitro: e.target.value })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Litros"
                      type="number"
                      inputProps={{ step: 0.01 }}
                      value={nuevoProducto.litros}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, litros: e.target.value })}
                      InputProps={{ endAdornment: 'L' }}
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    type="button"
                    fullWidth
                    variant="contained"
                    onClick={agregarProducto}
                    startIcon={<Add />}
                    size="small"
                  >
                    Agregar
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    variant="outlined"
                    onClick={limpiarFormularioProducto}
                    size="small"
                    color="secondary"
                  >
                    Limpiar
                  </Button>
                </Box>
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
                        {producto.marca && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({producto.marca})
                          </Typography>
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
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
            type="button"
            variant="outlined"
            onClick={async () => {
              try {
                setError('Reconectando a Firebase...');
                await disableNetwork(db);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await enableNetwork(db);
                setError('');
                console.log('✅ Reconexión completada');
              } catch (error) {
                console.error('❌ Error en reconexión:', error);
                setError('Error al reconectar');
              }
            }}
            disabled={loading}
          >
            Reconectar Firebase
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              loading || 
              productos.length === 0
            }
            startIcon={<ShoppingCart />}
            onClick={() => {
              console.log('🖱️ CLICK en botón Guardar Compra');
              console.log('📊 Estado actual:', {
                loading,
                productosLength: productos.length,
                supermercado,
                ubicacion,
                metodoPago
              });
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Compra'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
