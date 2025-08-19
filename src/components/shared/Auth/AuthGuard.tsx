"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinanceProfile } from '../../../contexts/FinanceProfileContext';
import FinanceSetupForm from './FinanceSetupForm';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireFinanceSetup?: boolean;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireFinanceSetup = true 
}: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useFinanceProfile();
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    console.log('🔍 AuthGuard useEffect ejecutado');
    console.log('Estados:', {
      authLoading,
      profileLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      requireAuth,
      requireFinanceSetup,
      showSetup
    });

    if (!authLoading) {
      if (requireAuth && !user) {
        console.log('🔄 Redirigiendo a login (no hay usuario)');
        router.push('/login');
        return;
      }

      // Si no requiere auth pero el usuario está logueado, redirigir al dashboard
      if (!requireAuth && user) {
        console.log('🔄 Redirigiendo a dashboard (usuario logueado en página pública)');
        router.push('/dashboard');
        return;
      }

      if (user && requireFinanceSetup && !profileLoading && !profile) {
        console.log('📋 Mostrando configuración financiera (usuario sin perfil)');
        setShowSetup(true);
      } else {
        console.log('✅ Permitiendo acceso normal');
        setShowSetup(false);
      }
    }
  }, [user?.uid, profile?.userId, authLoading, profileLoading, requireAuth, requireFinanceSetup, router]);

  const handleSetupComplete = () => {
    console.log('🎉 Setup completado, ocultando formulario');
    setShowSetup(false);
  };

  if (authLoading || profileLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando...
        </Typography>
      </Box>
    );
  }

  if (requireAuth && !user) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <Typography variant="h6">
          Redirigiendo al login...
        </Typography>
      </Box>
    );
  }

  if (showSetup) {
    return (
      <FinanceSetupForm 
        onComplete={handleSetupComplete}
      />
    );
  }

  return <>{children}</>;
}
