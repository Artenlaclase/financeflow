"use client";

import { Box, Typography, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalytics';

interface AnnualOverviewChartProps {
  selectedYear: number;
}

export default function AnnualOverviewChart({ selectedYear }: AnnualOverviewChartProps) {
  const { data, loading, error } = useAnalytics('thisYear', selectedYear);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Calcular métricas anuales
  const totalMonths = data.monthlyData.length;
  const activeMonths = data.monthlyData.filter(month => month.income > 0 || month.expenses > 0).length;
  const avgMonthlyIncome = totalMonths > 0 ? data.totalIncome / 12 : 0;
  const avgMonthlyExpenses = totalMonths > 0 ? data.totalExpenses / 12 : 0;
  const savingsRate = data.totalIncome > 0 ? ((data.balance / data.totalIncome) * 100).toFixed(1) : '0';
  
  // Encontrar el mes con mayor balance y menor balance
  const bestMonth = data.monthlyData.length > 0 
    ? data.monthlyData.reduce((best, month) => month.balance > best.balance ? month : best)
    : null;
  const worstMonth = data.monthlyData.length > 0 
    ? data.monthlyData.reduce((worst, month) => month.balance < worst.balance ? month : worst)
    : null;

  // Top 3 categorías de gastos
  const topCategories = Object.entries(data.expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <Box sx={{ width: '100%', height: '300px', overflow: 'auto' }}>
      <Grid container spacing={2}>
        {/* Métricas principales */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Resumen Anual {selectedYear}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Ingresos totales:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ${data.totalIncome.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Gastos totales:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    ${data.totalExpenses.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Balance neto:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: data.balance >= 0 ? 'success.main' : 'error.main' 
                    }}
                  >
                    ${data.balance.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tasa de ahorro:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: parseFloat(savingsRate) >= 20 ? 'success.main' : 
                             parseFloat(savingsRate) >= 10 ? 'warning.main' : 'error.main'
                    }}
                  >
                    {savingsRate}%
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Meses activos:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {activeMonths} de 12
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Promedios mensuales */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Promedios Mensuales
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Ingreso promedio:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ${avgMonthlyIncome.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Gasto promedio:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    ${avgMonthlyExpenses.toLocaleString()}
                  </Typography>
                </Box>
                
                {bestMonth && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Mejor mes:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {bestMonth.month}
                    </Typography>
                  </Box>
                )}
                
                {worstMonth && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Mes difícil:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {worstMonth.month}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top categorías de gastos */}
        {topCategories.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Principales Categorías de Gastos
                </Typography>
                
                <Grid container spacing={2}>
                  {topCategories.map(([category, amount], index) => {
                    const percentage = data.totalExpenses > 0 
                      ? ((amount / data.totalExpenses) * 100).toFixed(1) 
                      : '0';
                    
                    return (
                      <Grid item xs={12} sm={4} key={category}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            #{index + 1} {category}
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'error.main' }}>
                            ${amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentage}% del total
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
