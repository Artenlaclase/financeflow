"use client";

import RegisterForm from '../../../components/shared/Auth/RegisterForm';
import AuthGuard from '../../../components/shared/Auth/AuthGuard';
import { Container, Paper, Box } from '@mui/material';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <RegisterForm />
          </Paper>
        </Box>
      </Container>
    </AuthGuard>
  );
}
