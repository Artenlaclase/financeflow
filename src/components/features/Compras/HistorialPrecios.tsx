"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Store, 
  Scale,
  Search,
  Timeline,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

interface ProductoHistorial {
  id: string;
  transactionId: string;
  nombre: string;
  supermercado: string;
  ubicacion: string;
  fecha: any;
  porPeso: boolean;
  precio: number;
  cantidad: number;
  precioKilo?: number;
  peso?: number;
  total: number;
  metodoPago: string;
  createdAt: any;
}

interface HistorialPreciosProps {
  refreshTrigger?: number;
}

export default function HistorialPrecios({ refreshTrigger }: HistorialPreciosProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [productos, setProductos] = useState<ProductoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroSupermercado, setFiltroSupermercado] = useState('');
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Normaliza texto: minúsculas, sin acentos/diacríticos y sin espacios extra
  const normalizeText = (s: string | undefined | null) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  useEffect(() => {
    console.log('🔄 HistorialPrecios useEffect triggered - refreshTrigger:', refreshTrigger);
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up productos historial listener for user:', user.uid);

    const q = query(
      collection(db, 'productos-historial'),
      where('userId', '==', user.uid),
      orderBy('fecha', 'desc'),
      limit(100) // Limitar a los últimos 100 productos
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log('Productos historial query result:', querySnapshot.size, 'documents');
        const productosData: ProductoHistorial[] = [];
        querySnapshot.forEach((doc) => {
          productosData.push({
            id: doc.id,
            ...doc.data()
          } as ProductoHistorial);
        });
        setProductos(productosData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching productos historial:', error);
        setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      console.log('Firestore timeout - stopping loading');
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user, refreshTrigger]);

  const formatFecha = (fecha: any) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMetodoPagoInfo = (metodoPago?: string) => {
    const metodos = {
      efectivo: { label: 'Efectivo', icon: '💵', color: 'success' },
      debito: { label: 'Débito', icon: '💳', color: 'primary' },
      credito: { label: 'Crédito', icon: '💳', color: 'warning' },
      transferencia: { label: 'Transferencia', icon: '🏦', color: 'info' }
    };
    return metodos[metodoPago as keyof typeof metodos] || { label: metodoPago || 'N/E', icon: '❓', color: 'default' };
  };

  const getProductosUnicos = () => {
    // Deduplicar por nombre normalizado pero mostrar un nombre original representativo
    const map = new Map<string, string>();
    for (const p of productos) {
      const norm = normalizeText(p.nombre);
      if (!map.has(norm)) {
        map.set(norm, p.nombre);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'es'));
  };

  const getSupermercadosUnicos = () => {
    const supermercados = new Set(productos.map(p => p.supermercado));
    return Array.from(supermercados).sort();
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideProducto = !filtroProducto || 
      normalizeText(producto.nombre).includes(normalizeText(filtroProducto));
    const coincideSupermercado = !filtroSupermercado || 
      producto.supermercado === filtroSupermercado;
    
    return coincideProducto && coincideSupermercado;
  });

  // Verificar si hay contenido scrolleable en móvil
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current && isMobile) {
        const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
        const hasMoreContent = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
        const isAtTop = scrollTop <= 5;
        
        setCanScrollDown(hasMoreContent && !isAtBottom);
        setCanScrollUp(hasMoreContent && !isAtTop);
      }
    };

    checkScrollable();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollable);
      return () => container.removeEventListener('scroll', checkScrollable);
    }
  }, [productosFiltrados, isMobile]);

  const calcularEstadisticas = () => {
    if (productosFiltrados.length === 0) return null;

    const productosAgrupados = productosFiltrados.reduce((acc, producto) => {
      const key = normalizeText(producto.nombre);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(producto);
      return acc;
    }, {} as Record<string, ProductoHistorial[]>);

    return Object.entries(productosAgrupados).map(([nombre, items]) => {
      const ordenados = items.sort((a, b) => {
        const fechaA = a.fecha.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const fechaB = b.fecha.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return fechaB.getTime() - fechaA.getTime();
      });

      const ultimo = ordenados[0];
      const anterior = ordenados[1];
      
      let tendencia = 'igual';
      let cambio = 0;
      
      if (anterior) {
        const precioUltimo = ultimo.porPeso ? ultimo.precioKilo || 0 : ultimo.precio;
        const precioAnterior = anterior.porPeso ? anterior.precioKilo || 0 : anterior.precio;
        
        if (precioUltimo > precioAnterior) {
          tendencia = 'subida';
          cambio = precioUltimo - precioAnterior;
        } else if (precioUltimo < precioAnterior) {
          tendencia = 'bajada';
          cambio = precioAnterior - precioUltimo;
        }
      }

      return {
        nombre: items[0].nombre,
        ultimoProducto: ultimo,
        totalCompras: items.length,
        tendencia,
        cambio
      };
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Cargando historial de precios...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Esto puede tomar unos segundos
        </Typography>
      </Paper>
    );
  }

  const estadisticas = calcularEstadisticas();

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline />
          Historial de Precios de Productos
        </Typography>
        
        {/* Filtros */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar producto"
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filtrar por supermercado</InputLabel>
              <Select
                value={filtroSupermercado}
                onChange={(e) => setFiltroSupermercado(e.target.value)}
                label="Filtrar por supermercado"
              >
                <MenuItem value="">Todos los supermercados</MenuItem>
                {getSupermercadosUnicos().map((super_) => (
                  <MenuItem key={super_} value={super_}>
                    {super_}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {productosFiltrados.length} registro{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Resumen de tendencias */}
      {estadisticas && estadisticas.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tendencias de Precios
          </Typography>
          <Grid container spacing={2}>
            {estadisticas.slice(0, 6).map((stat, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium" noWrap>
                          {stat.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.ultimoProducto.supermercado} • {stat.totalCompras} compra{stat.totalCompras !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        {stat.tendencia === 'subida' && (
                          <Chip 
                            size="small" 
                            icon={<TrendingUp />} 
                            label={`+$${stat.cambio}`}
                            color="error"
                          />
                        )}
                        {stat.tendencia === 'bajada' && (
                          <Chip 
                            size="small" 
                            icon={<TrendingDown />} 
                            label={`-$${stat.cambio}`}
                            color="success"
                          />
                        )}
                        {stat.tendencia === 'igual' && (
                          <Chip 
                            size="small" 
                            label="Sin cambios"
                            color="default"
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Tabla/Cards de productos */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Detalle del Historial
        </Typography>

        {productosFiltrados.length === 0 ? (
          <Alert severity="info">
            {productos.length === 0 
              ? 'No hay productos registrados aún. ¡Registra tu primera compra!'
              : 'No se encontraron productos con los filtros aplicados.'
            }
          </Alert>
        ) : isMobile ? (
          /* Vista móvil - Cards */
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={scrollContainerRef}
              sx={{
                maxHeight: '500px',
                overflow: 'auto',
                // Sombras para indicar contenido scrolleable
                background: `
                  linear-gradient(white 30%, rgba(255,255,255,0)) 0 0,
                  linear-gradient(rgba(255,255,255,0), white 70%) 0 100%,
                  radial-gradient(50% 0, farthest-side, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 0,
                  radial-gradient(50% 100%, farthest-side, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 100%
                `,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 40px, 100% 40px, 100% 14px, 100% 14px',
                backgroundAttachment: 'local, local, scroll, scroll'
              }}
            >
              <Grid container spacing={2}>
                {productosFiltrados.map((producto) => (
                  <Grid item xs={12} key={producto.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ flex: 1 }}>
                            {producto.nombre}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ ml: 2 }}>
                            ${producto.total.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Fecha:</strong> {formatFecha(producto.fecha)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Supermercado:</strong> {producto.supermercado}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Ubicación:</strong> {producto.ubicacion}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Precio:</strong> {producto.porPeso ? (
                                `$${producto.precioKilo?.toLocaleString()}/kg`
                              ) : (
                                `$${producto.precio.toLocaleString()} c/u`
                              )}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                          {producto.porPeso && (
                            <Chip 
                              size="small" 
                              icon={<Scale />} 
                              label={`${producto.peso}kg`}
                              variant="outlined"
                            />
                          )}
                          <Chip
                            size="small"
                            label={`${getMetodoPagoInfo(producto.metodoPago).icon} ${getMetodoPagoInfo(producto.metodoPago).label}`}
                            color={getMetodoPagoInfo(producto.metodoPago).color as any}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Indicadores de scroll para móvil */}
            {canScrollDown && (
              <Fade in={canScrollDown}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 2,
                    zIndex: 10,
                    animation: 'bounce 2s infinite',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    },
                    '@keyframes bounce': {
                      '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)'
                      },
                      '40%': {
                        transform: 'translateY(-10px)'
                      },
                      '60%': {
                        transform: 'translateY(-5px)'
                      }
                    }
                  }}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollBy({
                        top: 200,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  <KeyboardArrowDown />
                </Box>
              </Fade>
            )}

            {canScrollUp && (
              <Fade in={canScrollUp}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    backgroundColor: 'secondary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 2,
                    zIndex: 10,
                    animation: 'bounceUp 2s infinite',
                    '&:hover': {
                      backgroundColor: 'secondary.dark'
                    },
                    '@keyframes bounceUp': {
                      '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)'
                      },
                      '40%': {
                        transform: 'translateY(10px)'
                      },
                      '60%': {
                        transform: 'translateY(5px)'
                      }
                    }
                  }}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollBy({
                        top: -200,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  <KeyboardArrowUp />
                </Box>
              </Fade>
            )}
          </Box>
        ) : (
          /* Vista desktop - Tabla */
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Supermercado</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Método Pago</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {producto.nombre}
                        </Typography>
                        {producto.porPeso && (
                          <Chip 
                            size="small" 
                            icon={<Scale />} 
                            label={`${producto.peso}kg`}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFecha(producto.fecha)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {producto.supermercado}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {producto.ubicacion}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {producto.porPeso ? (
                        <Typography variant="body2">
                          ${producto.precioKilo?.toLocaleString()}/kg
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          ${producto.precio.toLocaleString()} c/u
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${getMetodoPagoInfo(producto.metodoPago).icon} ${getMetodoPagoInfo(producto.metodoPago).label}`}
                        color={getMetodoPagoInfo(producto.metodoPago).color as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${producto.total.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
