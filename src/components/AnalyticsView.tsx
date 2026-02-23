import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TestAttempt, LeaderboardEntry } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Award,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AnalyticsView() {
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.tests.getHistory(),
      api.tests.getLeaderboard()
    ])
      .then(([historyData, leaderboardData]) => {
        if (Array.isArray(historyData)) setHistory(historyData);
        if (Array.isArray(leaderboardData)) setLeaderboard(leaderboardData);
      })
      .catch(err => console.error("Failed to fetch analytics data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
      <div className="h-16 w-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-label opacity-30">Generating Performance Metrics...</p>
    </div>
  );

  const globalAvgAccuracy = leaderboard.length
    ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.avg_accuracy, 0) / leaderboard.length)
    : 0;

  const subjectPerformance = history.reduce((acc: any, curr) => {
    const sub = curr.subject || 'Full Mock';
    if (!acc[sub]) acc[sub] = { name: sub, score: 0, total: 0, count: 0 };
    acc[sub].score += curr.score;
    acc[sub].total += curr.total;
    acc[sub].count += 1;
    return acc;
  }, {});

  const barData = Object.values(subjectPerformance).map((s: any) => ({
    name: s.name,
    accuracy: Math.round((s.score / s.total) * 100)
  }));

  const progressionData = [...history].reverse().map(h => ({
    date: format(new Date(h.date), 'MMM dd'),
    yourScore: Math.round((h.score / h.total) * 100),
    avgScore: globalAvgAccuracy
  }));

  const userAvgAccuracy = history.length
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0) / history.length)
    : 0;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  const weakTopics = barData.filter(d => d.accuracy < 60).map(d => d.name);
  const strongTopics = barData.filter(d => d.accuracy >= 80).map(d => d.name);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-24 pb-32">
      {/* Header */}
      <div className="pt-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <span className="text-label">NEURAL PERFORMANCE DATA</span>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
            ANALYTICS<br />
            <span className="text-white/20">GRID</span>
          </h1>
          <p className="text-white/30 text-xl font-light max-w-2xl">Visualizing your path to AP ECET 2026 mastery through high-fidelity metrics.</p>
        </motion.div>
      </div>

      {/* Main Progression Chart */}
      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-indigo-400" />
            Accuracy Progression
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black tracking-widest uppercase text-white/30">Your Growth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/10" />
              <span className="text-[10px] font-black tracking-widest uppercase text-white/30">Global Avg</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] h-[500px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5"><TrendingUp className="h-64 w-64" /></div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressionData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 800 }}
                dy={16}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 800 }}
                dx={-16}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
              />
              <Area
                type="monotone"
                dataKey="yourScore"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
                strokeDasharray="8 8"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Subject Breakdown */}
        <section className="space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-white/20" />
              Domain Mastery
            </h3>
          </div>
          <div className="glass-card p-10 rounded-[3rem]">
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 800 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="accuracy" radius={[0, 20, 20, 0]} barSize={28}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Insights Column */}
        <div className="space-y-12">
          <section className="glass-panel p-12 rounded-[3.5rem] space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-indigo-500 opacity-10"><Zap className="h-24 w-24 fill-current" /></div>
            <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
              Grid Insights
            </h3>

            <div className="space-y-12">
              <div className="space-y-6">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Weak Nodes
                </p>
                <div className="flex flex-wrap gap-3">
                  {weakTopics.length > 0 ? weakTopics.map(t => (
                    <span key={t} className="px-6 py-3 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/10">{t}</span>
                  )) : <span className="text-white/20 text-sm font-light italic">All sectors functioning normally.</span>}
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Elite Sectors
                </p>
                <div className="flex flex-wrap gap-3">
                  {strongTopics.length > 0 ? strongTopics.map(t => (
                    <span key={t} className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">{t}</span>
                  )) : <span className="text-white/20 text-sm font-light italic">Optimize more nodes to reach elite status.</span>}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-label opacity-30">GLOBAL PERCENTILE</p>
                <p className="text-4xl font-black text-white tracking-tighter mt-1">TOP {userAvgAccuracy > globalAvgAccuracy ? "15%" : "40%"}</p>
              </div>
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center">
                <Award className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
          </section>

          {/* AI Recommendation */}
          <section className="bg-indigo-600 p-12 rounded-[3.5rem] relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl"><Zap className="h-6 w-6 text-white" /></div>
                <h4 className="text-xl font-black text-white uppercase tracking-widest">Neural Guidance</h4>
              </div>

              <p className="text-white text-2xl font-light leading-tight tracking-tight">
                {weakTopics.length > 0
                  ? `Focus all computational power on "${weakTopics[0]}". Strengthening this node will maximize your overall ECET score.`
                  : "Performance is optimal. Transition focused practice toward high-speed Full Mock simulations."}
              </p>

              <button className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase bg-black text-white px-8 py-4 rounded-full hover:scale-105 transition-all">
                Execute Targeted Test <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
