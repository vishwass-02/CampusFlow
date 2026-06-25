'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Calendar as CalendarIcon, 
  Calculator, 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Info, 
  BookOpen, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  attended: number;
  totalHeldSoFar: number;
  plannedMisses: number;
}

interface CalcResult {
  remainingClasses: number;
  projectedAttendance: number;
  maxCanMiss: number;
  riskLevel: 'safe' | 'warning' | 'danger';
}

interface CalendarDay {
  date: string;
  classes: number;
  type: 'out-of-bound' | 'exam' | 'holiday' | 'sunday' | 'third-saturday-off' | 'override-working' | 'saturday' | 'weekday';
  label: string;
}

export default function AttendanceCalculatorPage() {
  const [semesterType, setSemesterType] = useState<'odd' | 'even' | ''>('odd');
  const [minRequiredPercent, setMinRequiredPercent] = useState<number>(75);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Database Management Systems', attended: 22, totalHeldSoFar: 28, plannedMisses: 2 },
    { id: '2', name: 'Operating Systems', attended: 25, totalHeldSoFar: 30, plannedMisses: 3 },
    { id: '3', name: 'Computer Networks', attended: 18, totalHeldSoFar: 26, plannedMisses: 4 }
  ]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [calcResults, setCalcResults] = useState<Record<string, CalcResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');

  // Calendar state
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // June 2026 (Odd sem classes start)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Sync calendar month with semester selection
  useEffect(() => {
    if (semesterType === 'odd') {
      setCurrentYear(2026);
      setCurrentMonth(6); // June
    } else if (semesterType === 'even') {
      setCurrentYear(2026);
      setCurrentMonth(11); // November
    }
  }, [semesterType]);

  // Fetch calculations when inputs change
  useEffect(() => {
    if (!semesterType) return;
    
    subjects.forEach(async (sub) => {
      setLoading(prev => ({ ...prev, [sub.id]: true }));
      try {
        const res = await fetch('http://localhost:4000/api/attendance/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            semesterType,
            attended: sub.attended,
            totalHeldSoFar: sub.totalHeldSoFar,
            plannedMisses: sub.plannedMisses,
            minRequiredPercent
          })
        });
        if (!res.ok) {
          throw new Error('Calculation error');
        }
        const data = await res.json();
        setCalcResults(prev => ({ ...prev, [sub.id]: data }));
      } catch (err) {
        console.error('Failed to calculate attendance:', err);
      } finally {
        setLoading(prev => ({ ...prev, [sub.id]: false }));
      }
    });
  }, [subjects, semesterType, minRequiredPercent]);

  // Fetch calendar days when month/semester changes
  useEffect(() => {
    if (!semesterType) return;

    const fetchCalendar = async () => {
      setLoadingCalendar(true);
      try {
        const res = await fetch('http://localhost:4000/api/attendance/calendar-month', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            semesterType,
            year: currentYear,
            month: currentMonth
          })
        });
        if (!res.ok) {
          throw new Error('Calendar fetch error');
        }
        const data = await res.json();
        setCalendarDays(data.days || []);
      } catch (err) {
        console.error('Failed to fetch calendar days:', err);
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchCalendar();
  }, [currentYear, currentMonth, semesterType]);

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSub: Subject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      attended: 0,
      totalHeldSoFar: 0,
      plannedMisses: 0
    };
    setSubjects(prev => [...prev, newSub]);
    setNewSubjectName('');
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setCalcResults(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleUpdateSubject = (id: string, field: keyof Subject, val: any) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, [field]: val };
      // Validations
      if (field === 'attended') {
        updated.attended = Math.max(0, parseInt(val) || 0);
        if (updated.attended > updated.totalHeldSoFar) {
          updated.totalHeldSoFar = updated.attended;
        }
      }
      if (field === 'totalHeldSoFar') {
        updated.totalHeldSoFar = Math.max(0, parseInt(val) || 0);
        if (updated.attended > updated.totalHeldSoFar) {
          updated.attended = updated.totalHeldSoFar;
        }
      }
      if (field === 'plannedMisses') {
        updated.plannedMisses = Math.max(0, parseInt(val) || 0);
      }
      return updated;
    }));
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Helper to format month name
  const getMonthName = (m: number) => {
    const date = new Date(2000, m - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  // Get color styles for calendar day type
  const getDayStyles = (day: CalendarDay) => {
    switch (day.type) {
      case 'holiday':
        return 'bg-gray-800/80 border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-400';
      case 'exam':
        return 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30';
      case 'sunday':
        return 'bg-gray-900/40 border-gray-850 text-gray-600';
      case 'third-saturday-off':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30';
      case 'override-working':
        return 'bg-indigo-600/25 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/35';
      case 'out-of-bound':
        return 'bg-gray-950/20 border-transparent text-gray-700 cursor-default opacity-50 pointer-events-none';
      default:
        // regular instruction day (weekday/Saturday working)
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20';
    }
  };

  // Calculate day labels and starting offset for calendar grid
  const renderCalendarDays = () => {
    if (calendarDays.length === 0) return null;

    // Get the weekday offset of the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = new Date(calendarDays[0].date).getDay();
    
    const blanks = Array(firstDayOfWeek).fill(null);
    const gridItems = [...blanks, ...calendarDays];

    return gridItems.map((day, idx) => {
      if (!day) {
        return <div key={`blank-${idx}`} className="h-10 md:h-12 bg-transparent" />;
      }

      const dayNum = new Date(day.date).getDate();
      return (
        <div 
          key={day.date}
          className={`h-10 md:h-12 border rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all relative group cursor-pointer ${getDayStyles(day)}`}
        >
          <span>{dayNum}</span>
          {day.classes > 0 && (
            <span className="text-[9px] opacity-75 mt-0.5">{day.classes}h</span>
          )}

          {/* Premium custom tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 border border-gray-800 text-white rounded-lg p-2 shadow-2xl text-[10px] leading-relaxed hidden group-hover:block z-50 pointer-events-none">
            <p className="font-bold text-gray-300">{day.date}</p>
            <p className="mt-1 font-medium text-indigo-400">{day.label}</p>
            <p className="text-gray-500 mt-0.5">Classes held: {day.classes}</p>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Calculator className="h-7 w-7 text-indigo-400" />
              Attendance Calculator
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track classes, forecast future attendance, and visualize academic schedule patterns.
            </p>
          </div>

          {/* Configurable Target & Semester Selector */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            {/* Semester Selector */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-semibold">Semester:</span>
              <select 
                value={semesterType}
                onChange={(e) => setSemesterType(e.target.value as 'odd' | 'even' | '')}
                className="bg-gray-950 border border-gray-850 rounded-lg px-2.5 py-1 text-sm font-bold focus:outline-none focus:border-indigo-500 text-indigo-400"
              >
                <option value="odd">Odd Semester</option>
                <option value="even">Even Semester</option>
              </select>
            </div>

            <div className="h-4 w-px bg-gray-800 hidden md:block" />

            {/* Target Percentage */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-semibold">Min Target:</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  min="50"
                  max="100"
                  value={minRequiredPercent}
                  onChange={(e) => setMinRequiredPercent(Math.max(50, Math.min(100, parseInt(e.target.value) || 75)))}
                  className="bg-gray-950 border border-gray-850 rounded-lg w-14 px-2 py-1 text-sm font-bold text-center focus:outline-none focus:border-indigo-500 text-emerald-400"
                />
                <span className="text-gray-400 text-xs font-semibold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gates remaining contents if semester type is not selected */}
        {!semesterType ? (
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-12 text-center shadow-xl">
            <Settings className="h-12 w-12 text-indigo-400/50 mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Configure Semester Type</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Please choose either the Odd or Even semester in the selector above to populate academic timelines.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Subject cards & Forms (2 cols on large screen) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Summary Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/40 backdrop-blur-md border border-gray-850 p-4 rounded-xl shadow-lg">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Remaining Classes</p>
                  <p className="text-2xl font-extrabold mt-1 text-white flex items-center gap-1.5">
                    {Object.values(calcResults)[0]?.remainingClasses ?? '...'}
                    <span className="text-xs font-medium text-gray-500">hours left</span>
                  </p>
                </div>
                <div className="bg-gray-900/40 backdrop-blur-md border border-gray-850 p-4 rounded-xl shadow-lg">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Risk Assessment</p>
                  <div className="flex items-center gap-2 mt-1">
                    {Object.values(calcResults).some(r => r.riskLevel === 'danger') ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 animate-pulse" /> Danger
                      </span>
                    ) : Object.values(calcResults).some(r => r.riskLevel === 'warning') ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Warning
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Safe
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-900/40 backdrop-blur-md border border-gray-850 p-4 rounded-xl shadow-lg col-span-1 sm:col-span-2 md:col-span-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Semester Type</p>
                  <p className="text-xl font-extrabold mt-1 text-indigo-400 uppercase tracking-wide">
                    {semesterType} Semester
                  </p>
                </div>
              </div>

              {/* Subjects Form & Cards */}
              <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                    Course Attendance Log
                  </h2>

                  {/* Quick Add Subject */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add Subject..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                      className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-500 placeholder-gray-600 text-white w-40 md:w-48"
                    />
                    <button 
                      onClick={handleAddSubject}
                      className="bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg text-white transition-all shadow-[0_2px_8px_rgba(99,102,241,0.2)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {subjects.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-sm">No subjects added. Add your courses above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjects.map((sub) => {
                      const res = calcResults[sub.id];
                      const isSubLoading = loading[sub.id];

                      // Color coding for percentages
                      const percentColor = !res ? 'text-gray-400' 
                        : res.projectedAttendance >= 75 ? 'text-emerald-400' 
                        : res.projectedAttendance >= 65 ? 'text-yellow-400' 
                        : 'text-red-400';

                      const borderHighlight = !res ? 'border-gray-800'
                        : res.riskLevel === 'danger' ? 'border-red-500/25 bg-red-950/5'
                        : res.riskLevel === 'warning' ? 'border-yellow-500/25 bg-yellow-950/5'
                        : 'border-emerald-500/20 bg-emerald-950/5';

                      return (
                        <div 
                          key={sub.id}
                          className={`border rounded-xl p-5 transition-all duration-300 ${borderHighlight}`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <span className="font-bold text-white text-sm md:text-base leading-tight truncate">
                              {sub.name}
                            </span>
                            <button 
                              onClick={() => handleRemoveSubject(sub.id)}
                              className="p-1 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            
                            {/* Inputs Column */}
                            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {/* Attended so far */}
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                                  Attended hours
                                </label>
                                <input 
                                  type="number"
                                  min="0"
                                  value={sub.attended}
                                  onChange={(e) => handleUpdateSubject(sub.id, 'attended', e.target.value)}
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                                />
                              </div>

                              {/* Total held so far */}
                              <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                                  Total hours held
                                </label>
                                <input 
                                  type="number"
                                  min="0"
                                  value={sub.totalHeldSoFar}
                                  onChange={(e) => handleUpdateSubject(sub.id, 'totalHeldSoFar', e.target.value)}
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                                />
                              </div>

                              {/* Planned misses */}
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                                  Planned misses (hours)
                                </label>
                                <input 
                                  type="number"
                                  min="0"
                                  max={res?.remainingClasses || 0}
                                  value={sub.plannedMisses}
                                  onChange={(e) => handleUpdateSubject(sub.id, 'plannedMisses', e.target.value)}
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500 font-semibold text-indigo-400"
                                />
                              </div>
                            </div>

                            {/* Result Block */}
                            <div className="bg-gray-950/70 border border-gray-850 p-4 rounded-xl flex flex-col justify-center h-full relative">
                              {isSubLoading ? (
                                <div className="absolute inset-0 bg-gray-950/40 rounded-xl flex items-center justify-center">
                                  <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                                </div>
                              ) : null}

                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Projected</span>
                                <span className={`text-xl font-black ${percentColor}`}>
                                  {res ? `${res.projectedAttendance}%` : '...'}
                                </span>
                              </div>

                              <div className="h-px bg-gray-850 my-2.5" />

                              <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Info className="h-3 w-3 text-gray-500" />
                                  Can miss up to:
                                </span>
                                <span className={`font-bold ${res?.maxCanMiss && res.maxCanMiss > 0 ? 'text-indigo-400' : 'text-gray-400'}`}>
                                  {res ? `${res.maxCanMiss} hours` : '...'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Interactive Calendar view */}
            <div className="space-y-6">
              <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 shadow-xl relative">
                
                {/* Calendar Title & Month Selector */}
                <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                  <h3 className="font-bold flex items-center gap-2 text-white text-sm md:text-base">
                    <CalendarIcon className="h-4 w-4 text-indigo-400" />
                    Academic Timeline
                  </h3>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-800 transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-indigo-400 px-1 w-24 text-center">
                      {getMonthName(currentMonth)} {currentYear}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-800 transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {loadingCalendar ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
                    <span className="text-gray-500 text-xs font-medium">Fetching academic days...</span>
                  </div>
                ) : (
                  <>
                    {/* Calendar grid labels */}
                    <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    {/* Calendar grid rendering */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {renderCalendarDays()}
                    </div>

                    {/* Calendar Key Legend */}
                    <div className="mt-5 border-t border-gray-800 pt-4 space-y-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Calendar Key</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30 block" />
                          <span>Classes Held (4h/6h)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-gray-800 border border-gray-700 block" />
                          <span>Official Holiday (0h)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-red-500/25 border border-red-500/40 block" />
                          <span>Exam Period (0h)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500/30 block" />
                          <span>3rd Saturday Off (0h)</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className="w-2.5 h-2.5 rounded bg-indigo-600/30 border border-indigo-500/40 block" />
                          <span>3rd Saturday working-override (4h)</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
