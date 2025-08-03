# 📊 Funcionalidad de Análisis Financiero

Se ha agregado una nueva página de análisis financiero que permite visualizar el balance anual y mensual con gráficos de gastos.

## ✨ Nuevas Características

### 📈 Página de Análisis (`/analytics`)
- **Acceso**: Nuevo botón "Ver Análisis" en el dashboard principal
- **Filtros avanzados**: Selección de período (este mes, mes anterior, últimos 3/6 meses, año completo)
- **Selector de año**: Para revisar datos históricos

### 📊 Componentes de Visualización

#### 1. **Resumen Estadístico**
- Ingresos totales del período
- Gastos totales del período
- Balance neto (ingresos - gastos)
- Número total de transacciones
- Indicadores visuales con colores (verde para positivo, rojo para negativo)

#### 2. **Gastos por Categoría**
- Visualización en lista con barras de progreso
- Porcentajes de cada categoría
- Colores distintivos para cada categoría
- Ordenamiento por monto (mayor a menor)

#### 3. **Tendencia Mensual**
- Tabla detallada con datos mes a mes
- Comparación de ingresos vs gastos
- Balance mensual calculado
- Estadísticas de promedios y mejores/peores meses

#### 4. **Resumen Anual**
- Métricas anuales consolidadas
- Tasa de ahorro calculada
- Promedios mensuales
- Top 3 categorías de gastos más importantes
- Identificación del mejor y peor mes del año

## 🛠️ Implementación Técnica

### Nuevos Archivos Creados:
- `src/app/analytics/page.tsx` - Página principal de análisis
- `src/hooks/useAnalytics.ts` - Hook personalizado para obtener datos analíticos
- `src/components/features/Analytics/` - Directorio con todos los componentes de análisis
  - `AnalyticsSummary.tsx` - Tarjetas de resumen
  - `ExpensesByCategoryChart.tsx` - Visualización de gastos por categoría
  - `MonthlyTrendChart.tsx` - Tabla de tendencias mensuales
  - `AnnualOverviewChart.tsx` - Resumen anual detallado

### Tecnologías Utilizadas:
- **Material-UI**: Para todos los componentes de interfaz
- **Firebase Firestore**: Para consultas de datos con filtros de fecha
- **React Hooks**: Para manejo de estado y efectos
- **TypeScript**: Para tipado estricto

### Funcionalidades del Hook `useAnalytics`:
- Consultas optimizadas a Firestore con filtros de fecha
- Cálculos automáticos de totales y promedios
- Agrupación de gastos por categoría
- Generación de datos mensuales organizados
- Manejo de errores y estados de carga

## 🎯 Características Destacadas

### 📅 Filtros Inteligentes
- **Este Mes**: Datos del mes actual
- **Mes Anterior**: Datos del mes pasado
- **Últimos 3/6 Meses**: Análisis de tendencias a corto/medio plazo
- **Este Año**: Análisis anual completo
- **Selector de Año**: Para revisar años anteriores

### 📈 Métricas Calculadas
- **Tasa de Ahorro**: (Balance / Ingresos Totales) × 100
- **Promedios Mensuales**: Ingresos y gastos promedio
- **Comparaciones**: Mejor vs peor mes del período
- **Distribución**: Porcentaje de cada categoría de gasto

### 🎨 Interfaz Intuitiva
- **Diseño Responsivo**: Funciona en desktop y móvil
- **Colores Semánticos**: Verde para ingresos, rojo para gastos, azul para balance
- **Feedback Visual**: Indicadores de carga y manejo de errores
- **Navegación Fácil**: Botón de regreso al dashboard

## 🚀 Cómo Usar

1. **Acceder**: Hacer clic en "Ver Análisis" desde el dashboard
2. **Filtrar**: Seleccionar el período y año deseado
3. **Analizar**: Revisar las diferentes secciones:
   - Resumen general en las tarjetas superiores
   - Distribución de gastos por categoría
   - Tendencias mensuales en la tabla
   - Métricas anuales en el resumen consolidado
4. **Navegar**: Usar el botón "Volver al Dashboard" para regresar

## 💡 Beneficios

- **Visión Completa**: Comprende mejor tus patrones de gasto
- **Toma de Decisiones**: Identifica categorías donde puedes reducir gastos
- **Seguimiento de Metas**: Monitorea tu tasa de ahorro
- **Análisis Histórico**: Compara diferentes períodos
- **Identificación de Tendencias**: Detecta mejoras o deterioros en tus finanzas

Esta funcionalidad transforma los datos financieros en información accionable, ayudando a tomar mejores decisiones financieras basadas en datos reales.
