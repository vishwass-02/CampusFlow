'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
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

  useEffect(() => {
    const id = localStorage.getItem('studentId') || '';
    const name = localStorage.getItem('studentName') || '';
    if (!id) { router.push('/onboarding'); return; }
    setStudentId(id);
    setStudentName(name);
    fetchTasks(id);
    fetchTip();
  }, []);

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
      await api.post('/tasks', { 
        ...newTask, 
        deadline: new Date(newTask.deadline).toISOString(), 
        student_id: studentId, 
        test_mode: testMode 
      });
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

  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* Shared Navbar */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 relative">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Study Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage your tasks and track automated WhatsApp reminders.
            </p>
          </div>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="flex items-center justify-center gap-2 self-start bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 transform active:scale-95 shadow-[0_4px_15px_rgba(99,102,241,0.25)]"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{pending.length} tasks</h3>
            </div>
          </div>

          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{done.length} tasks</h3>
            </div>
          </div>

          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Reminders</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{tasks.length} active</h3>
            </div>
          </div>
        </div>

        {/* AI Tip Card */}
        {tip && (
          <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 backdrop-blur-md border border-indigo-500/20 rounded-xl p-5 mb-8 shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-extrabold tracking-widest uppercase">
              <Sparkles className="h-4 w-4 animate-bounce" />
              AI Tip of the Day
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{tip}</p>
          </div>
        )}

        {/* Add Task Form */}
        {showAddTask && (
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-6 mb-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Create Study Task
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Task Title</label>
                <input
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="Review lecture notes"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Subject Code</label>
                <input
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="DBMS (or OS, CN, etc.)"
                  value={newTask.subject}
                  onChange={e => setNewTask({ ...newTask, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="testModeToggle"
                  checked={testMode}
                  onChange={e => setTestMode(e.target.checked)}
                  className="rounded border-gray-800 bg-gray-950 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="testModeToggle" className="text-xs text-gray-400 cursor-pointer select-none">
                  Demo Mode <span className="text-indigo-400/90">(30s WhatsApp Reminder instead of 24h)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="datetime-local"
                  className="bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  value={newTask.deadline}
                  onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                  onClick={e => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                />
                <button
                  onClick={addTask}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-bold px-6 py-2 rounded-lg transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                >
                  {loading ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task lists */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Deadlines
            </h2>

            <div className="space-y-3">
              {pending.length === 0 && (
                <div className="text-center py-14 bg-gray-900/10 border border-dashed border-gray-800/80 rounded-xl">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-gray-500 text-sm font-semibold">All caught up! No pending deadlines.</p>
                </div>
              )}
              {pending.map(task => (
                <div 
                  key={task.id} 
                  className="bg-gray-900/30 backdrop-blur-md border border-gray-800/80 hover:border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)]"
                >
                  <div>
                    <h3 className="font-bold text-white text-base">{task.title}</h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-gray-400 text-xs mt-1.5 font-medium">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {task.subject}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        Due: {new Date(task.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => markDone(task.id)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 px-3.5 py-2 rounded-lg transition-all duration-200"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Done
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/40 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          {done.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Completed
              </h2>
              <div className="space-y-2.5">
                {done.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-gray-900/20 border border-gray-800/40 rounded-xl p-4 flex items-center justify-between opacity-50"
                  >
                    <div>
                      <h3 className="font-bold text-gray-400 line-through text-sm">{task.title}</h3>
                      <p className="text-gray-500 text-xs mt-1">{task.subject}</p>
                    </div>
                    <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                      <Check className="h-3.5 w-3.5" />
                      Done
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
