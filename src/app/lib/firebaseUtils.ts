import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface ExpenseData {
  description: string;
  amount: number;
  category: string;
  date: Date;
}

export const addExpense = async (userId: string, expenseData: ExpenseData) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'expenses'), {
      ...expenseData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const addIncome = async (userId: string, incomeData: { description: string; amount: number; date: Date }) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'income'), {
      ...incomeData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
};

export const addDebt = async (userId: string, debtData: { description: string; amount: number; dueDate: Date; paid: boolean }) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'debts'), {
      ...debtData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding debt:', error);
    throw error;
  }
};
