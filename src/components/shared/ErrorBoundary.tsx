'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar errores de React y mostrar UI alternativa
 * Previene que toda la app se rompa por un error en un componente
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error para debugging
    logger.error('❌ Error capturado por ErrorBoundary:', error, errorInfo);

    // Llamar callback si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback custom si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI por defecto para errores
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 2
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: '3rem',
                color: 'error.main',
                mb: 2
              }}
            />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Algo salió mal
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Disculpa, ocurrió un error inesperado. Por favor intenta de nuevo.
            </Typography>
            {this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'left',
                  mb: 2
                }}
              >
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              sx={{ mt: 2 }}
            >
              Intentar de nuevo
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
