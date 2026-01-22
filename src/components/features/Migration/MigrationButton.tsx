"use client";

import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import { 
  migrateLegacyToTransactions, 
  getLegacyStats, 
  type MigrationResult 
} from '@/lib/firebase/migration';
import { useAuth } from '@/contexts/AuthContext';

export default function MigrationButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { user } = useAuth();

  const handleOpen = async () => {
    setOpen(true);
    if (user) {
      const legacyStats = await getLegacyStats(user.uid);
      setStats(legacyStats);
    }
  };

  const handleMigrate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Ejecutar migración
      const migrationResult = await migrateLegacyToTransactions(user.uid, { dryRun: false });
      setResult(migrationResult);
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  if (!user) return null;

  return (
    <>
      <Button 
        variant="outlined" 
        color="warning"
        onClick={handleOpen}
        size="small"
      >
        🔄 Migrar Datos Legacy
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Migración de Datos Legacy
        </DialogTitle>
        
        <DialogContent>
          {!result ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Esta migración copiará tus datos de las colecciones antiguas 
                (incomes, expenses, debts) a la nueva colección unificada (transactions).
                <br /><br />
                <strong>⚠️ Tus datos originales NO serán borrados.</strong>
              </Alert>

              {stats && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Datos encontrados:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Ingresos" 
                        secondary={`${stats.incomes} registros`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Gastos" 
                        secondary={`${stats.expenses} registros`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Deudas" 
                        secondary={`${stats.debts} registros`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={<strong>Total</strong>}
                        secondary={<strong>{stats.total} registros para migrar</strong>}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Migrando datos... Por favor espera.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
              {result.success ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ ¡Migración completada exitosamente!
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  ❌ La migración encontró errores
                </Alert>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resultados:
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
                      primary="Registros omitidos (ya migrados)" 
                      secondary={result.skippedCount} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Ingresos migrados" 
                      secondary={result.details.incomes} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Gastos migrados" 
                      secondary={result.details.expenses} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Deudas migradas" 
                      secondary={result.details.debts} 
                    />
                  </ListItem>
                  {result.errors.length > 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="Errores" 
                        secondary={result.errors.join(', ')} 
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                La página se recargará para mostrar los datos actualizados.
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {!result ? (
            <>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button 
                onClick={handleMigrate} 
                variant="contained" 
                color="primary"
                disabled={loading || !stats || stats.total === 0}
              >
                {loading ? 'Migrando...' : 'Iniciar Migración'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleClose}>Cerrar</Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="contained" 
                color="primary"
              >
                Recargar Página
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
