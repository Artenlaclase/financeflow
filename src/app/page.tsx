"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useFinanceProfile } from '@/contexts/FinanceProfileContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Dashboard from './dashboard/page';
import FinanceSetupForm from '@/components/shared/Auth/FinanceSetupForm';
import { Container, Paper, Box } from '@mui/material';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useFinanceProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  // Show finance setup if user doesn't have a profile yet
  if (!profile) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <FinanceSetupForm 
              onComplete={() => router.push('/dashboard')}
              onSkip={() => router.push('/dashboard')}
            />
          </Paper>
        </Box>
      </Container>
    );
  }

  // Show dashboard if authenticated and has profile
  return <Dashboard />;
}