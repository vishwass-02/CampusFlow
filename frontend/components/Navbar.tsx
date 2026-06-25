'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, Calendar, Activity, GraduationCap, LogOut, Calculator, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setStudentName(localStorage.getItem('studentName') || 'Student');
    }, 0);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/onboarding');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Calendar },
    { name: 'Study Buddy', path: '/study-buddy', icon: Brain },
    { name: 'Notices', path: '/notice-summarizer', icon: GraduationCap },
    { name: 'Placements', path: '/placements', icon: Briefcase },
    { name: 'Automations', path: '/automations', icon: Activity },
    { name: 'Attendance', path: '/attendance-calculator', icon: Calculator },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-4 sticky top-0 z-50">
      <nav className="backdrop-blur-xl bg-[#0a1428]/50 border border-white/8 px-6 py-2 flex items-center justify-between shadow-[0_15px_50px_rgba(0,0,0,0.5)] rounded-full">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => router.push('/dashboard')}
        >
          <img 
            src="/logo.png" 
            alt="CampusFlow Logo" 
            className="h-7 w-auto object-contain bg-white rounded-lg px-2 py-0.5 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300"
          />
        </div>

        <div className="flex gap-1 md:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border cursor-pointer ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-slate-500 text-[8px] font-extrabold tracking-wider uppercase">Student Profile</span>
            <span className="text-slate-200 text-xs font-semibold">👋 {studentName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-full transition-all duration-300 border border-transparent hover:border-rose-500/10 cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
