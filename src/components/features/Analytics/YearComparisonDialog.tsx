"use client";

import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { 
  Close, 
  TrendingUp, 
  TrendingDown, 
  CompareArrows,
  FileDownload
} from '@mui/icons-material';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMemo } from 'react';

interface YearComparisonDialogProps {
  open: boolean;
  currentYear: number;
  onClose: () => void;
}

export default function YearComparisonDialog({ open, currentYear, onClose }: YearComparisonDialogProps) {
  const previousYear = currentYear - 1;
  
  // Obtener datos del año actual y anterior
  const { data: currentYearData, loading: currentLoading } = useAnalytics('thisYear', currentYear);
  const { data: previousYearData, loading: previousLoading } = useAnalytics('thisYear', previousYear);

  const loading = currentLoading || previousLoading;

  // Calcular comparativas
  const comparisonMetrics = useMemo(() => {
    if (!currentYearData || !previousYearData) return null;

    const incomeChange = currentYearData.totalIncome - previousYearData.totalIncome;
    const incomeChangePercent = previousYearData.totalIncome > 0 
      ? ((incomeChange / previousYearData.totalIncome) * 100).toFixed(1)
      : '0';

    const expensesChange = currentYearData.totalExpenses - previousYearData.totalExpenses;
    const expensesChangePercent = previousYearData.totalExpenses > 0 
      ? ((expensesChange / previousYearData.totalExpenses) * 100).toFixed(1)
      : '0';

    const balanceChange = currentYearData.balance - previousYearData.balance;
    const balanceChangePercent = previousYearData.balance !== 0 
      ? ((balanceChange / Math.abs(previousYearData.balance)) * 100).toFixed(1)
      : '0';

    const savingsRateCurrent = currentYearData.totalIncome > 0 
      ? ((currentYearData.balance / currentYearData.totalIncome) * 100).toFixed(1)
      : '0';
    
    const savingsRatePrevious = previousYearData.totalIncome > 0 
      ? ((previousYearData.balance / previousYearData.totalIncome) * 100).toFixed(1)
      : '0';

    return {
      incomeChange,
      incomeChangePercent,
      expensesChange,
      expensesChangePercent,
      balanceChange,
      balanceChangePercent,
      savingsRateCurrent: parseFloat(savingsRateCurrent),
      savingsRatePrevious: parseFloat(savingsRatePrevious)
    };
  }, [currentYearData, previousYearData]);

  const getChangeColor = (value: number): string => {
    return value > 0 ? 'error.main' : 'success.main';
  };

  const getChangeIcon = (value: number) => {
    return value > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  const handleDownloadReport = () => {
    // Funcionalidad de descarga de reporte
    const reportContent = `
PANORÁMICA DE AÑOS: ${previousYear} vs ${currentYear}

====== COMPARATIVA DE INGRESOS ======
Año ${previousYear}: $${previousYearData?.totalIncome.toLocaleString()}
Año ${currentYear}: $${currentYearData?.totalIncome.toLocaleString()}
Cambio: ${comparisonMetrics?.incomeChangePercent}% (${(comparisonMetrics?.incomeChange ?? 0) > 0 ? '+' : ''}$${comparisonMetrics?.incomeChange?.toLocaleString()})

====== COMPARATIVA DE GASTOS ======
Año ${previousYear}: $${previousYearData?.totalExpenses.toLocaleString()}
Año ${currentYear}: $${currentYearData?.totalExpenses.toLocaleString()}
Cambio: ${comparisonMetrics?.expensesChangePercent}% (${(comparisonMetrics?.expensesChange ?? 0) > 0 ? '+' : ''}$${comparisonMetrics?.expensesChange?.toLocaleString()})

====== BALANCE NETO ======
Año ${previousYear}: $${previousYearData?.balance.toLocaleString()}
Año ${currentYear}: $${currentYearData?.balance.toLocaleString()}
Cambio: ${comparisonMetrics?.balanceChangePercent}% (${(comparisonMetrics?.balanceChange ?? 0) > 0 ? '+' : ''}$${comparisonMetrics?.balanceChange?.toLocaleString()})

====== TASA DE AHORRO ======
Año ${previousYear}: ${comparisonMetrics?.savingsRatePrevious}%
Año ${currentYear}: ${comparisonMetrics?.savingsRateCurrent}%

Reporte generado: ${new Date().toLocaleDateString('es-ES')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `panoramica-${previousYear}-${currentYear}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrows />
          <Typography variant="h6">
            Comparativa de Años: {previousYear} vs {currentYear}
          </Typography>
        </Box>
        <Button 
          color="inherit" 
          size="small"
          onClick={onClose}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !currentYearData || !previousYearData || !comparisonMetrics ? (
          <Alert severity="error">
            Error al cargar los datos de comparación
          </Alert>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Tarjetas de Comparación Principal */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Ingresos */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Ingresos {currentYear}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold', mb: 1 }}>
                      ${currentYearData.totalIncome.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getChangeColor(comparisonMetrics.incomeChange),
                          fontWeight: 'bold'
                        }}
                      >
                        {comparisonMetrics.incomeChangePercent}%
                      </Typography>
                      {getChangeIcon(comparisonMetrics.incomeChange)}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      vs {previousYear}: ${previousYearData.totalIncome.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gastos */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Gastos {currentYear}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold', mb: 1 }}>
                      ${currentYearData.totalExpenses.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getChangeColor(comparisonMetrics.expensesChange),
                          fontWeight: 'bold'
                        }}
                      >
                        {comparisonMetrics.expensesChangePercent}%
                      </Typography>
                      {getChangeIcon(comparisonMetrics.expensesChange)}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      vs {previousYear}: ${previousYearData.totalExpenses.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Balance */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Balance {currentYear}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: currentYearData.balance >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold', 
                        mb: 1 
                      }}
                    >
                      ${currentYearData.balance.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getChangeColor(comparisonMetrics.balanceChange),
                          fontWeight: 'bold'
                        }}
                      >
                        {comparisonMetrics.balanceChangePercent}%
                      </Typography>
                      {getChangeIcon(comparisonMetrics.balanceChange)}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      vs {previousYear}: ${previousYearData.balance.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tasa de Ahorro */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Tasa de Ahorro {currentYear}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: comparisonMetrics.savingsRateCurrent >= 20 ? 'success.main' : 
                               comparisonMetrics.savingsRateCurrent >= 10 ? 'warning.main' : 'error.main',
                        fontWeight: 'bold', 
                        mb: 1 
                      }}
                    >
                      {comparisonMetrics.savingsRateCurrent}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: comparisonMetrics.savingsRateCurrent > comparisonMetrics.savingsRatePrevious 
                            ? 'success.main' 
                            : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {(comparisonMetrics.savingsRateCurrent - comparisonMetrics.savingsRatePrevious).toFixed(1)}pp
                      </Typography>
                      {comparisonMetrics.savingsRateCurrent > comparisonMetrics.savingsRatePrevious 
                        ? <TrendingUp /> 
                        : <TrendingDown />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      vs {previousYear}: {comparisonMetrics.savingsRatePrevious}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Tabla de Comparación Mensual */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Comparativa Mensual
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Ingresos {previousYear}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Ingresos {currentYear}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Gastos {previousYear}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Gastos {currentYear}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Balance {previousYear}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Balance {currentYear}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previousYearData.monthlyData.map((month, index) => {
                    const currentMonth = currentYearData.monthlyData[index];
                    const balanceDiff = currentMonth.balance - month.balance;
                    
                    return (
                      <TableRow key={index} hover>
                        <TableCell>{month.month}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          ${month.income.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          ${currentMonth.income.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          ${month.expenses.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                          ${currentMonth.expenses.toLocaleString()}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: month.balance >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          ${month.balance.toLocaleString()}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: currentMonth.balance >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                            bgcolor: balanceDiff > 0 ? 'success.lighter' : 'error.lighter'
                          }}
                        >
                          ${currentMonth.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            {/* Análisis e Insights */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Análisis y Perspectivas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      📈 Ingresos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {comparisonMetrics.incomeChange > 0 
                        ? `Los ingresos aumentaron un ${comparisonMetrics.incomeChangePercent}% respecto al año anterior (+$${comparisonMetrics.incomeChange.toLocaleString()})`
                        : `Los ingresos disminuyeron un ${Math.abs(parseFloat(comparisonMetrics.incomeChangePercent))}% respecto al año anterior (-$${Math.abs(comparisonMetrics.incomeChange).toLocaleString()})`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      💰 Gastos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {comparisonMetrics.expensesChange > 0 
                        ? `Los gastos aumentaron un ${comparisonMetrics.expensesChangePercent}% respecto al año anterior (+$${comparisonMetrics.expensesChange.toLocaleString()}). Considera revisar tus hábitos de gasto.`
                        : `Excelente: Los gastos disminuyeron un ${Math.abs(parseFloat(comparisonMetrics.expensesChangePercent))}% respecto al año anterior (-$${Math.abs(comparisonMetrics.expensesChange).toLocaleString()})`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      🎯 Balance Anual
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {comparisonMetrics.balanceChange > 0 
                        ? `Tu balance mejoró un ${comparisonMetrics.balanceChangePercent}% (+$${comparisonMetrics.balanceChange.toLocaleString()}). ¡Excelente progreso!`
                        : `Tu balance disminuyó un ${Math.abs(parseFloat(comparisonMetrics.balanceChangePercent))}% (-$${Math.abs(comparisonMetrics.balanceChange).toLocaleString()}). Analiza qué cambió este año.`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      💾 Capacidad de Ahorro
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {comparisonMetrics.savingsRateCurrent > comparisonMetrics.savingsRatePrevious 
                        ? `Tu tasa de ahorro mejoró ${(comparisonMetrics.savingsRateCurrent - comparisonMetrics.savingsRatePrevious).toFixed(1)} puntos porcentuales. Vas en la dirección correcta.`
                        : `Tu tasa de ahorro bajó ${Math.abs(comparisonMetrics.savingsRateCurrent - comparisonMetrics.savingsRatePrevious).toFixed(1)} puntos porcentuales. Considera ajustar tu presupuesto.`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'grey.50', gap: 1 }}>
        <Button
          startIcon={<FileDownload />}
          variant="outlined"
          onClick={handleDownloadReport}
          disabled={loading}
        >
          Descargar Reporte
        </Button>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
