"use client";

import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  ShoppingCart, 
  Store, 
  LocationOn, 
  Scale,
  Receipt
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

interface HistorialComprasProps {
  refreshTrigger: number;
}

interface CompraDetalle {
  supermercado: string;
  ubicacion: string;
  productos: Array<{
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    porPeso: boolean;
    precioKilo?: number;
    peso?: number;
    total: number;
  }>;
  totalProductos: number;
  totalCompra: number;
}

interface CompraTransaction {
  id: string;
  amount: number;
  description: string;
  date: any;
  detalleCompra: CompraDetalle;
  createdAt: any;
}

export default function HistorialCompras({ refreshTrigger }: HistorialComprasProps) {
  const [compras, setCompras] = useState<CompraTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('category', '==', 'Supermercado'),
      where('type', '==', 'expense'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const comprasData: CompraTransaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.detalleCompra) {
          comprasData.push({
            id: doc.id,
            ...data
          } as CompraTransaction);
        }
      });
      setCompras(comprasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, refreshTrigger]);

  const toggleExpanded = (compraId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(compraId)) {
      newExpanded.delete(compraId);
    } else {
      newExpanded.add(compraId);
    }
    setExpandedCards(newExpanded);
  };

  const formatFecha = (fecha: any) => {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularEstadisticas = () => {
    const totalGastado = compras.reduce((sum, compra) => sum + compra.amount, 0);
    const totalProductos = compras.reduce((sum, compra) => sum + compra.detalleCompra.totalProductos, 0);
    const comprasUltimoMes = compras.filter(compra => {
      const fechaCompra = compra.date.toDate ? compra.date.toDate() : new Date(compra.date);
      const unMesAtras = new Date();
      unMesAtras.setMonth(unMesAtras.getMonth() - 1);
      return fechaCompra >= unMesAtras;
    });

    return {
      totalGastado,
      totalProductos,
      totalCompras: compras.length,
      comprasUltimoMes: comprasUltimoMes.length,
      gastoUltimoMes: comprasUltimoMes.reduce((sum, compra) => sum + compra.amount, 0)
    };
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando historial de compras...
        </Typography>
      </Paper>
    );
  }

  const stats = calcularEstadisticas();

  return (
    <Box>
      {/* Estadísticas resumidas */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt />
          Resumen de Compras
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.totalCompras}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Compras
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.totalProductos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos Comprados
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                ${stats.totalGastado.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Gastado
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                ${stats.gastoUltimoMes.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Último Mes ({stats.comprasUltimoMes} compras)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de compras */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Historial de Compras ({compras.length})
        </Typography>

        {compras.length === 0 ? (
          <Alert severity="info">
            No hay compras registradas aún. ¡Registra tu primera compra de supermercado!
          </Alert>
        ) : (
          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            {compras.map((compra) => (
              <Card key={compra.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleExpanded(compra.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Store color="primary" />
                      <Box>
                        <Typography variant="h6">
                          {compra.detalleCompra.supermercado}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {compra.detalleCompra.ubicacion}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={formatFecha(compra.date)} 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary">
                          ${compra.amount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {compra.detalleCompra.totalProductos} productos
                        </Typography>
                      </Box>
                      <IconButton>
                        {expandedCards.has(compra.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={expandedCards.has(compra.id)}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Productos comprados:
                    </Typography>
                    
                    <List dense>
                      {compra.detalleCompra.productos.map((producto) => (
                        <ListItem 
                          key={producto.id}
                          sx={{ 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 1, 
                            mb: 1 
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {producto.nombre}
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  ${producto.total.toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                {producto.porPeso ? (
                                  <>
                                    <Chip size="small" icon={<Scale />} label={`${producto.peso}kg`} />
                                    <Chip size="small" label={`$${producto.precioKilo}/kg`} />
                                  </>
                                ) : (
                                  <>
                                    <Chip size="small" label={`Cantidad: ${producto.cantidad}`} />
                                    <Chip size="small" label={`$${producto.precio} c/u`} />
                                  </>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
