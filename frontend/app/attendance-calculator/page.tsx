'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

const LineWaves = dynamic(() => import('@/components/LineWaves'), { ssr: false });
import { 
  Calendar as CalendarIcon, 
  Calculator, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  RefreshCw
} from 'lucide-react';

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
  
  // Overall attendance states
  const [attended, setAttended] = useState<number>(45);
  const [totalHeldSoFar, setTotalHeldSoFar] = useState<number>(60);
  const [plannedMisses, setPlannedMisses] = useState<number>(2);

  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Calendar state
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // June 2026 (Odd sem classes start)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Sync calendar month with semester selection
  useEffect(() => {
    if (semesterType === 'odd') {
      setTimeout(() => {
        setCurrentYear(2026);
        setCurrentMonth(6); // June
      }, 0);
    } else if (semesterType === 'even') {
      setTimeout(() => {
        setCurrentYear(2026);
        setCurrentMonth(11); // November
      }, 0);
    }
  }, [semesterType]);

  // Fetch calculations when inputs change
  useEffect(() => {
    if (!semesterType) return;
    
    const calculateOverallAttendance = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:4000/api/attendance/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            semesterType,
            attended,
            totalHeldSoFar,
            plannedMisses,
            minRequiredPercent
          })
        });
        if (!res.ok) {
          throw new Error('Calculation error');
        }
        const data = await res.json();
        setCalcResult(data);
      } catch (err) {
        console.error('Failed to calculate attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateOverallAttendance();
  }, [semesterType, attended, totalHeldSoFar, plannedMisses, minRequiredPercent]);

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
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 glass-panel backdrop-blur-xl text-white rounded-lg p-2 shadow-2xl text-[10px] leading-relaxed hidden group-hover:block z-50 pointer-events-none">
            <p className="font-bold text-slate-300">{day.date}</p>
            <p className="mt-1 font-medium text-blue-400">{day.label}</p>
            <p className="text-slate-500 mt-0.5">Classes held: {day.classes}</p>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans overflow-x-hidden">
      {/* Animated WebGL background */}
      <div className="line-waves-bg">
        <LineWaves
          speed={0.2}
          innerLineCount={28}
          outerLineCount={32}
          warpIntensity={0.8}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={0.6}
          brightness={0.18}
          color1="#3b82f6"
          color2="#6366f1"
          color3="#8b5cf6"
          enableMouseInteraction={true}
          mouseInfluence={1.5}
        />
      </div>

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-brand-sans">
              <Calculator className="h-7 w-7 text-blue-400" />
              Attendance Calculator
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Track your classes, forecast attendance percentage, and visualize academic schedules.
            </p>
          </div>

          {/* Configurable Target & Semester Selector */}
          <div className="flex flex-wrap items-center gap-3 glass-panel p-3 rounded-xl">
            {/* Semester Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Semester:</span>
              <select 
                value={semesterType}
                onChange={(e) => setSemesterType(e.target.value as 'odd' | 'even' | '')}
                className="glass-input rounded-lg px-2.5 py-1 text-sm font-bold focus:border-blue-500 text-blue-400"
              >
                <option value="odd" className="bg-slate-900">Odd Semester</option>
                <option value="even" className="bg-slate-900">Even Semester</option>
              </select>
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            {/* Target Percentage */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Min Target:</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  min="50"
                  max="100"
                  value={minRequiredPercent}
                  onChange={(e) => setMinRequiredPercent(Math.max(50, Math.min(100, parseInt(e.target.value) || 75)))}
                  className="glass-input rounded-lg w-14 px-2 py-1 text-sm font-bold text-center focus:border-blue-500 text-emerald-400"
                />
                <span className="text-slate-400 text-xs font-semibold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gates remaining contents if semester type is not selected */}
        {!semesterType ? (
          <div className="glass-card p-12 text-center">
            <Settings className="h-12 w-12 text-blue-400/50 mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2 font-brand-sans">Configure Semester Type</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Please choose either the Odd or Even semester in the selector above to populate academic timelines.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Calculator Metric Overview & Setup Forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dashboard Metrics Overview Panel */}
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-blue-500/10 blur-[60px] pointer-events-none" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  
                  {/* Gauge 1: Attendance Percentage */}
                  <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-xl text-center relative min-h-[160px]">
                    {loading && (
                      <div className="absolute inset-0 bg-[#050816]/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Projected Attendance</span>
                    <span className={`text-4xl font-black tracking-tight ${
                      !calcResult ? 'text-gray-400'
                      : calcResult.projectedAttendance >= 75 ? 'text-emerald-400'
                      : calcResult.projectedAttendance >= 65 ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                      {calcResult ? `${calcResult.projectedAttendance}%` : '...'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-3 font-semibold flex items-center gap-1">
                      {calcResult ? (
                        calcResult.projectedAttendance >= minRequiredPercent ? (
                          <span className="text-emerald-400">✅ Target Met</span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3 inline" /> Below Target</span>
                        )
                      ) : ''}
                    </span>
                  </div>

                  {/* Gauge 2: Remaining semester hours */}
                  <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-xl text-center min-h-[160px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Remaining Classes</span>
                    <span className="text-4xl font-black text-white tracking-tight">
                      {calcResult ? `${calcResult.remainingClasses}` : '...'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-3 font-semibold">semester hours left</span>
                  </div>

                  {/* Gauge 3: Safe absences count */}
                  <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-xl text-center min-h-[160px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Safe Absences Limit</span>
                    <span className={`text-4xl font-black tracking-tight ${
                      calcResult && calcResult.maxCanMiss > 0 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {calcResult ? `${calcResult.maxCanMiss}` : '...'}
                    </span>
                    <span className="text-[10px] text-blue-400/70 mt-3 font-semibold">hours you can miss</span>
                  </div>

                </div>
              </div>

              {/* Calculator Form Setup */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white border-b border-white/5 pb-3 mb-6 font-brand-sans">
                  <Settings className="h-4.5 w-4.5 text-blue-400" />
                  Attendance Configurations
                </h2>

                <div className="space-y-6">
                  {/* Hours inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                        Total Hours Attended
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={attended}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setAttended(val);
                          if (val > totalHeldSoFar) {
                            setTotalHeldSoFar(val);
                          }
                        }}
                        className="w-full glass-input rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                        Total Hours Held So Far
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={totalHeldSoFar}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTotalHeldSoFar(val);
                          if (val < attended) {
                            setAttended(val);
                          }
                        }}
                        className="w-full glass-input rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Planned Misses with Interactive Slider */}
                  <div className="glass-panel p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block">
                        Planned Absences (Future Missed Hours)
                      </label>
                      <span className="text-sm font-extrabold text-white">
                        {plannedMisses} / {calcResult?.remainingClasses || 0} hrs
                      </span>
                    </div>

                    <input 
                      type="range"
                      min="0"
                      max={calcResult?.remainingClasses || 10}
                      value={plannedMisses}
                      onChange={(e) => setPlannedMisses(parseInt(e.target.value) || 0)}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>0 hrs (Perfect attendance hereafter)</span>
                      <span>{calcResult?.remainingClasses || 0} hrs (All remaining missed)</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Col: Interactive Calendar view */}
            <div className="space-y-6">
              <div className="glass-card p-6 relative">
                
                {/* Calendar Title & Month Selector */}
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                  <h3 className="font-bold flex items-center gap-2 text-white text-sm md:text-base font-brand-sans">
                    <CalendarIcon className="h-4 w-4 text-blue-400" />
                    Academic Timeline
                  </h3>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg glass-panel hover:bg-white/5 transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-blue-400 px-1 w-24 text-center">
                      {getMonthName(currentMonth)} {currentYear}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg glass-panel hover:bg-white/5 transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {loadingCalendar ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 text-blue-400 animate-spin mb-2" />
                    <span className="text-slate-500 text-xs font-medium">Fetching academic days...</span>
                  </div>
                ) : (
                  <>
                    {/* Calendar grid labels */}
                    <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
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
                    <div className="mt-5 border-t border-white/5 pt-4 space-y-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Calendar Key</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
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
