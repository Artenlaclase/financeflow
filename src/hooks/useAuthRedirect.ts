import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceProfile } from '../contexts/FinanceProfileContext';

export function useAuthRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useFinanceProfile();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      const currentPath = window.location.pathname;
      
      // Si no está autenticado y no está en login/register, redirigir a login
      if (!user && !currentPath.includes('/login') && !currentPath.includes('/register')) {
        router.push('/login');
      }
      
      // Si está autenticado y está en login/register, redirigir según tenga perfil o no
      if (user && (currentPath.includes('/login') || currentPath.includes('/register'))) {
        if (profile) {
          router.push('/dashboard');
        } else {
          router.push('/dashboard'); // AuthGuard se encargará de mostrar el setup
        }
      }
    }
  }, [user, profile, authLoading, profileLoading, router]);

  return {
    user,
    profile,
    loading: authLoading || profileLoading,
    needsSetup: user && !profile
  };
}
