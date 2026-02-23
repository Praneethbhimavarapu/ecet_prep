import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, TestAttempt, Subject, LeaderboardEntry, Question } from '../types';
import { api } from '../services/api';
import { generateStaticPool } from '../services/gemini';
import {
  Trophy,
  Clock,
  Target,
  Play,
  BookOpen,
  Zap,
  Medal,
  RefreshCw,
  Database,
  Plus,
  ArrowRight,
  TrendingUp,
  Award
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
  const [staticCounts, setStaticCounts] = useState<{ subject: string; count: number }[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.tests.getHistory(),
      api.tests.getLeaderboard(),
      api.questions.getStaticCounts()
    ])
      .then(([historyData, leaderboardData, countsData]) => {
        if (Array.isArray(historyData)) setHistory(historyData);
        if (Array.isArray(leaderboardData)) setLeaderboard(leaderboardData);
        if (Array.isArray(countsData)) setStaticCounts(countsData);
      })
      .catch(err => console.error("Failed to fetch dashboard data:", err))
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
    } catch (error) {
      console.error('Seeding error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const getCount = (subject: string) => staticCounts.find(c => c.subject === subject)?.count || 0;

  const stats = {
    totalTests: history.length,
    avgScore: history.length ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0) / history.length) : 0,
    totalTime: history.reduce((acc, curr) => acc + curr.duration, 0),
  };

  const chartData = [...history].reverse().slice(-7).map(h => ({
    date: format(new Date(h.date), 'MMM dd'),
    score: Math.round((h.score / h.total) * 100)
  }));

  return (
    <div className="space-y-16 pb-32 max-w-7xl mx-auto px-4">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 pt-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <span className="text-label">CANDIDATE DASHBOARD</span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Welcome,<br />
            <span className="text-indigo-400">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-white/30 text-lg font-light">Prepare for excellence in AP ECET 2026.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <button
            onClick={() => navigate('/test/Full')}
            className="w-full lg:w-auto bg-white text-black px-12 py-5 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group tracking-widest uppercase shadow-2xl shadow-indigo-500/20"
          >
            <Play className="h-4 w-4 fill-current" />
            Launch Full Mock Exam
          </button>
        </motion.div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Trophy className="h-6 w-6" />}
          label="Total Attempts"
          value={stats.totalTests.toString()}
          sub="Tests completed"
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          label="Avg Accuracy"
          value={`${stats.avgScore}%`}
          sub="Subject performance"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Time Expended"
          value={`${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`}
          sub="Total practice minutes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-20">

          {/* Performance Chart */}
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-indigo-400" />
                Performance Curve
              </h3>
              <span className="text-label opacity-40">Last 7 Sessions</span>
            </div>

            <div className="glass-card p-8 h-[400px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={4}
                      dot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 10, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                  <div className="p-4 bg-white/5 rounded-full"><TrendingUp className="h-8 w-8" /></div>
                  <p className="font-light italic">Execute your first test to initialize analytics</p>
                </div>
              )}
            </div>
          </section>

          {/* Subjects Selection */}
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-white/20" />
                Target Practice
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUBJECTS.map((subject) => (
                <motion.button
                  key={subject}
                  whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.04)' }}
                  onClick={() => navigate(`/test/Subject/${encodeURIComponent(subject)}`)}
                  className="glass-card p-6 flex items-center justify-between group text-left transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white transition-all duration-300">
                      <Target className="h-5 w-5 text-indigo-400 group-hover:text-black" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-medium text-lg leading-tight tracking-tight">{subject}</p>
                      <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{getCount(subject)} Qs Ready</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          {/* Rankings Card */}
          <section className="glass-panel rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl"><Medal className="h-6 w-6 text-amber-500" /></div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter">Elite Rank</h4>
            </div>

            <div className="space-y-6">
              {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-amber-500' : 'text-white/20'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-tight">{entry.name}</p>
                      <p className="text-[10px] text-white/20 font-black tracking-widest uppercase">{entry.tests_taken} SESSIONS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white bg-white/5 px-2 py-1 rounded text-xs font-black">{entry.avg_accuracy}%</span>
                  </div>
                </div>
              )) : (
                <p className="text-white/10 text-center py-6 text-sm uppercase font-black tracking-widest">Awaiting Candidates</p>
              )}
            </div>

            <button className="w-full py-4 bg-white/5 text-white/30 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] border border-white/5 hover:bg-white hover:text-black transition-all">
              GLOBAL RANKINGS
            </button>
          </section>

          {/* Admin Tools */}
          <section className="glass-panel border-indigo-500/10 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Database className="h-6 w-6 text-indigo-500" /></div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">System Pool</h4>
              </div>
              {isSeeding && <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {SUBJECTS.map(s => (
                <div key={s} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between group">
                  <div className="space-y-2 overflow-hidden">
                    <p className="text-sm font-medium text-white/70 truncate">{s}</p>
                    <div className="w-24 bg-white/5 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (getCount(s) / 200) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSeed(s)}
                    disabled={isSeeding}
                    className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="glass-card p-10 space-y-6 group hover:glow-indigo transition-all duration-500">
      <div className="p-3 bg-white/5 rounded-2xl text-white/40 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 w-fit">
        {icon}
      </div>
      <div>
        <p className="text-label mb-2 opacity-50">{label}</p>
        <p className="text-5xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest mt-2">{sub}</p>
      </div>
    </div>
  );
}
