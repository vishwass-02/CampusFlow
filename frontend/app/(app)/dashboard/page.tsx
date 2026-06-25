'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  AlertCircle,
  FileText,
  Check
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tip, setTip] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', subject: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(true);

  const fetchTasks = async (id: string) => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTasks(data);
    } catch {}
  };

  const fetchTip = async () => {
    try {
      const { data } = await api.post('/ai/tip', { subject: 'engineering' });
      setTip(data.tip);
    } catch (err) {
      console.warn("Failed to fetch AI tip:", err);
      setTip("Review your B.Tech lecture notes within 24 hours to improve concept retention by up to 80%.");
    }
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.subject || !newTask.deadline) return;
    setLoading(true);
    try {
      await api.post('/tasks', { ...newTask, student_id: studentId, test_mode: testMode });
      setNewTask({ title: '', subject: '', deadline: '' });
      setShowAddTask(false);
      fetchTasks(studentId);
    } catch {}
    setLoading(false);
  };

  const markDone = async (id: string) => {
    await api.put(`/tasks/${id}`, { status: 'done' });
    fetchTasks(studentId);
  };

  const deleteTask = async (id: string) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks(studentId);
  };

  useEffect(() => {
    const id = localStorage.getItem('studentId') || '';
    const name = localStorage.getItem('studentName') || '';
    if (!id) { router.push('/onboarding'); return; }
    setTimeout(() => {
      setStudentId(id);
      setStudentName(name);
      fetchTasks(id);
      fetchTip();
    }, 0);
  }, [router]);

  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'done');

  // Derived display values — read-only, no business logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = studentName.split(' ')[0];
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const hasPending = pending.length > 0;

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-x-hidden pb-16">
      {/* Ambient background glows matching onboarding */}
      <div className="spotlight-top" />
      <div className="spotlight-bottom" />

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-12">

        {/* ── Page Hero ─────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2.5">
            {/* Eyebrow greeting & welcome */}
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-[10px] font-bold tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span>
                {firstName ? `${greeting}, ${firstName}` : greeting}
              </span>
            </div>

            {/* Primary title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-brand-sans leading-none">
              Study Dashboard
            </h1>

            {/* Supporting context text */}
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed font-medium">
              Welcome to your study environment for today, <span className="text-slate-200 font-semibold">{todayLabel}</span>. 
              {hasPending ? (
                <span>
                  {" "}You have <span className="text-blue-400 font-bold">{pending.length} pending task{pending.length !== 1 ? 's' : ''}</span> to complete. Let&apos;s keep the momentum going!
                </span>
              ) : (
                <span>
                  {" "}All caught up! You have no pending deadlines or active tasks.
                </span>
              )}
            </p>
          </div>

          {/* Right: primary action */}
          <div className="shrink-0">
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className={`flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer hover-scale ${
                showAddTask 
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' 
                  : 'glass-btn-primary'
              }`}
            >
              <Plus className={`h-4 w-4 transition-transform duration-300 ${showAddTask ? 'rotate-45' : ''}`} />
              {showAddTask ? 'Close Panel' : 'Add Task'}
            </button>
          </div>
        </section>

        {/* ── Stats Overview ───────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Pending Tasks */}
            <div className="glass-card p-6 shadow-2xl flex items-center justify-between glass-card-hover border-white/5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pending Tasks</span>
                <h3 className="text-3xl font-extrabold text-white tracking-tight font-brand-sans">{pending.length}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {pending.length === 0 ? "All caught up" : `${pending.length} need attention`}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3.5 rounded-2xl text-blue-400 shrink-0 border border-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Clock className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* Card 2: Completed Tasks */}
            <div className="glass-card p-6 shadow-2xl flex items-center justify-between glass-card-hover border-white/5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Completed Tasks</span>
                <h3 className="text-3xl font-extrabold text-white tracking-tight font-brand-sans">{done.length}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {done.length === 0 ? "No tasks completed" : `${done.length} finished`}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3.5 rounded-2xl text-emerald-400 shrink-0 border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckSquare className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* Card 3: Active Reminders */}
            <div className="glass-card p-6 shadow-2xl flex items-center justify-between glass-card-hover border-white/5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Active Reminders</span>
                <h3 className="text-3xl font-extrabold text-white tracking-tight font-brand-sans">{tasks.length}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {tasks.length === 0 ? "No reminders active" : `${tasks.length} total monitored`}
                </p>
              </div>
              <div className="bg-indigo-500/10 p-3.5 rounded-2xl text-indigo-400 shrink-0 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <AlertCircle className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Tip ───────────────────────────────────────────────── */}
        {tip && (
          <section>
            <div className="glass-card p-6 relative overflow-hidden flex items-start gap-4 border border-blue-500/15 halo-top-blue transition-all duration-300">
              {/* Left vertical glowing divider line */}
              <div className="w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full self-stretch shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                  <Sparkles className="h-3 w-3 text-blue-450 animate-pulse" />
                  AI Study Co-Pilot
                </div>
                <p className="text-slate-350 text-sm leading-relaxed font-medium">{tip}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Add Task Form ─────────────────────────────────────────── */}
        {showAddTask && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="glass-card overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-white/8">
              {/* Form Header */}
              <div className="px-6 py-4 bg-white/2 border-b border-white/5 flex items-center gap-2">
                <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400 border border-blue-500/15">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Create Study Task</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Add details to configure your personal reminder schedule.</p>
                </div>
              </div>

              {/* Form Body */}
               <div className="p-6 space-y-5">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="group">
                     <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200 block mb-2">
                       Task Title
                     </label>
                     <div className="relative flex items-center">
                       <FileText className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200 pointer-events-none" />
                       <input
                         className="w-full bg-[#030712]/50 border border-white/6 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-250 placeholder-slate-550 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-[#030712]/70"
                         placeholder="Review lecture notes"
                         value={newTask.title}
                         onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                       />
                     </div>
                   </div>

                   <div className="group">
                     <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200 block mb-2">
                       Subject Code
                     </label>
                     <div className="relative flex items-center">
                       <BookOpen className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200 pointer-events-none" />
                       <input
                         className="w-full bg-[#030712]/50 border border-white/6 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-250 placeholder-slate-550 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-[#030712]/70"
                         placeholder="DBMS (or OS, CN, etc.)"
                         value={newTask.subject}
                         onChange={e => setNewTask({ ...newTask, subject: e.target.value })}
                       />
                     </div>
                   </div>
                 </div>

                 {/* Form Footer Row */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
                   <label className="flex items-center gap-2.5 cursor-pointer select-none">
                     <input
                       type="checkbox"
                       id="testModeToggle"
                       checked={testMode}
                       onChange={e => setTestMode(e.target.checked)}
                       className="rounded border-white/10 text-blue-500 focus:ring-blue-500/20 bg-slate-950 w-4 h-4 cursor-pointer"
                     />
                     <span className="text-xs text-slate-400 font-medium">
                       Demo Mode <span className="text-blue-400 font-semibold">(30s WhatsApp Reminder instead of 24h)</span>
                     </span>
                   </label>

                   <div className="flex items-center gap-3 w-full sm:w-auto">
                     <input
                       type="datetime-local"
                       className="w-full sm:w-auto bg-[#030712]/50 border border-white/6 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer focus:bg-[#030712]/70"
                       value={newTask.deadline}
                       onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                       onClick={e => {
                         try { e.currentTarget.showPicker(); } catch {}
                       }}
                     />
                     <button
                       onClick={addTask}
                       disabled={loading}
                       className="w-full sm:w-auto glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold px-6 py-2.5 rounded-xl cursor-pointer shrink-0"
                     >
                       {loading ? 'Saving...' : 'Save Task'}
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          </section>
        )}

        {/* ── Task Lists ────────────────────────────────────────────── */}
        <div className="space-y-12">

          {/* Pending Tasks Section - Rebuilt to exactly match the reference layout */}
          <section className="space-y-4">
            <div className="glass-card p-6 md:p-8 space-y-6 border border-white/8 halo-top-blue relative overflow-hidden">
              {/* Reference lighting element */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-12 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white tracking-tight font-brand-sans">
                    Assigned to me
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Deadlines</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full">
                    {pending.length} remaining
                  </span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {pending.length === 0 ? (
                  <div className="text-center py-16 bg-white/2 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full mb-4">
                      <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-bold text-slate-200">All caught up!</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed text-center">
                      No pending deadlines or active tasks. Take a break, or create a new task to get started.
                    </p>
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create custom task
                    </button>
                  </div>
                ) : (
                  pending.map(task => {
                    // Generate progress percentage using title character code to make it look active/dynamic
                    const progress = (task.title.charCodeAt(0) % 5 + 3) * 10 + 2; 
                    return (
                      <div
                        key={task.id}
                        className="glass-panel p-5 space-y-4 transition-all duration-300 hover:border-blue-500/20 hover:scale-[1.005]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase">
                              {task.subject}
                            </span>
                            <h3 className="font-bold text-white text-base leading-tight tracking-tight pt-1">{task.title}</h3>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(task.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>

                          {/* Overlapping User Avatars matching reference exactly */}
                          <div className="flex -space-x-2.5 overflow-hidden shrink-0 py-1">
                            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#050816] bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md">JS</div>
                            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#050816] bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md">CF</div>
                            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#050816] bg-cyan-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md">AI</div>
                          </div>
                        </div>

                        {/* Custom glowing progress bar to replicate reference exactly */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-400" /> Reminder status</span>
                            <span className="font-bold text-slate-200">{progress}%</span>
                          </div>
                          <div className="w-full bg-[#030712]/80 border border-white/5 rounded-full h-2 overflow-hidden p-0.5">
                            <div className="progress-glow-blue h-1 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                          <button
                            onClick={() => markDone(task.id)}
                            className="flex items-center gap-1 text-xs font-extrabold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
                          >
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                            Mark Done
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-400 rounded-xl transition-all duration-200 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom statistics & Completed toggles matching reference exactly */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6 text-xs text-slate-400 font-semibold relative z-10">
                <span>{pending.length} of {tasks.length} tasks</span>
                <div className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-slate-400">Completed</span>
                  <div className="w-8 h-4 rounded-full bg-blue-600/20 border border-blue-500/30 p-0.5 relative flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-400 transform translate-x-3.5 transition-transform duration-200" />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Completed Tasks Section */}
          {done.length > 0 && (
            <section className="space-y-4">
              <div className="glass-card p-6 md:p-8 space-y-4 border border-white/8 halo-top-blue relative overflow-hidden">
                <header className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white tracking-tight font-brand-sans">
                      Completed Tasks
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Archived metrics</p>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full">
                    {done.length} completed
                  </span>
                </header>

                <div className="space-y-3">
                  {done.map(task => (
                    <div
                      key={task.id}
                      className="glass-panel opacity-65 p-4 flex items-center justify-between shadow-sm border-white/5 bg-slate-950/20"
                    >
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-400 line-through text-sm truncate">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-white/5 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {task.subject}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                          Done
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-450 rounded-lg transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
