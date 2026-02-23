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
  CheckCircle,
  Star,
  ChevronRight
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
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-20 text-center max-w-5xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 font-bold text-[10px] uppercase tracking-[0.2em]"
        >
          <Rocket className="h-3 w-3" />
          <span>AP ECET 2026 PREMIER PLATFORM</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-9xl font-light text-white leading-[0.9] tracking-tighter"
        >
          MASTER THE <br />
          <span className="font-black text-indigo-500">ECET 2026</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed font-light tracking-tight"
        >
          The definitive preparation platform for Diploma students. AI-crafted mock tests, precision analytics, and a curated question bank for the C-23 curriculum.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
        >
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded-full font-black text-sm hover:scale-105 transition-all flex items-center justify-center gap-3 group tracking-widest uppercase"
          >
            Get Started
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto bg-transparent text-white px-12 py-5 rounded-full font-bold text-sm border border-white/20 hover:bg-white/5 transition-all tracking-widest uppercase">
            View Syllabus
          </button>
        </motion.div>

        {/* Floating Stats */}
        <div className="pt-24 grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-4xl font-light text-white tracking-tighter">1000+</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">AI Questions</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl font-light text-white tracking-tighter">C-23</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Curriculum</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl font-light text-white tracking-tighter">24/7</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">AI Support</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl font-light text-white tracking-tighter">100%</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Free Access</p>
          </div>
        </div>
      </section>

      {/* Most Important Questions Section */}
      {impQuestions.length > 0 && (
        <section className="space-y-12 max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                <Star className="h-3 w-3 fill-current" />
                Featured Content
              </div>
              <h2 className="text-5xl font-light text-white tracking-tight">Most Important Questions</h2>
              <p className="text-white/40 font-light">Highly probable questions curated for AP ECET 2026 success.</p>
            </div>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="text-white/60 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-white transition-all"
            >
              Explore Full Bank <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {impQuestions.slice(0, 6).map((q, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.05)' }}
                className="bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5 transition-all group"
              >
                <div className="flex justify-between items-start mb-8">
                  <span className="px-3 py-1 bg-white/5 text-white/50 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {q.subject}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">
                    High Probable
                  </span>
                </div>
                <p className="text-white/80 font-light text-lg leading-relaxed mb-8 line-clamp-4">
                  {q.text}
                </p>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] uppercase tracking-widest font-bold group-hover:bg-white group-hover:text-black transition-all"
                >
                  Reveal Explanation
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        <FeatureCard 
          icon={<Brain className="h-10 w-10 text-white" />}
          title="Dynamic Generation"
          description="AI-powered engine that creates unique, ECET-level questions in real-time. Experience a new test every single time."
        />
        <FeatureCard 
          icon={<BarChart3 className="h-10 w-10 text-white" />}
          title="Precision Analytics"
          description="Deep insights into your performance. Identify weak points with surgical precision and track your global standing."
        />
        <FeatureCard 
          icon={<ShieldCheck className="h-10 w-10 text-white" />}
          title="C-23 Syllabus"
          description="Strict adherence to the latest Diploma C-23 curriculum. Every question is relevant, every test is a step closer to success."
        />
      </section>

      {/* Syllabus Coverage */}
      <section className="bg-white/[0.02] rounded-[4rem] p-20 border border-white/5 max-w-7xl mx-auto mx-4">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-6xl font-light text-white tracking-tight">Curriculum Coverage</h2>
          <p className="text-white/30 font-light uppercase tracking-widest text-sm">Everything you need to master AP ECET 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-10">
            <h3 className="text-3xl font-light text-white flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-white/40" />
              MPC Foundation
            </h3>
            <ul className="space-y-6">
              {['Mathematics', 'Physics', 'Chemistry'].map(s => (
                <li key={s} className="flex items-center gap-4 text-white/60 font-light text-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-10">
            <h3 className="text-3xl font-light text-white flex items-center gap-4">
              <Zap className="h-8 w-8 text-white/40" />
              Core Engineering
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                'Programming in C', 'Data Structures', 'Digital Electronics',
                'Computer Organization', 'Operating Systems', 'DBMS', 'Computer Networks'
              ].map(s => (
                <div key={s} className="flex items-center gap-4 text-white/60 font-light text-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" /> {s}
                </div>
              ))}
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/[0.02] p-12 rounded-[3rem] border border-white/5 hover:border-white/20 transition-all group">
      <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit group-hover:bg-white group-hover:text-black transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-light text-white mb-4 tracking-tight">{title}</h3>
      <p className="text-white/30 leading-relaxed font-light">{description}</p>
    </div>
  );
}
