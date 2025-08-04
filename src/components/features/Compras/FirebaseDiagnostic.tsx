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
      
      // Test 1: Verificar autenticación
      if (!user) {
        addLog('❌ Usuario no autenticado - necesitas hacer login');
        return;
      }
      addLog(`✅ Usuario autenticado: ${user.uid}`);
      addLog(`� Email: ${user.email || 'Sin email'}`);
      
      // Test 2: Verificar contexto de Auth
      addLog('� Verificando contexto de autenticación...');
      if (user.uid) {
        addLog('✅ Contexto de autenticación funcionando correctamente');
      }
      
      addLog('🎉 Diagnóstico básico completado - Usuario autenticado correctamente');
      
    } catch (error: any) {
      addLog(`❌ Error en diagnóstico: ${error.message || 'Error desconocido'}`);
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
      
      <Button
        variant="contained"
        onClick={testBasicConnection}
        disabled={isLoading}
        sx={{ mb: 2 }}
      >
        {isLoading ? 'Ejecutando diagnóstico...' : 'Ejecutar Diagnóstico Básico'}
      </Button>
      
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
