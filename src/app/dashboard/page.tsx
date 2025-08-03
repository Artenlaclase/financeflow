"use client";

import { Container, Grid, Typography, Box, Paper, Button } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinanceProfile } from '@/contexts/FinanceProfileContext';
import BalanceCard from '../../components/features/Dashboard/BalanceCard';
import QuickActions from '../../components/features/Dashboard/QuickActions';
import FinanceSetupForm from '../../components/shared/Auth/FinanceSetupForm';
import AuthGuard from '../../components/shared/Auth/AuthGuard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { profile } = useFinanceProfile();
  const router = useRouter();
  const [showFinanceSetup, setShowFinanceSetup] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleFinanceSetupComplete = () => {
    setShowFinanceSetup(false);
  };

  if (showFinanceSetup) {
    return (
      <FinanceSetupForm 
        onComplete={handleFinanceSetupComplete}
        onSkip={handleFinanceSetupComplete}
      />
    );
  }

  return (
    <AuthGuard requireAuth={true} requireFinanceSetup={true}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard Financiero
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowFinanceSetup(true)}
              color="primary"
            >
              Reconfigurar Presupuesto
            </Button>
            <Button variant="outlined" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>
        </Box>

      {user && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          Bienvenido, {user.email}
        </Typography>
      )}

      {profile && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary">
                Ingreso Mensual
              </Typography>
              <Typography variant="h4">
                ${profile.monthlyIncome.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="error">
                Gastos Fijos
              </Typography>
              <Typography variant="h4">
                ${profile.totalFixedExpenses.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="success.main">
                Disponible
              </Typography>
              <Typography variant="h4">
                ${profile.availableIncome.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <BalanceCard />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <QuickActions />
        </Grid>
      </Grid>
    </Container>
    </AuthGuard>
  );
}
