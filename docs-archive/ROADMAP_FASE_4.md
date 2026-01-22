# 📋 Roadmap Fase 4: Testing & Quality Assurance

**Versión:** 0.5.0 (Planificada)  
**Estado:** 🗓️ Próximo  
**Objetivo:** Cobertura 80%+ de tests, CI/CD automático

---

## 🎯 Objetivos Fase 4

### Testing
- [ ] Unit tests: 80%+ cobertura
- [ ] Component tests: Todos los componentes
- [ ] Hook tests: useAuth, useFinance, useSWR*
- [ ] E2E tests: Flujos críticos

### CI/CD
- [ ] GitHub Actions setup
- [ ] Pre-push hooks (lint + test)
- [ ] Automated deployment
- [ ] Performance monitoring

### Documentation
- [ ] API documentation
- [ ] Component storybook
- [ ] Architecture decisions
- [ ] Troubleshooting guide

---

## 📊 Testing Plan Detallado

### Fase 4.1: Unit Tests (Semana 1-2)

#### Hooks a testear
```
✅ Testing priority:
├── useAuth (critical)
├── useFinance (critical)
├── useSWRTransactions (high)
├── useSWRAnalytics (high)
├── useVirtualScroll (medium)
└── useAnalytics helpers (medium)
```

#### Stack
```typescript
// package.json dependencies para agregar
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^23.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

#### Estructura de tests
```
tests/
├── hooks/
│   ├── useAuth.test.ts
│   ├── useFinance.test.ts
│   ├── useSWRTransactions.test.ts
│   └── useSWRAnalytics.test.ts
├── utils/
│   ├── validation.test.ts
│   ├── dateUtils.test.ts
│   └── firebaseUtils.test.ts
├── components/
│   ├── ErrorBoundary.test.tsx
│   ├── VirtualScroll.test.tsx
│   └── AnalyticsSummary.test.tsx
└── integration/
    ├── auth-flow.test.ts
    ├── transaction-flow.test.ts
    └── analytics-flow.test.ts
```

### Fase 4.2: Component Tests (Semana 2-3)

#### Components a testear
```
Prioritario (P0):
├── Dashboard
├── Analytics
├── Compras
└── AddTransactionForm

Alto (P1):
├── TransactionsList
├── AnalyticsSummary
├── PieChart
└── LineChart

Medio (P2):
├── TransactionRow
├── CategoryBadge
└── Loading states
```

#### Testing library patterns
```typescript
// Ejemplo: Component test
describe('TransactionsList', () => {
  it('renders virtual scrolling', () => {
    const { container } = render(
      <VirtualTransactionsList items={mockTransactions} />
    );
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(20);
  });

  it('calls onRowClick on item click', () => {
    const onRowClick = vi.fn();
    render(
      <TransactionRow tx={mockTx} onRowClick={onRowClick} />
    );
    fireEvent.click(screen.getByText(mockTx.description));
    expect(onRowClick).toHaveBeenCalledWith(mockTx);
  });
});
```

### Fase 4.3: Hook Tests (Semana 3-4)

#### Patrones de hook testing
```typescript
// Ejemplo: SWR hook test
describe('useSWRTransactions', () => {
  it('caches transactions', async () => {
    const { result } = renderHook(() => useSWRTransactions());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it('deduplicates requests within 60s', async () => {
    const fetcher = vi.fn();
    renderHook(() => useSWRTransactions({ fetcher }));
    renderHook(() => useSWRTransactions({ fetcher }));
    
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1); // Solo 1 fetch
    });
  });

  it('handles errors with rollback', async () => {
    const { result } = renderHook(() => useSWRAddTransaction());
    
    await expect(
      result.current.addTransaction(invalidTx)
    ).rejects.toThrow();
  });
});
```

### Fase 4.4: E2E Tests (Semana 4-5)

#### Stack
```
playwright o cypress (TBD)
```

#### Flujos críticos
```
1. Auth Flow
   ├── Register user
   ├── Login
   ├── Logout
   └── Reset password

2. Transaction Flow
   ├── Add transaction
   ├── Edit transaction
   ├── Delete transaction
   └── Filter transactions

3. Analytics Flow
   ├── View analytics
   ├── Change period
   ├── Export report
   └── Compare years

4. Bank Connection
   ├── Connect bank
   ├── Sync transactions
   ├── Disconnect
   └── Re-authenticate
```

---

## 🔧 CI/CD Setup

### GitHub Actions Workflow

```yaml
# .github/workflows/test-and-deploy.yml
name: Test & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test
      
      - name: Coverage report
        run: npm run test:coverage
      
      - name: Build
        run: npm run build
      
      - name: E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: npm run deploy
```

### Pre-push Hook

```bash
#!/bin/bash
# .husky/pre-push

npm run lint
npm run test
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Push aborted."
  exit 1
fi
```

---

## 📈 Coverage Targets

### Por tipo de archivo

```
Utilities:     100% (validation, dateUtils, firebase)
Hooks:          90% (useAuth, useFinance, useSWR*)
Components:     80% (Dashboard, Analytics, Forms)
Pages:          70% (Integration with features)
Overall:        80%+ 

Líneas:
Current:  ~8,000
Target:   ~10,000 (con tests: ~15,000)
```

---

## 🚀 Testing Tools

### Stack Recomendado

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",           // Unit testing
    "jsdom": "^23.0.0",            // DOM simulation
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "playwright": "^1.40.0",       // E2E testing
    "@vitest/ui": "^1.0.0",        // Test dashboard
    "vitest-coverage-c8": "^0.0.1" // Coverage reports
  }
}
```

### Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:watch": "vitest --watch"
  }
}
```

---

## 📋 Checklist Fase 4

### Setup
- [ ] Instalar Vitest + testing-library
- [ ] Configurar jsdom + plugins
- [ ] Setup Playwright para E2E
- [ ] Configurar coverage reports

### Unit Tests
- [ ] Utilities (validation, dateUtils)
- [ ] Hooks (useAuth, useFinance)
- [ ] SWR hooks (useSWRTransactions, etc)
- [ ] Helper functions

### Component Tests
- [ ] Dashboard
- [ ] Analytics
- [ ] Compras
- [ ] Forms

### Integration Tests
- [ ] Auth flow
- [ ] Transaction flow
- [ ] Analytics flow

### E2E Tests
- [ ] Critical user paths
- [ ] Error scenarios
- [ ] Edge cases

### CI/CD
- [ ] GitHub Actions
- [ ] Pre-push hooks
- [ ] Coverage reports
- [ ] Auto-deploy

### Documentation
- [ ] Testing guide
- [ ] Test examples
- [ ] Coverage reports
- [ ] Troubleshooting

---

## 💡 Mejores Prácticas Testing

### 1. Test Behavior, Not Implementation
```typescript
// ❌ BAD: Testing implementation
expect(result.current.isLoading).toBe(false);

// ✅ GOOD: Testing behavior
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
```

### 2. Use Fixtures
```typescript
// fixtures/transactions.ts
export const mockTransactions = [
  {
    id: '1',
    type: 'expense',
    category: 'food',
    amount: 50,
    // ...
  },
];
```

### 3. Mock External Dependencies
```typescript
vi.mock('@/lib/firebase', () => ({
  getTransactions: vi.fn(() => Promise.resolve(mockTransactions)),
}));
```

### 4. Test Error Cases
```typescript
it('handles network errors', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
  // ...
});
```

---

## 📊 Expected Metrics After Phase 4

### Coverage
```
Statements:  85%
Branches:    80%
Functions:   90%
Lines:       85%
```

### Build Size
```
Main bundle: 55KB gzip (con tests: 56KB)
Test files:  ~2MB (no shipped)
```

### Performance
```
Test suite run: ~30s (first run)
Watch mode:    ~2-3s (incremental)
Coverage:      ~45s
```

### CI/CD
```
PR checks: ~5 min
Deploy: ~2 min
```

---

## 🎓 Learning Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Best Practices](https://testing-library.com)
- [Playwright Guide](https://playwright.dev)
- [SWR Testing](https://swr.vercel.app/docs/advanced/testing)

---

## 📞 Success Criteria

✅ Fase 4 será considerada completa cuando:

1. **Coverage:** 80%+ de líneas
2. **CI/CD:** Todos los checks pasen automáticamente
3. **E2E:** Flujos críticos documentados y pasando
4. **Docs:** Guía completa de testing para el equipo
5. **Speed:** Tests ejecutados en < 60 segundos

---

## 🗓️ Timeline Estimado

```
Fase 4: Semanas 5-8

├─ Semana 5: Setup + Unit Tests (Utilities)
├─ Semana 6: Unit Tests (Hooks) + Component Tests
├─ Semana 7: E2E Tests + CI/CD
└─ Semana 8: Documentation + Polish
```

---

**Próximo paso después de Fase 3:** Implementar Fase 4 Testing

**Versión:** 0.4.0 (Roadmap para 0.5.0)  
**Fecha:** 19 de Enero 2026
