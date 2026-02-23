import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestEnvironment from './components/TestEnvironment';
import AnalyticsView from './components/AnalyticsView';
import LandingPage from './components/LandingPage';
import BookmarksPage from './components/BookmarksPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar user={user} onLogout={handleLogout} onLogin={handleLogin} />
        <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage onLogin={handleLogin} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/test/:type/:subject?" element={user ? <TestEnvironment /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user ? <AnalyticsView /> : <Navigate to="/" />} />
            <Route path="/bookmarks" element={user ? <BookmarksPage /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
