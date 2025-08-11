"use client";

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/config';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'compra';
  amount: number;
  description?: string;
  category?: string;
  date: any;
}

export const updateTransaction = async (
  userId: string, 
  transactionId: string, 
  type: 'income' | 'expense' | 'compra',
  updateData: Partial<Transaction>
): Promise<void> => {
  try {
    // Importante: 'income' collection name es 'income', 'expense' collection name es 'expenses'
    const collectionName = type === 'income' ? 'income' : 'expenses';
    console.log('Updating in collection:', collectionName, 'Document ID:', transactionId);
    
    const docRef = doc(db, 'users', userId, collectionName, transactionId);
    
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Eliminar campos que no se deben actualizar
    delete dataToUpdate.id;
    delete dataToUpdate.type;
    
    await updateDoc(docRef, dataToUpdate);
    console.log('Transaction updated successfully:', transactionId);
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
    // Importante: 'income' collection name es 'income', 'expense' collection name es 'expenses' 
    const collectionName = type === 'income' ? 'income' : 'expenses';
    console.log('Deleting from collection:', collectionName, 'Document ID:', transactionId);
    
    const docRef = doc(db, 'users', userId, collectionName, transactionId);
    console.log('Document reference created:', docRef.path);
    
    await deleteDoc(docRef);
    console.log('Transaction deleted successfully:', transactionId);
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
