"use client";

import { Container, Typography, Box, Button, Grid, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
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

  const handleCompraCompleta = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <AuthGuard requireAuth={true} requireFinanceSetup={true}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/dashboard')}
            variant="outlined"
          >
            Volver al Dashboard
          </Button>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCart />
              Compras de Supermercado
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Registra tus compras del supermercado y mantén control de tus gastos en alimentación
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<ShoppingCart />}
            onClick={() => setShowForm(true)}
            size="large"
          >
            Nueva Compra
          </Button>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
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
          onClose={() => setShowForm(false)}
          onComplete={handleCompraCompleta}
        />
      </Container>
    </AuthGuard>
  );
}
