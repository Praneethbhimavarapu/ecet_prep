import { useState, useEffect } from 'react';
import { User, Question } from '../types';
import { api } from '../services/api';
import {
  Rocket,
  Brain,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Zap,
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import AuthModal from './AuthModal';

export default function LandingPage({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [impQuestions, setImpQuestions] = useState<Question[]>([]);

  useEffect(() => {
    api.questions.getImportant().then(setImpQuestions).catch(console.error);
  }, []);

  return (
    <div className="space-y-40 pb-40">
      {/* Hero Section */}
      <section className="relative pt-24 text-center max-w-7xl mx-auto px-4 overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-label mb-12"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>AP ECET 2026 PREMIER PLATFORM</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-8"
        >
          <h1 className="heading-giant">
            MASTER<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400 animate-pulse">THE ECET</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/40 max-w-3xl mx-auto leading-relaxed font-light tracking-tight px-4">
            The definitive AI-powered preparation ecosystem for Diploma students.
            Built for the <span className="text-indigo-400/60 font-medium">C-23 core curriculum</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
        >
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group tracking-widest uppercase shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Get Started
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto glass-panel text-white px-12 py-5 rounded-full font-bold text-sm hover:bg-white/5 transition-all tracking-widest uppercase">
            View Syllabus
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-32 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto"
        >
          <StatBox value="1000+" label="AI Questions" />
          <StatBox value="C-23" label="Syllabus" />
          <StatBox value="24/7" label="AI Support" />
          <StatBox value="100%" label="Free Forever" />
        </motion.div>
      </section>

      {/* Featured Questions Section */}
      {impQuestions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
            <div className="space-y-4">
              <span className="text-label">Curated Selection</span>
              <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white">Critical Questions</h2>
              <p className="text-white/30 text-lg font-light max-w-xl">
                Highly probable concepts analyzed by our AI for your immediate success.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase"
            >
              Explore Full Bank <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {impQuestions.slice(0, 6).map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-10 group cursor-default"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-500/10">
                    {q.subject}
                  </span>
                  <Star className="h-4 w-4 text-amber-500/50" />
                </div>
                <h4 className="text-white/90 text-xl font-light leading-relaxed mb-10 line-clamp-3">
                  {q.text}
                </h4>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full py-4 bg-white/5 text-white/40 rounded-xl text-[10px] uppercase tracking-widest font-black premium-border group-hover:bg-white group-hover:text-black transition-all"
                >
                  Reveal Analysis
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureBlock
          icon={<Brain className="h-8 w-8" />}
          title="Dynamic Engine"
          desc="Real-time ECET question generation tailored for the latest 2026 pattern."
        />
        <FeatureBlock
          icon={<BarChart3 className="h-8 w-8" />}
          title="Surgical Analytics"
          desc="Deep pattern recognition for your performance to reveal hidden weaknesses."
        />
        <FeatureBlock
          icon={<ShieldCheck className="h-8 w-8" />}
          title="C-23 Compliance"
          desc="100% adherence to the new diploma curriculum and engineering core."
        />
      </section>

      {/* Syllabus Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="glass-panel rounded-[4rem] p-12 md:p-24 border-white/5 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full" />

          <div className="text-center mb-20 space-y-6">
            <span className="text-label">Academic Scope</span>
            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter">Unified Curriculum</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="flex items-center gap-5 text-3xl font-light text-white">
                <div className="p-3 bg-white/5 rounded-2xl"><BookOpen className="h-8 w-8 text-indigo-400" /></div>
                MPC Foundation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Mathematics', 'Physics', 'Chemistry'].map(s => (
                  <SyllabusItem key={s} label={s} />
                ))}
              </div>
            </div>

            <div className="space-y-12">
              <div className="flex items-center gap-5 text-3xl font-light text-white">
                <div className="p-3 bg-white/5 rounded-2xl"><Zap className="h-8 w-8 text-amber-500" /></div>
                Core Engineering
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Programming in C', 'Data Structures', 'Digital Electronics',
                  'Computer Organization', 'Operating Systems', 'DBMS', 'Computer Networks'
                ].map(s => (
                  <SyllabusItem key={s} label={s} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={onLogin}
      />
    </div>
  );
}

function StatBox({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-label opacity-40">{label}</div>
    </div>
  );
}

function FeatureBlock({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-12 space-y-8 group hover:glow-indigo transition-all duration-500">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-white/30 font-light leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function SyllabusItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 group p-1">
      <div className="h-1.5 w-6 bg-white/10 rounded-full group-hover:w-8 group-hover:bg-indigo-500 transition-all" />
      <span className="text-white/60 font-light text-lg tracking-tight group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}
