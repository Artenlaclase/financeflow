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
    if (!authLoading) {
      if (requireAuth && !user) {
        router.push('/login');
        return;
      }

      // Si no requiere auth pero el usuario está logueado, redirigir al dashboard
      if (!requireAuth && user) {
        router.push('/dashboard');
        return;
      }

      if (user && requireFinanceSetup && !profileLoading && !profile) {
        setShowSetup(true);
      } else {
        setShowSetup(false);
      }
    }
  }, [user, profile, authLoading, profileLoading, requireAuth, requireFinanceSetup, router]);

  const handleSetupComplete = () => {
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
