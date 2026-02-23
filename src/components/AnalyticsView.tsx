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
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react';

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
      .catch(err => {
        console.error("Failed to fetch analytics data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading analytics...</div>;

  const safeHistory = Array.isArray(history) ? history : [];
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  // Calculate Global Average Accuracy
  const globalAvgAccuracy = safeLeaderboard.length 
    ? Math.round(safeLeaderboard.reduce((acc, curr) => acc + curr.avg_accuracy, 0) / safeLeaderboard.length)
    : 0;

  const subjectPerformance = safeHistory.reduce((acc: any, curr) => {
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

  const progressionData = safeHistory.slice().reverse().map(h => ({
    date: format(new Date(h.date), 'MMM dd'),
    yourScore: Math.round((h.score / h.total) * 100),
    avgScore: globalAvgAccuracy
  }));

  const userAvgAccuracy = safeHistory.length 
    ? Math.round(safeHistory.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0) / safeHistory.length)
    : 0;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const weakTopics = barData.filter(d => d.accuracy < 60).map(d => d.name);
  const strongTopics = barData.filter(d => d.accuracy >= 80).map(d => d.name);

  return (
    <div className="space-y-16 pb-32">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          Performance Insights
        </div>
        <h1 className="text-6xl font-light text-white tracking-tight">Analytics</h1>
        <p className="text-white/30 font-light tracking-tight">Deep dive into your AP ECET preparation metrics.</p>
      </div>

      {/* Progression Chart */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-4">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
            Progression vs. Global Average
          </h3>
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Last 10 attempts</span>
        </div>
        <div className="h-[400px] w-full bg-white/[0.02] rounded-[3rem] p-10 border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dx={-10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: '0px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }} />
              <Line 
                name="Your Accuracy"
                type="monotone" 
                dataKey="yourScore" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line 
                name="Global Avg"
                type="monotone" 
                dataKey="avgScore" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Accuracy by Subject */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-4">
              <Target className="h-6 w-6 text-white/40" />
              Subject Mastery
            </h3>
          </div>
          <div className="h-[450px] w-full bg-white/[0.02] rounded-[3rem] p-10 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#000', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="accuracy" radius={[0, 12, 12, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Insights & Recommendations */}
        <div className="space-y-12">
          <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 space-y-12">
            <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-4">
              <TrendingUp className="h-6 w-6 text-indigo-500" />
              Learning Insights
            </h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Needs Improvement
                </p>
                <div className="flex flex-wrap gap-3">
                  {weakTopics.length > 0 ? weakTopics.map(t => (
                    <span key={t} className="px-5 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">{t}</span>
                  )) : <span className="text-white/20 text-sm italic font-light">No major weak areas detected!</span>}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Strong Areas
                </p>
                <div className="flex flex-wrap gap-3">
                  {strongTopics.length > 0 ? strongTopics.map(t => (
                    <span key={t} className="px-5 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">{t}</span>
                  )) : <span className="text-white/20 text-sm italic font-light">Keep practicing to build strong areas!</span>}
                </div>
              </div>
              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Global Percentile
                  </span>
                  <span className="text-2xl font-light text-indigo-400 tracking-tighter">
                    {userAvgAccuracy > globalAvgAccuracy ? "Top 25%" : "Top 50%"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-indigo-500 p-12 rounded-[3rem] text-white space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700" />
            <h3 className="text-3xl font-light tracking-tight relative z-10">AI Recommendation</h3>
            <p className="text-white/80 leading-relaxed text-lg font-light relative z-10">
              {weakTopics.length > 0 
                ? `Based on your recent performance, we recommend focusing on ${weakTopics[0]}. Your accuracy here is below the global average. Try a targeted subject test.`
                : "You're performing above the global average! To maintain your lead, focus on speed and time management in Full Mock Tests."}
            </p>
            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest relative z-10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 opacity-40" />
                Avg Time: {safeHistory.length ? Math.round(safeHistory.reduce((a, c) => a + c.duration, 0) / safeHistory.length) : 0}m
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 opacity-40" />
                Consistency: High
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
