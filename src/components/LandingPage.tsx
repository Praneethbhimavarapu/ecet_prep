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
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 text-center max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm"
        >
          <Rocket className="h-4 w-4" />
          <span>AP ECET 2026 Preparation Platform</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight"
        >
          Master the <span className="text-indigo-600">ECET 2026</span> with AI-Powered Mock Tests
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
        >
          Designed specifically for Diploma students following the C-23 curriculum. Get unique questions, detailed explanations, and deep performance analytics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 group"
          >
            Get Started for Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto bg-white text-slate-700 px-10 py-5 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all">
            View Syllabus
          </button>
        </motion.div>
      </section>

      {/* Most Important Questions Section */}
      {impQuestions.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <Star className="h-6 w-6 text-amber-600 fill-current" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Most Important Questions</h2>
                <p className="text-slate-500">Highly probable questions for AP ECET 2026</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {impQuestions.slice(0, 6).map((q, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">
                    {q.subject}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">
                    High Probable
                  </span>
                </div>
                <p className="text-slate-800 font-medium line-clamp-3">
                  {q.text}
                </p>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  View Answer & Explanation
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Stats */}
      <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">1000+</p>
            <p className="text-sm text-slate-500">AI Questions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">C-23</p>
            <p className="text-sm text-slate-500">Curriculum</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">24/7</p>
            <p className="text-sm text-slate-500">AI Tutor</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">100%</p>
            <p className="text-sm text-slate-500">Free Access</p>
          </div>
        </div>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Brain className="h-8 w-8 text-indigo-600" />}
          title="Dynamic Question Generation"
          description="Never see the same question twice. Our AI generates fresh, ECET-level questions every time you start a test."
        />
        <FeatureCard 
          icon={<BarChart3 className="h-8 w-8 text-emerald-600" />}
          title="Deep Performance Analytics"
          description="Track your progress with detailed charts. Identify weak topics and get personalized improvement suggestions."
        />
        <FeatureCard 
          icon={<ShieldCheck className="h-8 w-8 text-amber-600" />}
          title="C-23 Syllabus Focused"
          description="Strictly follows the latest Diploma C-23 curriculum for CSE branch, covering both MPC and Core subjects."
        />
      </section>

      {/* Syllabus Coverage */}
      <section className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Comprehensive Syllabus Coverage</h2>
          <p className="text-slate-500">Everything you need to crack AP ECET 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              MPC Subjects
            </h3>
            <ul className="space-y-4">
              {['Mathematics', 'Physics', 'Chemistry'].map(s => (
                <li key={s} className="flex items-center gap-3 text-slate-600 font-medium">
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Zap className="h-6 w-6 text-indigo-600" />
              Core CSE Subjects
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Programming in C', 'Data Structures', 'Digital Electronics',
                'Computer Organization', 'Operating Systems', 'DBMS', 'Computer Networks'
              ].map(s => (
                <div key={s} className="flex items-center gap-3 text-slate-600 font-medium">
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> {s}
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
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
