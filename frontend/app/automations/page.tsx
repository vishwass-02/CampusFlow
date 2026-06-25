'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  ChevronRight,
  Settings,
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
  payload: any;
  created_at: string;
}

interface Preferences {
  deadlineReminders: boolean;
  deadlineHours: number;
  dailyDigest: boolean;
  overdueAlerts: boolean;
}

export default function Automations() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('studentId');
    if (!id) {
      router.push('/login');
      return;
    }
    setStudentId(id);
    fetchData(id);
  }, [router]);

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
    if (s === 'failed') return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
    return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
  };

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    return <XCircle className="h-4 w-4 text-rose-400" />;
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full cursor-pointer p-1 transition-colors duration-300 ease-in-out flex items-center ${checked ? 'bg-indigo-600' : 'bg-gray-700'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Automations Control Panel
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            Manage your AI study assistants, email reminders, and smart workflows.
          </p>
        </div>

        {/* Section 1: Automation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Deadline Reminders */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-500/20 p-2.5 rounded-lg text-indigo-400">
                  <Bell className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.deadlineReminders} onChange={(v) => updatePrefs({ deadlineReminders: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1">Deadline Reminders</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Get an email notification before your task deadlines hit.
              </p>
            </div>
            {prefs && (
              <div className={`pt-3 border-t border-gray-800 transition-opacity ${prefs.deadlineReminders ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Remind me</span>
                  <span className="text-indigo-400 font-bold">{prefs.deadlineHours}h before</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="48" 
                  value={prefs.deadlineHours}
                  onChange={(e) => updatePrefs({ deadlineHours: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
                />
              </div>
            )}
          </div>

          {/* Daily Study Digest */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400">
                  <Calendar className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.dailyDigest} onChange={(v) => updatePrefs({ dailyDigest: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1">Daily Study Digest</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Receive a morning summary of your tasks for the week along with AI study tips.
              </p>
            </div>
          </div>

          {/* Overdue Alerts */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="bg-rose-500/20 p-2.5 rounded-lg text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                {prefs && <ToggleSwitch checked={prefs.overdueAlerts} onChange={(v) => updatePrefs({ overdueAlerts: v })} />}
              </div>
              <h3 className="text-white font-bold text-base mb-1">Overdue Alerts</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Get a nudge email when you miss a deadline and haven't marked the task as done.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Quick Actions */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-900/40 border border-gray-800 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Manual Trigger
            </h3>
            <p className="text-gray-400 text-xs mt-1">Force the engine to run all active background checks immediately.</p>
          </div>
          <button
            onClick={triggerCheck}
            disabled={checking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {checking ? 'Running...' : 'Run Checks Now'}
          </button>
        </div>

        {/* Section 3: Automation Logs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              Activity Feed
            </h2>
            <button 
              onClick={() => fetchData(studentId)} 
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl">
              <div className="bg-gray-900 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-gray-500">
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-gray-400 text-base font-bold">No activity yet</p>
              <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                When automations are triggered, the execution logs will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 text-gray-400 flex-shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        {log.workflow_name}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border flex items-center gap-1 ${statusStyle(log.status)}`}>
                          {statusIcon(log.status)}
                          {log.status}
                        </span>
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {log.payload && (
                    <div className="bg-gray-950/50 rounded border border-gray-800 p-2 text-xs text-gray-400 font-mono w-full sm:w-auto sm:max-w-xs truncate overflow-hidden">
                      {JSON.stringify(log.payload).replace(/[{}]/g, '').replace(/"/g, '')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
