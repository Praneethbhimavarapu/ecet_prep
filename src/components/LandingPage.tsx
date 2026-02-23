import { User } from '../types';
import { Brain, Zap, Trophy, Target, BookOpen, Users } from 'lucide-react';
import { useState } from 'react';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onLogin: (user: User, token: string) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-title">
          <span className="text-primary">Master the </span>
          <span className="gradient-text">ECET 2026</span>
          <br />
          <span className="text-primary">with AI-Powered Practice</span>
        </div>
        
        <p className="landing-subtitle">
          Designed specifically for Diploma students following the C-23 curriculum. 
          Get unique questions, detailed explanations, and deep performance analytics.
        </p>
        
        <div className="landing-cta">
          <button 
            onClick={handleGetStarted}
            className="btn-premium"
            data-testid="get-started-btn"
          >
            Get Started for Free →
          </button>
          <button 
            onClick={handleSignIn}
            className="btn-secondary"
            data-testid="sign-in-btn"
          >
            Sign In
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">1000+</div>
            <div className="stat-label">AI Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">C-23</div>
            <div className="stat-label">Curriculum</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">AI Tutor</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Free Access</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="text-center mb-4">
          <span className="gradient-text">Premium Features</span>
        </h2>
        <p className="text-center text-secondary mb-12 max-w-2xl mx-auto">
          Everything you need to crack AP ECET 2026
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Brain className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">Dynamic Question Generation</h3>
            <p className="feature-description">
              Never see the same question twice. Our AI generates fresh, ECET-level questions every time you start a test.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">Beginner-Friendly Explanations</h3>
            <p className="feature-description">
              Every answer comes with detailed, step-by-step explanations designed for complete beginners.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">C-23 Syllabus Focused</h3>
            <p className="feature-description">
              Strictly follows the latest Diploma C-23 curriculum for CSE branch, covering both MPC and Core subjects.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">200-Question Full Mock Tests</h3>
            <p className="feature-description">
              Complete mock tests with 100 MPC + 100 Core questions. Windowed approach: Complete 50 questions to unlock next 50.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">Deep Performance Analytics</h3>
            <p className="feature-description">
              Track your progress with detailed charts. Identify weak topics and get personalized improvement suggestions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="feature-title">Compete with Friends</h3>
            <p className="feature-description">
              Join the leaderboard, compare scores with friends, and stay motivated throughout your preparation journey.
            </p>
          </div>
        </div>
      </section>

      {/* Syllabus Coverage Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-center mb-4">
          <span className="gradient-text">Comprehensive Syllabus Coverage</span>
        </h2>
        <p className="text-center text-secondary mb-12">
          Everything you need to crack AP ECET 2026
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="premium-card">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="gradient-text">📐</span> MPC Subjects
            </h3>
            <ul className="space-y-3">
              {['Mathematics', 'Physics', 'Chemistry'].map((subject) => (
                <li key={subject} className="flex items-center gap-3 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
                  {subject}
                </li>
              ))}
            </ul>
          </div>

          <div className="premium-card">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="gradient-text">💻</span> Core CSE Subjects
            </h3>
            <ul className="space-y-3">
              {[
                'Programming in C',
                'Data Structures',
                'Digital Electronics',
                'Computer Organization',
                'Operating Systems',
                'Database Management Systems',
                'Computer Networks'
              ].map((subject) => (
                <li key={subject} className="flex items-center gap-3 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
                  {subject}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto premium-card">
          <h2 className="text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Ace ECET 2026</span>?
          </h2>
          <p className="text-secondary text-lg mb-8">
            Join thousands of students preparing smarter with AI-powered practice tests.
          </p>
          <button 
            onClick={handleGetStarted}
            className="btn-premium text-lg px-12 py-4"
          >
            Start Practicing Now - It's Free! →
          </button>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={onLogin}
        />
      )}
    </div>
  );
}
