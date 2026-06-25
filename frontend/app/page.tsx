'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Authenticate with local backend
        const { data: authData } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Check if user has a profile in our backend
        const { data } = await api.get(`/students/${authData.id}`);
        if (data && data.id) {
          // Profile exists
          localStorage.setItem('studentId', data.id);
          localStorage.setItem('studentName', data.name);
          router.push('/dashboard');
        } else {
          // No profile, needs onboarding
          router.push('/onboarding');
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response?.status === 404) {
          // User authenticated but no student profile
          router.push('/onboarding');
        } else {
          // Invalid token or no connection
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    };
    
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="spotlight-top" />
      <div className="spotlight-bottom" />
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4 z-10"></div>
      <p className="text-slate-400 text-xs font-semibold z-10 animate-pulse tracking-wide">Loading your workspace...</p>
    </div>
  );
}
