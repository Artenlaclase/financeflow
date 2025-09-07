"use client";

import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Chip, useMediaQuery, useTheme, Fade } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Convertir datos de categorías a formato para mostrar
  const chartData = Object.entries(data?.expensesByCategory || {}).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: (data?.totalExpenses || 0) > 0 ? ((amount / (data?.totalExpenses || 1)) * 100).toFixed(1) : '0'
  }));

  // Ordenar por valor descendente
  chartData.sort((a, b) => b.value - a.value);

  // Encontrar el máximo valor para calcular porcentajes visuales
  const maxValue = Math.max(...(chartData.length > 0 ? chartData.map(item => item.value) : [1]));

  // Verificar si hay contenido scrolleable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current && isMobile) {
        const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
        const hasMoreContent = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
        const isAtTop = scrollTop <= 5;
        
        setCanScrollDown(hasMoreContent && !isAtBottom);
        setCanScrollUp(hasMoreContent && !isAtTop);
      }
    };

    checkScrollable();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollable);
      return () => container.removeEventListener('scroll', checkScrollable);
    }
  }, [chartData, isMobile]);

  const handleScrollDownClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: 200,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollUpClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: -200,
        behavior: 'smooth'
      });
    }
  };

  // Condiciones de renderizado después de todos los hooks
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

  if (chartData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="body1" color="text.secondary">
          No hay gastos registrados en el período seleccionado
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: { xs: 'auto', lg: '400px' }, 
      maxHeight: { xs: '400px', lg: '400px' },
      position: 'relative'
    }}>
      {/* Container con scroll */}
      <Box 
        ref={scrollContainerRef}
        sx={{
          width: '100%',
          height: { xs: '400px', lg: '400px' },
          overflow: 'auto',
          position: 'relative',
          // Sombras para indicar contenido scrolleable
          background: isMobile ? `
            linear-gradient(white 30%, rgba(255,255,255,0)) 0 0,
            linear-gradient(rgba(255,255,255,0), white 70%) 0 100%,
            radial-gradient(50% 0, farthest-side, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 0,
            radial-gradient(50% 100%, farthest-side, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 100%
          ` : 'none',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 40px, 100% 40px, 100% 14px, 100% 14px',
          backgroundAttachment: 'local, local, scroll, scroll'
        }}
      >
        {/* Lista visual de categorías */}
        <List dense={!isMobile}>
          {chartData.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            const widthPercentage = (item.value / maxValue) * 100;
            
            return (
              <ListItem 
                key={item.name} 
                sx={{ 
                  py: isMobile ? 1.5 : 1,
                  px: isMobile ? 1 : 2,
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    gap: isMobile ? 1 : 0,
                    mb: 1 
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        fontSize: isMobile ? '0.875rem' : '0.875rem',
                        wordBreak: 'break-word'
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      flexShrink: 0
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.875rem' : '0.875rem'
                        }}
                      >
                        ${item.value.toLocaleString()}
                      </Typography>
                      <Chip 
                        label={`${item.percentage}%`} 
                        size="small" 
                        sx={{ 
                          backgroundColor: color, 
                          color: 'white',
                          fontSize: isMobile ? '0.75rem' : '0.75rem',
                          height: isMobile ? 24 : 24
                        }}
                      />
                    </Box>
                  </Box>
                  
                  {/* Barra visual */}
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 12 : 8,
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
        <Box sx={{ 
          mt: 2, 
          mx: isMobile ? 1 : 2,
          p: 2, 
          backgroundColor: 'background.default', 
          borderRadius: 1 
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            <strong>Total de gastos:</strong> ${(data?.totalExpenses || 0).toLocaleString()}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            <strong>Categorías:</strong> {chartData.length}
          </Typography>
        </Box>
      </Box>

      {/* Indicadores de scroll para móvil */}
      {isMobile && canScrollDown && (
        <Fade in={canScrollDown}>
          <Box
            onClick={handleScrollDownClick}
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 2,
              zIndex: 10,
              animation: 'bounce 2s infinite',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': {
                  transform: 'translateY(0)'
                },
                '40%': {
                  transform: 'translateY(-10px)'
                },
                '60%': {
                  transform: 'translateY(-5px)'
                }
              }
            }}
          >
            <KeyboardArrowDown />
          </Box>
        </Fade>
      )}

      {isMobile && canScrollUp && (
        <Fade in={canScrollUp}>
          <Box
            onClick={handleScrollUpClick}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'secondary.main',
              color: 'white',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 2,
              zIndex: 10,
              animation: 'bounceUp 2s infinite',
              '&:hover': {
                backgroundColor: 'secondary.dark'
              },
              '@keyframes bounceUp': {
                '0%, 20%, 50%, 80%, 100%': {
                  transform: 'translateY(0)'
                },
                '40%': {
                  transform: 'translateY(10px)'
                },
                '60%': {
                  transform: 'translateY(5px)'
                }
              }
            }}
          >
            <KeyboardArrowUp />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
