import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { BookOpen, LogOut, Menu, X, Bookmark, Zap } from 'lucide-react';
import AuthModal from './AuthModal';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onLogin: (user: User, token: string) => void;
}

export default function Navbar({ user, onLogout, onLogin }: NavbarProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-6 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="glass-panel rounded-3xl px-6 md:px-8 py-4 flex justify-between items-center shadow-2xl">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-indigo-500 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Zap className="h-5 w-5 text-white fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                ECET <span className="text-white/30 font-light">2026</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {user ? (
              <>
                <NavLink to="/dashboard" label="DASHBOARD" />
                <NavLink to="/bookmarks" label="BOOKMARKS" icon={<Bookmark className="h-4 w-4" />} />

                <div className="flex items-center gap-5 pl-8 border-l border-white/10 ml-2">
                  <div className="text-right">
                    <p className="text-xs font-black text-white tracking-tight uppercase">{user.name}</p>
                    <p className="text-[9px] text-white/30 font-medium tracking-widest uppercase">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { onLogout(); navigate('/'); }}
                    className="p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white text-black px-8 py-3 rounded-full font-black text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all uppercase"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-white/50 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 mx-4 glass-panel rounded-[2rem] p-8 pointer-events-auto shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-8">
              {user ? (
                <>
                  <MobileNavLink to="/dashboard" label="Dashboard" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/bookmarks" label="Bookmarks" onClick={() => setIsMenuOpen(false)} />
                  <div className="pt-6 border-t border-white/5">
                    <button
                      onClick={() => { onLogout(); navigate('/'); setIsMenuOpen(false); }}
                      className="text-red-500 font-black text-xs tracking-widest uppercase"
                    >
                      TERMINATE SESSION
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-widest uppercase"
                >
                  Join the Grid
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={onLogin}
      />
    </nav>
  );
}

function NavLink({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link to={to} className="text-[10px] font-black tracking-[0.2em] text-white/50 hover:text-white transition-all flex items-center gap-2 group">
      {icon && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors"
    >
      {label}
    </Link>
  );
}
