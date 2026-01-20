# 🧪 Guía de Testing - Fintracker

**Fecha:** 19 de Enero 2026

---

## 📦 Instalación de Dependencias

Para habilitar testing en Fintracker, instala las siguientes dependencias:

```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  @vitest/ui
```

O en una sola línea:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

---

## ⚙️ Configuración de Vitest

### 1. Crear `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/index.ts',
        'dist/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2. Crear `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mock de Firebase si es necesario
vi.mock('@/lib/firebase/config', () => ({
  db: {}
}));

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 3. Actualizar `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 🧪 Ejemplos de Tests

### Test de Hook: `useAnalytics`

**Archivo:** `src/hooks/__tests__/useAnalytics.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnalyticsOptimized } from '../useAnalyticsOptimized';
import { useTransactions } from '../useTransactions';

vi.mock('../useTransactions');

describe('useAnalyticsOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return analytics data correctly', async () => {
    const mockTransactions = [
      {
        id: '1',
        userId: 'user1',
        type: 'income',
        amount: 1000,
        category: 'Salary',
        date: new Date('2026-01-15')
      },
      {
        id: '2',
        userId: 'user1',
        type: 'expense',
        amount: 200,
        category: 'Food',
        date: new Date('2026-01-16')
      }
    ];

    vi.mocked(useTransactions).mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    const { result } = renderHook(() => 
      useAnalyticsOptimized('thisMonth', 2026)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalIncome).toBe(1000);
    expect(result.current.totalExpenses).toBe(200);
    expect(result.current.balance).toBe(800);
  });

  it('should handle loading state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      transactions: [],
      loading: true,
      error: null,
      refetch: vi.fn()
    });

    const { result } = renderHook(() => 
      useAnalyticsOptimized('thisMonth', 2026)
    );

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      transactions: [],
      loading: false,
      error: 'Firestore error',
      refetch: vi.fn()
    });

    const { result } = renderHook(() => 
      useAnalyticsOptimized('thisMonth', 2026)
    );

    expect(result.current.error).toBe('Firestore error');
  });
});
```

### Test de Validación

**Archivo:** `src/lib/__tests__/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  validateYear, 
  validateMonth, 
  validateAnalyticsParams,
  validateAmount
} from '../validation';

describe('Validation Utils', () => {
  describe('validateYear', () => {
    it('should accept valid current year', () => {
      const result = validateYear(2026);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject future years', () => {
      const result = validateYear(2027);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('year');
    });

    it('should reject years before MIN_YEAR', () => {
      const result = validateYear(1999);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateMonth', () => {
    it('should accept valid month', () => {
      const result = validateMonth(5);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid month', () => {
      const result = validateMonth(12);
      expect(result.isValid).toBe(false);
    });

    it('should accept undefined month', () => {
      const result = validateMonth(undefined);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAnalyticsParams', () => {
    it('should validate all params correctly', () => {
      const result = validateAnalyticsParams('thisMonth', 2026);
      expect(result.isValid).toBe(true);
    });

    it('should require month for custom period', () => {
      const result = validateAnalyticsParams('custom', 2026);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Mes requerido');
    });
  });

  describe('validateAmount', () => {
    it('should accept positive amount', () => {
      const result = validateAmount(100);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = validateAmount(-50);
      expect(result.isValid).toBe(false);
    });

    it('should reject non-number', () => {
      const result = validateAmount(NaN);
      expect(result.isValid).toBe(false);
    });
  });
});
```

### Test de Componente

**Archivo:** `src/components/features/Analytics/__tests__/AnalyticsSummary.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyticsSummary from '../AnalyticsSummaryOptimized';
import * as analyticsHook from '@/hooks/useAnalyticsOptimized';

vi.mock('@/hooks/useAnalyticsOptimized');

describe('AnalyticsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render summary cards with data', async () => {
    vi.spyOn(analyticsHook, 'useAnalyticsOptimized').mockReturnValue({
      totalIncome: 5000,
      totalExpenses: 2000,
      balance: 3000,
      transactionCount: 15,
      loading: false,
      error: null
    });

    render(<AnalyticsSummary selectedPeriod="thisMonth" selectedYear={2026} />);

    await waitFor(() => {
      expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
      expect(screen.getByText(/5000/)).toBeInTheDocument();
    });
  });

  it('should show loading skeleton', () => {
    vi.spyOn(analyticsHook, 'useAnalyticsOptimized').mockReturnValue({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
      loading: true,
      error: null
    });

    render(<AnalyticsSummary selectedPeriod="thisMonth" selectedYear={2026} />);

    expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument();
  });

  it('should display error message', () => {
    vi.spyOn(analyticsHook, 'useAnalyticsOptimized').mockReturnValue({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
      loading: false,
      error: 'Failed to load data'
    });

    render(<AnalyticsSummary selectedPeriod="thisMonth" selectedYear={2026} />);

    expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
  });
});
```

---

## 📊 Cobertura de Tests

Para ver la cobertura de tests:

```bash
npm run test:coverage
```

Esto genera un reporte HTML en `coverage/index.html`

**Objetivos de cobertura:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🔄 Mejores Prácticas

### ✅ DO

```typescript
// ✅ Usar describe blocks para organizar
describe('Analytics', () => {
  describe('useAnalytics', () => {
    it('should calculate balance correctly', () => {
      // ...
    });
  });
});

// ✅ Usar nombres descriptivos
it('should return error when year is in the future', () => {
  // ...
});

// ✅ Mock solo lo necesario
vi.mock('@/lib/firebase/config', () => ({
  db: {}
}));

// ✅ Usar waitFor para async operations
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

### ❌ DON'T

```typescript
// ❌ Nombres genéricos
it('test something', () => {});

// ❌ No limpiar mocks
beforeEach(() => {
  // Olvidar vi.clearAllMocks()
});

// ❌ Tests que dependen uno de otro
it('test 1', () => {});
it('test 2 dependiente de test 1', () => {});

// ❌ Timeouts muy largos
await waitFor(() => { /* */ }, { timeout: 10000 });
```

---

## 🚀 Ejecución de Tests

```bash
# Ejecutar todos los tests
npm run test

# Ver UI interactiva
npm run test:ui

# Modo watch (re-ejecutar en cambios)
npm run test -- --watch

# Tests con coverage
npm run test:coverage

# Específico archivo
npm run test -- src/lib/validation.test.ts

# Específico patrón
npm run test -- --grep "validateYear"
```

---

## 📝 Próximos Pasos

- [ ] Agregar tests para todos los hooks
- [ ] Tests de componentes principales
- [ ] E2E tests con Playwright
- [ ] CI/CD con GitHub Actions
- [ ] Reporte de cobertura en PRs

---

**Mantén actualizada la cobertura de tests mientras agregas features.**
