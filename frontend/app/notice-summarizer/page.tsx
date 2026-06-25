'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function NoticeSummarizer() {
  const router = useRouter();
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
        eventDate,
        studentId,
      });
      setBroadcasted(true);
    } catch {}
    setBroadcasting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Glow overlays */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
      
      {/* Shared Header Navigation */}
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Notice Summarizer
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Analyze verbose college announcements instantly, extract deadlines, and broadcast updates to student groups.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: notice input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Raw Notice Content
              </h2>
              <textarea
                className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder-gray-600 resize-none font-medium leading-relaxed"
                rows={9}
                placeholder="Paste the announcement text here... e.g. 'All students of 3rd year B.Tech are hereby informed that the Internal Assessment exam for the subject Operating Systems will be conducted on 28th June 2025...'"
                value={noticeText}
                onChange={e => setNoticeText(e.target.value)}
              />
              {error && <p className="text-red-400 text-xs mt-3 flex items-center gap-1">⚠️ {error}</p>}
              <button
                onClick={summarize}
                disabled={loading || !noticeText.trim()}
                className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-950 disabled:to-purple-950 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
              >
                {loading ? '🤖 Processing notice...' : '✨ Generate AI Summary'}
              </button>
            </div>
          </div>

          {/* Right panel: summary & broadcast tools */}
          <div className="lg:col-span-5">
            {bullets.length === 0 ? (
              <div className="bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center h-[340px]">
                <div className="bg-gray-900 p-4 rounded-full mb-3 text-gray-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-gray-500 text-sm font-semibold max-w-xs">
                  Your AI-generated bullet points and scheduling parameters will load here.
                </p>
              </div>
            ) : (
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-emerald-400 text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    AI Summary Bullets
                  </h3>
                  <ul className="space-y-3">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-200 leading-relaxed font-medium">
                        <span className="text-purple-400 text-base mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-800 pt-5">
                  <h3 className="text-gray-400 text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    Calendar Sync Event
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide block mb-1">Event Title</label>
                      <input
                        className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder-gray-600 font-semibold"
                        placeholder="e.g. Operating Systems Exam"
                        value={eventTitle}
                        onChange={e => setEventTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide block mb-1">Event Date & Time</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer font-semibold"
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

                <div className="border-t border-gray-800 pt-5">
                  {broadcasted ? (
                    <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 flex items-start gap-2.5 text-emerald-400 text-sm">
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
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white text-sm font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
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
