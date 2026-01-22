/**
 * Migración de colecciones legacy a transactions/
 * NO BORRA DATOS - Solo copia
 */

import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/logger';
import { safeDate } from '@/lib/dateUtils';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
  details: {
    incomes: number;
    expenses: number;
    debts: number;
  };
}

/**
 * Migra datos de colecciones legacy a transactions/
 * NO BORRA datos originales - Solo copia
 */
export async function migrateLegacyToTransactions(
  userId: string,
  options = { dryRun: false }
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0,
    details: {
      incomes: 0,
      expenses: 0,
      debts: 0
    }
  };

  logger.log(`🚀 Starting migration for user ${userId} (dry run: ${options.dryRun})`);

  try {
    // 1. MIGRAR INCOMES
    logger.log('📊 Migrating incomes...');
    const incomesRef = collection(db, 'users', userId, 'incomes');
    const incomesSnap = await getDocs(incomesRef);
    
    for (const doc of incomesSnap.docs) {
      try {
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
          logger.log(`⏭️  Income ${doc.id} already migrated, skipping`);
          continue;
        }
        
        // Crear transacción unificada
        const transaction = {
          userId,
          type: 'income' as const,
          amount: data.amount || 0,
          category: data.category || 'otros',
          date: data.date ? Timestamp.fromDate(safeDate(data.date) || new Date()) : Timestamp.now(),
          description: data.description || '',
          createdAt: data.createdAt || Timestamp.now(),
          // Metadatos de migración
          legacyId: doc.id,
          legacyCollection: 'incomes',
          migratedAt: Timestamp.now(),
          migrationVersion: '1.0',
          source: 'migration'
        };
        
        if (!options.dryRun) {
          await addDoc(collection(db, 'transactions'), transaction);
        }
        
        result.migratedCount++;
        result.details.incomes++;
        logger.log(`✅ Migrated income ${doc.id}`);
      } catch (error) {
        const errorMsg = `Failed to migrate income ${doc.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }
    
    // 2. MIGRAR EXPENSES
    logger.log('💸 Migrating expenses...');
    const expensesRef = collection(db, 'users', userId, 'expenses');
    const expensesSnap = await getDocs(expensesRef);
    
    for (const doc of expensesSnap.docs) {
      try {
        const data = doc.data();
        
        const existsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('legacyId', '==', doc.id),
          where('legacyCollection', '==', 'expenses')
        );
        const existsSnap = await getDocs(existsQuery);
        
        if (!existsSnap.empty) {
          result.skippedCount++;
          logger.log(`⏭️  Expense ${doc.id} already migrated, skipping`);
          continue;
        }
        
        const transaction = {
          userId,
          type: 'expense' as const,
          amount: data.amount || 0,
          category: data.category || 'otros',
          date: data.date ? Timestamp.fromDate(safeDate(data.date) || new Date()) : Timestamp.now(),
          description: data.description || '',
          createdAt: data.createdAt || Timestamp.now(),
          legacyId: doc.id,
          legacyCollection: 'expenses',
          migratedAt: Timestamp.now(),
          migrationVersion: '1.0',
          source: 'migration'
        };
        
        if (!options.dryRun) {
          await addDoc(collection(db, 'transactions'), transaction);
        }
        
        result.migratedCount++;
        result.details.expenses++;
        logger.log(`✅ Migrated expense ${doc.id}`);
      } catch (error) {
        const errorMsg = `Failed to migrate expense ${doc.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }
    
    // 3. MIGRAR DEBTS
    logger.log('💳 Migrating debts...');
    const debtsRef = collection(db, 'users', userId, 'debts');
    const debtsSnap = await getDocs(debtsRef);
    
    for (const doc of debtsSnap.docs) {
      try {
        const data = doc.data();
        
        const existsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('legacyId', '==', doc.id),
          where('legacyCollection', '==', 'debts')
        );
        const existsSnap = await getDocs(existsQuery);
        
        if (!existsSnap.empty) {
          result.skippedCount++;
          logger.log(`⏭️  Debt ${doc.id} already migrated, skipping`);
          continue;
        }
        
        const transaction = {
          userId,
          type: 'debt' as const,
          amount: data.amount || 0,
          category: data.category || 'deudas',
          date: data.date ? Timestamp.fromDate(safeDate(data.date) || new Date()) : Timestamp.now(),
          description: data.description || '',
          creditor: data.creditor || '',
          status: data.status || 'pending',
          createdAt: data.createdAt || Timestamp.now(),
          legacyId: doc.id,
          legacyCollection: 'debts',
          migratedAt: Timestamp.now(),
          migrationVersion: '1.0',
          source: 'migration'
        };
        
        if (!options.dryRun) {
          await addDoc(collection(db, 'transactions'), transaction);
        }
        
        result.migratedCount++;
        result.details.debts++;
        logger.log(`✅ Migrated debt ${doc.id}`);
      } catch (error) {
        const errorMsg = `Failed to migrate debt ${doc.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }
    
    logger.log(`
✅ Migration ${options.dryRun ? 'simulation' : 'complete'}:
   - Migrated: ${result.migratedCount} items
   - Skipped: ${result.skippedCount} items (already migrated)
   - Errors: ${result.errors.length}
   - Details: ${result.details.incomes} incomes, ${result.details.expenses} expenses, ${result.details.debts} debts
    `);
    
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMsg);
    logger.error('❌ Migration failed:', error);
  }
  
  return result;
}

/**
 * Ejecuta migración con dry run previo para validación
 */
export async function safeMigration(userId: string): Promise<MigrationResult> {
  // 1. Dry run para validar
  logger.log('🔍 Running dry run...');
  const dryRunResult = await migrateLegacyToTransactions(userId, { dryRun: true });
  
  logger.log('Dry run result:', {
    willMigrate: dryRunResult.migratedCount,
    willSkip: dryRunResult.skippedCount,
    errors: dryRunResult.errors.length
  });
  
  if (dryRunResult.errors.length > 0) {
    logger.warn('⚠️  Dry run found errors:', dryRunResult.errors);
  }
  
  // 2. Migración real
  logger.log('🚀 Starting real migration...');
  const result = await migrateLegacyToTransactions(userId, { dryRun: false });
  
  if (result.success) {
    logger.log('✅ Migration successful!');
  } else {
    logger.error('❌ Migration failed:', result.errors);
  }
  
  return result;
}

/**
 * Obtiene estadísticas de datos legacy sin migrar
 */
export async function getLegacyStats(userId: string) {
  const stats = {
    incomes: 0,
    expenses: 0,
    debts: 0,
    total: 0
  };
  
  try {
    const incomesSnap = await getDocs(collection(db, 'users', userId, 'incomes'));
    const expensesSnap = await getDocs(collection(db, 'users', userId, 'expenses'));
    const debtsSnap = await getDocs(collection(db, 'users', userId, 'debts'));
    
    stats.incomes = incomesSnap.size;
    stats.expenses = expensesSnap.size;
    stats.debts = debtsSnap.size;
    stats.total = stats.incomes + stats.expenses + stats.debts;
  } catch (error) {
    logger.error('Failed to get legacy stats:', error);
  }
  
  return stats;
}
