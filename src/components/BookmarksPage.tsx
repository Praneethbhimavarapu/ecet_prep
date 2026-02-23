import { useState, useEffect } from 'react';
import { Bookmark, Question } from '../types';
import { api } from '../services/api';
import { 
  Bookmark as BookmarkIcon, 
  Trash2, 
  ChevronRight, 
  HelpCircle,
  BookOpen,
  Search
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
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const q = JSON.parse(b.question_data) as Question;
    return q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
           q.subject.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Saved Content
          </div>
          <h1 className="text-6xl font-light text-white tracking-tight flex items-center gap-6">
            <BookmarkIcon className="h-12 w-12 text-indigo-500 fill-current" />
            Bookmarks
          </h1>
          <p className="text-white/30 font-light tracking-tight">Review and master your saved questions.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full md:w-96 transition-all text-white font-light placeholder:text-white/10"
          />
        </div>
      </div>

      {filteredBookmarks.length > 0 ? (
        <div className="space-y-6">
          {filteredBookmarks.map((bookmark) => {
            const question = JSON.parse(bookmark.question_data) as Question;
            const isExpanded = expandedId === bookmark.id;

            return (
              <motion.div
                layout
                key={bookmark.id}
                className="bg-white/[0.02] rounded-[3rem] border border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all"
              >
                <div 
                  className="p-10 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : bookmark.id)}
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          {question.subject}
                        </span>
                        <span className="px-3 py-1 bg-white/5 text-white/20 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="text-2xl font-light text-white leading-tight tracking-tight">
                        {question.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(bookmark.id);
                        }}
                        className="p-4 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <div className={`p-4 bg-white/5 rounded-2xl text-white/20 transition-transform duration-500 ${isExpanded ? 'rotate-90 text-white' : ''}`}>
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
                      <div className="p-12 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {question.options.map((option, idx) => (
                            <div 
                              key={idx}
                              className={`p-8 rounded-[2rem] border-2 flex items-center gap-6 ${
                                idx === question.correctAnswer 
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                  : 'bg-white/5 border-white/5 text-white/40'
                              }`}
                            >
                              <span className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-sm shrink-0 ${
                                idx === question.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="font-light text-lg tracking-tight">{option}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                            <HelpCircle className="h-5 w-5" />
                            Explanation
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
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/[0.02] rounded-[4rem] border border-white/5 border-dashed">
          <div className="p-8 bg-white/5 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-10">
            <BookOpen className="h-10 w-10 text-white/10" />
          </div>
          <h3 className="text-3xl font-light text-white mb-4 tracking-tight">No bookmarks found</h3>
          <p className="text-white/30 max-w-sm mx-auto font-light">
            {searchQuery ? `No results for "${searchQuery}"` : "Save questions during tests to review them later here."}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-8 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
