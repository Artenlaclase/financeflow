"use client";

import { AuthProvider } from '../contexts/AuthContext';
import { FinanceProvider } from '../contexts/FinanceContext';
import { FinanceProfileProvider } from '../contexts/FinanceProfileContext';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../styles/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <FinanceProfileProvider>
          <FinanceProvider>
            {children}
          </FinanceProvider>
        </FinanceProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
