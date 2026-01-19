/**
 * Utilidades para validaciones de analytics
 */

import { ANALYTICS_VALIDATION } from '@/constants/analytics';
import { logger } from '@/lib/logger';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida que el año sea válido para analytics
 */
export const validateYear = (year: number): ValidationResult => {
  const errors: ValidationError[] = [];
  const currentYear = new Date().getFullYear();

  if (year < ANALYTICS_VALIDATION.MIN_YEAR) {
    errors.push({
      field: 'year',
      message: `El año no puede ser anterior a ${ANALYTICS_VALIDATION.MIN_YEAR}`
    });
  }

  if (year > currentYear) {
    errors.push({
      field: 'year',
      message: 'No se puede seleccionar un año futuro'
    });
  }

  logger.log('✅ Year validation:', { year, isValid: errors.length === 0 });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida que el mes sea válido (0-11)
 */
export const validateMonth = (month: number | undefined): ValidationResult => {
  const errors: ValidationError[] = [];

  if (typeof month !== 'undefined') {
    if (month < 0 || month > 11 || !Number.isInteger(month)) {
      errors.push({
        field: 'month',
        message: 'El mes debe ser un número entre 0 y 11'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida el período seleccionado
 */
export const validatePeriod = (
  period: string,
  validPeriods: string[] = ['thisMonth', 'lastMonth', 'last3Months', 'last6Months', 'thisYear', 'custom']
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!validPeriods.includes(period)) {
    errors.push({
      field: 'period',
      message: `Período inválido. Debe ser uno de: ${validPeriods.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida múltiples parámetros de analytics
 */
export const validateAnalyticsParams = (
  period: string,
  year: number,
  month?: number
): ValidationResult => {
  const allErrors: ValidationError[] = [];

  const periodValidation = validatePeriod(period);
  if (!periodValidation.isValid) {
    allErrors.push(...periodValidation.errors);
  }

  const yearValidation = validateYear(year);
  if (!yearValidation.isValid) {
    allErrors.push(...yearValidation.errors);
  }

  const monthValidation = validateMonth(month);
  if (!monthValidation.isValid) {
    allErrors.push(...monthValidation.errors);
  }

  // Validación adicional: si es custom, se requiere mes
  if (period === 'custom' && typeof month === 'undefined') {
    allErrors.push({
      field: 'month',
      message: 'Mes requerido cuando el período es "custom"'
    });
  }

  logger.log('✅ Analytics params validation:', {
    period,
    year,
    month,
    isValid: allErrors.length === 0
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

/**
 * Manejo de errores de Firestore comunes
 */
export const getFirestoreErrorMessage = (error: any): string => {
  const code = error?.code;

  const errorMessages: Record<string, string> = {
    'permission-denied': 'No tienes permisos para acceder a estos datos',
    'not-found': 'Los datos solicitados no existen',
    'already-exists': 'Estos datos ya existen',
    'failed-precondition': 'La operación no puede completarse en este estado',
    'aborted': 'La operación fue abortada',
    'out-of-range': 'El valor está fuera del rango válido',
    'unimplemented': 'Esta operación no está implementada',
    'internal': 'Error interno del servidor. Intenta de nuevo',
    'unavailable': 'El servicio no está disponible. Intenta de nuevo',
    'data-loss': 'Pérdida de datos. Por favor contacta soporte',
    'unauthenticated': 'Debes autenticarte para acceder'
  };

  return errorMessages[code] || 'Error al cargar los datos. Por favor intenta de nuevo';
};

/**
 * Valida que un número sea una cantidad válida
 */
export const validateAmount = (amount: number): ValidationResult => {
  const errors: ValidationError[] = [];

  if (typeof amount !== 'number') {
    errors.push({
      field: 'amount',
      message: 'El monto debe ser un número'
    });
  } else if (amount < 0) {
    errors.push({
      field: 'amount',
      message: 'El monto no puede ser negativo'
    });
  } else if (!Number.isFinite(amount)) {
    errors.push({
      field: 'amount',
      message: 'El monto debe ser un número finito'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
