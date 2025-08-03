"use client";

import { useState } from 'react';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Link, 
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel 
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import FinanceSetupForm from './FinanceSetupForm';

export default function RegisterForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const router = useRouter();

  const steps = ['Crear Cuenta', 'Configurar Presupuesto'];

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      await register(email, password);
      setActiveStep(1); // Ir al paso de configuración financiera
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    }
  };

  const handleFinanceSetupComplete = () => {
    router.push('/dashboard');
  };

  const handleSkipFinanceSetup = () => {
    router.push('/dashboard');
  };

  if (activeStep === 1) {
    return (
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <FinanceSetupForm 
          onComplete={handleFinanceSetupComplete}
          onSkip={handleSkipFinanceSetup}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box component="form" onSubmit={handleAccountSubmit} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Crear Cuenta
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <TextField
          label="Confirmar Contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          fullWidth 
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
        </Button>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" variant="body2">
              Iniciar Sesión
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
