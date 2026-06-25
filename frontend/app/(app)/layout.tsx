'use client';
import Navbar from '@/components/Navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary transition-colors duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Shared Header Navigation */}
      <Navbar />

      {/* Main Structural Wrapper (Flex setup prepares layout for future left sidebar) */}
      <div className="flex flex-1 w-full relative">
        {/* Placeholder: Left Sidebar will go here in the future */}
        
        {/* Main Content Area with unified page containers */}
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
