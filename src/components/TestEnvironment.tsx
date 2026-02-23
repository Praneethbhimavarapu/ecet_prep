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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-bold text-slate-900">{type === 'Full' ? 'Full Mock Test' : testSubject}</h2>
            <p className="text-xs text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              Submit <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  {currentQuestion.difficulty}
                </span>
                <button 
                  onClick={() => handleBookmark(currentIndex)}
                  disabled={bookmarked[currentIndex]}
                  className={`p-2 rounded-lg transition-colors ${bookmarked[currentIndex] ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Bookmark className={`h-5 w-5 ${bookmarked[currentIndex] ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h3 className="text-xl font-medium text-slate-900 mb-8 leading-relaxed">
                {currentQuestion.text}
              </h3>

              <div className="space-y-3">
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
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        variant === 'correct' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' :
                        variant === 'incorrect' ? 'bg-red-50 border-red-500 text-red-900' :
                        variant === 'selected' ? 'bg-indigo-50 border-indigo-500 text-indigo-900' :
                        'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className={`h-8 w-8 flex items-center justify-center rounded-lg font-bold shrink-0 ${
                        variant === 'correct' ? 'bg-emerald-500 text-white' :
                        variant === 'incorrect' ? 'bg-red-500 text-white' :
                        variant === 'selected' ? 'bg-indigo-500 text-white' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-medium">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
                    <HelpCircle className="h-5 w-5" />
                    Explanation
                  </div>
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                    <ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>

            {canUnlockNext && (
              <button
                onClick={handleNextWindow}
                disabled={loadingNext}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {loadingNext ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
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
              className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Question Grid Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900">Question Palette</h4>
              {type === 'Full' && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">
                  Window {currentWindow + 1}/4
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = currentIndex === idx;
                const isCorrect = isSubmitted && answers[idx] === questions[idx].correctAnswer;
                const isWrong = isSubmitted && answers[idx] !== undefined && answers[idx] !== questions[idx].correctAnswer;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    } ${
                      isSubmitted ? (
                        isCorrect ? 'bg-emerald-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        'bg-slate-100 text-slate-400'
                      ) : (
                        isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      )
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
              {type === 'Full' && questions.length < 200 && !isSubmitted && (
                <div className="col-span-5 mt-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {200 - questions.length} more questions to unlock
                  </p>
                </div>
              )}
            </div>
          </div>

          {isSubmitted && (
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
              <h4 className="font-bold mb-2">Test Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm opacity-90">
                  <span>Score</span>
                  <span className="font-bold">{questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0)}/{questions.length}</span>
                </div>
                <div className="flex justify-between text-sm opacity-90">
                  <span>Accuracy</span>
                  <span className="font-bold">{Math.round((questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0) / questions.length) * 100)}%</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full mt-6 bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
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
