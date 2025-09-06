import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import JournalDashboard from './JournalDashboard';
import ProgressView from './ProgressView';
import ChallengesView from './ChallengesView';
import ProfileView from './ProfileView';
import BottomNavigation from './BottomNavigation';

type NavigationView = 'dashboard' | 'daily-entry' | 'progress' | 'challenges' | 'profile';

export default function MainDashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  
  // Check if user has an active track (enables Daily Entry and Progress views)
  const hasActiveTrack = Boolean(profile?.current_track);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        // If user has active track, show journal dashboard, otherwise show track selection
        return hasActiveTrack ? <JournalDashboard /> : <Dashboard />;
      case 'daily-entry':
        // Only available if user has active track
        return hasActiveTrack ? <JournalDashboard /> : <Dashboard />;
      case 'progress':
        return <ProgressView />;
      case 'challenges':
        return <ChallengesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="pb-16">
        {renderCurrentView()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        hasActiveTrack={hasActiveTrack}
      />
    </div>
  );
}