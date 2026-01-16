# Funcionalidad de Panorámica del Año Anterior

## 📋 Descripción
Se ha agregado una nueva funcionalidad a la página de Analytics que permite a los usuarios ver una comparativa detallada entre el año actual y el año anterior. Esta funcionalidad es especialmente útil en enero para revisar el desempeño del año pasado.

## ✨ Características Principales

### 1. **Botón de Acceso Rápido**
- Ubicado en el header de la página de Analytics
- Etiqueta: "📊 Panorámica [YYYY-1]" (ej: "Panorámica 2025")
- Diseño: Gradiente morado con icono de tendencia
- Accesible desde cualquier período/año seleccionado

### 2. **Diálogo Modal de Comparación**
Muestra las siguientes secciones:

#### A. **Tarjetas Comparativas (4 KPIs)**
1. **Ingresos**: Comparativa y cambio porcentual
2. **Gastos**: Comparativa y cambio porcentual
3. **Balance Neto**: Comparativa con cambio porcentual
4. **Tasa de Ahorro**: Comparativa en puntos porcentuales

Cada tarjeta muestra:
- Valor del año actual
- Cambio porcentual respecto al año anterior
- Icono indicador (tendencia up/down)
- Valor del año anterior para referencia

#### B. **Tabla Comparativa Mensual**
Matriz de 12 filas (meses) con columnas:
- Mes
- Ingresos año anterior
- Ingresos año actual
- Gastos año anterior
- Gastos año actual
- Balance año anterior
- Balance año actual

Características:
- Scrolleable para dispositivos pequeños
- Filas hover para mejor legibilidad
- Colores según corresponda (verde ingresos, rojo gastos)
- Resaltado del balance año actual

#### C. **Análisis e Insights**
Cuatro tarjetas con análisis narrativo:
1. **Ingresos**: Interpretación del cambio porcentual
2. **Gastos**: Evaluación y recomendaciones
3. **Balance Anual**: Análisis de mejora/deterioro
4. **Capacidad de Ahorro**: Perspectiva sobre hábitos de ahorro

### 3. **Funcionalidad de Descarga**
- Botón "Descargar Reporte"
- Genera archivo TXT con:
  - Resumen ejecutivo de cambios
  - Comparativa de ingresos, gastos y balance
  - Tasas de ahorro comparadas
  - Timestamp de generación
- Formato: `panoramica-YYYY-YYYY.txt`

## 🔧 Implementación Técnica

### Archivos Creados

#### 1. **YearComparisonDialog.tsx**
```typescript
// Ubicación: src/components/features/Analytics/YearComparisonDialog.tsx
// Props:
// - open: boolean                 // Estado del diálogo
// - currentYear: number           // Año actual (para calcular anterior)
// - onClose: () => void           // Callback al cerrar
```

**Funcionalidades Internas:**
- Cálculo automático de año anterior
- Obtención de datos para ambos años usando `useAnalytics`
- Cálculo de métricas comparativas (cambios porcentuales)
- Generación de insights automáticos
- Exportación a archivo TXT

### Cambios en Archivos Existentes

#### 1. **src/app/analytics/page.tsx**
```typescript
// Cambios:
// 1. Importar YearComparisonDialog
// 2. Agregar estado: const [openYearComparison, setOpenYearComparison] = useState(false);
// 3. Agregar botón en header con onClick={() => setOpenYearComparison(true)}
// 4. Renderizar componente al final: 
//    <YearComparisonDialog 
//      open={openYearComparison}
//      currentYear={selectedYear}
//      onClose={() => setOpenYearComparison(false)}
//    />
```

## 🎨 Diseño y UX

### Colores y Estilos
- **Header**: Fondo azul primario (primary.main)
- **Botón**: Gradiente morado (667eea → 764ba2)
- **Tarjetas**: Blanco con bordes, sombra ligera
- **Ingresos**: Verde (success.main)
- **Gastos**: Rojo (error.main)
- **Balance Positivo**: Verde
- **Balance Negativo**: Rojo

### Responsive Design
- **XS**: Una columna, botón debajo del título
- **MD**: Dos columnas para tarjetas
- **LG**: Cuatro columnas para tarjetas
- Tabla scrolleable en dispositivos pequeños

## 📊 Flujo de Datos

```
AnalyticsPage (estado year)
    ↓
YearComparisonDialog (abre)
    ↓
useAnalytics(period='thisYear', year=2025)  →  previousYearData
useAnalytics(period='thisYear', year=2026)  →  currentYearData
    ↓
Cálculo de métricas (useMemo)
    ↓
Renderizado de tarjetas, tabla e insights
    ↓
Exportación (opcional)
```

## 🚀 Casos de Uso

### Caso 1: Usuario Básico
1. Accede a Analytics
2. Hace clic en "Panorámica 2025"
3. Ve comparativa de años automáticamente
4. Entiende cambios en su situación financiera

### Caso 2: Usuario Avanzado
1. Selecciona "Custom" con un mes específico
2. Abre comparativa para ver tendencias
3. Descarga reporte para documentación

### Caso 3: Análisis de Tendencias
1. Usa el diálogo para identificar patrones
2. Revisa cambios porcentuales
3. Lee insights para tomar decisiones

## ⚙️ Configuración y Personalización

### Variables Ajustables
Actualmente, no hay variables de configuración. Si deseas personalizar:

1. **Año fijo**: Cambiar `const previousYear = currentYear - 1` a `const previousYear = 2025`
2. **Número de años anteriores**: Agregar parámetro `yearsBack` al diálogo
3. **Formato de descarga**: Modificar `handleDownloadReport()` para PDF/Excel

## 🔐 Seguridad y Permisos

- Hereda permisos de AuthGuard (requiere usuario autenticado)
- Requiere `requireFinanceSetup={true}`
- Solo accede a datos del usuario autenticado (userId en Firestore)
- Sin datos sensibles expuestos en descarga

## 📈 Métricas Calculadas

### Cálculos Implementados
1. **Cambio de Ingresos**: `(actual - anterior) / anterior * 100`
2. **Cambio de Gastos**: `(actual - anterior) / anterior * 100`
3. **Cambio de Balance**: `(actual - anterior) / |anterior| * 100`
4. **Tasa de Ahorro**: `balance / ingresos * 100`
5. **Cambio en Tasa de Ahorro**: Diferencia en puntos porcentuales

### Validaciones
- Si ingresos anteriores = 0, cambio = 0%
- Si balance anterior = 0, cambio = 0%
- Color rojo para gastos, verde para ingresos

## 🐛 Consideraciones y Limitaciones

### Limitaciones Actuales
1. **Un año atrás**: Solo compara con el año inmediatamente anterior
2. **Año completo**: No soporta períodos parciales en la comparativa
3. **Descarga básica**: Formato TXT simple, no PDF/Excel
4. **Gastos fijos**: Se duplican si el perfil cambió entre años

### Mejoras Futuras Posibles
1. Soportar múltiples años atrás (selector)
2. Exportación a PDF con gráficos
3. Comparativa de categorías de gastos
4. Análisis de tendencias (3 años mínimo)
5. Notificaciones de cambios significativos
6. Gráficos de comparación visual

## 🧪 Testing Manual

### Pasos para Validar
1. ✅ Acceder a Analytics
2. ✅ Hacer clic en "Panorámica [YYYY-1]"
3. ✅ Verificar que se carguen datos de ambos años
4. ✅ Validar cálculos de cambios porcentuales
5. ✅ Revisar tabla mensual completa
6. ✅ Leer insights generados
7. ✅ Descargar reporte y verificar contenido
8. ✅ Probar en dispositivos móviles (responsive)
9. ✅ Validar con usuario sin datos en año anterior (graceful degradation)

## 📝 Notas para Desarrolladores

- El componente usa `useMemo` para evitar recálculos innecesarios
- El diálogo es standalone y reutilizable
- Compatibilidad con modo responsive
- Sin dependencias externas adicionales
- Usa MUI theming existente

## 🔄 Integración Futura

Este componente está preparado para:
- Agregar exportación PDF
- Integración con reporte mensual automático
- Notificaciones basadas en cambios
- Dashboard ejecutivo anual

---

**Versión**: 1.0
**Fecha**: 16 de enero de 2026
**Componentes Afectados**: 1 nuevo, 1 modificado
**Status**: ✅ Implementado y Listo para Testing
