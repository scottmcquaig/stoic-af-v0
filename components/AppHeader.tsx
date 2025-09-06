import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Book, User, Settings, LogOut, Flame, DollarSign, Heart, Target, Brain } from 'lucide-react';

type NavigationView = 'dashboard' | 'daily-entry' | 'progress' | 'challenges' | 'profile';

interface AppHeaderProps {
  onNavigate?: (view: NavigationView) => void;
}

export default function AppHeader({ onNavigate }: AppHeaderProps) {
  const { user, profile, signOut } = useAuth();

  const currentTrack = profile?.current_track;
  const streak = profile?.streak || 0;

  const trackIcons = {
    Money: DollarSign,
    Relationships: Heart,
    Discipline: Target,
    Ego: Brain
  };

  const trackColors = {
    Money: 'var(--track-money)',
    Relationships: 'var(--track-relationships)',
    Discipline: 'var(--track-discipline)',
    Ego: 'var(--track-ego)'
  };

  const TrackIcon = currentTrack ? trackIcons[currentTrack as keyof typeof trackIcons] : null;
  const trackColor = currentTrack ? trackColors[currentTrack as keyof typeof trackColors] : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-3xl">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground py-[0px] px-[10px]">
                <User className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="flex flex-col gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigate?.('profile')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-sm text-muted-foreground hover:text-foreground"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground">STOIC AF</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Streak Display */}
          {streak > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-foreground">{streak}</span>
            </div>
          )}
          
          {/* Current Track Icon */}
          {currentTrack && TrackIcon && (
            <div className="flex items-center pt-[0px] pr-[10px] pb-[0px] pl-[0px]">
              <TrackIcon 
                className="h-4 w-4" 
                style={{ color: trackColor }} 
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}