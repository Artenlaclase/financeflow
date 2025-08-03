"use client";

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper,
  InputAdornment,
  Alert
} from '@mui/material';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';

interface FinanceSetupFormProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function FinanceSetupForm({ onComplete, onSkip }: FinanceSetupFormProps) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [fixedExpenses, setFixedExpenses] = useState({
    housing: 0,
    phone: 0,
    internet: 0,
    creditCards: 0,
    loans: 0,
    insurance: 0
  });
  const [error, setError] = useState('');
  const { createProfile, loading } = useFinanceProfile();

  const handleExpenseChange = (field: keyof typeof fixedExpenses, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFixedExpenses(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const totalFixedExpenses = Object.values(fixedExpenses).reduce((sum, expense) => sum + expense, 0);
  const availableIncome = monthlyIncome - totalFixedExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (monthlyIncome <= 0) {
      setError('Por favor ingresa un ingreso mensual válido');
      return;
    }

    try {
      await createProfile({
        monthlyIncome,
        fixedExpenses
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil financiero');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Configuración Inicial del Presupuesto
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph align="center">
        Para comenzar, necesitamos conocer tu situación financiera básica. 
        Esto nos ayudará a crear un presupuesto personalizado para ti.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ingreso Mensual
        </Typography>
        <TextField
          label="Ingreso mensual neto"
          type="number"
          value={monthlyIncome || ''}
          onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
          fullWidth
          required
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          helperText="Ingresa tu salario neto mensual después de descuentos"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gastos Fijos Mensuales
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Vivienda"
              type="number"
              value={fixedExpenses.housing || ''}
              onChange={(e) => handleExpenseChange('housing', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Alquiler, hipoteca, expensas"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Telefonía"
              type="number"
              value={fixedExpenses.phone || ''}
              onChange={(e) => handleExpenseChange('phone', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Planes de celular, teléfono fijo"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Internet"
              type="number"
              value={fixedExpenses.internet || ''}
              onChange={(e) => handleExpenseChange('internet', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Internet, TV por cable"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tarjetas de Crédito"
              type="number"
              value={fixedExpenses.creditCards || ''}
              onChange={(e) => handleExpenseChange('creditCards', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Pagos mínimos mensuales"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Préstamos/Cuotas"
              type="number"
              value={fixedExpenses.loans || ''}
              onChange={(e) => handleExpenseChange('loans', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Préstamos personales, auto, etc."
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Seguros"
              type="number"
              value={fixedExpenses.insurance || ''}
              onChange={(e) => handleExpenseChange('insurance', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Seguros médicos, de vida, auto"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Resumen del Presupuesto
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Ingreso Mensual
            </Typography>
            <Typography variant="h6" color="primary">
              ${monthlyIncome.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Gastos Fijos Totales
            </Typography>
            <Typography variant="h6" color="error">
              ${totalFixedExpenses.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Ingresos Disponibles
            </Typography>
            <Typography 
              variant="h6" 
              color={availableIncome >= 0 ? "success.main" : "error.main"}
            >
              ${availableIncome.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        {availableIncome < 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tus gastos fijos superan tus ingresos. Te recomendamos revisar 
            y reducir algunos gastos para mantener un presupuesto saludable.
          </Alert>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        {onSkip && (
          <Button 
            variant="outlined" 
            onClick={onSkip}
            disabled={loading}
          >
            Omitir por ahora
          </Button>
        )}
        
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          sx={{ ml: 'auto' }}
        >
          {loading ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </Box>
    </Box>
  );
}
