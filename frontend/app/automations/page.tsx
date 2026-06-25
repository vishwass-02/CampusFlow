'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Clock, 
  Zap,
  ChevronRight
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Log {
  id: string;
  workflow_name: string;
  student_phone: string;
  status: string;
  payload: any;
  created_at: string;
}

export default function Automations() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setLogs(data || []);
    setLoading(false);
  };

  const statusStyle = (s: string) => {
    if (s === 'triggered') return 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40';
    if (s === 'success') return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
  };

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    return <XCircle className="h-4 w-4 text-rose-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Shared Header */}
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Automation Logs
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">
              Live feed monitoring of direct Twilio API calls and task reminder schedules.
            </p>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center justify-center gap-1.5 self-start bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl">
            <div className="bg-gray-900 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-gray-500">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-gray-400 text-base font-bold">No logs record yet</p>
            <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              Dispatched WhatsApp notifications or scheduled reminders will register logs here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <div 
                key={log.id} 
                className="bg-gray-900/40 backdrop-blur-md border border-gray-800 hover:border-gray-700/80 rounded-xl p-5 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-400" />
                      {log.workflow_name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border flex items-center gap-1 ${statusStyle(log.status)}`}>
                      {statusIcon(log.status)}
                      {log.status === 'triggered' ? 'Dispatched' : log.status}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-gray-800/60 pt-3 mt-3">
                  {log.student_phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      <span>Recipient:</span>
                      <span className="text-gray-300 font-mono">+{log.student_phone.replace(/\D/g, '')}</span>
                    </div>
                  )}
                  {log.payload && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                      <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                      <span>Payload details:</span>
                      <span className="text-indigo-400 font-medium truncate">
                        {log.payload.taskTitle || log.payload.eventTitle || log.payload.error || JSON.stringify(log.payload)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
