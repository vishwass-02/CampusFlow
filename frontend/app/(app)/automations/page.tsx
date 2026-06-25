'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  created_at: string;
}

export default function Automations() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const statusStyle = (s: string) => {
    if (s === 'triggered') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (s === 'success') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    return <XCircle className="h-4 w-4 text-rose-400" />;
  };

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-x-hidden pb-16">
      {/* Background blurs */}
      <div className="spotlight-top" />
      <div className="spotlight-bottom" />

      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-brand-sans">
              Automation Logs
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Live feed monitoring of direct Twilio API calls and task reminder schedules.
            </p>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center justify-center gap-1.5 self-start glass-btn-secondary px-5 py-2.5 rounded-full cursor-pointer hover-scale text-xs font-bold shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="glass-card border border-dashed border-white/10 bg-transparent py-20 px-6 text-center border-white/8 shadow-xl">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-slate-200 text-base font-bold">No logs recorded yet</p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              Dispatched WhatsApp notifications or scheduled reminders will register logs here.
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
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>Recipient:</span>
                        <span className="text-slate-300 font-mono">+{log.student_phone.replace(/\D/g, '')}</span>
                      </div>
                    )}
                    {log.payload && (
                      <div className="flex items-center gap-2 text-xs text-slate-455 font-semibold">
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        <span>Payload details:</span>
                        <span className="text-blue-400 font-bold truncate">
                          {log.payload.taskTitle || log.payload.eventTitle || log.payload.error || JSON.stringify(log.payload)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
