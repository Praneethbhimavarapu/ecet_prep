import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { BookOpen, LogOut, User as UserIcon, Menu, X, Bookmark } from 'lucide-react';
import AuthModal from './AuthModal';

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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
                AP ECET 2026
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/bookmarks" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1">
                  <Bookmark className="h-4 w-4" /> Bookmarks
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { onLogout(); navigate('/'); }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4">
          {user ? (
            <>
              <Link to="/dashboard" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/bookmarks" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Bookmarks</Link>
              <button
                onClick={() => { onLogout(); navigate('/'); setIsMenuOpen(false); }}
                className="block text-red-500 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={onLogin}
      />
    </nav>
  );
}
