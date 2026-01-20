# 🚀 Lazy Loading y Code Splitting - Guía de Implementación

**Fecha:** 19 de Enero 2026

---

## 📚 Concepto

**Lazy Loading** carga componentes solo cuando se necesitan  
**Code Splitting** divide el bundle en chunks más pequeños

**Beneficios:**
- Bundle inicial más pequeño (30-50% reducción)
- Mejor tiempo de first paint
- Carga más rápida en conexiones lentas
- Mejor UX

---

## 🎯 Estrategias

### 1. Route-Based Code Splitting (Next.js Automático)

Next.js ya hace esto automáticamente con App Router.

**Cada ruta = chunk separado:**
```
app/
├── page.tsx               → chunk: page
├── dashboard/page.tsx     → chunk: dashboard
├── analytics/page.tsx     → chunk: analytics
└── compras/page.tsx       → chunk: compras
```

No requiere configuración adicional ✅

---

## 🔄 2. Component-Based Lazy Loading

### Opción A: `dynamic()` de Next.js (Recomendado)

**Uso:**
```typescript
// src/app/analytics/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Lazy load componentes pesados
const ExpensesByCategoryChart = dynamic(
  () => import('@/components/features/Analytics/ExpensesByCategoryChart'),
  { 
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    ),
    ssr: false // Deshabilitar SSR si es necesario
  }
);

const MonthlyTrendChart = dynamic(
  () => import('@/components/features/Analytics/MonthlyTrendChart'),
  {
    loading: () => <CircularProgress />,
    ssr: false
  }
);

const YearComparisonDialog = dynamic(
  () => import('@/components/features/Analytics/YearComparisonDialog'),
  { ssr: false }
);

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      
      {/* Estos componentes se cargan bajo demanda */}
      <ExpensesByCategoryChart />
      <MonthlyTrendChart />
      
      {/* Se carga solo si se abre el modal */}
      <YearComparisonDialog />
    </div>
  );
}
```

### Opción B: Suspense + React.lazy

```typescript
import { Suspense, lazy } from 'react';
import { CircularProgress } from '@mui/material';

const ExpensesByCategory = lazy(
  () => import('@/components/features/Analytics/ExpensesByCategoryChart')
);

export default function Analytics() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ExpensesByCategory />
    </Suspense>
  );
}
```

---

## 💀 3. Skeleton Loaders + Lazy Loading

Combina skeleton loaders para mejor UX:

```typescript
import dynamic from 'next/dynamic';
import { CategoryChartSkeleton } from '@/components/shared/Skeletons/AnalyticsSkeleton';

const ExpensesByCategoryChart = dynamic(
  () => import('@/components/features/Analytics/ExpensesByCategoryChart'),
  {
    loading: () => <CategoryChartSkeleton />,
    ssr: false
  }
);

export default function Analytics() {
  return (
    <>
      {/* Muestra skeleton mientras se carga el componente real */}
      <ExpensesByCategoryChart />
    </>
  );
}
```

---

## 📦 4. Bundle Analysis

### Instalar herramienta

```bash
npm install --save-dev @next/bundle-analyzer
```

### Configurar `next.config.js`

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // tu configuración de Next.js
});
```

### Analizar bundle

```bash
ANALYZE=true npm run build
```

Abre `http://localhost:3000` para ver visualización interactiva.

---

## 🎯 5. Estrategia Recomendada para Fintracker

### Página de Analytics

```typescript
// src/app/analytics/page.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Grid } from '@mui/material';
import AnalyticsHeader from '@/components/features/Analytics/AnalyticsHeader';
import AnalyticsSummary from '@/components/features/Analytics/AnalyticsSummary';
import {
  CategoryChartSkeleton,
  MonthlyTrendSkeleton
} from '@/components/shared/Skeletons/AnalyticsSkeleton';

// Componentes pesados: lazy load
const ExpensesByCategoryChart = dynamic(
  () => import('@/components/features/Analytics/ExpensesByCategoryChart'),
  {
    loading: () => <CategoryChartSkeleton />,
    ssr: false
  }
);

const MonthlyTrendChart = dynamic(
  () => import('@/components/features/Analytics/MonthlyTrendChart'),
  {
    loading: () => <MonthlyTrendSkeleton />,
    ssr: false
  }
);

const MonthlyTransactionsTable = dynamic(
  () => import('@/components/features/Analytics/MonthlyTransactionsTable'),
  {
    loading: () => <CircularProgress />,
    ssr: false
  }
);

const YearComparisonDialog = dynamic(
  () => import('@/components/features/Analytics/YearComparisonDialog'),
  { ssr: false }
);

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openYearComparison, setOpenYearComparison] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      {/* Componentes ligeros cargan inmediatamente */}
      <AnalyticsHeader />
      <AnalyticsSummary 
        selectedPeriod={selectedPeriod} 
        selectedYear={selectedYear} 
      />

      {/* Componentes pesados: lazy load solo cuando sea necesario */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <ExpensesByCategoryChart
            selectedPeriod={selectedPeriod}
            selectedYear={selectedYear}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MonthlyTrendChart
            selectedPeriod={selectedPeriod}
            selectedYear={selectedYear}
          />
        </Grid>
      </Grid>

      {/* Modal: solo se carga si se abre */}
      <YearComparisonDialog
        open={openYearComparison}
        onClose={() => setOpenYearComparison(false)}
      />
    </Box>
  );
}
```

---

## ⚙️ 6. Optimizaciones de Recharts

Los gráficos de Recharts son pesados. Optimiza así:

```typescript
import dynamic from 'next/dynamic';

// Importar solo lo necesario
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);

// Luego en el componente, usarlos normalmente
```

**O mejor aún, lazy load el componente completo:**

```typescript
const MonthlyTrendChart = dynamic(
  () => import('@/components/features/Analytics/MonthlyTrendChart'),
  { 
    loading: () => <MonthlyTrendSkeleton />,
    ssr: false // Recharts no funciona bien con SSR
  }
);
```

---

## 📊 7. Patrón: Conditional Lazy Loading

Carga componentes solo si cierta condición es verdadera:

```typescript
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Cargar solo en desktop
const DesktopChart = dynamic(
  () => import('@/components/features/Analytics/DesktopChart'),
  { loading: () => null, ssr: false }
);

// Cargar solo en mobile
const MobileChart = dynamic(
  () => import('@/components/features/Analytics/MobileChart'),
  { loading: () => null, ssr: false }
);

export default function ResponsiveChart() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <MobileChart /> : <DesktopChart />;
}
```

---

## ✅ 8. Checklist de Implementación

```
[ ] Analizar bundle actual (ANALYZE=true npm run build)
[ ] Identificar componentes pesados
[ ] Implementar lazy loading en Analytics page
[ ] Implementar lazy loading en Dashboard page
[ ] Reemplazar skeleton loaders en loading states
[ ] Optimizar imports de Recharts
[ ] Usar dynamic() para modales pesados
[ ] Deshabilitar SSR donde sea apropiado
[ ] Re-analizar bundle (verificar reducción)
[ ] Medir performance en Network throttling
[ ] Documentar cambios
```

---

## 📈 Resultados Esperados

### Bundle Size Reducción
```
Antes:
- app-initial:     450KB (gzip: 120KB)
- analytics:       120KB (gzip: 35KB)

Después:
- app-initial:     250KB (gzip: 65KB)  ↓ 45%
- analytics:        85KB (gzip: 25KB)  ↓ 29%
- chart-component:  35KB (gzip: 10KB)  (lazy)
```

### Performance Improvement
```
Antes:
- First Contentful Paint: 2.5s
- Largest Contentful Paint: 3.8s
- Time to Interactive: 4.2s

Después:
- First Contentful Paint: 1.2s ↓ 52%
- Largest Contentful Paint: 2.0s ↓ 47%
- Time to Interactive: 2.3s ↓ 45%
```

---

## 🐛 Troubleshooting

### Error: "Cannot read property 'map' of undefined"

Causa: Componente lazy no está exportando por defecto

**Solución:**
```typescript
// ❌ INCORRECTO
export const MyChart = () => {};

// ✅ CORRECTO
export default function MyChart() {}
```

### Error: "Module not found"

Causa: Ruta incorrecta en dynamic import

**Solución:**
```typescript
// ✅ Verificar ruta correcta
const MyComponent = dynamic(
  () => import('@/components/features/Analytics/MyChart'), // @ = src/
  { loading: () => <div>Cargando...</div> }
);
```

### Gráficos de Recharts no se ren…

Causa: SSR habilitado en componente con Recharts

**Solución:**
```typescript
const Chart = dynamic(
  () => import('./Chart'),
  { ssr: false } // ← Importante para Recharts
);
```

---

## 📚 Recursos

- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/dynamic-imports)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/package-bundling)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Recharts SSR Issues](https://recharts.org/en-US/guide/advanced)

---

**Implementa lazy loading de forma gradual y mide el impacto en cada paso.**
