"use client";

import { useState } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';

export default function FirestoreDiagnostic() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testFirestore = async () => {
    if (!user) {
      addLog('❌ Error: Usuario no autenticado');
      return;
    }

    setLoading(true);
    clearLogs();
    
    try {
      addLog('🔍 Iniciando diagnóstico de Firestore...');
      addLog(`👤 Usuario: ${user.email} (${user.uid})`);
      
      const { collection, getDocs, addDoc, deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase/config');
      
      // Test 1: Leer colecciones existentes
      addLog('📖 Test 1: Leyendo colecciones...');
      
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      addLog(`💰 Gastos encontrados: ${expensesSnapshot.size}`);
      
      const incomeRef = collection(db, 'users', user.uid, 'income');
      const incomeSnapshot = await getDocs(incomeRef);
      addLog(`💵 Ingresos encontrados: ${incomeSnapshot.size}`);
      
      // Test 2: Crear una transacción de prueba
      addLog('➕ Test 2: Creando transacción de prueba...');
      
      const testTransaction = {
        amount: 5.00,
        category: 'Test Diagnostic',
        description: 'Transacción de diagnóstico - puede eliminarse',
        date: new Date(),
        createdAt: new Date()
      };
      
      const docRef = await addDoc(expensesRef, testTransaction);
      addLog(`✅ Transacción creada con ID: ${docRef.id}`);
      
      // Test 3: Eliminar la transacción de prueba
      addLog('🗑️ Test 3: Eliminando transacción de prueba...');
      
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', docRef.id));
      addLog('✅ Transacción eliminada correctamente');
      
      addLog('🎉 ¡Todos los tests pasaron! Firestore está funcionando correctamente.');
      
    } catch (error) {
      addLog(`❌ Error: ${(error as Error).message}`);
      console.error('Firestore diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Diagnóstico de Firestore
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={testFirestore}
          disabled={loading || !user}
          sx={{ mr: 1 }}
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </Button>
        <Button 
          variant="outlined" 
          onClick={clearLogs}
          disabled={loading}
        >
          Limpiar Logs
        </Button>
      </Box>

      {!user && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Usuario no autenticado. Inicia sesión para ejecutar el diagnóstico.
        </Alert>
      )}

      {logs.length > 0 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: 300, 
            overflow: 'auto',
            backgroundColor: 'grey.50',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        >
          {logs.map((log, index) => (
            <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
              {log}
            </Typography>
          ))}
        </Paper>
      )}
    </Paper>
  );
}
