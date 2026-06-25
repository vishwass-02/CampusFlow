'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Sparkles, Brain, HelpCircle, Check, HelpCircle as HelpIcon, ChevronRight } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'AI generation failed.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Shared Navbar */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            AI Study Buddy
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Convert your complex lecture notes into bite-sized flashcards or multiple-choice quizzes in seconds.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
          {/* Tab switcher */}
          <div className="flex gap-2.5 mb-5 border-b border-gray-800 pb-4">
            <button 
              onClick={() => setTab('flashcards')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                tab === 'flashcards' 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Brain className="h-4 w-4" />
              🃏 Flashcards
            </button>
            <button 
              onClick={() => setTab('mcq')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                tab === 'mcq' 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              ❓ MCQ Quiz
            </button>
          </div>

          {/* Notes textarea */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Paste your lecture notes here... e.g. Normalization in DBMS removes redundancy. 1NF removes duplicate columns. 2NF removes partial dependencies. 3NF removes transitive dependencies."
            className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600 resize-none font-medium leading-relaxed"
          />

          {error && <p className="text-red-400 text-xs mt-3 flex items-center gap-1">⚠️ {error}</p>}

          <button
            onClick={generate}
            disabled={loading || !notes.trim()}
            className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-950 disabled:to-purple-950 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
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
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Generated Flashcards <span className="text-indigo-400/90">(Tap to flip)</span>
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
                      className="absolute inset-0 bg-gray-900 border border-gray-800 hover:border-indigo-500/30 rounded-xl p-5 flex flex-col justify-between transition-colors duration-300"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-indigo-400 text-[10px] font-extrabold tracking-wider uppercase">Question</span>
                      <p className="text-white font-bold text-sm leading-relaxed">{card.front}</p>
                      <span className="text-gray-500 text-[10px] font-semibold text-right">tap to reveal →</span>
                    </div>
                    {/* Back */}
                    <div 
                      className="absolute inset-0 bg-indigo-950/40 border border-indigo-500/35 rounded-xl p-5 flex flex-col justify-between"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase">Answer</span>
                      <p className="text-gray-200 font-medium text-sm leading-relaxed">{card.back}</p>
                      <span className="text-indigo-400/70 text-[10px] font-semibold text-right">tap to flip back</span>
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
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-bold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              MCQ Practice Test
            </p>
            <div className="space-y-4">
              {mcqs.map((q, i) => (
                <div key={i} className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-lg">
                  <p className="text-white font-bold text-sm leading-relaxed mb-4">
                    <span className="text-indigo-400 font-extrabold mr-1.5">Q{i+1}.</span>
                    {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt, j) => {
                      const chosen = selected[i];
                      const isCorrect = opt === q.answer;
                      let btnStyle = "bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-900/50 hover:text-white";
                      
                      if (chosen) {
                        if (opt === chosen && isCorrect) {
                          btnStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                        } else if (opt === chosen) {
                          btnStyle = "bg-red-950/40 border-red-500 text-red-400 font-bold";
                        } else if (isCorrect) {
                          btnStyle = "bg-emerald-950/20 border-emerald-500/50 text-emerald-400";
                        } else {
                          btnStyle = "bg-gray-950 border-gray-800/40 text-gray-600";
                        }
                      }
                      
                      return (
                        <button 
                          key={j} 
                          onClick={() => !chosen && setSelected(s=>({...s,[i]:opt}))} 
                          className={`text-left px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${btnStyle} flex items-center justify-between`}
                        >
                          <span>{opt}</span>
                          {chosen && isCorrect && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {selected[i] && (
                    <div className="mt-4 text-xs text-gray-400 bg-gray-950/70 border border-gray-800/80 px-4 py-3 rounded-lg flex gap-2 leading-relaxed">
                      <span className="font-extrabold text-indigo-400 flex-shrink-0">💡 explanation:</span>
                      <span className="font-medium text-gray-300">{q.explanation}</span>
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
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-bold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
