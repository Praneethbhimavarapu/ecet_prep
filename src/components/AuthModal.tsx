import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isLogin 
        ? await api.auth.login({ email, password })
        : await api.auth.register({ name, email, password });
      
      onLogin(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 w-full h-full z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-md relative overflow-hidden my-auto"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)]" />
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-10 sm:p-14 relative z-0">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-light text-white mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join Platform'}
            </h2>
            <p className="text-white/30 font-light text-sm">
              {isLogin ? 'Sign in to continue your preparation' : 'Create an account to start your journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-white placeholder:text-white/10 font-light"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-white placeholder:text-white/10 font-light"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-white placeholder:text-white/10 font-light"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
