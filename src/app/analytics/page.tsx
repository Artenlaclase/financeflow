"use client";

import { Container, Grid, Typography, Box, Button, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowBack, TrendingUp, PieChart, BarChart } from '@mui/icons-material';
import AuthGuard from '../../components/shared/Auth/AuthGuard';
import ExpensesByCategoryChart from '../../components/features/Analytics/ExpensesByCategoryChart';
import MonthlyTrendChart from '../../components/features/Analytics/MonthlyTrendChart';
import AnnualOverviewChart from '../../components/features/Analytics/AnnualOverviewChart';
import AnalyticsSummary from '../../components/features/Analytics/AnalyticsSummary';

export default function AnalyticsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const periodOptions = [
    { value: 'thisMonth', label: 'Este Mes' },
    { value: 'lastMonth', label: 'Mes Anterior' },
    { value: 'last3Months', label: 'Últimos 3 Meses' },
    { value: 'last6Months', label: 'Últimos 6 Meses' },
    { value: 'thisYear', label: 'Este Año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearOptions.push(i);
  }

  return (
    <AuthGuard requireAuth={true} requireFinanceSetup={true}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={handleBackToDashboard}
            >
              Volver al Dashboard
            </Button>
            <Typography variant="h4" component="h1">
              Análisis Financiero
            </Typography>
          </Box>
        </Box>

        {/* Controles de filtro */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros de Análisis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={selectedPeriod}
                    label="Período"
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Año"
                    onChange={(e) => setSelectedYear(e.target.value as number)}
                  >
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Resumen estadístico */}
        <AnalyticsSummary selectedPeriod={selectedPeriod} selectedYear={selectedYear} />

        {/* Gráficos principales */}
        <Grid container spacing={3}>
          {/* Gastos por categoría */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '500px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChart sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Gastos por Categoría
                  </Typography>
                </Box>
                <ExpensesByCategoryChart selectedPeriod={selectedPeriod} selectedYear={selectedYear} />
              </CardContent>
            </Card>
          </Grid>

          {/* Tendencia mensual */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '500px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Tendencia Mensual
                  </Typography>
                </Box>
                <MonthlyTrendChart selectedPeriod={selectedPeriod} selectedYear={selectedYear} />
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen anual */}
          <Grid item xs={12}>
            <Card sx={{ height: '400px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BarChart sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Resumen Anual - {selectedYear}
                  </Typography>
                </Box>
                <AnnualOverviewChart selectedYear={selectedYear} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </AuthGuard>
  );
}
