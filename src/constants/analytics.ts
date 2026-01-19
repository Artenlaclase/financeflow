/**
 * Constantes y configuración para módulo de Analytics
 */

// Opciones de período de tiempo disponibles
export const PERIOD_OPTIONS = [
  { value: 'thisMonth', label: 'Este Mes' },
  { value: 'lastMonth', label: 'Mes Anterior' },
  { value: 'last3Months', label: 'Últimos 3 Meses' },
  { value: 'last6Months', label: 'Últimos 6 Meses' },
  { value: 'thisYear', label: 'Este Año' },
  { value: 'custom', label: 'Personalizado' }
] as const;

// Etiquetas de meses en español
export const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
] as const;

// Colores para categorías de gastos
export const CATEGORY_COLORS: Record<string, string> = {
  // Gastos fijos
  'Vivienda (Fijo)': '#FF6384',
  'Telefonía (Fijo)': '#36A2EB',
  'Internet (Fijo)': '#FFCE56',
  'Tarjetas de Crédito (Fijo)': '#4BC0C0',
  'Préstamos (Fijo)': '#9966FF',
  'Seguros (Fijo)': '#FF9F40',
  // Gastos variables
  housing: '#FF6384',
  food: '#36A2EB',
  transport: '#FFCE56',
  entertainment: '#4BC0C0',
  utilities: '#9966FF',
  shopping: '#FF9F40',
  'Sin categoría': '#E0E0E0'
};

// Paleta de colores para gráficos
export const CHART_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF'
];

/**
 * Genera un array de años para seleccionar
 * @param yearsBack Número de años hacia atrás desde el actual
 * @returns Array de años
 */
export const generateYearOptions = (yearsBack: number = 5): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }, (_, i) => currentYear - i).sort();
};

// Validaciones
export const ANALYTICS_VALIDATION = {
  MAX_YEARS_BACK: 10,
  MIN_YEAR: 2000,
  MAX_FUTURE_YEARS: 0, // No permitir años futuros
} as const;

// Tipos de transacción
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  COMPRA: 'compra'
} as const;

// Intervalo de SWR para revalidación (en milisegundos)
export const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 60 segundos
  focusThrottleInterval: 300000 // 5 minutos
} as const;
