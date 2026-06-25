'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, Mail, Phone, BookOpen, GraduationCap, MapPin, Sparkles } from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', branch: '', year: '1',
    subjects: '', phone: '', email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.branch || !form.subjects || !form.phone || !form.email) {
      setError('Please fill in all the fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/students/register', {
        ...form,
        year: parseInt(form.year),
        subjects: form.subjects.split(',').map(s => s.trim()),
      });
      localStorage.setItem('studentId', data.id);
      localStorage.setItem('studentName', data.name);
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Check your backend and database connection.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-gray-900/40 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-8 md:p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-2xl mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <GraduationCap className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Welcome to CampusFlow
          </h1>
          <p className="text-gray-400 text-sm mt-1 max-w-sm">
            Configure your B.Tech student profile to unlock automated WhatsApp reminders & AI study assistance.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-bold">⚠️</span> {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                placeholder="Vishwas Kumar"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Branch */}
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Branch</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="AI & ML"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Year of Study</label>
              <select
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}
              >
                <option value="1" className="bg-gray-950">1st Year (Freshman)</option>
                <option value="2" className="bg-gray-950">2nd Year (Sophomore)</option>
                <option value="3" className="bg-gray-950">3rd Year (Junior)</option>
                <option value="4" className="bg-gray-950">4th Year (Senior)</option>
              </select>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block flex justify-between">
              <span>Core Subjects</span>
              <span className="text-gray-600 font-normal lowercase">(comma separated)</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                placeholder="DBMS, OS, CN, AI"
                value={form.subjects}
                onChange={e => setForm({ ...form, subjects: e.target.value })}
              />
            </div>
          </div>

          {/* WhatsApp Phone */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block flex justify-between">
              <span>WhatsApp Number</span>
              <span className="text-indigo-400 text-[10px] lowercase tracking-normal">Requires +CountryCode</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                placeholder="+919876543210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                placeholder="vishwas@christuniversity.in"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all duration-300 transform active:scale-[0.98] disabled:from-indigo-800 disabled:to-purple-800 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>Setting up profile...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Initialize Workspace →
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
