'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  Lock 
} from 'lucide-react';

// ─── Shared input field wrapper ──────────────────────────────────────────────
function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
          {label}
        </label>
        {hint && <span className="text-[10px] text-slate-500 font-medium">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        <Icon className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full bg-[#030712]/50 border border-white/6 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-550 ' +
  'transition-all duration-250 outline-none ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-[#030712]/70';

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', branch: '', year: '1',
    subjects: '', phone: '', email: '', id: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Detect if the page was refreshed (reload) vs navigated to from the app
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isRefresh = navEntries.length > 0 && navEntries[0].type === 'reload';

    if (isRefresh) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    const getUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(prev => ({ ...prev, email: data.email || '', id: data.id }));
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [router]);

  const handleSubmit = async () => {
    if (!form.name || !form.branch || !form.subjects || !form.phone) {
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
    } catch {
      setError('Registration failed. Check your backend and database connection.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="spotlight-top" />
        <div className="spotlight-bottom" />
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 z-10"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050816] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* ── Ambient background glows ──────────────────────────────────────── */}
      <div className="spotlight-top" />
      <div className="spotlight-bottom" />

      <div className="relative w-full max-w-[480px]">
        {/* ── Card shell ────────────────────────────────────────────────────── */}
        <div className="glass-card p-8 sm:p-10 flex flex-col gap-6 relative z-10">
          
          {/* Header Area */}
          <div className="space-y-4">
            {/* Logo Brand */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-full text-blue-400">
                <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-lg font-bold text-slate-200 tracking-tight font-brand-sans">CampusFlow</span>
            </div>

            {/* AI Workspace Badge */}
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-[10px] font-bold tracking-wider uppercase w-fit">
              <Sparkles className="h-3 w-3 animate-pulse" strokeWidth={2} />
              Your AI Campus Workspace
            </div>

            {/* Title / Header */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-extrabold text-white tracking-tight font-brand-sans leading-[1.15]">
                Let&apos;s personalize <br />
                your <span className="text-blue-450 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">experience</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                One minute setup for a smarter academic journey.
              </p>
            </div>
          </div>

          {/* Form Fields Container */}
          <div className="space-y-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-[#1e1b4b]/30 border border-rose-500/20 text-rose-450 text-xs px-4 py-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <Field label="Full Name" icon={User}>
              <input
                className={inputCls}
                placeholder="Jesbin"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            {/* Branch and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Branch" icon={MapPin}>
                <input
                  className={inputCls}
                  placeholder="AI & ML"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                />
              </Field>

              <Field label="Year of Study" icon={GraduationCap}>
                <select
                  className={`${inputCls} appearance-none cursor-pointer pr-10`}
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                >
                  <option value="1" className="bg-slate-900 text-slate-200">1st Year</option>
                  <option value="2" className="bg-slate-900 text-slate-200">2nd Year</option>
                  <option value="3" className="bg-slate-900 text-slate-200">3rd Year</option>
                  <option value="4" className="bg-slate-900 text-slate-200">4th Year</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Field>
            </div>

            {/* Core Subjects */}
            <Field
              label="Core Subjects"
              hint="comma separated"
              icon={BookOpen}
            >
              <input
                className={inputCls}
                placeholder="DBMS, OS, CN, AI"
                value={form.subjects}
                onChange={e => setForm({ ...form, subjects: e.target.value })}
              />
            </Field>

            {/* WhatsApp */}
            <Field
              label="WhatsApp Number"
              hint="+CountryCode required"
              icon={Phone}
            >
              <input
                className={inputCls}
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </Field>

            {/* Email (Read Only from Auth) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Email Address (Verified)
                </label>
              </div>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  disabled
                  className="w-full bg-[#030712]/30 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-400 cursor-not-allowed opacity-60"
                  value={form.email}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold py-3.5 rounded-xl cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up your workspace…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Initialize Workspace
                    <ArrowRight className="h-4 w-4 ml-0.5" />
                  </>
                )}
              </button>
            </div>

            {/* Secure Caption */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>Your data is secure and private</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
