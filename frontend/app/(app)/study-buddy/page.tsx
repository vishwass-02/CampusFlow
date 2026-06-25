'use client';
import { useState, useRef } from 'react';
import { Sparkles, Brain, HelpCircle, Check, Upload, FileText, X, Loader2 } from 'lucide-react';

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

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint',
    ];
    const allowedExts = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setError('Only PDF, DOCX, and PPTX files are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadedFile(file);
    setExtracting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:4000/ai/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Failed to extract text');
      }

      setNotes(data.text);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to extract text from file.';
      setError(errorMsg);
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }

  function clearFile() {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

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
            Upload your lecture notes (PDF, DOCX, PPTX) or paste text to generate flashcards and quizzes in seconds.
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

          {/* File Upload Zone */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload Document
              <span className="text-gray-600 font-normal lowercase">(PDF, DOCX, PPTX — max 10MB)</span>
            </label>

            {!uploadedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                    : 'border-gray-800 bg-gray-950/40 hover:border-gray-700 hover:bg-gray-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    dragActive ? 'bg-indigo-500/20' : 'bg-gray-800/60'
                  }`}>
                    <Upload className={`h-6 w-6 transition-colors duration-300 ${
                      dragActive ? 'text-indigo-400' : 'text-gray-500'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-400">
                    <span className="text-indigo-400 font-semibold">Click to browse</span> or drag & drop your file here
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Supports PDF, Word (.docx), and PowerPoint (.pptx)
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {extracting ? (
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white font-semibold truncate max-w-[300px]">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatFileSize(uploadedFile.size)}
                      {extracting && <span className="text-indigo-400 ml-2">Extracting text...</span>}
                      {!extracting && <span className="text-emerald-400 ml-2">✓ Text extracted</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[11px] text-gray-600 font-semibold uppercase tracking-wider">or paste your notes</span>
            <div className="flex-1 h-px bg-gray-800" />
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
            disabled={loading || !notes.trim() || extracting}
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
