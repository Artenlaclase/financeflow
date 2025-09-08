"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceProfile } from '../contexts/FinanceProfileContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

export const useMonthlyReset = () => {
  const { user } = useAuth();
  const { profile } = useFinanceProfile();
  const lastResetMonth = useRef<number | null>(null);

  useEffect(() => {
    const checkAndResetMonthlyData = async () => {
      if (!user || !profile) return;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Si es la primera vez o cambió el mes, resetear los pagos
      if (lastResetMonth.current === null || lastResetMonth.current !== currentMonth) {
        try {
          const monthlyPaymentsRef = doc(db, 'users', user.uid, 'monthlyPayments', `${currentYear}-${currentMonth + 1}`);
          
          // Verificar si ya existe un documento para este mes
          const docSnap = await getDoc(monthlyPaymentsRef);
          
          if (!docSnap.exists()) {
            // Crear nuevo documento con todos los pagos en false
            await setDoc(monthlyPaymentsRef, {
              housing: false,
              phone: false,
              internet: false,
              creditCards: false,
              loans: false,
              insurance: false,
              createdAt: new Date(),
              month: currentMonth + 1,
              year: currentYear
            });

            console.log(`🔄 Monthly reset: Created new payment tracking for ${currentYear}-${currentMonth + 1}`);
          }

          lastResetMonth.current = currentMonth;
        } catch (error) {
          console.error('Error during monthly reset:', error);
        }
      }
    };

    checkAndResetMonthlyData();

    // Verificar cada minuto si cambió el mes
    const interval = setInterval(checkAndResetMonthlyData, 60000);

    return () => clearInterval(interval);
  }, [user, profile]);

  return {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
  };
};
