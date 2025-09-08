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
import MonthlyTransactionsTable from '../../components/features/Analytics/MonthlyTransactionsTable';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function AnalyticsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // Usar el hook de analytics
  const { data, loading, error } = useAnalytics(selectedPeriod, selectedYear, selectedMonth);

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

  const monthOptions = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  return (
    <AuthGuard requireAuth={true} requireFinanceSetup={true}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' }, 
          gap: 2,
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={handleBackToDashboard}
              sx={{ 
                alignSelf: { xs: 'flex-start', md: 'center' }
              }}
            >
              Volver al Dashboard
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              Análisis Financiero
            </Typography>
          </Box>
        </Box>

        {/* Debug info */}
        {error && (
          <Card sx={{ mb: 4, bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="h6" color="error">
                Error en Analytics
              </Typography>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </CardContent>
          </Card>
        )}
        
        {loading && (
          <Card sx={{ mb: 4, bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6">
                Cargando datos de análisis...
              </Typography>
            </CardContent>
          </Card>
        )}

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
              <Grid item xs={12} md={selectedPeriod === 'custom' ? 3 : 6}>
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
              {selectedPeriod === 'custom' && (
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Mes</InputLabel>
                    <Select
                      value={selectedMonth}
                      label="Mes"
                      onChange={(e) => setSelectedMonth(e.target.value as number)}
                    >
                      {monthOptions.map((name, idx) => (
                        <MenuItem key={name} value={idx}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Resumen estadístico */}
  <AnalyticsSummary selectedPeriod={selectedPeriod} selectedYear={selectedYear} selectedMonth={selectedMonth} />

        {/* Gráficos principales */}
        <Grid container spacing={3}>
          {/* Gastos por categoría */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: { xs: 'auto', lg: '500px' },
              minHeight: { xs: '400px', lg: '500px' }
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChart sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Gastos por Categoría
                  </Typography>
                </Box>
                <ExpensesByCategoryChart selectedPeriod={selectedPeriod} selectedYear={selectedYear} selectedMonth={selectedMonth} />
              </CardContent>
            </Card>
          </Grid>

          {/* Tendencia mensual */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: { xs: 'auto', lg: '500px' },
              minHeight: { xs: '400px', lg: '500px' }
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Tendencia Mensual
                  </Typography>
                </Box>
                <MonthlyTrendChart selectedPeriod={selectedPeriod} selectedYear={selectedYear} selectedMonth={selectedMonth} />
              </CardContent>
            </Card>
          </Grid>

          {/* Tabla de transacciones */}
          <Grid item xs={12}>
            <MonthlyTransactionsTable selectedPeriod={selectedPeriod} selectedYear={selectedYear} selectedMonth={selectedMonth} />
          </Grid>

          {/* Resumen anual */}
          <Grid item xs={12}>
            <Card sx={{ 
              height: { xs: 'auto', lg: '400px' },
              minHeight: { xs: '350px', lg: '400px' }
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BarChart sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
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
