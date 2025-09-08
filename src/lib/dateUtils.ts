/**
 * Utilidades para manejo seguro de fechas en Firebase y JavaScript
 */

/**
 * Convierte cualquier valor de fecha a un objeto Date válido
 * Maneja Timestamps de Firebase, Dates, strings y números
 */
export const safeDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  try {
    let date: Date;
    
    // Si es un Timestamp de Firebase
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Si ya es una fecha válida
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Si es un string o número
    else if (typeof dateValue === 'string') {
      // Manejar formato YYYY-MM-DD como fecha local (evita desfase por zona horaria)
      const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
      if (ymdMatch) {
        const [y, m, d] = dateValue.split('-').map(n => parseInt(n, 10));
        // Usar mediodía para minimizar efectos de DST
        date = new Date(y, (m - 1), d, 12, 0, 0, 0);
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Error converting date:', dateValue, error);
    return null;
  }
};

/**
 * Formatea una fecha para inputs de tipo date (YYYY-MM-DD)
 */
export const formatDateForInput = (dateValue: any): string => {
  const date = safeDate(dateValue);
  if (!date) return '';
  
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error formatting date for input:', dateValue, error);
    return '';
  }
};

/**
 * Formatea una fecha para mostrar al usuario (DD/MM/YYYY)
 */
export const formatDateForDisplay = (dateValue: any, locale: string = 'es-ES'): string => {
  const date = safeDate(dateValue);
  if (!date) return 'Fecha inválida';
  
  try {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date for display:', dateValue, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha con hora para mostrar al usuario
 */
export const formatDateTimeForDisplay = (dateValue: any, locale: string = 'es-ES'): string => {
  const date = safeDate(dateValue);
  if (!date) return 'Fecha inválida';
  
  try {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting datetime for display:', dateValue, error);
    return 'Fecha inválida';
  }
};

/**
 * Compara dos fechas de forma segura para ordenamiento
 * Retorna: -1 si a < b, 1 si a > b, 0 si son iguales
 */
export const compareDates = (a: any, b: any): number => {
  const dateA = safeDate(a);
  const dateB = safeDate(b);
  
  // Si ambas fechas son inválidas, considerarlas iguales
  if (!dateA && !dateB) return 0;
  
  // Si solo una es inválida, la válida va primero
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  // Comparar fechas válidas
  return dateB.getTime() - dateA.getTime(); // Más recientes primero
};

/**
 * Obtiene una fecha hace X días
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Obtiene una fecha hace X meses
 */
export const getMonthsAgo = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};
