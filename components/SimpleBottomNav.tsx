import React from 'react';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Trophy, 
  User 
} from 'lucide-react';

interface SimpleBottomNavProps {
  hasActiveTrack: boolean;
}

export default function SimpleBottomNav({ hasActiveTrack }: SimpleBottomNavProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      enabled: true
    },
    {
      id: 'daily-entry',
      label: 'Daily Entry',
      icon: BookOpen,
      enabled: hasActiveTrack
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: TrendingUp,
      enabled: hasActiveTrack
    },
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Trophy,
      enabled: true
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      enabled: true
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = item.enabled;

            return (
              <div
                key={item.id}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg ${
                  isEnabled 
                    ? 'text-muted-foreground' 
                    : 'text-muted-foreground/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {!isEnabled && item.id !== 'dashboard' && item.id !== 'challenges' && item.id !== 'profile' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-muted-foreground/30 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}