import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Flame, 
  Target, 
  Trophy, 
  Calendar, 
  CheckCircle,
  DollarSign,
  Heart,
  Brain
} from 'lucide-react';

interface JournalEntry {
  day: number;
  entry_text: string;
  created_at: string;
}

const trackIcons = {
  Money: DollarSign,
  Relationships: Heart,
  Discipline: Target,
  Ego: Brain
};

export default function ProgressView() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTrack = profile?.current_track;
  const currentDay = profile?.current_day || 1;
  const streak = profile?.streak || 0;
  const totalDays = profile?.total_days_completed || 0;
  const completedTracks = profile?.tracks_completed || [];

  // Load journal entries for current track
  useEffect(() => {
    const loadEntries = async () => {
      if (!user || !currentTrack) {
        setLoading(false);
        return;
      }
      
      try {
        const { projectId } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
        
        if (!session.data.session?.access_token) {
          console.log('No valid session found, skipping entries load');
          setLoading(false);
          return;
        }

        const accessToken = session.data.session.access_token;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/entries/${currentTrack}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setEntries(result.entries || []);
        }
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user, currentTrack]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const TrackIcon = currentTrack ? trackIcons[currentTrack as keyof typeof trackIcons] : Target;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl text-foreground mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your journey and celebrate your wins
        </p>
      </div>

      {/* Current Streak */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDays}</p>
              <p className="text-sm text-muted-foreground">Total Days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTracks.length}</p>
              <p className="text-sm text-muted-foreground">Tracks Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Track Progress */}
      {currentTrack && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrackIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {currentTrack} Track Progress
                  <Badge variant="outline">Day {currentDay}/30</Badge>
                </div>
                <CardDescription>Your current 30-day journey</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{Math.round((currentDay / 30) * 100)}%</span>
              </div>
              <Progress value={(currentDay / 30) * 100} className="h-3" />
            </div>
            
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {30 - currentDay} days remaining
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {entries.length} entries written
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 30-Day Calendar */}
      {currentTrack && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              30-Day Calendar
            </CardTitle>
            <CardDescription>Your daily progress visualization</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 30 }, (_, i) => {
                const dayNumber = i + 1;
                const hasEntry = entries.some(entry => entry.day === dayNumber);
                const isCurrentDay = dayNumber === currentDay;
                
                let dayClasses = 'aspect-square rounded-xl flex items-center justify-center text-sm font-medium border-2 transition-all min-h-[3rem]';
                
                if (isCurrentDay) {
                  // Current day - blue border with accent color
                  dayClasses += ' bg-accent text-accent-foreground border-accent shadow-sm';
                } else if (hasEntry) {
                  // Completed day with entry - green
                  dayClasses += ' bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800';
                } else {
                  // Available day - light gray
                  dayClasses += ' bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-950 dark:text-gray-600 dark:border-gray-900';
                }
                
                return (
                  <div
                    key={dayNumber}
                    className={dayClasses}
                    title={
                      isCurrentDay 
                        ? `Today - Day ${dayNumber}`
                        : hasEntry 
                        ? `Day ${dayNumber} - Entry completed`
                        : `Day ${dayNumber} - Available`
                    }
                  >
                    {dayNumber}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded-md border-2 border-green-300 dark:bg-green-950 dark:border-green-800"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent rounded-md border-2 border-accent"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 rounded-md border-2 border-gray-100 dark:bg-gray-950 dark:border-gray-900"></div>
                <span>Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Completed Tracks */}
      {completedTracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Conquered Tracks
            </CardTitle>
            <CardDescription>
              Your completed 30-day journeys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTracks.map((completed, idx) => {
                // Handle both string and object formats for backward compatibility
                const trackName = typeof completed === 'string' ? completed : completed.track;
                const completedAt = typeof completed === 'object' && completed.completed_at 
                  ? completed.completed_at 
                  : 'Recently completed';
                
                const TrackIcon = trackIcons[trackName as keyof typeof trackIcons] || Target;
                
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <TrackIcon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{trackName}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeof completedAt === 'string' && completedAt !== 'Recently completed'
                          ? new Date(completedAt).toLocaleDateString()
                          : completedAt
                        }
                      </p>
                    </div>
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!currentTrack && completedTracks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Active Journey</h3>
            <p className="text-sm text-muted-foreground">
              Start a track to begin tracking your progress
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}