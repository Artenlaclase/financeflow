"use client";

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { FirebaseDate } from '@/types/firebase';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'compra';
  amount: number;
  description?: string;
  category?: string;
  date: FirebaseDate;
  paymentMethod?: 'efectivo' | 'debito' | 'credito';
  installments?: number;
  merchant?: string;
}

export const updateTransaction = async (
  userId: string, 
  transactionId: string, 
  type: 'income' | 'expense' | 'compra',
  updateData: Partial<Transaction>
): Promise<void> => {
  try {
    // Intentar primero en la colección global de transacciones
    console.log('Attempting to update in global collection: transactions, ID:', transactionId);

    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Eliminar campos que no se deben actualizar
    delete dataToUpdate.id;
    delete dataToUpdate.type;

    try {
      const globalRef = doc(db, 'transactions', transactionId);
      await updateDoc(globalRef, dataToUpdate);
      console.log('Transaction updated successfully in global collection:', transactionId);
      return;
    } catch (globalErr) {
      console.warn('Global update failed, attempting legacy path...', globalErr);
      // Fallback a colecciones legacy por usuario
      const collectionName = type === 'income' ? 'income' : 'expenses';
      const legacyRef = doc(db, 'users', userId, collectionName, transactionId);
      await updateDoc(legacyRef, dataToUpdate);
      console.log('Transaction updated successfully in legacy collection:', collectionName, transactionId);
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw new Error('Error al actualizar la transacción');
  }
};

export const deleteTransaction = async (
  userId: string, 
  transactionId: string, 
  type: 'income' | 'expense' | 'compra'
): Promise<void> => {
  console.log('deleteTransaction called with:', { userId, transactionId, type });
  
  if (!userId || !transactionId || !type) {
    console.error('Invalid parameters:', { userId, transactionId, type });
    throw new Error('Parámetros inválidos para eliminar la transacción');
  }

  try {
    // Intentar primero borrar en la colección global
    try {
      const globalRef = doc(db, 'transactions', transactionId);
      await deleteDoc(globalRef);
      console.log('Transaction deleted successfully from global collection:', transactionId);
      return;
    } catch (globalErr) {
      console.warn('Global delete failed, attempting legacy path...', globalErr);
      // Fallback a colecciones legacy por usuario
      const collectionName = type === 'income' ? 'income' : 'expenses';
      console.log('Deleting from legacy collection:', collectionName, 'Document ID:', transactionId);
      const legacyRef = doc(db, 'users', userId, collectionName, transactionId);
      console.log('Document reference created:', legacyRef.path);
      await deleteDoc(legacyRef);
      console.log('Transaction deleted successfully from legacy collection:', transactionId);
    }
  } catch (error) {
    console.error('Firestore delete error:', error);
    
    // Proporcionar más información sobre el error
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Sin permisos para eliminar la transacción. Verifica las reglas de Firestore.');
      } else if (error.message.includes('not-found')) {
        throw new Error('La transacción no existe o ya fue eliminada.');
      } else {
        throw new Error('Error al eliminar la transacción: ' + error.message);
      }
    } else {
      throw new Error('Error desconocido al eliminar la transacción');
    }
  }
};
