import React, { useState } from 'react';
import HeroSection from './landing/HeroSection';
import ProblemsSection from './landing/ProblemsSection';
import SolutionSection from './landing/SolutionSection';
import TracksSection from './landing/TracksSection';
import SocialProofSection from './landing/SocialProofSection';
import FooterCTA from './landing/FooterCTA';
import AuthModal from './AuthModal';
import { Badge } from './ui/badge';

interface LandingPageProps {
  onLogin?: () => void;
  onSignUp?: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps = {}) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [prefillEmail, setPrefillEmail] = useState('');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignUp = (email?: string) => {
    setAuthMode('signup');
    setPrefillEmail(email || '');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection onLogin={handleLogin} onSignUp={() => handleSignUp()} />
      <ProblemsSection />
      <SolutionSection />
      <TracksSection onSignUp={() => handleSignUp()} />
      <SocialProofSection />
      <FooterCTA onSignUp={() => handleSignUp()} />
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        prefillEmail={prefillEmail}
      />
    </div>
  );
}