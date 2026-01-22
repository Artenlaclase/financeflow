# 🧪 Tests - Fintracker

Testing framework setup con Vitest + Testing Library para Fintracker v0.5.0

---

## 📁 Estructura

```
tests/
├── setup.ts                      # Configuración global de Vitest
├── helpers/
│   └── firebase.ts               # Mocks y utilidades de Firebase
└── lib/
    ├── dateUtils.test.ts         # Tests de utilidades de fechas
    ├── validation.test.ts        # Tests de validaciones
    └── logger.test.ts            # Tests del logger
```

---

## 🚀 Comandos

### Ejecutar Tests
```bash
# Todos los tests
npm test

# UI interactiva
npm run test:ui

# Una sola ejecución (CI mode)
npm run test:run

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Test específico
npm test -- dateUtils.test.ts
```

---

## 📊 Coverage Actual

| Archivo | Tests | Status | Coverage |
|---------|-------|--------|----------|
| dateUtils.ts | 23 | ✅ | ~90% |
| validation.ts | 35 | ✅ | ~95% |
| logger.ts | 8 | ⚠️ 6/8 | ~75% |
| **TOTAL** | **66** | **64/66** | **~85%** |

---

## 🛠️ Configuración

### Vitest Config ([vitest.config.ts](../vitest.config.ts))
- **Environment:** happy-dom (rápido y compatible)
- **Coverage Target:** 80%+ en lines, functions, branches, statements
- **Setup:** `tests/setup.ts`
- **Include:** `**/*.{test,spec}.{ts,tsx}`
- **Exclude:** node_modules, .next, dist

### Mocks Globales ([setup.ts](./setup.ts))
- Firebase Auth
- Firebase Firestore
- Next.js Router (useRouter, usePathname, useSearchParams)
- Browser APIs (matchMedia, IntersectionObserver, ResizeObserver)

---

## 📝 Patrones de Testing

### 1. Estructura Básica
```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '@/lib/myUtils';

describe('myUtils', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### 2. Testing con Firebase Mocks
```typescript
import { createMockFirebaseTimestamp } from '../helpers/firebase';

it('should handle Firebase Timestamp', () => {
  const timestamp = createMockFirebaseTimestamp(new Date('2024-01-15'));
  const result = safeDate(timestamp);
  expect(result).toBeInstanceOf(Date);
});
```

### 3. Testing de Errores
```typescript
it('should return null for invalid input', () => {
  expect(safeDate(null)).toBeNull();
  expect(safeDate('invalid')).toBeNull();
  expect(safeDate(undefined)).toBeNull();
});
```

### 4. Testing de Validaciones
```typescript
it('should validate correct input', () => {
  const result = validateYear(2024);
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

it('should reject invalid input', () => {
  const result = validateYear(1999);
  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  expect(result.errors[0].field).toBe('year');
});
```

---

## 🔧 Helpers Disponibles

### Firebase Helpers ([helpers/firebase.ts](./helpers/firebase.ts))

```typescript
// Crear timestamp de Firebase
const timestamp = createMockFirebaseTimestamp(new Date());

// Crear usuario mock
const user = createMockUser({ email: 'test@example.com' });

// Crear transacción mock
const transaction = createMockTransaction({
  amount: 100,
  category: 'Alimentación'
});

// Mock de query snapshot
const snapshot = createMockQuerySnapshot([data1, data2]);

// Mock de document snapshot
const docSnap = createMockDocumentSnapshot(data);

// Esperar promesas pendientes
await flushPromises();

// Esperar tiempo específico
await wait(1000);

// Mock de console
const consoleMock = mockConsole();
// ... tus tests ...
consoleMock.restore();
```

---

## 📚 Guías de Testing

### Testing de Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

it('should update state correctly', async () => {
  const { result } = renderHook(() => useMyHook());
  
  act(() => {
    result.current.doSomething();
  });
  
  await waitFor(() => {
    expect(result.current.state).toBe('updated');
  });
});
```

### Testing de Componentes
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

it('should render and interact correctly', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  const button = screen.getByRole('button', { name: /click me/i });
  await user.click(button);
  
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

---

## ⚠️ Notas Importantes

### Fechas y Timezone
Siempre usar formato ISO con timezone para evitar problemas:
```typescript
// ✅ Correcto
new Date('2024-01-15T12:00:00Z')

// ❌ Evitar (puede fallar por timezone)
new Date('2024-01-15')
```

### Async/Await
Siempre marcar tests asíncronos:
```typescript
it('should handle async operations', async () => {
  await someAsyncFunction();
  expect(result).toBe(expected);
});
```

### Cleanup
Testing Library hace cleanup automático después de cada test.

---

## 🎯 Próximos Tests a Implementar

### Prioridad Alta
- [ ] `useAuth` hook
- [ ] `useFinance` hook
- [ ] `useSWRTransactions` hook
- [ ] `useSWRAnalytics` hook

### Prioridad Media
- [ ] `ErrorBoundary` component
- [ ] `AnalyticsSummary` component
- [ ] `TransactionsList` component
- [ ] `firebaseSimple.ts` utilities

### Prioridad Baja
- [ ] E2E tests con Playwright
- [ ] Visual regression tests
- [ ] Performance tests

---

## 🐛 Debugging Tests

### Ver UI de Tests
```bash
npm run test:ui
```
Abre interfaz visual en el navegador para ver tests, coverage y rerun selectivo.

### Ver Solo Errores
```bash
npm test -- --reporter=verbose
```

### Debug con VSCode
Agregar breakpoint en el test y usar:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

---

## 📖 Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event API](https://testing-library.com/docs/user-event/intro)

---

**Última actualización:** 21 de Enero 2026  
**Mantenedor:** AI Coding Agent  
**Coverage Target:** 80%+
