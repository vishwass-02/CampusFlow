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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4 z-10"></div>
      <p className="text-gray-400 text-sm z-10 animate-pulse">Loading your workspace...</p>
    </div>
  );
}
