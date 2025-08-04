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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  ShoppingCart, 
  Store, 
  LocationOn, 
  Scale,
  Receipt,
  Edit,
  Delete,
  LocalDrink
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import EditarCompraForm from '../Forms/EditarCompraForm';
import { CompraTransaction } from '../../../types/compras';

interface HistorialComprasProps {
  refreshTrigger: number;
}

export default function HistorialCompras({ refreshTrigger }: HistorialComprasProps) {
  const [compras, setCompras] = useState<CompraTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Estados para edición y borrado
  const [compraABorrar, setCompraABorrar] = useState<CompraTransaction | null>(null);
  const [compraAEditar, setCompraAEditar] = useState<CompraTransaction | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up compras listener for user:', user.uid);

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('category', '==', 'Supermercado'),
      where('type', '==', 'expense'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log('Compras query result:', querySnapshot.size, 'documents');
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
      },
      (error) => {
        console.error('Error fetching compras:', error);
        setLoading(false);
      }
    );

    // Timeout de seguridad en caso de que Firestore no responda
    const timeout = setTimeout(() => {
      console.log('Firestore timeout - stopping loading');
      setLoading(false);
    }, 10000); // Aumentado de 5s a 10s

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
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

  const getMetodoPagoInfo = (metodoPago?: string) => {
    const metodos = {
      efectivo: { label: 'Efectivo', icon: '💵', color: 'success' },
      debito: { label: 'Débito', icon: '💳', color: 'primary' },
      credito: { label: 'Crédito', icon: '💳', color: 'warning' }
    };
    return metodos[metodoPago as keyof typeof metodos] || { label: metodoPago || 'No especificado', icon: '❓', color: 'default' };
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

    // Estadísticas por método de pago
    const porMetodoPago = compras.reduce((acc, compra) => {
      const metodo = compra.detalleCompra.metodoPago || 'no-especificado';
      if (!acc[metodo]) {
        acc[metodo] = { cantidad: 0, total: 0 };
      }
      acc[metodo].cantidad += 1;
      acc[metodo].total += compra.amount;
      return acc;
    }, {} as Record<string, { cantidad: number; total: number }>);

    return {
      totalGastado,
      totalProductos,
      totalCompras: compras.length,
      comprasUltimoMes: comprasUltimoMes.length,
      gastoUltimoMes: comprasUltimoMes.reduce((sum, compra) => sum + compra.amount, 0),
      porMetodoPago
    };
  };

  // Funciones para editar y borrar compras
  const handleEditarCompra = (compra: CompraTransaction) => {
    setCompraAEditar(compra);
    setEditFormOpen(true);
  };

  const handleBorrarCompra = (compra: CompraTransaction) => {
    setCompraABorrar(compra);
    setConfirmDeleteOpen(true);
  };

  const confirmarBorrado = async () => {
    if (!compraABorrar || !user) return;
    
    try {
      console.log('🗑️ Iniciando borrado de compra:', compraABorrar.id);
      
      // 1. Borrar todos los productos del historial asociados a esta transacción
      const productosQuery = query(
        collection(db, 'users', user.uid, 'productos-historial'),
        where('transactionId', '==', compraABorrar.id)
      );
      
      const productosSnapshot = await getDocs(productosQuery);
      console.log(`📦 Encontrados ${productosSnapshot.size} productos para borrar`);
      
      // Borrar cada producto del historial
      const borrarProductosPromises = productosSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'users', user.uid, 'productos-historial', docSnapshot.id))
      );
      
      await Promise.all(borrarProductosPromises);
      console.log('✅ Productos del historial borrados exitosamente');
      
      // 2. Borrar la transacción principal
      await deleteDoc(doc(db, 'transactions', compraABorrar.id));
      console.log('✅ Transacción principal borrada exitosamente');
      
      console.log('🎉 Compra eliminada completamente');
      
      setConfirmDeleteOpen(false);
      setCompraABorrar(null);
    } catch (error) {
      console.error('❌ Error al borrar compra:', error);
      // TODO: Mostrar mensaje de error al usuario
    }
  };

  const guardarEdicion = async (compraEditada: CompraTransaction) => {
    try {
      console.log('💾 Compra editada exitosamente:', compraEditada.id);
      
      // Actualizar la lista local de compras
      setCompras(compras.map(compra => 
        compra.id === compraEditada.id ? compraEditada : compra
      ));
      
      setEditFormOpen(false);
      setCompraAEditar(null);
    } catch (error) {
      console.error('Error al procesar la edición:', error);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Cargando historial de compras...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Esto puede tomar unos segundos
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

        {/* Desglose por método de pago */}
        {Object.keys(stats.porMetodoPago).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
              Desglose por Método de Pago
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(stats.porMetodoPago).map(([metodo, datos]) => {
                const metodoPagoInfo = getMetodoPagoInfo(metodo);
                return (
                  <Grid item xs={6} md={4} key={metodo}>
                    <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        {metodoPagoInfo.icon}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${datos.total.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metodoPagoInfo.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {datos.cantidad} compra{datos.cantidad !== 1 ? 's' : ''}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Lista de compras */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Historial de Compras ({compras.length})
        </Typography>

        {compras.length === 0 && !loading ? (
          <Alert 
            severity="info" 
            sx={{ 
              textAlign: 'center', 
              py: 4,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Typography variant="h6" gutterBottom>
              🛒 ¡Aún no hay compras registradas!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Comienza a registrar tus compras de supermercado para llevar un mejor control de tus gastos.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tip: Usa el botón "Nueva Compra" para agregar tu primera compra
            </Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {compra.detalleCompra.ubicacion}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={formatFecha(compra.date)} 
                            variant="outlined"
                          />
                          {compra.detalleCompra.metodoPago && (
                            <Chip 
                              size="small" 
                              label={`${getMetodoPagoInfo(compra.detalleCompra.metodoPago).icon} ${getMetodoPagoInfo(compra.detalleCompra.metodoPago).label}`}
                              color={getMetodoPagoInfo(compra.detalleCompra.metodoPago).color as any}
                              variant="filled"
                            />
                          )}
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
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarCompra(compra);
                          }}
                          title="Editar compra"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBorrarCompra(compra);
                          }}
                          title="Borrar compra"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => toggleExpanded(compra.id)}>
                          {expandedCards.has(compra.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  <Collapse in={expandedCards.has(compra.id)}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Productos comprados:
                    </Typography>
                    
                    <List dense>
                      {compra.detalleCompra.productos.map((producto, index) => (
                        <ListItem 
                          key={`${compra.id}-producto-${index}`}
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
                                ) : producto.porLitro ? (
                                  <>
                                    <Chip size="small" icon={<LocalDrink />} label={`${producto.litros}L`} />
                                    <Chip size="small" label={`$${producto.precioLitro}/L`} />
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

      {/* Diálogo de confirmación para borrar */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🗑️ Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar esta compra?
          </DialogContentText>
          {compraABorrar && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>{compraABorrar.detalleCompra.supermercado}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📍 {compraABorrar.detalleCompra.ubicacion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📅 {formatFecha(compraABorrar.date)}
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                💰 ${compraABorrar.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🛍️ {compraABorrar.detalleCompra.totalProductos} productos
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Esta acción no se puede deshacer.</strong> Se eliminará tanto la transacción principal como todos los productos asociados del historial de precios.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteOpen(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmarBorrado}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar Compra
          </Button>
        </DialogActions>
      </Dialog>

      {/* TODO: Diálogo de edición - Se implementará en el siguiente paso */}
      <EditarCompraForm
        open={editFormOpen}
        compra={compraAEditar}
        onClose={() => {
          setEditFormOpen(false);
          setCompraAEditar(null);
        }}
        onSave={guardarEdicion}
      />
      
    </Box>
  );
}
