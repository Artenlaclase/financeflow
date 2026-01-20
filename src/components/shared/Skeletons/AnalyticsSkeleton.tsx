'use client';

import { Skeleton, Grid, Card, CardContent, Box, Stack } from '@mui/material';

/**
 * Skeleton loader para la sección de resumen de analytics
 * Muestra placeholders mientras se cargan los datos
 */
export const AnalyticsSkeleton = () => (
  <Grid container spacing={3}>
    {[1, 2, 3, 4].map((i) => (
      <Grid item xs={12} sm={6} md={3} key={i}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ my: 2 }} />
            <Skeleton variant="text" width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/**
 * Skeleton loader para gráfico de gastos por categoría
 */
export const CategoryChartSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={300} />
    </CardContent>
  </Card>
);

/**
 * Skeleton loader para gráfico de tendencias mensuales
 */
export const MonthlyTrendSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={250} />
    </CardContent>
  </Card>
);

/**
 * Skeleton loader para tabla de transacciones mensuales
 */
export const TransactionsTableSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Stack spacing={1}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

/**
 * Skeleton loader completo para página de analytics
 */
export const AnalyticsPageSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />

    {/* Filtros */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Skeleton variant="rectangular" height={45} />
        </Grid>
      ))}
    </Grid>

    {/* Resumen */}
    <AnalyticsSkeleton />

    {/* Gráficos */}
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} md={6}>
        <CategoryChartSkeleton />
      </Grid>
      <Grid item xs={12} md={6}>
        <MonthlyTrendSkeleton />
      </Grid>
    </Grid>

    {/* Tabla */}
    <Box sx={{ mt: 3 }}>
      <TransactionsTableSkeleton />
    </Box>
  </Box>
);
