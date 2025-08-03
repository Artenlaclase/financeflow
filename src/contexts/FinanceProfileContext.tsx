"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from './AuthContext';

export interface FinanceProfile {
  userId: string;
  monthlyIncome: number;
  incomeStartDate?: Date; // Fecha desde cuando se recibe el ingreso fijo
  fixedExpenses: {
    housing: number;
    phone: number;
    internet: number;
    creditCards: number;
    loans: number;
    insurance: number;
  };
  expensesStartDate?: Date; // Fecha desde cuando se tienen los gastos fijos
  totalFixedExpenses: number;
  availableIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FinanceProfileContextType {
  profile: FinanceProfile | null;
  loading: boolean;
  createProfile: (data: Omit<FinanceProfile, 'userId' | 'totalFixedExpenses' | 'availableIncome' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (data: Partial<FinanceProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;
}

const FinanceProfileContext = createContext<FinanceProfileContextType>({
  profile: null,
  loading: false,
  createProfile: async () => {},
  updateProfile: async () => {},
  loadProfile: async () => {}
});

export function FinanceProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FinanceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const calculateTotals = (monthlyIncome: number, fixedExpenses: FinanceProfile['fixedExpenses']) => {
    const totalFixedExpenses = Object.values(fixedExpenses).reduce((sum, expense) => sum + expense, 0);
    const availableIncome = monthlyIncome - totalFixedExpenses;
    return { totalFixedExpenses, availableIncome };
  };

  const createProfile = async (data: Omit<FinanceProfile, 'userId' | 'totalFixedExpenses' | 'availableIncome' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');
    
    setLoading(true);
    try {
      const { totalFixedExpenses, availableIncome } = calculateTotals(data.monthlyIncome, data.fixedExpenses);
      
      const newProfile: FinanceProfile = {
        ...data,
        userId: user.uid,
        totalFixedExpenses,
        availableIncome,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'financeProfiles', user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error creating finance profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<FinanceProfile>) => {
    if (!user || !profile) throw new Error('Usuario no autenticado o perfil no existe');
    
    setLoading(true);
    try {
      const updatedData = { ...profile, ...data, updatedAt: new Date() };
      
      if (data.monthlyIncome !== undefined || data.fixedExpenses !== undefined) {
        const { totalFixedExpenses, availableIncome } = calculateTotals(
          updatedData.monthlyIncome, 
          updatedData.fixedExpenses
        );
        updatedData.totalFixedExpenses = totalFixedExpenses;
        updatedData.availableIncome = availableIncome;
      }

      await setDoc(doc(db, 'financeProfiles', user.uid), updatedData);
      setProfile(updatedData);
    } catch (error) {
      console.error('Error updating finance profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'financeProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FinanceProfile;
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading finance profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FinanceProfileContext.Provider value={{ 
      profile, 
      loading, 
      createProfile, 
      updateProfile, 
      loadProfile 
    }}>
      {children}
    </FinanceProfileContext.Provider>
  );
}

export const useFinanceProfile = () => useContext(FinanceProfileContext);
