'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  ChevronRight,
  Bell,
  Calendar,
  AlertTriangle,
  Play
} from 'lucide-react';

interface Log {
  id: string;
  workflow_name: string;
  student_phone: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  created_at: string;
}

interface Preferences {
  deadlineReminders: boolean;
  deadlineHours: number;
  dailyDigest: boolean;
  overdueAlerts: boolean;
}

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full cursor-pointer p-0.5 transition-colors duration-300 ease-in-out flex items-center ${checked ? 'bg-blue-600' : 'bg-slate-800'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </div>
);

export default function Automations() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [prefsRes, logsRes] = await Promise.all([
        api.get(`/automations/preferences/${id}`),
        api.get(`/automations/logs/${id}`)
      ]);
      setPrefs(prefsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const id = localStorage.getItem('studentId');
    if (!id) {
      router.push('/login');
      return;
    }
    const timer = setTimeout(() => {
      setStudentId(id);
      fetchData(id);
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const updatePrefs = async (updates: Partial<Preferences>) => {
    if (!prefs || !studentId) return;
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    try {
      await api.put(`/automations/preferences/${studentId}`, newPrefs);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCheck = async () => {
    if (!studentId) return;
    setChecking(true);
    try {
      await api.post('/automations/trigger-check', { studentId });
      await fetchData(studentId);
    } catch (err) {
      console.error(err);
    }
    setChecking(false);
  };

  const statusStyle = (s: string) => {
    if (s === 'failed') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    return <XCircle className="h-4 w-4 text-rose-400" />;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16">

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-brand-sans">
              Automations Control Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Manage your AI study assistants, email reminders, and smart workflows.
            </p>
          </div>
          <button 
            onClick={() => studentId && fetchData(studentId)} 
            disabled={loading}
            className="flex items-center justify-center gap-1.5 self-start glass-btn-secondary px-5 py-2.5 rounded-full cursor-pointer hover-scale text-xs font-bold shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Section 1: Automation Controls */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deadline Reminders */}
          <div className="glass-card p-6 shadow-2xl flex flex-col justify-between border-white/5 glass-card-hover min-h-[220px]">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-450 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                  <Bell className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.deadlineReminders} onChange={(v) => updatePrefs({ deadlineReminders: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1 font-brand-sans">Deadline Reminders</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4 font-medium">
                Get an email notification before your task deadlines hit.
              </p>
            </div>
            {prefs && (
              <div className={`pt-3 border-t border-white/5 transition-opacity duration-300 ${prefs.deadlineReminders ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-semibold">
                  <span>Remind me</span>
                  <span className="text-blue-400 font-bold">{prefs.deadlineHours}h before</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="48" 
                  value={prefs.deadlineHours}
                  onChange={(e) => updatePrefs({ deadlineHours: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                />
              </div>
            )}
          </div>

          {/* Daily Study Digest */}
          <div className="glass-card p-6 shadow-2xl flex flex-col justify-between border-white/5 glass-card-hover min-h-[220px]">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-450 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                  <Calendar className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.dailyDigest} onChange={(v) => updatePrefs({ dailyDigest: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1 font-brand-sans">Daily Study Digest</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Receive a morning summary of your tasks for the week along with AI study tips.
              </p>
            </div>
          </div>

          {/* Overdue Alerts */}
          <div className="glass-card p-6 shadow-2xl flex flex-col justify-between border-white/5 glass-card-hover min-h-[220px]">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-450 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.overdueAlerts} onChange={(v) => updatePrefs({ overdueAlerts: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1 font-brand-sans">Overdue Alerts</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Get a nudge email when you miss a deadline and haven&apos;t marked the task as done.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Quick Actions */}
        <section className="glass-card border-white/8 p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 halo-top-blue relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-12 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-white font-bold flex items-center gap-2 font-brand-sans">
              <Zap className="h-4 w-4 text-blue-400" />
              Manual Trigger
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Force the engine to run all active background checks immediately.</p>
          </div>
          <button
            onClick={triggerCheck}
            disabled={checking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 glass-btn-primary font-bold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {checking ? 'Running...' : 'Run Checks Now'}
          </button>
        </section>

        {/* Section 3: Automation Logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-brand-sans">
              <Activity className="h-4.5 w-4.5 text-blue-400" />
              Activity Feed
            </h2>
          </div>

          {logs.length === 0 ? (
            <div className="glass-card border border-dashed border-white/10 bg-transparent py-20 px-6 text-center border-white/8">
              <div className="bg-blue-500/10 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Zap className="h-6 w-6" />
              </div>
              <p className="text-slate-200 text-base font-bold">No activity yet</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed font-medium">
                When automations are triggered, the execution logs will appear here.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-white/5 ml-3 pl-6 sm:pl-8 space-y-8">
              {logs.map(log => (
                <div key={log.id} className="relative">
                  {/* Timeline Bullet Icon matching the reference layout */}
                  <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 bg-[#050816] p-1.5 rounded-full border border-blue-500/25 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.25)] z-20 flex items-center justify-center">
                    <Zap className="h-3 w-3" />
                  </div>

                  <div 
                    className="glass-panel border-white/5 p-5 transition-all duration-300 shadow-md hover:border-blue-500/20 hover:scale-[1.005]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-slate-200 font-bold text-sm tracking-tight flex items-center gap-1.5">
                          {log.workflow_name}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider border flex items-center gap-1 ${statusStyle(log.status)}`}>
                          {statusIcon(log.status)}
                          {log.status === 'triggered' ? 'Dispatched' : log.status}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-white/5 pt-3 mt-3">
                      {log.student_phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                          <span>Recipient:</span>
                          <span className="text-slate-300 font-mono">+{log.student_phone.replace(/\D/g, '')}</span>
                        </div>
                      )}
                      {log.payload && (
                        <div className="flex items-center gap-2 text-xs text-slate-455 font-semibold">
                          <ChevronRight className="h-3.5 w-3.5 text-slate-550" />
                          <span>Payload:</span>
                          <span className="text-blue-400 font-bold truncate">
                            {JSON.stringify(log.payload).replace(/[{}]/g, '').replace(/"/g, '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
