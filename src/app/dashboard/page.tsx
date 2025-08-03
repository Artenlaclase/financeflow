"use client";

import { Container, Grid, Typography, Box, Paper, Button, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useFinanceProfile } from '@/contexts/FinanceProfileContext';
import BalanceCard from '../../components/features/Dashboard/BalanceCard';
import QuickActions from '../../components/features/Dashboard/QuickActions';
import RecentTransactions from '../../components/features/Dashboard/RecentTransactions';
import FinanceSetupForm from '../../components/shared/Auth/FinanceSetupForm';
import EditProfileDialog from '../../components/shared/Auth/EditProfileDialog';
import AuthGuard from '../../components/shared/Auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { Analytics, Edit, Person, ShoppingCart } from '@mui/icons-material';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { getDisplayName, profile: userProfile } = useUserProfile();
  const { profile } = useFinanceProfile();
  const router = useRouter();
  const [showFinanceSetup, setShowFinanceSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

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
        {/* Saludo personalizado */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h4" component="h1">
              ¡Bienvenido, {getDisplayName()}!
            </Typography>
            <Tooltip title="Editar perfil">
              <IconButton 
                onClick={() => setShowEditProfile(true)}
                size="small"
                sx={{ ml: 1 }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Sugerencia para completar perfil si no tiene nombre */}
          {!userProfile && (
            <Box sx={{ 
              bgcolor: 'info.light', 
              color: 'info.contrastText', 
              p: 2, 
              borderRadius: 1, 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Person />
              <Typography variant="body2">
                <strong>¡Personaliza tu experiencia!</strong> 
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => setShowEditProfile(true)}
                  sx={{ ml: 1, color: 'inherit', textDecoration: 'underline' }}
                >
                  Agrega tu nombre y apellido
                </Button>
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" color="text.secondary">
            Aquí tienes un resumen de tu situación financiera
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h2">
            Dashboard Financiero
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<Analytics />}
              onClick={() => router.push('/analytics')}
              color="secondary"
            >
              Ver Análisis
            </Button>
            <Button 
              variant="contained" 
              startIcon={<ShoppingCart />}
              onClick={() => router.push('/compras')}
              color="success"
            >
              Compras Mercado
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setShowFinanceSetup(true)}
              color="primary"
            >
              Reconfigurar Presupuesto
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Person />}
              onClick={() => setShowEditProfile(true)}
            >
              Editar Perfil
            </Button>
            <Button variant="outlined" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>
        </Box>

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
        
        <Grid item xs={12}>
          <RecentTransactions />
        </Grid>
      </Grid>
      
      {/* Diálogos */}
      <EditProfileDialog 
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </Container>
    </AuthGuard>
  );
}
