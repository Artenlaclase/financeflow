# Plan de Migración: Legacy Collections → Transactions

## 🎯 Objetivo

Migrar completamente de las colecciones legacy (`users/{userId}/incomes`, `users/{userId}/expenses`, `users/{userId}/debts`) a la colección unificada `transactions/` **SIN PERDER DATOS**.

## ⚠️ Principios Fundamentales

1. **NUNCA borrar datos existentes en Firebase**
2. **Migración gradual y reversible**
3. **Doble escritura durante transición**
4. **Validación exhaustiva antes de deprecar**
5. **Backup de datos críticos**

---

## 📊 Inventario de Uso Actual

### Archivos que Usan Colecciones Legacy

```typescript
// 1. FinanceContext.tsx - CRÍTICO
// Líneas: 159, 200
collection(db, 'users', user.uid, 'expenses')
collection(db, 'users', user.uid, 'debts')

// 2. DebtForm.tsx - CRÍTICO
// Línea: 52
await addDoc(collection(db, 'users', user.uid, 'debts'), {...})

// 3. RecentTransactions.tsx
// Línea: 239
const expensesRef = collection(db, 'users', user.uid, 'expenses')

// 4. FirestoreDiagnostic.tsx - DIAGNÓSTICO
// Línea: 40
const expensesRef = collection(db, 'users', user.uid, 'expenses')

// 5. testData.ts - DATOS DE PRUEBA
// Línea: 38
await addDoc(collection(db, 'users', userId, 'expenses'), expense)
```

---

## 🗺️ Roadmap de Migración

### **Fase 1: Preparación y Análisis** (1-2 días)

#### 1.1. Auditoría Completa de Código
```bash
# Buscar TODOS los usos de colecciones legacy
grep -r "users.*incomes" src/
grep -r "users.*expenses" src/
grep -r "users.*debts" src/
```

#### 1.2. Crear Snapshot de Datos
```typescript
// src/scripts/backupLegacyCollections.ts
export async function backupLegacyData(userId: string) {
  const backup = {
    timestamp: new Date().toISOString(),
    userId,
    incomes: [],
    expenses: [],
    debts: []
  };
  
  // Leer todas las colecciones legacy
  // Guardar en archivo JSON local
  // Subir a Firestore en /backups/
}
```

#### 1.3. Documentar Estructura de Datos
```typescript
// Identificar campos específicos de cada colección
// incomes/: {amount, date, description, category}
// expenses/: {amount, date, description, category}
// debts/: {amount, date, description, creditor, status}
```

---

### **Fase 2: Crear Infraestructura de Migración** (2-3 días)

#### 2.1. Función de Migración de Datos

```typescript
// src/lib/firebase/migration.ts

import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/logger';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
}

/**
 * Migra datos de colecciones legacy a transactions/
 * NO BORRA datos originales
 */
export async function migrateLegacyToTransactions(
  userId: string,
  options = { dryRun: false }
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    // 1. Migrar incomes
    const incomesRef = collection(db, 'users', userId, 'incomes');
    const incomesSnap = await getDocs(incomesRef);
    
    for (const doc of incomesSnap.docs) {
      const data = doc.data();
      
      // Verificar si ya existe en transactions/
      const existsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('legacyId', '==', doc.id),
        where('legacyCollection', '==', 'incomes')
      );
      const existsSnap = await getDocs(existsQuery);
      
      if (!existsSnap.empty) {
        result.skippedCount++;
        continue;
      }
      
      // Crear transacción unificada
      const transaction = {
        userId,
        type: 'income' as const,
        amount: data.amount || 0,
        category: data.category || 'otros',
        date: data.date,
        description: data.description || '',
        createdAt: data.createdAt || new Date(),
        // Metadatos de migración
        legacyId: doc.id,
        legacyCollection: 'incomes',
        migratedAt: new Date(),
        migrationVersion: '1.0'
      };
      
      if (!options.dryRun) {
        await addDoc(collection(db, 'transactions'), transaction);
      }
      
      result.migratedCount++;
      logger.log(`Migrated income ${doc.id} to transactions`);
    }
    
    // 2. Migrar expenses (similar)
    const expensesRef = collection(db, 'users', userId, 'expenses');
    // ... código similar a incomes
    
    // 3. Migrar debts (similar)
    const debtsRef = collection(db, 'users', userId, 'debts');
    // ... código similar
    
    logger.log(`Migration complete: ${result.migratedCount} items migrated, ${result.skippedCount} skipped`);
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    logger.error('Migration failed:', error);
  }
  
  return result;
}

/**
 * Ejecuta migración con validación previa
 */
export async function safeMigration(userId: string): Promise<void> {
  // 1. Backup de datos
  logger.log('Creating backup...');
  // await backupLegacyData(userId);
  
  // 2. Dry run
  logger.log('Running dry run...');
  const dryRunResult = await migrateLegacyToTransactions(userId, { dryRun: true });
  logger.log('Dry run result:', dryRunResult);
  
  // 3. Confirmar con usuario (en UI)
  // if (!confirm(`Migrar ${dryRunResult.migratedCount} registros?`)) return;
  
  // 4. Migración real
  logger.log('Starting real migration...');
  const result = await migrateLegacyToTransactions(userId, { dryRun: false });
  
  if (result.success) {
    logger.log('✅ Migration successful!');
  } else {
    logger.error('❌ Migration failed:', result.errors);
    throw new Error('Migration failed');
  }
}
```

#### 2.2. Función de Doble Escritura

```typescript
// src/lib/firebase/transactionWriter.ts

import { addDoc, collection } from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/logger';

export interface WriteResult {
  transactionId?: string;
  legacyId?: string;
  error?: string;
}

/**
 * Escribe en AMBAS colecciones durante período de transición
 */
export async function addTransactionWithLegacy(
  userId: string,
  transaction: {
    type: 'income' | 'expense' | 'debt' | 'compra';
    amount: number;
    category: string;
    date: Date;
    description?: string;
  }
): Promise<WriteResult> {
  const result: WriteResult = {};
  
  try {
    // 1. Escribir en transactions/ (nueva colección)
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId,
      ...transaction,
      createdAt: new Date(),
      source: 'app' // indica que fue creada por la app, no migrada
    });
    result.transactionId = transactionRef.id;
    logger.log(`✅ Transaction written: ${transactionRef.id}`);
    
    // 2. Escribir en legacy collection (para compatibilidad)
    if (transaction.type === 'income' || transaction.type === 'expense' || transaction.type === 'debt') {
      const legacyCollectionName = transaction.type === 'debt' ? 'debts' : `${transaction.type}s`;
      const legacyRef = await addDoc(
        collection(db, 'users', userId, legacyCollectionName),
        {
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description || '',
          createdAt: new Date(),
          // Referencia cruzada
          transactionId: transactionRef.id
        }
      );
      result.legacyId = legacyRef.id;
      logger.log(`✅ Legacy entry written: ${legacyRef.id}`);
    }
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Write failed:', error);
  }
  
  return result;
}
```

---

### **Fase 3: Migración Gradual de Componentes** (5-7 días)

#### 3.1. Orden de Migración (Prioridad)

1. **DebtForm.tsx** ✅
   - Cambiar `addDoc` para usar `addTransactionWithLegacy()`
   - Validar que deudas se guarden correctamente

2. **FinanceContext.tsx** ✅
   - Remover listeners de `expenses` y `debts`
   - Mantener solo listener de `transactions/`
   - Filtrar por tipo en memoria

3. **RecentTransactions.tsx** ✅
   - Cambiar query de `expenses` a `transactions`
   - Filtrar por `where('type', '==', 'expense')`

4. **FirestoreDiagnostic.tsx** 🔧
   - Actualizar para mostrar ambas colecciones
   - Agregar info de migración

5. **testData.ts** 🔧
   - Usar `addTransactionWithLegacy()` en datos de prueba

#### 3.2. Ejemplo: Migrar DebtForm.tsx

```typescript
// ANTES (legacy)
await addDoc(collection(db, 'users', user.uid, 'debts'), {
  amount: debtAmount,
  description: debtDescription,
  // ...
});

// DESPUÉS (nuevo)
import { addTransactionWithLegacy } from '@/lib/firebase/transactionWriter';

await addTransactionWithLegacy(user.uid, {
  type: 'debt',
  amount: debtAmount,
  category: 'deudas',
  date: new Date(),
  description: debtDescription,
});
```

---

### **Fase 4: Testing y Validación** (3-4 días)

#### 4.1. Tests de Migración

```typescript
// tests/lib/migration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLegacyToTransactions } from '@/lib/firebase/migration';

describe('Legacy Migration', () => {
  it('should migrate incomes without data loss', async () => {
    // Mock Firestore
    // Crear datos legacy
    // Ejecutar migración
    // Verificar datos en transactions/
    // Verificar datos legacy intactos
  });
  
  it('should skip already migrated items', async () => {
    // Migrar dos veces
    // Verificar que no se dupliquen
  });
  
  it('should handle migration errors gracefully', async () => {
    // Simular error
    // Verificar rollback
  });
});
```

#### 4.2. Tests Manuales

```
✅ Checklist de Validación:

1. Crear nueva transacción income
   - ✅ Se guarda en transactions/
   - ✅ Se guarda en users/{uid}/incomes (legacy)
   - ✅ Aparece en dashboard

2. Crear nueva transacción expense
   - ✅ Se guarda en transactions/
   - ✅ Se guarda en users/{uid}/expenses (legacy)
   - ✅ Aparece en recent transactions

3. Crear nueva deuda
   - ✅ Se guarda en transactions/
   - ✅ Se guarda en users/{uid}/debts (legacy)
   - ✅ Aparece en dashboard

4. Ver analytics
   - ✅ Incluye datos nuevos
   - ✅ Incluye datos migrados
   - ✅ No hay duplicados

5. Performance
   - ✅ Tiempos de carga aceptables
   - ✅ No se exceden límites de Firestore
```

---

### **Fase 5: Monitoreo y Deprecación** (Continuo)

#### 5.1. Agregar Logging

```typescript
// src/lib/firebase/monitoring.ts

export async function logCollectionUsage(
  collection: 'incomes' | 'expenses' | 'debts',
  operation: 'read' | 'write'
) {
  // Log a Firestore o Analytics
  await addDoc(collection(db, 'usage_logs'), {
    collection,
    operation,
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
}
```

#### 5.2. Deprecation Warnings

```typescript
// Agregar warnings en consola
logger.warn('⚠️ Legacy collection accessed. Please migrate to transactions/');
```

#### 5.3. Plan de Deprecación

```
Semana 1-2: Migración de datos + Doble escritura
Semana 3-4: Migración de código
Semana 5-6: Testing exhaustivo
Semana 7-8: Monitoreo
Semana 9+:   Deprecar legacy (solo lectura)
Mes 3+:      Considerar desactivar legacy
```

---

## 📋 Checklist de Ejecución

### Pre-Migración
- [ ] Crear branch: `feature/migrate-to-transactions`
- [ ] Backup completo de Firestore (exportar proyecto)
- [ ] Documentar estructura actual de datos
- [ ] Auditoría completa de código

### Implementación
- [ ] Crear `src/lib/firebase/migration.ts`
- [ ] Crear `src/lib/firebase/transactionWriter.ts`
- [ ] Crear tests para funciones de migración
- [ ] Implementar doble escritura
- [ ] Migrar componentes uno por uno
- [ ] Validar cada migración

### Post-Migración
- [ ] Ejecutar dry-run en producción
- [ ] Ejecutar migración real de datos
- [ ] Monitorear logs por 1 semana
- [ ] Confirmar que no hay regresiones
- [ ] Crear dashboard de monitoreo
- [ ] Documentar proceso completo

### Deprecación (Futuro)
- [ ] Confirmar 100% de uso de transactions/
- [ ] Agregar warnings de deprecación
- [ ] Modo solo lectura en legacy
- [ ] Considerar desactivación total

---

## 🚨 Rollback Plan

Si algo sale mal:

1. **Detener doble escritura inmediatamente**
2. **Revertir código a versión anterior** (git revert)
3. **Mantener datos legacy como fuente de verdad**
4. **Analizar error antes de reintentar**
5. **NO borrar nada hasta confirmar éxito total**

---

## 📞 Puntos de Decisión

**¿Cuándo deprecar completamente legacy?**
- ✅ 30 días sin errores
- ✅ 100% de código usando transactions/
- ✅ Monitoreo muestra 0 accesos a legacy
- ✅ Tests de integración pasando

**¿Cuándo desactivar legacy?**
- ✅ 90 días después de deprecación
- ✅ Backup completo confirmado
- ✅ Plan de recuperación documentado

---

**Creado**: 21 Enero 2026  
**Última actualización**: 21 Enero 2026  
**Próxima revisión**: Al inicio de implementación
