"use client";

import { Container, Typography, Box, Button, Grid } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowBack, ShoppingCart } from '@mui/icons-material';
import AuthGuard from '../../components/shared/Auth/AuthGuard';
import ComprasMercadoForm from '../../components/features/Forms/ComprasMercadoForm';
import HistorialCompras from '../../components/features/Compras/HistorialCompras';

export default function ComprasPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCompraCompleta = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
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

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <HistorialCompras refreshTrigger={refreshTrigger} />
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
