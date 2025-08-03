"use client";

import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase/config';

export const addTestTransactions = async (userId: string) => {
  try {
    // Agregar algunas transacciones de prueba
    const testExpenses = [
      {
        amount: 50.00,
        category: 'Comida',
        description: 'Almuerzo en restaurante',
        date: new Date(),
        createdAt: new Date()
      },
      {
        amount: 25.50,
        category: 'Transporte',
        description: 'Taxi al trabajo',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        createdAt: new Date()
      }
    ];

    const testIncomes = [
      {
        amount: 100.00,
        category: 'Freelance',
        description: 'Trabajo extra',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        createdAt: new Date()
      }
    ];

    // Agregar gastos
    for (const expense of testExpenses) {
      await addDoc(collection(db, 'users', userId, 'expenses'), expense);
    }

    // Agregar ingresos
    for (const income of testIncomes) {
      await addDoc(collection(db, 'users', userId, 'income'), income);
    }

    console.log('Test transactions added successfully');
  } catch (error) {
    console.error('Error adding test transactions:', error);
  }
};
