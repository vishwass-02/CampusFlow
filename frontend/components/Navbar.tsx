'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, Calendar, GraduationCap, LogOut, Calculator } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    setStudentName(localStorage.getItem('studentName') || 'Student');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/onboarding');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Calendar },
    { name: 'Study Buddy', path: '/study-buddy', icon: Brain },
    { name: 'Notices', path: '/notice-summarizer', icon: GraduationCap },
    { name: 'Attendance', path: '/attendance-calculator', icon: Calculator },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-950/70 border-b border-gray-800/85 px-6 py-3 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => router.push('/dashboard')}
      >
        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold text-xl tracking-tight">
          CampusFlow
        </span>
      </div>

      <div className="flex gap-1 md:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-gray-500 text-[10px] font-semibold tracking-wider uppercase">Student Profile</span>
          <span className="text-gray-200 text-sm font-semibold">👋 {studentName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
