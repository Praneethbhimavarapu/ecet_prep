import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, Subject, User } from '../types';
import { api } from '../services/api';
import { generateQuestions } from '../services/gemini';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  Shield,
  Zap,
  HelpCircle,
  Bookmark,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function TestEnvironment({ user }: { user: User }) {
  const { type, subject } = useParams<{ type: 'Full' | 'Subject', subject?: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentWindow, setCurrentWindow] = useState(0);
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});

  const testSubject = subject ? decodeURIComponent(subject) as Subject : 'Full';

  const loadWindow = useCallback(async (windowIdx: number) => {
    try {
      if (windowIdx === 0) setLoading(true);
      else setLoadingNext(true);

      const count = type === 'Full' ? 50 : 30;
      const newQuestions = await generateQuestions(testSubject, count, windowIdx);

      setQuestions(prev => [...prev, ...newQuestions]);

      if (windowIdx === 0) {
        setTimeLeft(type === 'Full' ? 180 * 60 : count * 60);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to initialize examination grid: ${err.message || 'Unknown error'}. Please retry.`);
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setLoadingNext(false);
    }
  }, [type, testSubject, navigate]);

  useEffect(() => {
    loadWindow(0);
  }, [loadWindow]);

  useEffect(() => {
    if (loading || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isSubmitted, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && !loading && questions.length > 0) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, loading, questions.length]);

  const handleSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const score = questions.reduce((acc, q, idx) => {
      return acc + (answers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);

    const duration = Math.floor((Date.now() - startTime) / 1000 / 60);

    try {
      await api.tests.save({
        test_type: type as 'Full' | 'Subject',
        subject: testSubject === 'Full' ? undefined : testSubject,
        score,
        total: questions.length,
        duration
      });
    } catch (err) {
      console.error("Critical failure during telemetry transmission:", err);
    }
  };

  const handleBookmark = async (idx: number) => {
    try {
      await api.bookmarks.add(questions[idx]);
      setBookmarked(prev => ({ ...prev, [idx]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlag = (idx: number) => {
    const newFlags = new Set(flags);
    if (newFlags.has(idx)) newFlags.delete(idx);
    else newFlags.add(idx);
    setFlags(newFlags);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextWindow = () => {
    const nextWindow = currentWindow + 1;
    setCurrentWindow(nextWindow);
    loadWindow(nextWindow);
    setCurrentIndex(questions.length);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12">
      <div className="relative">
        <div className="h-32 w-32 border-[12px] border-white/5 border-t-indigo-500 rounded-full animate-spin" />
        <Zap className="h-10 w-10 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center space-y-4">
        <h2 className="heading-giant text-7xl">INITIALIZING</h2>
        <p className="text-label opacity-30 italic">Compiling examination parameters for {testSubject}...</p>
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];
  const progress = (Object.keys(answers).length / questions.length) * 100;
  const canUnlockNext = type === 'Full' && currentWindow < 3 && (currentIndex >= questions.length - 1);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Test Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b-0 rounded-none md:rounded-b-[2rem] mx-0 md:mx-4">
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex h-12 w-12 bg-white/5 rounded-xl items-center justify-center">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-black tracking-tighter uppercase">{type} EXAM: {testSubject}</h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-indigo-500"
                />
              </div>
              <span className="text-[10px] font-black text-white/30 uppercase">{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${timeLeft < 300 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-white/5 text-white'}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono text-xl font-bold tracking-tight">{formatTime(timeLeft)}</span>
          </div>
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 hidden sm:block"
            >
              FINALIZE EXAM
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 hidden lg:block space-y-8">
          <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-tighter uppercase text-white/40">Question Palette</h3>
              {type === 'Full' && <span className="text-[10px] font-black text-indigo-400">WINDOW {currentWindow + 1}</span>}
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-10 rounded-lg text-xs font-black transition-all flex items-center justify-center
                    ${currentIndex === i ? 'bg-white text-black scale-110 shadow-lg' :
                      isSubmitted ? (
                        answers[i] === questions[i].correctAnswer ? 'bg-emerald-500 text-white' :
                          answers[i] !== undefined ? 'bg-red-500 text-white' : 'bg-white/5 text-white/20'
                      ) : (
                        answers[i] !== undefined ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          flags.has(i) ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                            'bg-white/5 text-white/20 hover:bg-white/10'
                      )}
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] space-y-4">
            <h3 className="text-xs font-black tracking-widest uppercase text-white/20">Status Key</h3>
            <div className="space-y-3">
              <StatusLabel color="bg-indigo-500" label="Answered" />
              <StatusLabel color="bg-amber-500" label="Flagged" />
              <StatusLabel color="bg-white/5" label="Terminal" />
              {isSubmitted && (
                <>
                  <StatusLabel color="bg-emerald-500" label="Correct" />
                  <StatusLabel color="bg-red-500" label="Erroneous" />
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Question Area */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 md:p-12 rounded-[3rem] min-h-[500px] flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/20" />

              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <span className="text-label bg-white/5 px-4 py-2 rounded-full uppercase tracking-widest text-indigo-400">
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{currentQ.difficulty}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleBookmark(currentIndex)}
                    className={`p-3 rounded-xl transition-all ${bookmarked[currentIndex] ? 'text-amber-500 bg-amber-500/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                  >
                    <Bookmark className={`h-5 w-5 ${bookmarked[currentIndex] ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleFlag(currentIndex)}
                    disabled={isSubmitted}
                    className={`p-3 rounded-xl transition-all ${flags.has(currentIndex) ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/20 hover:text-white'}`}
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-12 tracking-tight group">
                <ReactMarkdown>{currentQ.text}</ReactMarkdown>
              </h2>

              <div className="grid grid-cols-1 gap-4 mt-auto">
                {currentQ.options.map((option, i) => {
                  const isSelected = answers[currentIndex] === i;
                  const isCorrect = currentQ.correctAnswer === i;
                  const showResult = isSubmitted;

                  return (
                    <button
                      key={i}
                      disabled={isSubmitted}
                      onClick={() => setAnswers({ ...answers, [currentIndex]: i })}
                      className={`group w-full p-6 rounded-[1.5rem] text-left transition-all flex items-center gap-6 border-2
                        ${showResult ? (
                          isCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                            isSelected ? 'bg-red-500/10 border-red-500 text-red-500' :
                              'bg-white/5 border-white/5 text-white/40'
                        ) : (
                          isSelected ? 'bg-white text-black border-transparent scale-[1.02] shadow-2xl' :
                            'bg-white/5 text-white/50 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                        )}
                      `}
                    >
                      <span className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-black text-sm transition-all
                        ${showResult ? (
                          isCorrect ? 'bg-emerald-500 text-white' :
                            isSelected ? 'bg-red-500 text-white' : 'bg-white/10 text-white/30'
                        ) : (
                          isSelected ? 'bg-black text-white' : 'bg-white/5 text-white/20 group-hover:bg-white group-hover:text-black'
                        )}
                      `}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-lg font-medium">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="ml-auto h-6 w-6 text-emerald-500" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="ml-auto h-6 w-6 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10"
                >
                  <div className="flex items-center gap-3 mb-4 text-indigo-400 font-black text-[10px] tracking-widest uppercase">
                    <HelpCircle className="h-4 w-4" /> Explanation
                  </div>
                  <div className="prose prose-invert max-w-none text-white/60 font-light text-sm leading-relaxed">
                    <ReactMarkdown>{currentQ.explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-24 md:pb-0">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl glass-panel text-white font-black text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" /> PREVIOUS
            </button>

            {canUnlockNext && !isSubmitted && (
              <button
                onClick={handleNextWindow}
                disabled={loadingNext}
                className="w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loadingNext ? (
                  <div className="flex items-center gap-3"><Loader2 className="h-4 w-4 animate-spin" /> GENERATING...</div>
                ) : (
                  <>UNLOCK NEXT 50 QUESTIONS <Zap className="h-4 w-4 fill-current" /></>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (currentIndex === questions.length - 1) {
                  if (type === 'Full' && currentWindow < 3) return; // Wait for unlock
                  handleSubmit();
                } else {
                  setCurrentIndex(currentIndex + 1);
                }
              }}
              disabled={currentIndex === questions.length - 1 && type === 'Full' && currentWindow < 3}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-indigo-500 text-white font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-30"
            >
              {currentIndex === questions.length - 1 ? 'FINISH EXAM' : (
                <>NEXT QUESTION <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      {isSubmitted && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/5">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-widest uppercase"
          >
            Terminal Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

function StatusLabel({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{label}</span>
    </div>
  );
}
