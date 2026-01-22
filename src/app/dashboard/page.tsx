"use client";

import { Container, Grid, Typography, Box, Paper, Button, IconButton, Tooltip, Card, CardContent, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useFinanceProfile } from '@/contexts/FinanceProfileContext';
import { useMonthlyReset } from '../../hooks/useMonthlyReset';
import BalanceCard from '../../components/features/Dashboard/BalanceCard';
import QuickActions from '../../components/features/Dashboard/QuickActions';
import RecentTransactions from '../../components/features/Dashboard/RecentTransactions';
import FixedExpensesCard from '../../components/features/Dashboard/FixedExpensesCard';
import FinanceSetupForm from '../../components/shared/Auth/FinanceSetupForm';
import EditProfileDialog from '../../components/shared/Auth/EditProfileDialog';
import MigrationButton from '../../components/features/Migration/MigrationButton';
import AuthGuard from '../../components/shared/Auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { Analytics, Edit, Person, ShoppingCart, Settings, Logout, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { getDisplayName, profile: userProfile } = useUserProfile();
  const { profile } = useFinanceProfile();
  const { currentMonth, currentYear } = useMonthlyReset();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showFinanceSetup, setShowFinanceSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    {
      label: 'Ver Análisis',
      icon: <Analytics />,
      action: () => router.push('/analytics'),
      variant: 'contained' as const,
      color: 'secondary' as const
    },
    {
      label: 'Compras Mercado',
      icon: <ShoppingCart />,
      action: () => router.push('/compras'),
      variant: 'contained' as const,
      color: 'success' as const
    },
    {
      label: 'Reconfigurar Presupuesto',
      icon: <Settings />,
      action: () => setShowFinanceSetup(true),
      variant: 'outlined' as const,
      color: 'primary' as const
    },
    {
      label: 'Editar Perfil',
      icon: <Person />,
      action: () => setShowEditProfile(true),
      variant: 'outlined' as const,
      color: 'inherit' as const
    },
    {
      label: 'Cerrar Sesión',
      icon: <Logout />,
      action: handleLogout,
      variant: 'outlined' as const,
      color: 'error' as const
    }
  ];

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
        {/* Header con saludo y título */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            {/* Saludo personalizado */}
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
            
            <Typography variant="body1" color="text.secondary">
              Aquí tienes un resumen de tu situación financiera
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' }, display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-end' }, alignItems: 'center' }}>
              <Typography variant="h5" component="h2">
                {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </Typography>
              <MigrationButton />
            </Box>
          </Grid>
        </Grid>

        {/* Sugerencia para completar perfil si no tiene nombre */}
        {!userProfile && (
          <Box sx={{ 
            bgcolor: 'info.light', 
            color: 'info.contrastText', 
            p: 2, 
            borderRadius: 1, 
            mb: 3,
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

        {/* Navegación */}
        {!isMobile ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuIcon />
                Navegación
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                flexWrap: 'wrap'
              }}>
                {menuItems.map((item, index) => (
                  <Button 
                    key={index}
                    variant={item.variant}
                    startIcon={item.icon}
                    onClick={item.action}
                    color={item.color}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        ) : (
          /* Mobile header with hamburger menu */
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            {/* <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              Menú
            </Typography> */}
            <IconButton
              edge="end"
              color="primary"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Mobile Drawer Menu */}
        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
        >
          <Box
            sx={{ 
              width: 280, 
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Menú
              </Typography>
              <IconButton onClick={handleMobileMenuClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant={item.variant}
                  color={item.color}
                  startIcon={item.icon}
                  onClick={() => {
                    item.action();
                    handleMobileMenuClose();
                  }}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    p: 2
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Drawer>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <BalanceCard />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <QuickActions />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FixedExpensesCard />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            px: { xs: 2, md: 0 }
          }}>
            <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 'none' } }}>
              <RecentTransactions />
            </Box>
          </Box>
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
