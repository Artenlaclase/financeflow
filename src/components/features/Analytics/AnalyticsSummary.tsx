"use client";

import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, Receipt } from '@mui/icons-material';
import { useAnalytics } from '../../../hooks/useAnalytics';

interface AnalyticsSummaryProps {
  selectedPeriod: string;
  selectedYear: number;
}

export default function AnalyticsSummary({ selectedPeriod, selectedYear }: AnalyticsSummaryProps) {
  const { data, loading, error } = useAnalytics(selectedPeriod, selectedYear);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      title: 'Ingresos Totales',
      value: data.totalIncome,
      icon: <TrendingUp />,
      color: 'success.main',
      bgColor: 'success.light',
      subtitle: `Fijos: $${data.fixedIncomeTotal.toLocaleString()} | Variables: $${data.transactionIncomeTotal.toLocaleString()}`
    },
    {
      title: 'Gastos Totales',
      value: data.totalExpenses,
      icon: <TrendingDown />,
      color: 'error.main',
      bgColor: 'error.light',
      subtitle: `Fijos: $${data.fixedExpensesTotal.toLocaleString()} | Variables: $${data.transactionExpensesTotal.toLocaleString()}`
    },
    {
      title: 'Balance',
      value: data.balance,
      icon: <AccountBalance />,
      color: data.balance >= 0 ? 'success.main' : 'error.main',
      bgColor: data.balance >= 0 ? 'success.light' : 'error.light',
      subtitle: `${data.balance >= 0 ? 'Superávit' : 'Déficit'} del período`
    },
    {
      title: 'Transacciones',
      value: data.transactionCount,
      icon: <Receipt />,
      color: 'primary.main',
      bgColor: 'primary.light',
      isCount: true
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {summaryCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: card.bgColor,
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" color="text.secondary">
                  {card.title}
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: card.color,
                  fontWeight: 'bold'
                }}
              >
                {card.isCount 
                  ? card.value 
                  : `$${card.value.toLocaleString()}`
                }
              </Typography>
              
              {/* Mostrar subtítulo si existe */}
              {card.subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {card.subtitle}
                </Typography>
              )}
              
              {!card.isCount && !card.subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {getPeriodLabel(selectedPeriod)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case 'thisMonth':
      return 'Este mes';
    case 'lastMonth':
      return 'Mes anterior';
    case 'last3Months':
      return 'Últimos 3 meses';
    case 'last6Months':
      return 'Últimos 6 meses';
    case 'thisYear':
      return 'Este año';
    default:
      return 'Período seleccionado';
  }
}
