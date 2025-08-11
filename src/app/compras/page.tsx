"use client";

import { Container, Typography, Box, Button, Grid, Tabs, Tab } from '@mui/material';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowBack, ShoppingCart, Timeline, Receipt } from '@mui/icons-material';
import AuthGuard from '@/components/shared/Auth/AuthGuard';
import ComprasMercadoForm from '@/components/features/Forms/ComprasMercadoForm';
import HistorialCompras from '@/components/features/Compras/HistorialCompras';
import HistorialPrecios from '@/components/features/Compras/HistorialPrecios';

export default function ComprasPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // Usar useMemo para estabilizar las funciones
  const handlers = useMemo(() => ({
    handleCloseForm: () => setShowForm(false),
    handleCompraCompleta: () => {
      setShowForm(false);
      setRefreshTrigger(prev => prev + 1);
    },
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    }
  }), []);

  return (
    <AuthGuard requireAuth={true} requireFinanceSetup={true}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' }, 
          gap: 2, 
          mb: 4 
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/dashboard')}
            variant="outlined"
            sx={{ 
              alignSelf: { xs: 'flex-start', md: 'center' },
              mb: { xs: 2, md: 0 }
            }}
          >
            Volver al Dashboard
          </Button>
          
          <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h4"
              component="h1" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: { xs: 'center', md: 'flex-start' },
                gap: 1,
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              <ShoppingCart />
              Compras de Supermercado
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', md: '1rem' },
                mt: 1
              }}
            >
              Registra tus compras del supermercado y mantén control de tus gastos en alimentación
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            width: { xs: '100%', md: 'auto' }
          }}>
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => setShowForm(true)}
              size="large"
              sx={{
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Nueva Compra
            </Button>
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handlers.handleTabChange}>
            <Tab 
              icon={<Receipt />} 
              label="Historial de Compras" 
              iconPosition="start"
            />
            <Tab 
              icon={<Timeline />} 
              label="Historial de Precios" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {activeTab === 0 && (
              <HistorialCompras refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 1 && (
              <HistorialPrecios refreshTrigger={refreshTrigger} />
            )}
          </Grid>
        </Grid>

        {/* Formulario de nueva compra */}
        <ComprasMercadoForm
          open={showForm}
          onClose={handlers.handleCloseForm}
          onComplete={handlers.handleCompraCompleta}
        />
      </Container>
    </AuthGuard>
  );
}
