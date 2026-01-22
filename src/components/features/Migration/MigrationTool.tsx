'use client';

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { MigrationResult, safeMigration } from '@/lib/firebase/migration';
import { useAuth } from '@/contexts/AuthContext';

export default function MigrationTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleMigration = async () => {
    if (!user) {
      setError('No hay usuario autenticado');
      return;
    }

    if (!confirm('¿Ejecutar migración de colecciones legacy a transactions/? Esta operación NO borra datos existentes.')) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const migrationResult = await safeMigration(user.uid);
      setResult(migrationResult);
      
      if (migrationResult.success) {
        alert('✅ Migración completada exitosamente!');
      } else {
        alert('⚠️ Migración completada con errores. Ver detalles.');
      }
    } catch (err: any) {
      setError(err.message || 'Error durante la migración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          🔄 Herramienta de Migración
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Migra datos de colecciones legacy (incomes, expenses, debts) a la colección
          unificada <code>transactions/</code>. Los datos originales NO se borran.
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> Esta operación es segura y no destructiva.
            Los datos legacy se mantienen intactos.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mb: 2 }}>
            <Alert severity={result.success ? 'success' : 'warning'}>
              <Typography variant="h6">
                Resultados de la Migración
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Registros migrados" 
                    secondary={result.migratedCount}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Registros omitidos (ya existían)" 
                    secondary={result.skippedCount}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Ingresos" 
                    secondary={result.details.incomes}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Gastos" 
                    secondary={result.details.expenses}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Deudas" 
                    secondary={result.details.debts}
                  />
                </ListItem>
              </List>
              
              {result.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    Errores:
                  </Typography>
                  <List dense>
                    {result.errors.map((err, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={err} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Alert>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleMigration}
          disabled={loading || !user}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Migrando...' : 'Ejecutar Migración'}
        </Button>

        {!user && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Debes iniciar sesión para ejecutar la migración
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
