'use client';

import { Box, Container, Typography } from '@mui/material';
import MigrationTool from '@/components/features/Migration/MigrationTool';

export default function MigrationPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Panel de Migración de Datos
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Herramienta administrativa para migrar datos legacy
        </Typography>
        
        <MigrationTool />
      </Box>
    </Container>
  );
}
