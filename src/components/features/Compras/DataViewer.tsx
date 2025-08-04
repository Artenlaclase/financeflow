"use client";

import { useState } from 'react';
import { Box, Button, Typography, Alert, Paper, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DataViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 19)
    ]);
  };

  const viewAllTransactions = async () => {
    setIsLoading(true);
    setLogs([]);
    setTransactions([]);
    
    try {
      addLog('🔍 Consultando todas las transacciones del usuario...');
      
      if (!user) {
        addLog('❌ Usuario no autenticado');
        return;
      }
      
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );
      
      addLog('📤 Ejecutando consulta...');
      const querySnapshot = await getDocs(q);
      
      addLog(`📊 Total documentos encontrados: ${querySnapshot.size}`);
      
      const transactionsData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsData.push({
          id: doc.id,
          ...data
        });
        
        addLog(`📄 Doc ${doc.id}: ${data.type} - ${data.category} - $${data.amount} - ${data.description || 'Sin descripción'}`);
        
        if (data.detalleCompra) {
          addLog(`   🛒 Tiene detalleCompra: ${data.detalleCompra.supermercado || 'N/A'} - ${data.detalleCompra.totalProductos || 0} productos`);
        } else {
          addLog(`   ⚠️ NO tiene detalleCompra`);
        }
      });
      
      setTransactions(transactionsData);
      
      // Analizar por categorías
      const categories = transactionsData.reduce((acc, doc) => {
        const cat = doc.category || 'Sin categoría';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      addLog(`📈 Resumen por categorías:`);
      Object.entries(categories).forEach(([cat, count]) => {
        addLog(`   - ${cat}: ${count} transacciones`);
      });
      
      // Específicamente buscar compras de supermercado
      const supermercadoCompras = transactionsData.filter(doc => 
        doc.category === 'Supermercado' && doc.type === 'expense'
      );
      addLog(`🛒 Compras de supermercado encontradas: ${supermercadoCompras.length}`);
      
      const conDetalle = supermercadoCompras.filter(doc => doc.detalleCompra);
      addLog(`📦 Compras con detalleCompra: ${conDetalle.length}`);
      
      const sinDetalle = supermercadoCompras.filter(doc => !doc.detalleCompra);
      addLog(`⚠️ Compras SIN detalleCompra: ${sinDetalle.length}`);
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message || 'Error desconocido'}`);
      console.error('Error completo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Visor de Datos de Firebase
      </Typography>
      
      <Button
        variant="contained"
        onClick={viewAllTransactions}
        disabled={isLoading}
        sx={{ mb: 2 }}
      >
        {isLoading ? 'Consultando...' : 'Ver Todas las Transacciones'}
      </Button>
      
      {logs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Logs de la consulta:
          </Typography>
          {logs.map((log, index) => (
            <Alert 
              key={index} 
              severity={
                log.includes('❌') ? 'error' : 
                log.includes('✅') ? 'success' : 
                log.includes('⚠️') ? 'warning' :
                'info'
              }
              sx={{ mb: 1, fontSize: '0.7rem' }}
            >
              {log}
            </Alert>
          ))}
        </Box>
      )}
      
      {transactions.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Ver Datos Detallados ({transactions.length} documentos)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {transactions.map((transaction, index) => (
                <Box key={transaction.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    <strong>ID:</strong> {transaction.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {transaction.type} | 
                    <strong> Categoría:</strong> {transaction.category} | 
                    <strong> Monto:</strong> ${transaction.amount}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Descripción:</strong> {transaction.description || 'Sin descripción'}
                  </Typography>
                  {transaction.detalleCompra ? (
                    <Typography variant="body2" color="success.main">
                      <strong>✅ DetalleCompra:</strong> {JSON.stringify(transaction.detalleCompra, null, 2).substring(0, 100)}...
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="warning.main">
                      <strong>⚠️ Sin detalleCompra</strong>
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
}
