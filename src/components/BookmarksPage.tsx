import { useState, useEffect } from 'react';
import { Bookmark, Question } from '../types';
import { api } from '../services/api';
import {
  Bookmark as BookmarkIcon,
  Trash2,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Search,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const data = await api.bookmarks.getAll();
      setBookmarks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (id: number) => {
    try {
      await api.bookmarks.remove(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const q = JSON.parse(b.question_data) as Question;
    return q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
      <div className="h-16 w-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-label opacity-30">Accessing Data Vault...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-24 pb-32">
      {/* Header & Search */}
      <div className="pt-8 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <span className="text-label">NEURAL DATA VAULT</span>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
              SAVED<br />
              <span className="text-white/20">RESOURCES</span>
            </h1>
          </motion.div>

          <div className="relative group w-full lg:w-[450px]">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">
              <Search className="h-6 w-6" />
            </div>
            <input
              type="text"
              placeholder="Query data nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-6 bg-white/[0.03] border border-white/5 rounded-3xl text-white placeholder:text-white/20 focus:bg-white/[0.05] focus:border-indigo-500/50 outline-none transition-all font-light tracking-tight"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => {
              const question = JSON.parse(bookmark.question_data) as Question;
              const isExpanded = expandedId === bookmark.id;

              return (
                <motion.div
                  layout
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-card rounded-[2.5rem] transition-all duration-500 ${isExpanded ? 'ring-2 ring-indigo-500/30' : 'hover:bg-white/[0.04]'}`}
                >
                  <div
                    className="p-8 md:p-10 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : bookmark.id)}
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                      <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-500/10">
                            {question.subject}
                          </span>
                          <span className="px-4 py-1.5 bg-white/5 text-white/30 text-[10px] font-black rounded-full uppercase tracking-widest border border-white/5">
                            {question.difficulty}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight max-w-3xl">
                          <ReactMarkdown>{question.text}</ReactMarkdown>
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(bookmark.id);
                          }}
                          className="flex-1 md:flex-none p-5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5 md:border-transparent"
                        >
                          <Trash2 className="h-5 w-5 mx-auto" />
                        </button>
                        <div className={`p-5 bg-white/5 rounded-2xl text-white/20 transition-all duration-500 ${isExpanded ? 'rotate-90 bg-indigo-500 text-white' : ''}`}>
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-white/[0.01]"
                      >
                        <div className="p-8 md:p-12 space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {question.options.map((option, idx) => (
                              <div
                                key={idx}
                                className={`p-8 rounded-[1.5rem] border-2 flex items-center gap-6 transition-all ${idx === question.correctAnswer
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                    : 'bg-white/5 border-white/5 text-white/40'
                                  }`}
                              >
                                <span className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-xs shrink-0 ${idx === question.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'
                                  }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="font-bold text-lg tracking-tight leading-tight">{option}</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-6 pt-12 border-t border-white/5">
                            <div className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                              <Zap className="h-4 w-4 fill-current" />
                              Resolution Protocol
                            </div>
                            <div className="prose prose-invert max-w-none text-white/60 text-lg leading-relaxed font-light">
                              <ReactMarkdown>{question.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-40 glass-panel rounded-[4rem] border-dashed border-white/10"
            >
              <div className="p-10 bg-white/5 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-10">
                <BookOpen className="h-10 w-10 text-white/10" />
              </div>
              <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">No Nodes Found</h3>
              <p className="text-white/30 max-w-sm mx-auto font-light text-lg">
                {searchQuery ? `Target query "${searchQuery}" yielded no results.` : "Your data vault is currently empty. Bookmark questions during neural simulations to review them here."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-12 group flex items-center gap-3 mx-auto text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all"
                >
                  <X className="h-4 w-4 group-hover:rotate-90 transition-transform" /> Reset Sequence
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
