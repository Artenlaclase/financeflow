"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from './AuthContext';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  createProfile: (data: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;
  getDisplayName: () => string;
}

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: false,
  createProfile: async () => {},
  updateProfile: async () => {},
  loadProfile: async () => {},
  getDisplayName: () => ''
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (data: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('No user authenticated');

    console.log('👤 UserProfileContext.createProfile iniciado');
    console.log('Usuario:', user.uid);
    console.log('Datos recibidos:', data);

    setLoading(true);
    try {
      const now = new Date();
      const profileData: UserProfile = {
        ...data,
        userId: user.uid,
        createdAt: now,
        updatedAt: now
      };

      console.log('Perfil de usuario a guardar:', profileData);
      console.log('Guardando en documento:', `userProfiles/${user.uid}`);

      await setDoc(doc(db, 'userProfiles', user.uid), profileData);
      console.log('✅ Perfil de usuario guardado exitosamente');
      
      setProfile(profileData);
      console.log('✅ Estado local del perfil actualizado');
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    } finally {
      setLoading(false);
      console.log('🏁 createProfile de usuario finalizado');
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No user or profile found');

    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        ...data,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'userProfiles', user.uid), updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (): string => {
    if (profile) {
      return `${profile.firstName} ${profile.lastName}`.trim();
    }
    return user?.email || 'Usuario';
  };

  return (
    <UserProfileContext.Provider value={{
      profile,
      loading,
      createProfile,
      updateProfile,
      loadProfile,
      getDisplayName
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
