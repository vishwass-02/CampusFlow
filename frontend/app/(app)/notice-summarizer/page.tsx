'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  FileText,
  CheckCircle
} from 'lucide-react';

export default function NoticeSummarizer() {
  const [noticeText, setNoticeText] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcasted, setBroadcasted] = useState(false);
  const [error, setError] = useState('');

  const summarize = async () => {
    if (!noticeText.trim()) return;
    setLoading(true);
    setBullets([]);
    setError('');
    setBroadcasted(false);
    try {
      const { data } = await api.post('/ai/summarize', { text: noticeText });
      // Split the single string bullet summary back into array points
      if (data.summary) {
        const points = data.summary
          .split('\n')
          .map((p: string) => p.replace(/^•\s*/, '').trim())
          .filter(Boolean);
        setBullets(points);
      }
      setEventTitle(data.event_title || '');
      setEventDate(data.event_date || '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'AI summarization failed.';
      setError(errMsg);
    }
    setLoading(false);
  };

  const broadcast = async () => {
    setBroadcasting(true);
    const studentId = localStorage.getItem('studentId');
    try {
      await api.post('/notices/broadcast', {
        summary: bullets.map(b => `• ${b}`).join(' | '),
        phoneList: [],
        eventTitle,
        eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        studentId,
      });
      setBroadcasted(true);
    } catch {}
    setBroadcasting(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16">

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10 space-y-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-brand-sans">
            Notice Summarizer
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Analyze verbose college announcements instantly, extract deadlines, and broadcast updates to student groups.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: notice input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 shadow-xl relative z-10 border border-white/8">
              <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-400" />
                Raw Notice Content
              </h2>
              <textarea
                className="w-full bg-[#030712]/50 border border-white/6 rounded-xl px-4 py-3.5 text-sm text-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-slate-550 resize-none font-medium leading-relaxed focus:bg-[#030712]/75 font-mono"
                rows={9}
                placeholder="Paste the announcement text here... e.g. 'All students of 3rd year B.Tech are hereby informed that the Internal Assessment exam for the subject Operating Systems will be conducted on 28th June 2025...'"
                value={noticeText}
                onChange={e => setNoticeText(e.target.value)}
              />
              {error && <p className="text-rose-450 text-xs mt-3 flex items-center gap-1">⚠️ {error}</p>}
              <button
                onClick={summarize}
                disabled={loading || !noticeText.trim()}
                className="mt-4 w-full glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold py-3.5 rounded-xl cursor-pointer"
              >
                {loading ? '🤖 Processing notice...' : '✨ Generate AI Summary'}
              </button>
            </div>
          </div>

          {/* Right panel: summary & broadcast tools */}
          <div className="lg:col-span-5">
            {bullets.length === 0 ? (
              <div className="glass-card border border-dashed border-white/10 bg-transparent p-10 flex flex-col items-center justify-center text-center h-[340px]">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-4 text-blue-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-slate-400 text-sm font-bold max-w-xs leading-relaxed">
                  Your AI-generated bullet points and scheduling parameters will load here.
                </p>
              </div>
            ) : (
              <div className="glass-card p-6 shadow-xl space-y-6 relative z-10 border border-white/8 animate-fade-in">
                <div>
                  <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    AI Summary Bullets
                  </h3>
                  <ul className="space-y-3">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-250 leading-relaxed font-medium">
                        <span className="text-blue-400 text-base mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    Calendar Sync Event
                  </h3>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-2">Event Title</label>
                      <input
                        className="w-full bg-[#030712]/50 border border-white/6 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-slate-550 font-semibold focus:bg-[#030712]/65"
                        placeholder="e.g. Operating Systems Exam"
                        value={eventTitle}
                        onChange={e => setEventTitle(e.target.value)}
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-2">Event Date & Time</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-[#030712]/50 border border-white/6 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer font-semibold focus:bg-[#030712]/65"
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        onClick={e => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-5">
                  {broadcasted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-2.5 text-emerald-450 text-sm">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Broadcast Successful!</span>
                        <p className="text-emerald-500/80 text-xs mt-1">Notifications have been dispatched via WhatsApp to the student broadcast roster.</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={broadcast}
                      disabled={broadcasting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:shadow-[0_4px_25px_rgba(16,185,129,0.3)] hover-scale"
                    >
                      <Send className="h-4 w-4" />
                      {broadcasting ? 'Broadcasting notifications...' : '📲 Broadcast via WhatsApp'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
