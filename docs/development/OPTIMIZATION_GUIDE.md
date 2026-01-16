# 🚀 Guía de Optimización - Módulo Analytics

## Introducción
Este documento proporciona recomendaciones de optimización basadas en la revisión de código detallada del módulo Analytics. Están priorizadas por impacto y complejidad.

---

## ⭐ Optimizaciones de Alta Prioridad

### 1. Refactorizar useAnalytics.ts

**Problema**: Archivo de 339 líneas con lógica acoplada
**Impacto**: Alto
**Esfuerzo**: 4-6 horas

#### Solución Propuesta: Dividir en Funciones Especializadas

**Paso 1**: Crear `lib/analytics/utils.ts`

```typescript
// src/lib/analytics/utils.ts

export const getDateFromTimestamp = (timestamp: any): Date => {
  return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
};

export const getMonthsDifference = (start: Date, end: Date): number => {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months + 1;
};

export const getDaysDifference = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculateSavingsRate = (balance: number, income: number): number => {
  if (income === 0) return 0;
  return (balance / income) * 100;
};

export const FIXED_EXPENSE_MAPPING = {
  housing: 'Vivienda (Fijo)',
  phone: 'Telefonía (Fijo)',
  internet: 'Internet (Fijo)',
  creditCards: 'Tarjetas de Crédito (Fijo)',
  loans: 'Préstamos (Fijo)',
  insurance: 'Seguros (Fijo)'
} as const;

export const buildFixedExpensesMap = (
  fixedExpenses: Record<string, number>,
  monthsInPeriod: number
): Record<string, number> => {
  const result: Record<string, number> = {};
  
  Object.entries(FIXED_EXPENSE_MAPPING).forEach(([key, label]) => {
    const amount = fixedExpenses[key];
    if (amount > 0) {
      result[label] = amount * monthsInPeriod;
    }
  });
  
  return result;
};
```

**Paso 2**: Actualizar `useAnalytics.ts`

```typescript
// src/hooks/useAnalytics.ts (refactorizado)

import {
  getDateFromTimestamp,
  getMonthsDifference,
  calculatePercentageChange,
  calculateSavingsRate,
  buildFixedExpensesMap
} from '../lib/analytics/utils';

// Ahora es mucho más legible y mantenible
const fetchAnalyticsData = async () => {
  // ... código reducido
  
  const expensesByCategory: Record<string, number> = {};
  
  // Gastos variables
  expensesData.forEach((expense: any) => {
    const category = expense.category || 'Sin categoría';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
  });
  
  // Gastos fijos - mucho más limpio
  if (profile && fixedExpensesForPeriod > 0) {
    Object.assign(
      expensesByCategory,
      buildFixedExpensesMap(profile.fixedExpenses, expensesMonthsInPeriod)
    );
  }
  
  // ... resto del código
};
```

**Beneficios**:
- ✅ Funciones reutilizables
- ✅ Más fácil de testear
- ✅ Código más legible
- ✅ Menos duplicación

---

### 2. Agregar Validación de Año Futuro

**Problema**: Usuario puede seleccionar 2027+ causando datos inconsistentes
**Impacto**: Medio
**Esfuerzo**: 30 minutos

#### Solución

```typescript
// src/lib/analytics/validators.ts

export const isValidAnalyticsYear = (year: number, maxYearsBack: number = 5): boolean => {
  const currentYear = new Date().getFullYear();
  return year <= currentYear && year >= currentYear - maxYearsBack;
};

export const getValidYearOptions = (yearsBack: number = 5): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }, (_, i) => currentYear - i);
};

export const constrainYear = (year: number, yearsBack: number = 5): number => {
  const validYears = getValidYearOptions(yearsBack);
  return validYears.includes(year) ? year : validYears[0];
};
```

#### Uso en Page

```typescript
// src/app/analytics/page.tsx

const yearOptions = getValidYearOptions(5);

const handleYearChange = (newYear: number) => {
  if (isValidAnalyticsYear(newYear, 5)) {
    setSelectedYear(newYear);
  } else {
    // Mostrar error o usar año válido más cercano
    setSelectedYear(constrainYear(newYear, 5));
  }
};
```

---

## 🎯 Optimizaciones de Prioridad Media

### 3. Memoización de Componentes

**Problema**: Componentes se re-renderizan innecesariamente
**Impacto**: Bajo (visible solo con muchas transacciones)
**Esfuerzo**: 1-2 horas

#### Solución

```typescript
// src/components/features/Analytics/AnalyticsSummary.tsx

const AnalyticsSummaryMemo = React.memo(AnalyticsSummary, (prevProps, nextProps) => {
  // No re-renderizar si los props son iguales
  return (
    prevProps.selectedPeriod === nextProps.selectedPeriod &&
    prevProps.selectedYear === nextProps.selectedYear &&
    prevProps.selectedMonth === nextProps.selectedMonth
  );
});

export default AnalyticsSummaryMemo;
```

O más simple con `useMemo` en el parent:

```typescript
// src/app/analytics/page.tsx

const analyticsComponentProps = useMemo(() => ({
  selectedPeriod,
  selectedYear,
  selectedMonth
}), [selectedPeriod, selectedYear, selectedMonth]);

// Usar en componentes
<AnalyticsSummary {...analyticsComponentProps} />
```

---

### 4. Optimizar Consultas a Firestore

**Problema**: Se obtienen TODAS las transacciones y se filtran en cliente
**Impacto**: Altísimo para usuarios con +1000 transacciones
**Esfuerzo**: 4-6 horas

#### Solución

```typescript
// src/hooks/useAnalyticsOptimized.ts

const fetchAnalyticsData = async () => {
  if (!user) return;

  try {
    const { startDate, endDate } = getDateRange(selectedPeriod, selectedYear, selectedMonth);
    
    // ✅ ANTES: Obtener todo y filtrar
    // const transactionsQuery = query(
    //   collection(db, 'transactions'),
    //   where('userId', '==', user.uid)
    // );
    
    // ✅ AHORA: Filtrar en Firestore (mucho más eficiente)
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log('📊 Fetched', transactionsSnapshot.size, 'transactions (filtered in Firestore)');
    
    // ... resto del código sin filtrado manual
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    setError('Error al cargar los datos de análisis');
  }
};
```

**Requisitos**: Crear índices compuestos en Firestore

```
Collection: transactions
Index 1:
  - userId (Ascending)
  - date (Descending)

Index 2:
  - userId (Ascending)
  - date (Ascending)
  - date (Descending)
```

---

### 5. Agregar Logging Condicional

**Problema**: Demasiados `console.log()` en producción
**Impacto**: Bajo (pero buena práctica)
**Esfuerzo**: 1 hora

#### Solución

```typescript
// src/lib/logger.ts

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) console.log('🔍', message, data);
  },
  info: (message: string, data?: any) => {
    if (isDev) console.log('ℹ️', message, data);
  },
  warn: (message: string, data?: any) => {
    console.warn('⚠️', message, data);
  },
  error: (message: string, error?: any) => {
    console.error('❌', message, error);
  }
};

// Uso en useAnalytics.ts
logger.debug('📊 Analytics date range:', { startDate, endDate });
logger.info('📊 Fetching transactions from global collection...');
```

---

## 🎨 Optimizaciones de UI/UX

### 6. Agregar Skeleton Loaders

**Problema**: Pantalla en blanco mientras carga
**Impacto**: Mejora percepción de velocidad
**Esfuerzo**: 2-3 horas

#### Solución

```typescript
// src/components/features/Analytics/AnalyticsSummarySkeleton.tsx

import { Grid, Card, CardContent, Skeleton, Box } from '@mui/material';

export default function AnalyticsSummarySkeleton() {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
```

Uso:

```typescript
// En AnalyticsSummary.tsx
if (loading) {
  return <AnalyticsSummarySkeleton />;
}
```

---

### 7. Paginación en Tabla de Transacciones

**Problema**: Tabla puede tener cientos de filas
**Impacto**: Mejora performance con muchos datos
**Esfuerzo**: 2-3 horas

#### Solución

```typescript
// Agregar a MonthlyTransactionsTable.tsx

import { TablePagination } from '@mui/material';
import { useState } from 'react';

export default function MonthlyTransactionsTable(props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <TableContainer>
        <Table>
          {/* ... header */}
          <TableBody>
            {paginatedData.map((transaction) => (
              // ... render
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={transactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
}
```

---

## 📝 Optimizaciones de Código

### 8. Extraer Constantes

**Problema**: Magic strings dispersos en código
**Impacto**: Facilita mantenimiento
**Esfuerzo**: 1-2 horas

#### Solución

```typescript
// src/lib/analytics/constants.ts

export const ANALYTICS_PERIODS = {
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  LAST_3_MONTHS: 'last3Months',
  LAST_6_MONTHS: 'last6Months',
  THIS_YEAR: 'thisYear',
  CUSTOM: 'custom'
} as const;

export const PERIOD_LABELS = {
  thisMonth: 'Este Mes',
  lastMonth: 'Mes Anterior',
  last3Months: 'Últimos 3 Meses',
  last6Months: 'Últimos 6 Meses',
  thisYear: 'Este Año',
  custom: 'Personalizado'
} as const;

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export const COLORS = {
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2'
} as const;

// Uso
import { PERIOD_LABELS, ANALYTICS_PERIODS } from '../lib/analytics/constants';

const periodOptions = Object.entries(PERIOD_LABELS).map(([value, label]) => ({
  value,
  label
}));
```

---

### 9. Agregar Comentarios JSDoc

**Problema**: Funciones sin documentación clara
**Impacto**: Mejora mantenibilidad
**Esfuerzo**: 1-2 horas

#### Solución

```typescript
/**
 * Obtiene el rango de fechas para un período de análisis específico
 * 
 * @param period - Período seleccionado (thisMonth, lastMonth, etc)
 * @param year - Año a analizar
 * @param month - Mes opcional para período custom
 * @returns Objeto con startDate y endDate
 * 
 * @example
 * const { startDate, endDate } = getDateRange('thisMonth', 2026);
 */
export const getDateRange = (
  period: string,
  year: number,
  month?: number
): { startDate: Date; endDate: Date } => {
  // ... implementación
};
```

---

## 🧪 Testing

### 10. Agregar Tests Unitarios

**Problema**: Coverage = 0%
**Impacto**: Altísimo para mantenimiento futuro
**Esfuerzo**: 6-8 horas

#### Setup Jest

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ]
};
```

#### Tests Ejemplo

```typescript
// src/lib/analytics/utils.test.ts

import {
  calculatePercentageChange,
  calculateSavingsRate,
  getMonthsDifference
} from './utils';

describe('Analytics Utilities', () => {
  describe('calculatePercentageChange', () => {
    it('should calculate percentage increase correctly', () => {
      const result = calculatePercentageChange(150, 100);
      expect(result).toBe(50);
    });

    it('should calculate percentage decrease correctly', () => {
      const result = calculatePercentageChange(50, 100);
      expect(result).toBe(-50);
    });

    it('should return 0 if previous value is 0', () => {
      const result = calculatePercentageChange(100, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate savings rate correctly', () => {
      const result = calculateSavingsRate(500, 2000);
      expect(result).toBe(25);
    });

    it('should return 0 if income is 0', () => {
      const result = calculateSavingsRate(100, 0);
      expect(result).toBe(0);
    });
  });
});
```

---

## 📊 Resumen de Optimizaciones

| # | Optimización | Prioridad | Esfuerzo | Impacto | Status |
|---|--------------|-----------|----------|---------|--------|
| 1 | Refactorizar useAnalytics | Alta | 4-6h | 🔴 Alto | ⏳ |
| 2 | Validar año futuro | Alta | 30min | 🟡 Medio | ⏳ |
| 3 | Memoización | Media | 1-2h | 🟢 Bajo | ⏳ |
| 4 | Optimizar Firestore | Media | 4-6h | 🔴 Alto | ⏳ |
| 5 | Logging condicional | Media | 1h | 🟢 Bajo | ⏳ |
| 6 | Skeleton loaders | Media | 2-3h | 🟡 Medio | ⏳ |
| 7 | Paginación | Baja | 2-3h | 🟡 Medio | ⏳ |
| 8 | Extraer constantes | Baja | 1-2h | 🟢 Bajo | ⏳ |
| 9 | JSDoc | Baja | 1-2h | 🟢 Bajo | ⏳ |
| 10 | Tests unitarios | Alta | 6-8h | 🔴 Alto | ⏳ |

---

## 🎯 Plan de Ejecución Recomendado

### Semana 1
- [ ] #2 Validar año futuro (30 min)
- [ ] #1 Refactorizar useAnalytics (4-6h)

### Semana 2
- [ ] #4 Optimizar Firestore (4-6h)
- [ ] #10 Comenzar tests unitarios (3-4h)

### Semana 3
- [ ] #10 Completar tests unitarios (3-4h)
- [ ] #5 Logging condicional (1h)
- [ ] #8 Extraer constantes (1-2h)

### Semana 4
- [ ] #6 Skeleton loaders (2-3h)
- [ ] #9 Agregar JSDoc (1-2h)

### Semana 5
- [ ] #3 Memoización (1-2h)
- [ ] #7 Paginación (2-3h)
- [ ] Testing e integración

---

## 📚 Referencias Útiles

- [Firebase Query Optimization](https://firebase.google.com/docs/firestore/query-data/queries)
- [React Performance Optimization](https://react.dev/reference/react/useMemo)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

**Documento creado**: 16 de enero de 2026  
**Versión**: 1.0  
**Prioridad Total Estimada**: ~30 horas de desarrollo
