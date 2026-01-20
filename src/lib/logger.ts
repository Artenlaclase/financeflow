/**
 * Logger condicional para desarrollo y producción
 * Solo muestra logs en desarrollo para evitar contaminar la consola en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general (solo en desarrollo)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log de error (siempre, en desarrollo y producción)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log de advertencia (solo en desarrollo)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log de información con timestamp (solo en desarrollo)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(`[${new Date().toISOString()}]`, ...args);
    }
  },

  /**
   * Marca de inicio para medir performance (solo en desarrollo)
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * Marca de fin para medir performance (solo en desarrollo)
   */
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

export default logger;
