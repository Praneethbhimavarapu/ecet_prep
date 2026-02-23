import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
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
      setError(err.message || 'Authentication sequence failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto pointer-events-auto">
          {/* Backdrop - use absolute instead of fixed to stay within parent stacking context */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Content - add relative and z-10 to ensure it's on top of backdrop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="glass-panel w-full max-w-[480px] rounded-[3rem] overflow-hidden relative z-10 shadow-[0_0_100px_-20px_rgba(99,102,241,0.2)]"
          >
            <button
              onClick={onClose}
              className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-20"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-10 md:p-14">
              <div className="text-center mb-12 space-y-4">
                <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl mb-4">
                  <ShieldCheck className="h-6 w-6 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                  {isLogin ? 'Access the Grid' : 'System Enroll'}
                </h2>
                <p className="text-white/30 font-light tracking-tight">
                  {isLogin ? 'Initialize your candidate profile' : 'Create a new core identity'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <AuthInput
                    icon={<UserIcon className="h-5 w-5" />}
                    type="text"
                    placeholder="Candidate Name"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    required
                  />
                )}

                <AuthInput
                  icon={<Mail className="h-5 w-5" />}
                  type="email"
                  placeholder="Network Email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                />

                <AuthInput
                  icon={<Lock className="h-5 w-5" />}
                  type="password"
                  placeholder="Security Key"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs font-black tracking-widest uppercase text-center py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-sm tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      SECURE LOGGING...
                    </div>
                  ) : (
                    <>
                      {isLogin ? 'Establish Link' : 'Finalize Registry'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-12 text-center">
                <button
                  disabled={loading}
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase hover:text-white transition-colors"
                >
                  {isLogin ? 'No identity? Register' : 'Existing profile? Sign in'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AuthInput({ icon, ...props }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors pointer-events-none z-10">
        {icon}
      </div>
      <input
        {...props}
        className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-white/[0.05] focus:border-indigo-500/50 outline-none transition-all font-light tracking-tight relative z-0"
      />
    </div>
  );
}
