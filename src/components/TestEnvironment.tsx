import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, Subject } from '../types';
import { generateQuestions } from '../services/gemini';
import { api } from '../services/api';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Bookmark,
  Loader2,
  HelpCircle,
  Brain,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function TestEnvironment() {
  const { type, subject } = useParams<{ type: 'Full' | 'Subject', subject?: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [currentWindow, setCurrentWindow] = useState(0);

  const testSubject = subject ? decodeURIComponent(subject) as Subject : 'Full';

  const loadWindow = useCallback(async (windowIdx: number) => {
    try {
      if (windowIdx === 0) setLoading(true);
      else setLoadingNext(true);

      const count = type === 'Full' ? 50 : 30;
      
      // Fetch AI questions (already sequenced by prompt)
      const aiQuestions = await generateQuestions(testSubject, count, windowIdx);
      
      // Fetch some static questions to mix in
      let mixedQuestions = [...aiQuestions];
      
      try {
        if (type === 'Full') {
          // For full mock, we pick a few subjects relevant to the current window
          const subjectsInWindow = windowIdx === 0 ? ['Mathematics', 'Physics', 'Chemistry'] : 
                                  windowIdx === 1 ? ['Mathematics', 'Data Structures', 'Operating Systems'] :
                                  windowIdx === 2 ? ['Operating Systems', 'Database Management Systems', 'Java'] :
                                  ['Web Technologies', 'Big Data', 'Python'];
          
          const staticBatch = await Promise.all(
            subjectsInWindow.map(s => api.questions.getStaticBySubject(s))
          );
          
          const flatStatic = staticBatch.flat().slice(0, 10); // Take 10 static questions
          // Replace 10 AI questions with static ones to keep count at 50
          mixedQuestions = [...aiQuestions.slice(0, 40), ...flatStatic];
        } else {
          // For subject-wise, fetch 5 static questions
          const staticQs = await api.questions.getStaticBySubject(testSubject);
          mixedQuestions = [...aiQuestions.slice(0, count - 5), ...staticQs.slice(0, 5)];
        }
      } catch (e) {
        console.warn("Failed to fetch static questions, using AI only", e);
      }

      // Final sort to ensure subject sequencing (especially for Full Mock)
      if (type === 'Full') {
        const subjectOrder = [
          'Mathematics', 'Physics', 'Chemistry', 'Digital Electronics', 
          'Software Engineering', 'Computer Organization', 'Data Structures',
          'Computer Networks', 'Operating Systems', 'Database Management Systems',
          'Java', 'Web Technologies', 'Big Data', 'Android', 'IoT', 'Python'
        ];
        mixedQuestions.sort((a, b) => subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject));
      }
      
      setQuestions(prev => [...prev, ...mixedQuestions]);
      
      if (windowIdx === 0) {
        setTimeLeft(type === 'Full' ? 180 * 60 : count * 60); 
        setLoading(false);
      } else {
        setLoadingNext(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load questions. Please try again.");
      navigate('/dashboard');
    }
  }, [type, testSubject, navigate]);

  useEffect(() => {
    loadWindow(0);
  }, [loadWindow]);

  const handleNextWindow = () => {
    const nextWindow = currentWindow + 1;
    setCurrentWindow(nextWindow);
    loadWindow(nextWindow);
  };

  const isWindowComplete = (windowIdx: number) => {
    const start = windowIdx * 50;
    const end = Math.min((windowIdx + 1) * 50, questions.length);
    for (let i = start; i < end; i++) {
      if (answers[i] === undefined) return false;
    }
    return true;
  };

  const canUnlockNext = type === 'Full' && currentWindow < 3 && isWindowComplete(currentWindow);

  useEffect(() => {
    if (loading || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isSubmitted, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && !loading) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
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
      console.error("Failed to save test result", err);
    }
  }, [answers, questions, startTime, type, testSubject]);

  const handleBookmark = async (idx: number) => {
    try {
      await api.bookmarks.add(questions[idx]);
      setBookmarked(prev => ({ ...prev, [idx]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Generating {type === 'Full' ? 'First 50' : '30'} AI Questions...
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Our AI is crafting unique, high-quality questions based on the C-23 Diploma curriculum. 
            Complete each set of 50 to unlock the next window.
          </p>
        </div>
        <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 30, ease: "linear" }}
            className="bg-indigo-600 h-full"
          />
        </div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          Please wait • Do not refresh
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-10 sticky top-20 z-40 bg-black/80 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">Examination Module</p>
              <h2 className="text-4xl font-light text-white tracking-tight">{type === 'Full' ? 'Full Mock Test' : testSubject}</h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className={`flex items-center gap-4 px-8 py-4 rounded-3xl border ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
            <Clock className="h-5 w-5 opacity-40" />
            <span className="text-2xl font-light tracking-tighter">{formatTime(timeLeft)}</span>
          </div>
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
            >
              Submit <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.02] p-12 rounded-[3rem] border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {currentQuestion.difficulty}
                  </span>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">Question {currentIndex + 1} of {questions.length}</p>
                </div>
                <button 
                  onClick={() => handleBookmark(currentIndex)}
                  disabled={bookmarked[currentIndex]}
                  className={`p-4 rounded-2xl transition-all ${bookmarked[currentIndex] ? 'text-amber-500 bg-amber-500/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                >
                  <Bookmark className={`h-6 w-6 ${bookmarked[currentIndex] ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h3 className="text-3xl font-light text-white mb-12 leading-tight tracking-tight">
                {currentQuestion.text}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentIndex] === idx;
                  const isCorrect = currentQuestion.correctAnswer === idx;
                  const showResult = isSubmitted;

                  let variant = "default";
                  if (showResult) {
                    if (isCorrect) variant = "correct";
                    else if (isSelected) variant = "incorrect";
                  } else if (isSelected) {
                    variant = "selected";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isSubmitted}
                      onClick={() => setAnswers({ ...answers, [currentIndex]: idx })}
                      className={`w-full text-left p-8 rounded-[2rem] border-2 transition-all flex items-center gap-8 group ${
                        variant === 'correct' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                        variant === 'incorrect' ? 'bg-red-500/10 border-red-500 text-red-500' :
                        variant === 'selected' ? 'bg-white border-white text-black' :
                        'bg-white/5 border-white/5 hover:border-white/20 text-white/60'
                      }`}
                    >
                      <span className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-sm transition-all ${
                        variant === 'correct' ? 'bg-emerald-500 text-white' :
                        variant === 'incorrect' ? 'bg-red-500 text-white' :
                        variant === 'selected' ? 'bg-black text-white' :
                        'bg-white/5 text-white/20 group-hover:text-white'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-light text-xl tracking-tight">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="ml-auto h-6 w-6 text-emerald-500" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="ml-auto h-6 w-6 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 p-10 bg-white/5 rounded-[2.5rem] border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-6 text-indigo-400 font-bold text-sm uppercase tracking-widest">
                    <HelpCircle className="h-5 w-5" />
                    Explanation
                  </div>
                  <div className="prose prose-invert max-w-none text-white/60 leading-relaxed font-light">
                    <ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto flex items-center gap-3 px-10 py-5 rounded-full font-bold text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-10"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            {canUnlockNext && (
              <button
                onClick={handleNextWindow}
                disabled={loadingNext}
                className="w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loadingNext ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Next 50...
                  </>
                ) : (
                  <>
                    Unlock Next 50 Questions <Zap className="h-4 w-4 fill-current" />
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="w-full sm:w-auto flex items-center gap-3 px-10 py-5 rounded-full font-bold text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-10"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Question Grid Sidebar */}
        <div className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10">
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">Question Palette</h4>
              {type === 'Full' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-widest">
                  Window {currentWindow + 1}/4
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = currentIndex === idx;
                const isCorrect = isSubmitted && answers[idx] === questions[idx].correctAnswer;
                const isWrong = isSubmitted && answers[idx] !== undefined && answers[idx] !== questions[idx].correctAnswer;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                      isCurrent ? 'ring-4 ring-white/10 scale-110 z-10' : ''
                    } ${
                      isSubmitted ? (
                        isCorrect ? 'bg-emerald-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        'bg-white/5 text-white/20'
                      ) : (
                        isAnswered ? 'bg-white text-black' : 'bg-white/5 text-white/20 hover:bg-white/10'
                      )
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-10 border-t border-white/5 space-y-6">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <div className="h-3 w-3 bg-white rounded-sm" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <div className="h-3 w-3 bg-white/5 rounded-sm" />
                <span>Not Visited</span>
              </div>
              {isSubmitted && (
                <>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                    <div className="h-3 w-3 bg-emerald-500 rounded-sm" />
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                    <div className="h-3 w-3 bg-red-500 rounded-sm" />
                    <span>Incorrect</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {isSubmitted && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-10 rounded-[3rem] space-y-8">
              <h4 className="text-xl font-light text-white tracking-tight">Test Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Score</span>
                  <span className="text-2xl font-light text-white tracking-tighter">{questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0)}/{questions.length}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Accuracy</span>
                  <span className="text-2xl font-light text-white tracking-tighter">{Math.round((questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0) / questions.length) * 100)}%</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
