import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { User } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestEnvironment from './components/TestEnvironment';
import AnalyticsView from './components/AnalyticsView';
import LandingPage from './components/LandingPage';
import BookmarksPage from './components/BookmarksPage';
import QuestionBankGenerator from './components/QuestionBankGenerator';
import AuthModal from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-2 border-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-b-2 border-white/20 animate-spin-slow" />
        </div>
      </div>
      <div className="space-y-2 text-center relative z-10">
        <h2 className="text-white font-light tracking-[0.3em] uppercase text-xs animate-pulse">Initializing Platform</h2>
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">AP ECET 2026 CSE</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onLogin={handleLogin} 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
        />
        <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage onLogin={handleLogin} onOpenAuth={() => setIsAuthModalOpen(true)} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/test/:type/:subject?" element={user ? <TestEnvironment /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user ? <AnalyticsView /> : <Navigate to="/" />} />
            <Route path="/bookmarks" element={user ? <BookmarksPage /> : <Navigate to="/" />} />
            <Route path="/admin/generator" element={user ? <QuestionBankGenerator /> : <Navigate to="/" />} />
          </Routes>
        </main>

        <AnimatePresence>
          {isAuthModalOpen && (
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
              onLogin={handleLogin} 
            />
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
