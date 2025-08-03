import { AuthProvider } from '../contexts/AuthContext';
import { FinanceProvider } from '../contexts/FinanceContext';
import type { AppProps } from 'next/app';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../styles/theme';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <FinanceProvider>
          <Component {...pageProps} />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;