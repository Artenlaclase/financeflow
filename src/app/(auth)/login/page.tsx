"use client";

import LoginForm from '../../../components/shared/Auth/LoginForm';
import AuthGuard from '../../../components/shared/Auth/AuthGuard';
import { Container, Paper, Box } from '@mui/material';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <LoginForm />
          </Paper>
        </Box>
      </Container>
    </AuthGuard>
  );
}
