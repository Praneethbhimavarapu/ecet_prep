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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookmarkIcon className="h-8 w-8 text-indigo-600 fill-current" />
            My Bookmarks
          </h1>
          <p className="text-slate-500 mt-1">Review and master your saved questions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full md:w-80 transition-all"
          />
        </div>
      </div>

      {filteredBookmarks.length > 0 ? (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => {
            const question = JSON.parse(bookmark.question_data) as Question;
            const isExpanded = expandedId === bookmark.id;

            return (
              <motion.div
                layout
                key={bookmark.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div 
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : bookmark.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">
                          {question.subject}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase">
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {question.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(bookmark.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {question.options.map((option, idx) => (
                            <div 
                              key={idx}
                              className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                                idx === question.correctAnswer 
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                                  : 'bg-white border-slate-100 text-slate-600'
                              }`}
                            >
                              <span className={`h-8 w-8 flex items-center justify-center rounded-lg font-bold shrink-0 ${
                                idx === question.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="font-medium">{option}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                            <HelpCircle className="h-4 w-4" />
                            Explanation
                          </div>
                          <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed">
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
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No bookmarks found</h3>
          <p className="text-slate-500 max-w-xs mx-auto">
            {searchQuery ? `No results for "${searchQuery}"` : "Save questions during tests to review them later here."}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
