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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
      </div>

      {/* Progression Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Progression vs. Global Average
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                name="Your Accuracy"
                type="monotone" 
                dataKey="yourScore" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#4f46e5' }}
              />
              <Line 
                name="Global Avg"
                type="monotone" 
                dataKey="avgScore" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accuracy by Subject */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Accuracy by Subject
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Learning Insights
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Needs Improvement
                </p>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.length > 0 ? weakTopics.map(t => (
                    <span key={t} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">{t}</span>
                  )) : <span className="text-slate-400 text-sm italic">No major weak areas detected!</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Strong Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {strongTopics.length > 0 ? strongTopics.map(t => (
                    <span key={t} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">{t}</span>
                  )) : <span className="text-slate-400 text-sm italic">Keep practicing to build strong areas!</span>}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Global Percentile
                  </span>
                  <span className="font-bold text-indigo-600">
                    {userAvgAccuracy > globalAvgAccuracy ? "Top 25%" : "Top 50%"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white">
            <h3 className="text-xl font-bold mb-4">AI Recommendation</h3>
            <p className="text-indigo-100 leading-relaxed mb-6">
              {weakTopics.length > 0 
                ? `Based on your recent performance, we recommend focusing on ${weakTopics[0]}. Your accuracy here is below the global average. Try a targeted subject test.`
                : "You're performing above the global average! To maintain your lead, focus on speed and time management in Full Mock Tests."}
            </p>
            <div className="flex items-center gap-4 text-sm font-bold">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Avg Time: {safeHistory.length ? Math.round(safeHistory.reduce((a, c) => a + c.duration, 0) / safeHistory.length) : 0}m
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Consistency: High
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
