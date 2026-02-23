import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, TestAttempt, Subject, LeaderboardEntry, Question } from '../types';
import { api } from '../services/api';
import { generateStaticPool } from '../services/gemini';
import { 
  Trophy, 
  Clock, 
  Target, 
  ChevronRight, 
  Play, 
  BookOpen, 
  Zap,
  History,
  Medal,
  Users,
  Star,
  RefreshCw,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const SUBJECTS: Subject[] = [
  'Mathematics', 'Physics', 'Chemistry',
  'Programming in C', 'Data Structures', 'Digital Electronics',
  'Computer Organization', 'Operating Systems', 'Database Management Systems',
  'Computer Networks'
];

export default function Dashboard({ user }: { user: User }) {
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [impQuestions, setImpQuestions] = useState<Question[]>([]);
  const [staticCounts, setStaticCounts] = useState<{ subject: string; count: number }[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.tests.getHistory(),
      api.tests.getLeaderboard(),
      api.questions.getImportant(),
      api.questions.getStaticCounts()
    ])
      .then(([historyData, leaderboardData, impData, countsData]) => {
        if (Array.isArray(historyData)) setHistory(historyData);
        if (Array.isArray(leaderboardData)) setLeaderboard(leaderboardData);
        if (Array.isArray(impData)) setImpQuestions(impData);
        if (Array.isArray(countsData)) setStaticCounts(countsData);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSeed = async (subject: Subject) => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const questions = await generateStaticPool(subject, 50);
      await api.questions.seedStatic(questions);
      const counts = await api.questions.getStaticCounts();
      setStaticCounts(counts);
      alert(`Successfully seeded 50 questions for ${subject}`);
    } catch (error) {
      console.error('Seeding error:', error);
      alert('Failed to seed questions.');
    } finally {
      setIsSeeding(false);
    }
  };

  const getCount = (subject: string) => {
    return staticCounts.find(c => c.subject === subject)?.count || 0;
  };

  const safeHistory = Array.isArray(history) ? history : [];
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  const stats = {
    totalTests: safeHistory.length,
    avgScore: safeHistory.length ? Math.round(safeHistory.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0) / safeHistory.length) : 0,
    totalTime: safeHistory.reduce((acc, curr) => acc + curr.duration, 0),
  };

  const chartData = safeHistory.slice(0, 7).reverse().map(h => ({
    date: format(new Date(h.date), 'MMM dd'),
    score: Math.round((h.score / h.total) * 100)
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hello, {user.name}! 👋</h1>
          <p className="text-slate-500 mt-1">Ready to ace your AP ECET 2026 preparation today?</p>
        </div>
        <button
          onClick={() => navigate('/test/Full')}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 group"
        >
          <Play className="h-5 w-5 fill-current" />
          Start Full Mock Test
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Trophy className="text-amber-500" />} 
          label="Total Attempts" 
          value={stats.totalTests.toString()} 
          subValue="Tests completed"
        />
        <StatCard 
          icon={<Target className="text-emerald-500" />} 
          label="Average Accuracy" 
          value={`${stats.avgScore}%`} 
          subValue="Across all subjects"
        />
        <StatCard 
          icon={<Clock className="text-indigo-500" />} 
          label="Time Spent" 
          value={`${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`} 
          subValue="Total practice time"
        />
      </div>

      {/* Most Important Questions Section */}
      {impQuestions.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              Most Important Questions
            </h3>
            <span className="text-xs text-slate-500">Highly probable for 2026</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {impQuestions.slice(0, 3).map((q, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">
                    {q.subject}
                  </span>
                </div>
                <p className="text-slate-800 font-medium text-sm line-clamp-3">{q.text}</p>
                <button 
                  onClick={() => navigate(`/test/Subject/${encodeURIComponent(q.subject)}`)}
                  className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  Practice Subject
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Admin Seeding Section (Visible for development) */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-2xl">
              <Database className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Static Question Pool</h3>
              <p className="text-slate-400 text-sm">Seed the database with important questions (Goal: 200/subject)</p>
            </div>
          </div>
          {isSeeding && (
            <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold uppercase">Seeding in progress...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => handleSeed(s)}
              disabled={isSeeding}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group disabled:opacity-50"
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{s}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{getCount(s)}</span>
                <span className="text-[10px] text-indigo-400 font-bold group-hover:underline">Seed +50</span>
              </div>
              <div className="mt-2 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (getCount(s) / 200) * 100)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              Performance Trend
            </h3>
            <span className="text-sm text-slate-500">Last 7 attempts</span>
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Complete your first test to see trends
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Top Performers
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
              </div>
            ) : safeLeaderboard.length > 0 ? (
              safeLeaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    entry.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-600' : 
                      index === 1 ? 'bg-slate-200 text-slate-600' : 
                      index === 2 ? 'bg-orange-100 text-orange-600' : 
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{entry.name}</p>
                      <p className="text-[10px] text-slate-500">{entry.tests_taken} tests taken</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-sm">{entry.avg_accuracy}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8 italic text-sm">No rankings yet</p>
            )}
          </div>
          {safeLeaderboard.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="h-4 w-4" />
                <span>Compete with {safeLeaderboard.length}+ active students</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            Recent History
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
              </div>
            ) : safeHistory.length > 0 ? (
              safeHistory.slice(0, 5).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{test.test_type === 'Full' ? 'Full Mock' : test.subject}</p>
                    <p className="text-[10px] text-slate-500">{format(new Date(test.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-sm">{Math.round((test.score / test.total) * 100)}%</p>
                    <p className="text-[10px] text-slate-500">{test.score}/{test.total}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8 italic">No tests taken yet</p>
            )}
          </div>
        </div>

        {/* Subject Selection (Moved to span 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Subject-Wise Practice
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUBJECTS.slice(0, 6).map((subject) => (
              <motion.button
                key={subject}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/test/Subject/${encodeURIComponent(subject)}`)}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group flex items-center gap-4"
              >
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors shrink-0">
                  <Target className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{subject}</h4>
                  <p className="text-[10px] text-slate-500">Practice specific topics</p>
                </div>
              </motion.button>
            ))}
          </div>
          <button 
            onClick={() => navigate('/analytics')}
            className="w-full py-3 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-xl transition-colors"
          >
            View All Subjects & Detailed Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 my-1">{value}</p>
        <p className="text-xs text-slate-400">{subValue}</p>
      </div>
    </div>
  );
}
