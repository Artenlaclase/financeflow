"use client";

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/config';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  category?: string;
  date: any;
}

export const updateTransaction = async (
  userId: string, 
  transactionId: string, 
  type: 'income' | 'expense',
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
  type: 'income' | 'expense'
): Promise<void> => {
  if (!userId || !transactionId || !type) {
    throw new Error('Parámetros inválidos para eliminar la transacción');
  }

  try {
    // Importante: 'income' collection name es 'income', 'expense' collection name es 'expenses' 
    const collectionName = type === 'income' ? 'income' : 'expenses';
    console.log('Deleting from collection:', collectionName, 'Document ID:', transactionId);
    
    const docRef = doc(db, 'users', userId, collectionName, transactionId);
    await deleteDoc(docRef);
    console.log('Transaction deleted successfully:', transactionId);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw new Error('Error al eliminar la transacción: ' + (error as Error).message);
  }
};
