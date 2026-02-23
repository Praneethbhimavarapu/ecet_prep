import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { BookOpen, LogOut, User as UserIcon, Menu, X, Bookmark } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onLogin: (user: User, token: string) => void;
  onOpenAuth: () => void;
}

export default function Navbar({ user, onLogout, onLogin, onOpenAuth }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-black/50 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
                AP ECET <span className="text-white/50 font-light">2026</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white/70 hover:text-white text-sm font-medium transition-colors tracking-wide">DASHBOARD</Link>
                <Link to="/bookmarks" className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 tracking-wide">
                  <Bookmark className="h-4 w-4" /> BOOKMARKS
                </Link>
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-white tracking-tight">{user.name}</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { onLogout(); navigate('/'); }}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-white text-black px-8 py-2.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all"
              >
                SIGN IN
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white/40 hover:text-white transition-colors">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-b border-white/10 px-4 py-8 space-y-6">
          {user ? (
            <>
              <Link to="/dashboard" className="block text-white font-light tracking-tight text-xl" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/bookmarks" className="block text-white font-light tracking-tight text-xl" onClick={() => setIsMenuOpen(false)}>Bookmarks</Link>
              <button
                onClick={() => { onLogout(); navigate('/'); setIsMenuOpen(false); }}
                className="block text-red-500 font-bold text-[10px] uppercase tracking-widest"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setIsMenuOpen(false); }}
              className="w-full bg-white text-black py-4 rounded-full font-black text-[10px] uppercase tracking-widest"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
