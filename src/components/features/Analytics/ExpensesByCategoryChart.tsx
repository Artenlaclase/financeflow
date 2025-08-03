"use client";

import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalytics';

interface ExpensesByCategoryChartProps {
  selectedPeriod: string;
  selectedYear: number;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

export default function ExpensesByCategoryChart({ selectedPeriod, selectedYear }: ExpensesByCategoryChartProps) {
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

  // Convertir datos de categorías a formato para mostrar
  const chartData = Object.entries(data.expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: data.totalExpenses > 0 ? ((amount / data.totalExpenses) * 100).toFixed(1) : '0'
  }));

  // Ordenar por valor descendente
  chartData.sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="body1" color="text.secondary">
          No hay gastos registrados en el período seleccionado
        </Typography>
      </Box>
    );
  }

  // Encontrar el máximo valor para calcular porcentajes visuales
  const maxValue = Math.max(...chartData.map(item => item.value));

  return (
    <Box sx={{ width: '100%', height: '400px', overflow: 'auto' }}>
      {/* Lista visual de categorías */}
      <List dense>
        {chartData.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          const widthPercentage = (item.value / maxValue) * 100;
          
          return (
            <ListItem key={item.name} sx={{ py: 1 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ${item.value.toLocaleString()}
                    </Typography>
                    <Chip 
                      label={`${item.percentage}%`} 
                      size="small" 
                      sx={{ backgroundColor: color, color: 'white' }}
                    />
                  </Box>
                </Box>
                
                {/* Barra visual */}
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${widthPercentage}%`,
                      height: '100%',
                      backgroundColor: color,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>
      
      {/* Resumen numérico */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          <strong>Total de gastos:</strong> ${data.totalExpenses.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          <strong>Categorías:</strong> {chartData.length}
        </Typography>
      </Box>
    </Box>
  );
}
