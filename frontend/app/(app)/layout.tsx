'use client';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

const LineWaves = dynamic(() => import('@/components/LineWaves'), { ssr: false });

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-text-primary transition-colors duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
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
          brightness={0.18}
          color1="#3b82f6"
          color2="#6366f1"
          color3="#8b5cf6"
          enableMouseInteraction={true}
          mouseInfluence={1.5}
        />
      </div>

      {/* Shared Header Navigation */}
      <Navbar />

      {/* Main Structural Wrapper */}
      <div className="flex flex-1 w-full relative">
        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

