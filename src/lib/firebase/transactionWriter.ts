/**
 * Doble escritura de transacciones
 * Escribe en transactions/ (nuevo) y en colecciones legacy (compatibilidad)
 * NO BORRA DATOS - Solo agrega
 */

import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/logger';

export interface WriteResult {
  transactionId?: string;
  legacyId?: string;
  error?: string;
}

export interface TransactionData {
  type: 'income' | 'expense' | 'debt' | 'compra';
  amount: number;
  category: string;
  date: Date;
  description?: string;
  creditor?: string; // Para deudas
  status?: string; // Para deudas
}

/**
 * Escribe transacción en AMBAS colecciones durante período de transición
 * @param userId - ID del usuario
 * @param transaction - Datos de la transacción
 * @returns IDs de ambos documentos creados
 */
export async function addTransactionWithLegacy(
  userId: string,
  transaction: TransactionData
): Promise<WriteResult> {
  const result: WriteResult = {};
  
  try {
    logger.log('📝 Writing transaction with legacy support:', transaction.type);
    
    // 1. ESCRIBIR EN transactions/ (colección nueva unificada)
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      date: Timestamp.fromDate(transaction.date),
      description: transaction.description || '',
      createdAt: Timestamp.fromDate(new Date()),
      source: 'app', // Indica que fue creada por la app, no migrada
      // Campos adicionales para deudas
      ...(transaction.creditor && { creditor: transaction.creditor }),
      ...(transaction.status && { status: transaction.status }),
    });
    
    result.transactionId = transactionRef.id;
    logger.log(`✅ Transaction written to transactions/: ${transactionRef.id}`);
    
    // 2. ESCRIBIR EN COLECCIÓN LEGACY (para compatibilidad temporal)
    if (transaction.type === 'income' || transaction.type === 'expense' || transaction.type === 'debt') {
      const legacyCollectionName = transaction.type === 'debt' 
        ? 'debts' 
        : transaction.type === 'income' 
          ? 'incomes' 
          : 'expenses';
      
      const legacyData: any = {
        amount: transaction.amount,
        category: transaction.category,
        date: Timestamp.fromDate(transaction.date),
        description: transaction.description || '',
        createdAt: Timestamp.fromDate(new Date()),
        // Referencia cruzada para rastrear migración
        transactionId: transactionRef.id,
        _migratedToTransactions: true,
      };
      
      // Campos específicos de deudas
      if (transaction.type === 'debt') {
        legacyData.creditor = transaction.creditor || '';
        legacyData.status = transaction.status || 'pending';
      }
      
      const legacyRef = await addDoc(
        collection(db, 'users', userId, legacyCollectionName),
        legacyData
      );
      
      result.legacyId = legacyRef.id;
      logger.log(`✅ Legacy entry written to users/${userId}/${legacyCollectionName}: ${legacyRef.id}`);
    }
    // compra solo va a transactions/ (no tiene legacy)
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Write failed:', error);
    throw error; // Re-throw para que el formulario pueda manejar el error
  }
  
  return result;
}

/**
 * Helper: Convierte tipo de transacción a nombre de colección legacy
 */
export function getLegacyCollectionName(type: string): string | null {
  const mapping: Record<string, string> = {
    'income': 'incomes',
    'expense': 'expenses',
    'debt': 'debts',
  };
  return mapping[type] || null;
}
