'use client';

import { memo, useMemo } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, Receipt } from '@mui/icons-material';
import { AnalyticsSkeleton } from '../shared/Skeletons/AnalyticsSkeleton';
import { useAnalyticsOptimized } from '@/hooks/useAnalyticsOptimized';

interface AnalyticsSummaryProps {
  selectedPeriod: string;
  selectedYear: number;
  selectedMonth?: number;
}

/**
 * Componente memoizado para mostrar resumen de analytics
 * Previene re-renders innecesarios cuando props no cambian
 */
const AnalyticsSummaryContent = memo(
  ({ selectedPeriod, selectedYear, selectedMonth, totalIncome, totalExpenses, balance, fixedIncome, fixedExpenses, transactionIncome, transactionExpenses, loading, error }: any) => {
    if (loading) {
      return <AnalyticsSkeleton />;
    }

    if (error) {
      return (
        <Card sx={{ mb: 4, backgroundColor: '#fff3cd' }}>
          <CardContent>
            <Typography color="error">⚠️ {error}</Typography>
          </CardContent>
        </Card>
      );
    }

    const summaryCards = [
      {
        title: 'Ingresos Totales',
        value: totalIncome,
        icon: <TrendingUp />,
        color: 'success.main',
        bgColor: 'success.light',
        subtitle: `Fijos: $${fixedIncome.toLocaleString()} | Variables: $${transactionIncome.toLocaleString()}`
      },
      {
        title: 'Gastos Totales',
        value: totalExpenses,
        icon: <TrendingDown />,
        color: 'error.main',
        bgColor: 'error.light',
        subtitle: `Fijos: $${fixedExpenses.toLocaleString()} | Variables: $${transactionExpenses.toLocaleString()}`
      },
      {
        title: 'Balance',
        value: balance,
        icon: <AccountBalance />,
        color: balance >= 0 ? 'success.main' : 'error.main',
        bgColor: balance >= 0 ? 'success.light' : 'error.light',
        subtitle: balance >= 0 ? 'Superávit' : 'Déficit'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.bgColor} 0%, white 100%)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: card.color, mr: 2, display: 'flex' }}>
                    {card.icon}
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ${card.value.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  },
  (prevProps, nextProps) => {
    // Retornar true si props son iguales (no hacer re-render)
    // Retornar false si props cambiaron (hacer re-render)
    return (
      prevProps.selectedPeriod === nextProps.selectedPeriod &&
      prevProps.selectedYear === nextProps.selectedYear &&
      prevProps.selectedMonth === nextProps.selectedMonth &&
      prevProps.loading === nextProps.loading &&
      prevProps.totalIncome === nextProps.totalIncome &&
      prevProps.totalExpenses === nextProps.totalExpenses &&
      prevProps.balance === nextProps.balance
    );
  }
);

AnalyticsSummaryContent.displayName = 'AnalyticsSummaryContent';

/**
 * Wrapper del componente que maneja el hook y props memoizadas
 */
export default memo(function AnalyticsSummary({
  selectedPeriod,
  selectedYear,
  selectedMonth
}: AnalyticsSummaryProps) {
  const analyticsData = useAnalyticsOptimized(selectedPeriod, selectedYear, selectedMonth);

  // Memoizar props para pasar al componente de contenido
  const contentProps = useMemo(
    () => ({
      selectedPeriod,
      selectedYear,
      selectedMonth,
      totalIncome: analyticsData.totalIncome,
      totalExpenses: analyticsData.totalExpenses,
      balance: analyticsData.balance,
      fixedIncome: analyticsData.totalIncome * 0.5, // Aproximado, ajusta según tu lógica
      fixedExpenses: analyticsData.totalExpenses * 0.5,
      transactionIncome: analyticsData.totalIncome * 0.5,
      transactionExpenses: analyticsData.totalExpenses * 0.5,
      loading: analyticsData.loading,
      error: analyticsData.error
    }),
    [selectedPeriod, selectedYear, selectedMonth, analyticsData]
  );

  return <AnalyticsSummaryContent {...contentProps} />;
});
