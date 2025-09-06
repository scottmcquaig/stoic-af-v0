import React from 'react';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Trophy
} from 'lucide-react';

type NavigationView = 'dashboard' | 'daily-entry' | 'progress' | 'challenges';

interface BottomNavigationProps {
  currentView?: NavigationView;
  onViewChange: (view: NavigationView) => void;
  hasActiveTrack?: boolean;
}

export default function BottomNavigation({ currentView = 'dashboard', onViewChange, hasActiveTrack = false }: BottomNavigationProps) {
  const navItems = [
    {
      id: 'dashboard' as NavigationView,
      label: 'Dashboard',
      icon: Home,
      enabled: true
    },
    {
      id: 'daily-entry' as NavigationView,
      label: 'Daily Entry',
      icon: BookOpen,
      enabled: hasActiveTrack
    },
    {
      id: 'progress' as NavigationView,
      label: 'Progress',
      icon: TrendingUp,
      enabled: hasActiveTrack
    },
    {
      id: 'challenges' as NavigationView,
      label: 'Challenges',
      icon: Trophy,
      enabled: true
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isEnabled = item.enabled;

            let buttonClasses = 'flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200';
            
            if (isActive) {
              buttonClasses += ' text-accent bg-accent/10';
            } else if (isEnabled) {
              buttonClasses += ' text-muted-foreground hover:text-foreground hover:bg-muted/50';
            } else {
              buttonClasses += ' text-muted-foreground/50 cursor-not-allowed';
            }

            return (
              <button
                key={item.id}
                onClick={() => isEnabled && onViewChange(item.id)}
                disabled={!isEnabled}
                className={buttonClasses}
              >
                <Icon className={isActive ? 'h-5 w-5 text-accent' : 'h-5 w-5'} />
                <span className="text-xs font-medium hidden sm:block">{item.label}</span>
                {!isEnabled && item.id !== 'dashboard' && item.id !== 'challenges' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-muted-foreground/30 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}