"use client";

import { Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalyticsSimplified';

interface MonthlyTrendChartProps {
  selectedPeriod: string;
  selectedYear: number;
}

export default function MonthlyTrendChart({ selectedPeriod, selectedYear }: MonthlyTrendChartProps) {
  const { data, loading, error } = useAnalytics(selectedPeriod, selectedYear);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (data.monthlyData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos suficientes para mostrar la tendencia
        </Typography>
      </Box>
    );
  }

  // Calcular estadísticas
  const avgIncome = data.monthlyData.reduce((sum, month) => sum + month.income, 0) / data.monthlyData.length;
  const avgExpenses = data.monthlyData.reduce((sum, month) => sum + month.expenses, 0) / data.monthlyData.length;
  const bestMonth = data.monthlyData.reduce((best, month) => 
    month.balance > best.balance ? month : best
  );
  const worstMonth = data.monthlyData.reduce((worst, month) => 
    month.balance < worst.balance ? month : worst
  );

  return (
    <Box sx={{ width: '100%', height: '400px', overflow: 'auto' }}>
      {/* Tabla de datos mensuales */}
      <TableContainer component={Paper} sx={{ maxHeight: '300px' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mes</TableCell>
              <TableCell align="right">Ingresos</TableCell>
              <TableCell align="right">Gastos</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.monthlyData.map((month, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {month.month}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ color: 'success.main', fontWeight: 'bold' }}
                >
                  ${month.income.toLocaleString()}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ color: 'error.main', fontWeight: 'bold' }}
                >
                  ${month.expenses.toLocaleString()}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    color: month.balance >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold' 
                  }}
                >
                  ${month.balance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Estadísticas resumidas */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
          <Typography variant="caption" color="text.secondary">
            Ingreso Promedio
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            ${avgIncome.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
          <Typography variant="caption" color="text.secondary">
            Gasto Promedio
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            ${avgExpenses.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
          <Typography variant="caption" color="text.secondary">
            Mejor Mes
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            {bestMonth.month}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
          <Typography variant="caption" color="text.secondary">
            Peor Mes
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            {worstMonth.month}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
