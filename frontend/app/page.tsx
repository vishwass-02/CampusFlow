'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';

const LineWaves = dynamic(() => import('@/components/LineWaves'), { ssr: false });

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
      {/* Animated WebGL background */}
      <div className="line-waves-bg">
        <LineWaves
          speed={0.2}
          innerLineCount={28}
          outerLineCount={32}
          warpIntensity={0.8}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={0.6}
          brightness={0.12}
          color1="#3b82f6"
          color2="#6366f1"
          color3="#8b5cf6"
          enableMouseInteraction={false}
          mouseInfluence={1.5}
        />
      </div>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4 z-10"></div>
      <p className="text-slate-400 text-xs font-semibold z-10 animate-pulse tracking-wide">Loading your workspace...</p>
    </div>
  );
}

