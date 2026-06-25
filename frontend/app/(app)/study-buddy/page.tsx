'use client';
import { useState } from 'react';
import { Sparkles, Brain, HelpCircle, Check } from 'lucide-react';

export default function StudyBuddyPage() {
  const [notes,   setNotes]   = useState('');
  const [tab,     setTab]     = useState<'flashcards'|'mcq'>('flashcards');
  const [cards,   setCards]   = useState<{front:string;back:string}[]>([]);
  const [mcqs,    setMcqs]    = useState<{question:string;options:string[];answer:string;explanation:string}[]>([]);
  const [flipped, setFlipped] = useState<Record<number,boolean>>({});
  const [selected,setSelected]= useState<Record<number,string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,   setError]   = useState('');

  async function generate() {
    if (!notes.trim()) return;
    setLoading(true); setError(''); setCards([]); setMcqs([]); setFlipped({}); setSelected({});
    try {
      const endpoint = tab === 'flashcards' ? '/ai/flashcards' : '/ai/mcq';
      const res  = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Server error');
      }
      if (tab === 'flashcards') {
        if (!data.flashcards || data.flashcards.length === 0) {
          throw new Error('No flashcards were generated. Please check your inputs.');
        }
        setCards(data.flashcards);
      } else {
        if (!data.mcqs || data.mcqs.length === 0) {
          throw new Error('No MCQs were generated. Please check your inputs.');
        }
        setMcqs(data.mcqs);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'AI generation failed. Is your backend running on port 4000?');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!notes.trim() || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const isFlashcards = tab === 'flashcards';
      const endpoint = isFlashcards ? '/ai/flashcards' : '/ai/mcq';
      const exclude = isFlashcards 
        ? cards.map(c => c.front) 
        : mcqs.map(m => m.question);

      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, exclude, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Server error');
      }

      if (isFlashcards) {
        if (!data.flashcards || data.flashcards.length === 0) {
          throw new Error('No new flashcards were generated.');
        }
        setCards(prev => [...prev, ...data.flashcards]);
      } else {
        if (!data.mcqs || data.mcqs.length === 0) {
          throw new Error('No new MCQs were generated.');
        }
        setMcqs(prev => [...prev, ...data.mcqs]);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'AI generation failed.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-x-hidden pb-16">
      {/* Glow effects */}
      <div className="spotlight-top" />
      <div className="spotlight-bottom" />

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-brand-sans">
            AI Study Buddy
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Convert your complex lecture notes into bite-sized flashcards or multiple-choice quizzes in seconds.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 shadow-xl relative z-10 border border-white/8">
          {/* Tab switcher */}
          <div className="flex gap-2.5 mb-5 border-b border-white/5 pb-4">
            <button 
              onClick={() => setTab('flashcards')} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${
                tab === 'flashcards' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-white/2 text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              🃏 Flashcards
            </button>
            <button 
              onClick={() => setTab('mcq')} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${
                tab === 'mcq' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-white/2 text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              ❓ MCQ Quiz
            </button>
          </div>

          {/* Notes textarea */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Paste your lecture notes here... e.g. Normalization in DBMS removes redundancy. 1NF removes duplicate columns. 2NF removes partial dependencies. 3NF removes transitive dependencies."
            className="w-full bg-[#030712]/50 border border-white/6 rounded-xl px-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-slate-550 resize-none font-medium leading-relaxed focus:bg-[#030712]/70"
          />

          {error && <p className="text-rose-400 text-xs mt-3 flex items-center gap-1">⚠️ {error}</p>}

          <button
            onClick={generate}
            disabled={loading || !notes.trim()}
            className="mt-4 w-full glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold py-3.5 rounded-xl cursor-pointer"
          >
            {loading ? (
              <>✨ Generating Study Material...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {tab === 'flashcards' ? 'Generate Flashcards' : 'Generate MCQs'}
              </>
            )}
          </button>
        </div>

        {/* Flashcards Results */}
        {cards.length > 0 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Generated Flashcards <span className="text-blue-450">(Tap to flip)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => setFlipped(f => ({...f,[i]:!f[i]}))}
                  className="h-40 rounded-xl cursor-pointer relative"
                  style={{ perspective: 1000 }}
                >
                  <div 
                    className="w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.5s',
                      transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 glass-panel border-white/8 hover:border-blue-500/30 rounded-xl p-5 flex flex-col justify-between transition-colors duration-300 glass-panel-hover"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-blue-400 text-[9px] font-bold tracking-wider uppercase">Question</span>
                      <p className="text-white font-bold text-sm leading-relaxed">{card.front}</p>
                      <span className="text-slate-500 text-[10px] font-semibold text-right">tap to reveal →</span>
                    </div>
                    {/* Back */}
                    <div 
                      className="absolute inset-0 bg-blue-950/20 border border-blue-500/30 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_25px_rgba(59,130,246,0.05)]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-emerald-400 text-[9px] font-bold tracking-wider uppercase">Answer</span>
                      <p className="text-slate-200 font-medium text-sm leading-relaxed">{card.back}</p>
                      <span className="text-blue-400/70 text-[10px] font-semibold text-right">tap to flip back</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {tab === 'flashcards' && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="glass-btn-secondary px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm hover:scale-95 active:scale-90 transition-all flex items-center gap-2"
                >
                  {loadingMore ? 'Generating...' : 'Show More Flashcards'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MCQs Results */}
        {mcqs.length > 0 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              MCQ Practice Test
            </p>
            <div className="space-y-4">
              {mcqs.map((q, i) => (
                <div key={i} className="glass-panel border-white/5 p-6 shadow-md hover:border-white/10 transition-all">
                  <p className="text-slate-200 font-bold text-sm leading-relaxed mb-4">
                    <span className="text-blue-400 font-extrabold mr-1.5">Q{i+1}.</span>
                    {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt, j) => {
                      const chosen = selected[i];
                      const isCorrect = opt === q.answer;
                      let btnStyle = "bg-slate-950/50 border-white/5 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer";
                      
                      if (chosen) {
                        if (opt === chosen && isCorrect) {
                          btnStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                        } else if (opt === chosen) {
                          btnStyle = "bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold";
                        } else if (isCorrect) {
                          btnStyle = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400";
                        } else {
                          btnStyle = "bg-slate-950/20 border-white/2 text-slate-600 cursor-not-allowed";
                        }
                      }
                      
                      return (
                        <button 
                          key={j} 
                          onClick={() => !chosen && setSelected(s=>({...s,[i]:opt}))} 
                          className={`text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${btnStyle} flex items-center justify-between`}
                        >
                          <span>{opt}</span>
                          {chosen && isCorrect && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {selected[i] && (
                    <div className="mt-4 text-xs text-slate-400 bg-slate-950/70 border border-white/5 px-4 py-3 rounded-xl flex gap-2 leading-relaxed">
                      <span className="font-extrabold text-blue-400 flex-shrink-0">💡 Explanation:</span>
                      <span className="font-medium text-slate-300">{q.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {tab === 'mcq' && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="glass-btn-secondary px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-sm hover:scale-95 active:scale-90 transition-all flex items-center gap-2"
                >
                  {loadingMore ? 'Generating...' : 'Show More MCQs'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
