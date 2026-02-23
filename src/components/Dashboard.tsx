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
  Plus,
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
    <div className="space-y-16 pb-32">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Candidate Portal
          </div>
          <h1 className="text-6xl font-light text-white tracking-tight">Welcome, {user.name}</h1>
          <p className="text-white/30 font-light tracking-tight">Your path to AP ECET 2026 excellence starts here.</p>
        </div>
        <button
          onClick={() => navigate('/test/Full')}
          className="bg-white text-black px-10 py-5 rounded-full font-black text-sm hover:scale-105 transition-all flex items-center gap-3 group tracking-widest uppercase"
        >
          <Play className="h-4 w-4 fill-current" />
          Start Mock Exam
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          icon={<Trophy className="h-6 w-6" />} 
          label="Total Attempts" 
          value={stats.totalTests.toString()} 
          subValue="Tests completed"
        />
        <StatCard 
          icon={<Target className="h-6 w-6" />} 
          label="Avg Accuracy" 
          value={`${stats.avgScore}%`} 
          subValue="Across all subjects"
        />
        <StatCard 
          icon={<Clock className="h-6 w-6" />} 
          label="Time Invested" 
          value={`${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`} 
          subValue="Total practice time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-20">
          
          {/* Performance Chart */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-4">
                <Zap className="h-6 w-6 text-indigo-500" />
                Performance Trend
              </h3>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Last 7 attempts</span>
            </div>
            <div className="h-[350px] w-full bg-white/[0.02] rounded-[3rem] p-8 border border-white/5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dx={-10} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/20 font-light italic">
                  Complete your first test to see trends
                </div>
              )}
            </div>
          </section>

          {/* Subject Selection */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-4">
                <BookOpen className="h-6 w-6 text-white/40" />
                Subject Practice
              </h3>
              <button 
                onClick={() => navigate('/analytics')}
                className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-all"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SUBJECTS.slice(0, 6).map((subject) => (
                <motion.button
                  key={subject}
                  whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => navigate(`/test/Subject/${encodeURIComponent(subject)}`)}
                  className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-left transition-all group flex items-center gap-6"
                >
                  <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                    <Target className="h-5 w-5 text-white/40 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-light text-white text-lg tracking-tight">{subject}</h4>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Practice Module</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-16">
          {/* Leaderboard */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10">
            <h3 className="text-2xl font-light text-white tracking-tight flex items-center gap-4">
              <Medal className="h-6 w-6 text-amber-500" />
              Top Performers
            </h3>
            <div className="space-y-8">
              {loading ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl" />)}
                </div>
              ) : safeLeaderboard.length > 0 ? (
                safeLeaderboard.slice(0, 5).map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-5">
                      <span className={`text-sm font-black w-6 ${
                        index === 0 ? 'text-amber-500' : 
                        index === 1 ? 'text-slate-400' : 
                        index === 2 ? 'text-amber-700' : 
                        'text-white/10'
                      }`}>
                        0{index + 1}
                      </span>
                      <div>
                        <p className="font-light text-white group-hover:text-indigo-400 transition-colors">{entry.name}</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{entry.tests_taken} Tests</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{entry.avg_accuracy}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/20 text-center py-8 italic font-light">No rankings yet</p>
              )}
            </div>
            <button className="w-full py-4 bg-white/5 text-white/30 rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all">
              Full Leaderboard
            </button>
          </section>

          {/* Admin Seeding Section */}
          <section className="bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] p-10 space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light text-white tracking-tight flex items-center gap-4">
                <Database className="h-6 w-6 text-indigo-500" />
                System Pool
              </h3>
              {isSeeding && <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />}
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {SUBJECTS.map(s => (
                <div key={s} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-light text-white/70 truncate mr-4">{s}</p>
                    <button
                      onClick={() => handleSeed(s)}
                      disabled={isSeeding}
                      className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/20">
                      <span>{getCount(s)} Qs</span>
                      <span>Goal: 200</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (getCount(s) / 200) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 flex items-start gap-6 group hover:bg-white/[0.04] transition-all">
      <div className="p-4 bg-white/5 rounded-2xl text-white/40 group-hover:bg-white group-hover:text-black transition-all">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2">{label}</p>
        <p className="text-4xl font-light text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold mt-2">{subValue}</p>
      </div>
    </div>
  );
}
