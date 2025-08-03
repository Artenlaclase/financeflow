"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Dashboard from './dashboard/page';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show dashboard if authenticated
  if (user) {
    return <Dashboard />;
  }

  // This will be briefly shown before redirect
  return null;
}