"use client";

import { useState } from 'react';
import { Box, Button, Typography, Alert, Paper, Grid } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function FirebaseDiagnostic() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 9)
    ]);
  };

  const testBasicConnection = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Iniciando diagnóstico básico...');
      
      if (!user) {
        addLog('❌ Usuario no autenticado - necesitas hacer login');
        return;
      }
      addLog(`✅ Usuario autenticado: ${user.uid}`);
      addLog(`📧 Email: ${user.email || 'Sin email'}`);
      
      addLog('🎉 Diagnóstico básico completado - Usuario autenticado correctamente');
      
    } catch (error: any) {
      addLog(`❌ Error en diagnóstico: ${error.message || 'Error desconocido'}`);
      console.error('Error completo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseSave = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Probando guardado en Firebase...');
      
      if (!user) {
        addLog('❌ Usuario no autenticado');
        return;
      }
      
      addLog('🔄 Intentando guardar datos de prueba...');
      
      const testData = {
        type: 'expense',
        category: 'Supermercado',
        amount: 100,
        description: 'Compra de prueba - DIAGNÓSTICO',
        date: Timestamp.now(),
        userId: user.uid,
        createdAt: Timestamp.now()
      };
      
      addLog('📤 Enviando a Firestore...');
      const docRef = await addDoc(collection(db, 'transactions'), testData);
      addLog(`✅ ¡Éxito! Documento guardado con ID: ${docRef.id}`);
      addLog('🎉 Firebase está funcionando correctamente para guardado');
      
    } catch (error: any) {
      addLog(`❌ Error al guardar: ${error.message || 'Error desconocido'}`);
      addLog(`❌ Código: ${error.code || 'Sin código'}`);
      console.error('Error completo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Diagnóstico de Firebase
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item>
          <Button
            variant="contained"
            onClick={testBasicConnection}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? 'Ejecutando...' : 'Test Autenticación'}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={testFirebaseSave}
            disabled={isLoading}
            color="secondary"
          >
            {isLoading ? 'Guardando...' : 'Test Guardado'}
          </Button>
        </Grid>
      </Grid>
      
      {logs.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Logs del diagnóstico:
          </Typography>
          {logs.map((log, index) => (
            <Alert 
              key={index} 
              severity={
                log.includes('❌') ? 'error' : 
                log.includes('✅') ? 'success' : 
                log.includes('🔄') || log.includes('📤') ? 'info' : 
                'info'
              }
              sx={{ mb: 1, fontSize: '0.8rem' }}
            >
              {log}
            </Alert>
          ))}
        </Box>
      )}
    </Paper>
  );
}
