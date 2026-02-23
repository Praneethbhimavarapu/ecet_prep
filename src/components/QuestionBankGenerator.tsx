import { useState } from 'react';
import { Subject, Question } from '../types';
import { generateQuestionBank } from '../services/gemini';
import { api } from '../services/api';
import { 
  Sparkles, 
  Database, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Layers,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

const SUBJECTS: Subject[] = [
  'Mathematics', 
  'Physics', 
  'Chemistry', 
  'Programming in C', 
  'Data Structures', 
  'Digital Electronics', 
  'Computer Organization', 
  'Operating Systems', 
  'Database Management Systems', 
  'Computer Networks'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export default function QuestionBankGenerator() {
  const [subject, setSubject] = useState<Subject>(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await generateQuestionBank(subject, difficulty, count);
      setQuestions(data);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.questions.seedStatic(questions);
      setSuccess(`Successfully added ${questions.length} questions to the static pool!`);
      setQuestions([]);
    } catch (err) {
      setError('Failed to save questions to the database.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          AI Powered Tools
        </div>
        <h1 className="text-6xl font-light text-white tracking-tight">Question Bank <span className="text-indigo-500">Generator</span></h1>
        <p className="text-white/30 font-light tracking-tight max-w-2xl">
          Use advanced AI to expand the AP ECET 2026 CSE question pool. Generate high-quality, syllabus-aligned questions categorized by subject and difficulty.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Select Subject
                </label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-light outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  {SUBJECTS.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        difficulty === d 
                          ? 'bg-indigo-500 border-indigo-500 text-white' 
                          : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4" /> Question Count
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <span>5</span>
                  <span className="text-indigo-400">{count} Questions</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>

          {questions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-500 p-10 rounded-[3rem] space-y-6"
            >
              <h3 className="text-2xl font-light text-white tracking-tight">Ready to Save</h3>
              <p className="text-white/70 font-light text-sm">
                Review the {questions.length} generated questions. If they meet the quality standards, add them to the permanent static pool.
              </p>
              <button
                onClick={handleSaveToBank}
                disabled={saving}
                className="w-full py-4 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save to Static Pool'}
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4 text-emerald-500"
              >
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500"
              >
                <AlertCircle className="h-6 w-6 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <h3 className="text-3xl font-light text-white tracking-tight">Preview Area</h3>
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">
              {questions.length} Questions Generated
            </span>
          </div>

          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
            {questions.length === 0 && !loading && (
              <div className="py-32 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-[3rem]">
                <Sparkles className="h-12 w-12 text-white/5 mx-auto mb-6" />
                <p className="text-white/20 font-light">Questions will appear here after generation.</p>
              </div>
            )}

            {loading && (
              <div className="py-32 text-center">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-6" />
                <p className="text-white/40 font-light animate-pulse tracking-widest uppercase text-[10px] font-bold">AI is crafting questions...</p>
              </div>
            )}

            {questions.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 space-y-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                        {idx + 1}
                      </span>
                      <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xl font-light text-white leading-tight tracking-tight">
                      {q.text}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => (
                    <div 
                      key={oIdx}
                      className={`p-6 rounded-2xl border ${
                        oIdx === q.correctAnswer 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                          : 'bg-white/5 border-white/5 text-white/40'
                      } flex items-center gap-4`}
                    >
                      <span className={`h-8 w-8 flex items-center justify-center rounded-lg font-black text-xs ${
                        oIdx === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/10'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm font-light">{opt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Explanation</div>
                  <div className="prose prose-invert prose-sm max-w-none text-white/40 font-light leading-relaxed">
                    <ReactMarkdown>{q.explanation}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
