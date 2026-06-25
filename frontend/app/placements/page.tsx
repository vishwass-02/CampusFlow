'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

/* ─── constants ─── */
const STATUSES = ['applied','shortlisted','oa','interview','offer','rejected'];
const ROUNDS   = ['Application','OA','Technical Round 1','Technical Round 2','HR Round','Final Round'];
const MOCK_ROUNDS = ['Technical Round 1','Technical Round 2','HR Round','OA'];

const STATUS_STYLE: Record<string,string> = {
  applied:     'bg-blue-900/40 text-blue-300 border-blue-800',
  shortlisted: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  oa:          'bg-orange-900/40 text-orange-300 border-orange-800',
  interview:   'bg-purple-900/40 text-purple-300 border-purple-800',
  offer:       'bg-green-900/40 text-green-300 border-green-800',
  rejected:    'bg-red-900/40 text-red-300 border-red-800',
};
const STATUS_ICON: Record<string,string> = {
  applied:'📨', shortlisted:'⭐', oa:'💻', interview:'🎙️', offer:'🎉', rejected:'❌',
};
const Q_TYPE_STYLE: Record<string,string> = {
  DSA:            'bg-blue-900/40 text-blue-300 border-blue-800',
  'System Design':'bg-purple-900/40 text-purple-300 border-purple-800',
  HR:             'bg-pink-900/40 text-pink-300 border-pink-800',
  Behavioural:    'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  'Core CS':      'bg-teal-900/40 text-teal-300 border-teal-800',
};

/* ─── types ─── */
interface Placement {
  id: string; company: string; role: string; applied_date: string;
  status: string; current_round: string; rounds_cleared: string[];
  notes: string; package_lpa: number;
}
interface DayPlan { day: string; focus: string; tasks: string[]; tip: string; }
interface MockQ   { question: string; type: string; hint: string; sample_answer: string; }
interface ResumeResult {
  score: number; verdict: string; strengths: string[];
  improvements: string[]; missing_keywords: string[]; ats_tips: string[];
}
interface CalEvent {
  id: string; title: string; date: string; type: 'drive'|'deadline'|'interview'|'other'; company?: string;
}

/* ─── helpers ─── */
const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};
const scoreColor = (s: number) =>
  s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
const scoreBg = (s: number) =>
  s >= 75 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

/* ----------------------------------------------------------- */
export default function Placements() {
  const router = useRouter();
  const [studentId, setStudentId]     = useState('');
  const [placements, setPlacements]   = useState<Placement[]>([]);
  const [activeTab, setActiveTab]     = useState<'tracker'|'plan'|'resume'|'mock'|'calendar'>('tracker');

  /* tracker */
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string|null>(null);
  const [form, setForm]               = useState({ company:'', role:'', applied_date:'',
    status:'applied', current_round:'Application', notes:'', package_lpa:'' });
  const [formLoading, setFormLoading] = useState(false);

  /* prep plan */
  const [prepPlan, setPrepPlan]       = useState<DayPlan[]>([]);
  const [planDate, setPlanDate]       = useState('');
  const [genPlan, setGenPlan]         = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  /* resume */
  const [resumeText, setResumeText]   = useState('');
  const [targetRole, setTargetRole]   = useState('');
  const [resumeResult, setResumeResult] = useState<ResumeResult|null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  /* mock interview */
  const [mockCompany, setMockCompany] = useState('');
  const [mockRole, setMockRole]       = useState('');
  const [mockRound, setMockRound]     = useState('Technical Round 1');
  const [mockQs, setMockQs]           = useState<MockQ[]>([]);
  const [mockLoading, setMockLoading] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<number[]>([]);

  /* calendar */
  const [calEvents, setCalEvents]     = useState<CalEvent[]>([]);
  const [showCalForm, setShowCalForm] = useState(false);
  const [calForm, setCalForm]         = useState({ title:'', date:'', type:'drive' as CalEvent['type'], company:'' });

  /* ── data fetchers ── */
  const fetchPlacements = async (id: string) => {
    try { const { data } = await api.get(`/placements/${id}`); setPlacements(data); } catch {}
  };
  const fetchSavedPlan = async (id: string) => {
    try {
      const { data } = await api.get(`/placements/prepplan/${id}`);
      if (data.plan) { setPrepPlan(data.plan); setPlanDate(new Date(data.created_at).toLocaleDateString('en-IN')); }
    } catch {}
  };
  const loadCalEvents = () => {
    try { setCalEvents(JSON.parse(localStorage.getItem('calEvents') || '[]')); } catch {}
  };
  const saveCalEvents = (evs: CalEvent[]) => {
    setCalEvents(evs);
    localStorage.setItem('calEvents', JSON.stringify(evs));
  };

  /* ── init ── */
  useEffect(() => {
    const id = localStorage.getItem('studentId') || '';
    if (!id) { router.push('/onboarding'); return; }
    setTimeout(() => {
      setStudentId(id);
      fetchPlacements(id);
      fetchSavedPlan(id);
      loadCalEvents();
    }, 0);
  }, [router]);

  /* ── tracker actions ── */
  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      const payload = { ...form, student_id: studentId, package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null };
      if (editId) await api.put(`/placements/${editId}`, payload);
      else        await api.post('/placements', payload);
      setForm({ company:'', role:'', applied_date:'', status:'applied', current_round:'Application', notes:'', package_lpa:'' });
      setShowForm(false); setEditId(null);
      fetchPlacements(studentId);
    } catch {}
    setFormLoading(false);
  };
  const startEdit = (p: Placement) => {
    setForm({ company: p.company, role: p.role, applied_date: p.applied_date,
      status: p.status, current_round: p.current_round, notes: p.notes||'', package_lpa: p.package_lpa?.toString()||'' });
    setEditId(p.id); setShowForm(true);
  };
  const deleteEntry = async (id: string) => { await api.delete(`/placements/${id}`); fetchPlacements(studentId); };

  /* ── prep plan ── */
  const generatePlan = async () => {
    setGenPlan(true);
    try {
      const { data } = await api.post('/placements/ai/prepplan', {
        student_id: studentId, placements, branch: 'AI & ML', year: 3 });
      setPrepPlan(data.plan); setPlanDate(new Date().toLocaleDateString('en-IN'));
      setActiveTab('plan'); setSelectedDay(0);
    } catch {}
    setGenPlan(false);
  };

  /* ── resume ── */
  const analyzeResume = async () => {
    if (!resumeText.trim() || !targetRole.trim()) return;
    setResumeLoading(true); setResumeResult(null);
    try {
      const { data } = await api.post('/placements/ai/resume', { resumeText, targetRole });
      setResumeResult(data);
    } catch {}
    setResumeLoading(false);
  };

  /* ── mock interview ── */
  const generateMock = async () => {
    if (!mockCompany || !mockRole) return;
    setMockLoading(true); setMockQs([]); setRevealedIdx([]);
    try {
      const { data } = await api.post('/placements/ai/mockinterview', {
        company: mockCompany, role: mockRole, round: mockRound });
      setMockQs(data);
    } catch {}
    setMockLoading(false);
  };
  const toggleReveal = (i: number) =>
    setRevealedIdx(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  /* ── calendar ── */
  const addCalEvent = () => {
    if (!calForm.title || !calForm.date) return;
    const ev: CalEvent = { id: Date.now().toString(), ...calForm };
    saveCalEvents([...calEvents, ev].sort((a,b) => a.date.localeCompare(b.date)));
    setCalForm({ title:'', date:'', type:'drive', company:'' }); setShowCalForm(false);
  };
  const deleteCalEvent = (id: string) => saveCalEvents(calEvents.filter(e => e.id !== id));

  const CAL_TYPE_STYLE: Record<string,string> = {
    drive:     'bg-blue-900/40 text-blue-300 border-blue-800',
    deadline:  'bg-red-900/40 text-red-300 border-red-800',
    interview: 'bg-purple-900/40 text-purple-300 border-purple-800',
    other:     'bg-gray-800 text-gray-300 border-gray-700',
  };

  /* ── stats ── */
  const total     = placements.length;
  const offers    = placements.filter(p => p.status==='offer').length;
  const interviews= placements.filter(p => p.status==='interview').length;
  const rejected  = placements.filter(p => p.status==='rejected').length;
  const active    = placements.filter(p => !['offer','rejected'].includes(p.status)).length;
  const upcoming  = calEvents.filter(e => daysUntil(e.date) >= 0).length;

  const TABS = [
    { id:'tracker',  label:'Applications' },
    { id:'plan',     label:'Prep Plan' },
    { id:'resume',   label:'Resume AI' },
    { id:'mock',     label:'Mock Interview' },
    { id:'calendar', label: `Calendar ${upcoming>0 ? '(' + upcoming + ')' : ''}` },
  ] as const;

  /* --------------- RENDER --------------- */
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-purple-400 font-bold text-lg">CampusFlow</span>
        <div className="flex gap-4 text-sm">
          <button onClick={() => router.push('/dashboard')}         className="text-gray-400 hover:text-white transition-colors">Dashboard</button>
          <button onClick={() => router.push('/study-buddy')}       className="text-gray-400 hover:text-white transition-colors">Study Buddy</button>
          <button onClick={() => router.push('/notice-summarizer')} className="text-gray-400 hover:text-white transition-colors">Notices</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Placement Tracker</h1>
            <p className="text-gray-400 text-sm">Track applications · AI resume review · Mock interviews · Prep plan</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'tracker' && (
              <>
                <button onClick={generatePlan} disabled={genPlan || placements.length===0}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  {genPlan ? '✨ Generating...' : '✨ AI Prep Plan'}
                </button>
                <button onClick={() => { setShowForm(!showForm); setEditId(null); }}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  + Add Company
                </button>
              </>
            )}
            {activeTab === 'calendar' && (
              <button onClick={() => setShowCalForm(!showCalForm)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Add Event
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[
            { label:'Applied',    value: total,      color:'text-white' },
            { label:'Active',     value: active,     color:'text-blue-400' },
            { label:'Interviews', value: interviews, color:'text-purple-400' },
            { label:'Offers',     value: offers,     color:'text-green-400' },
            { label:'Rejected',   value: rejected,   color:'text-red-400' },
            { label:'Upcoming',   value: upcoming,   color:'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 text-sm px-4 py-2 rounded-lg transition-colors ${activeTab===t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ----------- TAB: TRACKER ----------- */}
        {activeTab === 'tracker' && (
          <div>
            {showForm && (
              <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-medium text-purple-300 mb-4">{editId ? 'Edit Application' : 'Log New Application'}</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="Company name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                  <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="Role (e.g. SDE Intern)" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Applied Date</label>
                    <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      value={form.applied_date} onChange={e => setForm({...form, applied_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Package LPA (if offer)</label>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. 12" value={form.package_lpa} onChange={e => setForm({...form, package_lpa: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Status</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Current Round</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      value={form.current_round} onChange={e => setForm({...form, current_round: e.target.value})}>
                      {ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none mb-3"
                  rows={2} placeholder="Notes — referral, prep focus, contact name..."
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={handleSubmit} disabled={formLoading || !form.company || !form.role || !form.applied_date}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                    {formLoading ? 'Saving...' : editId ? 'Update' : 'Save Application'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null); }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {placements.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-5xl mb-3">💼</p>
                <p className="text-lg mb-1">No applications logged yet</p>
                <p className="text-sm">Click &quot;+ Add Company&quot; to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {placements.map(p => (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-white">{p.company}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status]}`}>
                            {STATUS_ICON[p.status]} {p.status.charAt(0).toUpperCase()+p.status.slice(1)}
                          </span>
                          {p.package_lpa && (
                            <span className="text-xs bg-green-900/40 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">
                              ₹{p.package_lpa} LPA
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{p.role}</p>
                        <div className="flex items-center gap-1 mb-2">
                          {ROUNDS.map((r, i) => {
                            const ci = ROUNDS.indexOf(p.current_round);
                            return (
                              <div key={r} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${i < ci ? 'bg-green-500' : r===p.current_round ? 'bg-purple-500' : 'bg-gray-700'}`} />
                                {i < ROUNDS.length-1 && <div className={`w-4 h-0.5 ${i < ci ? 'bg-green-500' : 'bg-gray-700'}`} />}
                              </div>
                            );
                          })}
                          <span className="text-gray-500 text-xs ml-2">{p.current_round}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-gray-600 text-xs">Applied {new Date(p.applied_date).toLocaleDateString('en-IN')}</span>
                          {p.notes && <span className="text-gray-600 text-xs truncate max-w-xs">📝 {p.notes}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button onClick={() => { setMockCompany(p.company); setMockRole(p.role); setActiveTab('mock'); }}
                          className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          🎙️ Mock
                        </button>
                        <button onClick={() => startEdit(p)}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => deleteEntry(p.id)}
                          className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------- TAB: PREP PLAN ----------- */}
        {activeTab === 'plan' && (
          <div>
            {prepPlan.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-5xl mb-3">🤖</p>
                <p className="text-lg mb-1">No prep plan yet</p>
                <p className="text-sm mb-4">Go to Applications tab and click &quot;✨ AI Prep Plan&quot;</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-sm">Generated {planDate} · based on {placements.length} application{placements.length!==1?'s':''}</p>
                  <button onClick={generatePlan} disabled={genPlan}
                    className="text-sm text-purple-400 hover:text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg transition-colors">
                    {genPlan ? 'Regenerating...' : '↻ Regenerate'}
                  </button>
                </div>
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                  {prepPlan.map((d, i) => (
                    <button key={i} onClick={() => setSelectedDay(i)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedDay===i ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}>
                      {d.day}
                    </button>
                  ))}
                </div>
                {prepPlan[selectedDay] && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="bg-purple-600 rounded-xl w-12 h-12 flex items-center justify-center text-lg font-bold">{selectedDay+1}</div>
                      <div>
                        <h2 className="font-bold text-lg">{prepPlan[selectedDay].day}</h2>
                        <p className="text-purple-300 text-sm">Focus: {prepPlan[selectedDay].focus}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-5">
                      {prepPlan[selectedDay].tasks.map((task, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
                          <div className="w-6 h-6 rounded-full bg-purple-900 border border-purple-700 flex items-center justify-center text-xs text-purple-300 flex-shrink-0 mt-0.5">{i+1}</div>
                          <p className="text-gray-200 text-sm">{task}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3">
                      <p className="text-amber-300 text-xs font-medium mb-1">💡 TIP</p>
                      <p className="text-amber-100 text-sm">{prepPlan[selectedDay].tip}</p>
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <p className="text-gray-500 text-xs font-medium mb-3">WEEK OVERVIEW</p>
                  <div className="grid grid-cols-7 gap-2">
                    {prepPlan.map((d, i) => (
                      <button key={i} onClick={() => setSelectedDay(i)}
                        className={`rounded-xl p-3 text-center transition-colors ${selectedDay===i ? 'bg-purple-600' : 'bg-gray-900 border border-gray-800 hover:border-gray-600'}`}>
                        <p className="text-xs font-medium text-white">{d.day.slice(0,3)}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{d.focus.split(' ')[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------- TAB: RESUME AI ----------- */}
        {activeTab === 'resume' && (
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Paste your resume & get an instant AI review</h2>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 mb-3"
                placeholder="Target role (e.g. SDE Intern at Google)"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
              />
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none mb-3"
                rows={8}
                placeholder="Paste your full resume text here (copy from your PDF/doc)..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
              />
              <button onClick={analyzeResume} disabled={resumeLoading || !resumeText.trim() || !targetRole.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
                {resumeLoading ? '🔍 Analyzing...' : '🔍 Analyze Resume'}
              </button>
            </div>

            {resumeResult && (
              <div className="space-y-4">
                {/* Score card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">RESUME SCORE</p>
                      <p className={`text-5xl font-bold ${scoreColor(resumeResult.score)}`}>{resumeResult.score}<span className="text-2xl text-gray-500">/100</span></p>
                    </div>
                    <div className="w-24 h-24 relative flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={resumeResult.score>=75?'#22c55e':resumeResult.score>=50?'#eab308':'#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${resumeResult.score} ${100-resumeResult.score}`}
                          strokeLinecap="round"/>
                      </svg>
                      <span className={`absolute text-sm font-bold ${scoreColor(resumeResult.score)}`}>{resumeResult.score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full transition-all ${scoreBg(resumeResult.score)}`} style={{ width:`${resumeResult.score}%` }} />
                  </div>
                  <p className="text-gray-300 text-sm italic">&quot;{resumeResult.verdict}&quot;</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-green-400 text-xs font-medium mb-3">✅ STRENGTHS</p>
                    <ul className="space-y-2">
                      {resumeResult.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-300">
                          <span className="text-green-400 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-red-400 text-xs font-medium mb-3">⚠️ IMPROVEMENTS</p>
                    <ul className="space-y-2">
                      {resumeResult.improvements.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing keywords */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-yellow-400 text-xs font-medium mb-3">🔑 MISSING KEYWORDS — add these to beat ATS filters</p>
                  <div className="flex flex-wrap gap-2">
                    {resumeResult.missing_keywords.map((k, i) => (
                      <span key={i} className="bg-yellow-900/30 text-yellow-300 border border-yellow-800 text-xs px-3 py-1 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>

                {/* ATS tips */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-blue-400 text-xs font-medium mb-3">🤖 ATS TIPS</p>
                  <ul className="space-y-2">
                    {resumeResult.ats_tips.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-blue-400 mt-0.5">→</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------- TAB: MOCK INTERVIEW ----------- */}
        {activeTab === 'mock' && (
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Generate interview questions for any company & role</h2>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Company (e.g. Google)"
                  value={mockCompany}
                  onChange={e => setMockCompany(e.target.value)}
                />
                <input
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Role (e.g. SDE Intern)"
                  value={mockRole}
                  onChange={e => setMockRole(e.target.value)}
                />
                <select
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={mockRound}
                  onChange={e => setMockRound(e.target.value)}
                >
                  {MOCK_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={generateMock} disabled={mockLoading || !mockCompany || !mockRole}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
                {mockLoading ? '🎙️ Generating...' : '🎙️ Generate Questions'}
              </button>
            </div>

            {mockQs.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  {mockQs.length} questions for <span className="text-white font-medium">{mockCompany} · {mockRole}</span> · {mockRound}
                  <span className="text-gray-600 ml-2">— click a question to reveal the sample answer</span>
                </p>
                <div className="space-y-3">
                  {mockQs.map((q, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <button onClick={() => toggleReveal(i)} className="w-full text-left p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-purple-900 border border-purple-700 flex items-center justify-center text-xs text-purple-300 flex-shrink-0">{i+1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded border ${Q_TYPE_STYLE[q.type] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>{q.type}</span>
                            </div>
                            <p className="text-white text-sm font-medium">{q.question}</p>
                            <p className="text-gray-500 text-xs mt-1">💡 {q.hint}</p>
                          </div>
                          <span className="text-gray-500 text-xs flex-shrink-0 mt-1">
                            {revealedIdx.includes(i) ? '▲ hide' : '▼ reveal'}
                          </span>
                        </div>
                      </button>
                      {revealedIdx.includes(i) && (
                        <div className="border-t border-gray-800 px-4 py-3 bg-purple-900/10">
                          <p className="text-purple-300 text-xs font-medium mb-1">SAMPLE ANSWER</p>
                          <p className="text-gray-300 text-sm">{q.sample_answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------- TAB: CALENDAR ----------- */}
        {activeTab === 'calendar' && (
          <div>
            {showCalForm && (
              <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-medium text-purple-300 mb-4">Add Placement Event</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="Event title (e.g. Google OA)"
                    value={calForm.title}
                    onChange={e => setCalForm({...calForm, title: e.target.value})}
                  />
                  <input
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="Company (optional)"
                    value={calForm.company}
                    onChange={e => setCalForm({...calForm, company: e.target.value})}
                  />
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Date & Time</label>
                    <input type="datetime-local"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      value={calForm.date}
                      onChange={e => setCalForm({...calForm, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Event Type</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      value={calForm.type}
                      onChange={e => setCalForm({...calForm, type: e.target.value as CalEvent['type']})}
                    >
                      <option value="drive">Campus Drive</option>
                      <option value="deadline">Application Deadline</option>
                      <option value="interview">Interview</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addCalEvent} disabled={!calForm.title || !calForm.date}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                    Save Event
                  </button>
                  <button onClick={() => setShowCalForm(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {calEvents.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-5xl mb-3">📅</p>
                <p className="text-lg mb-1">No events added yet</p>
                <p className="text-sm">Click &quot;+ Add Event&quot; to track drives, deadlines &amp; interviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calEvents.map(ev => {
                  const days = daysUntil(ev.date);
                  const past = days < 0;
                  return (
                    <div key={ev.id} className={`bg-gray-900 border rounded-xl p-4 flex items-center justify-between transition-colors ${past ? 'border-gray-800 opacity-50' : 'border-gray-700 hover:border-gray-600'}`}>
                      <div className="flex items-center gap-4">
                        {/* Countdown bubble */}
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${past ? 'bg-gray-800' : days<=2 ? 'bg-red-900/40 border border-red-800' : days<=7 ? 'bg-yellow-900/40 border border-yellow-800' : 'bg-purple-900/40 border border-purple-800'}`}>
                          {past ? (
                            <span className="text-gray-500 text-xs">Done</span>
                          ) : (
                            <>
                              <span className={`text-lg font-bold leading-none ${days<=2?'text-red-400':days<=7?'text-yellow-400':'text-purple-400'}`}>{days}</span>
                              <span className="text-gray-500 text-xs">days</span>
                            </>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white">{ev.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded border ${CAL_TYPE_STYLE[ev.type]}`}>
                              {ev.type.charAt(0).toUpperCase()+ev.type.slice(1)}
                            </span>
                          </div>
                          {ev.company && <p className="text-gray-400 text-xs">{ev.company}</p>}
                          <p className="text-gray-500 text-xs">
                            {new Date(ev.date).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteCalEvent(ev.id)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
