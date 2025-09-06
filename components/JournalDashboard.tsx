import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { DollarSign, Heart, Target, Brain, LogOut, Trophy, Flame, Calendar, CheckCircle, ArrowRight, Book, Quote, Eye, History, Sunrise, Moon, Award, AlertTriangle, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import AppHeader from './AppHeader';
import JournalViewer from './JournalViewer';
import BottomNavigation from './BottomNavigation';

type NavigationView = 'dashboard' | 'daily-entry' | 'progress' | 'challenges' | 'profile';

interface JournalDashboardProps {
  onViewChange?: (view: NavigationView) => void;
}

interface TrackDay {
  day: number;
  daily_theme: string;
  stoic_quote: string;
  quote_author: string;
  bro_translation: string;
  todays_challenge: string;
  challenge_type: string;
  todays_intention: string;
  evening_reflection_prompts: string[];
}

interface TrackData {
  track_id: string;
  days: TrackDay[];
}

interface JournalEntry {
  day: number;
  entry_text: string;
  created_at: string;
  updated_at?: string;
}

export default function JournalDashboard({ onViewChange }: JournalDashboardProps = {}) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [morningIntention, setMorningIntention] = useState('');
  const [eveningReflections, setEveningReflections] = useState<string[]>([]);
  const [eveningReflection, setEveningReflection] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [startingTrack, setStartingTrack] = useState(false);
  const [viewingJournal, setViewingJournal] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [viewingDay, setViewingDay] = useState<number | null>(null);

  const currentTrack = profile?.current_track;
  const currentDay = profile?.current_day || 1;
  const displayDay = viewingDay || currentDay;
  
  // Get display day's content from seeded data
  const todayData = trackData?.days?.find(day => day.day === displayDay);
  const todayTheme = todayData?.daily_theme || '';
  const todayQuote = todayData?.stoic_quote || '';
  const todayAuthor = todayData?.quote_author || '';
  const todayBroTranslation = todayData?.bro_translation || '';
  const todayPrompts = todayData?.evening_reflection_prompts || [];
  const todayChallenge = todayData?.todays_challenge || '';
  const todayIntention = todayData?.todays_intention || '';

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

  const TrackIcon = currentTrack ? trackIcons[currentTrack as keyof typeof trackIcons] : Target;
  const trackColor = currentTrack ? trackColors[currentTrack as keyof typeof trackColors] : 'var(--accent)';

  const updateEveningReflection = (index: number, value: string) => {
    setEveningReflections(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Initialize evening reflections if needed
  useEffect(() => {
    if (todayPrompts.length > 0 && eveningReflections.length !== todayPrompts.length) {
      setEveningReflections(new Array(todayPrompts.length).fill(''));
    }
  }, [todayPrompts.length, eveningReflections.length]);

  // Load purchases, track data, and journal entries
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const { projectId } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());

        // Check if we have a valid session
        if (!session.data.session?.access_token) {
          console.log('No valid session found, skipping data load');
          setLoading(false);
          return;
        }

        const accessToken = session.data.session.access_token;

        // Load purchases
        const purchasesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (purchasesResponse.ok) {
          const purchasesResult = await purchasesResponse.json();
          setPurchases(purchasesResult.purchases || []);
        }

        // Load track data if user has a current track
        if (currentTrack) {
          console.log('Loading track data for:', currentTrack);
          const trackDataResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/prompts/${currentTrack.toUpperCase()}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          console.log('Track data response status:', trackDataResponse.status);
          
          if (trackDataResponse.ok) {
            const trackDataResult = await trackDataResponse.json();
            console.log('Track data loaded successfully:', trackDataResult.track_id, 'Days:', trackDataResult.days?.length);
            setTrackData(trackDataResult);
          } else {
            const errorResult = await trackDataResponse.json();
            console.error('Failed to load track data:', errorResult);
            
            // Show a helpful message to the user
            if (trackDataResponse.status === 404) {
              console.log('Track prompts not seeded - showing admin message');
            }
          }

          // Load journal entries
          const entriesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/entries/${currentTrack}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (entriesResponse.ok) {
            const entriesResult = await entriesResponse.json();
            setEntries(entriesResult.entries || []);
            
            // Load current day's entry if it exists
            const loadEntryForDay = (dayNum: number) => {
              const dayEntry = entriesResult.entries?.find((e: JournalEntry) => e.day === dayNum);
              if (dayEntry) {
                // Parse the entry to extract morning intention and evening reflections
                try {
                  const entryData = JSON.parse(dayEntry.entry_text);
                  setMorningIntention(entryData.morningIntention || '');
                  if (entryData.eveningReflections && Array.isArray(entryData.eveningReflections)) {
                    setEveningReflections(entryData.eveningReflections);
                  } else if (entryData.eveningReflection) {
                    // Backward compatibility - convert single reflection to array
                    setEveningReflections([entryData.eveningReflection]);
                  } else {
                    setEveningReflections([]);
                  }
                } catch {
                  // Fallback for old format entries
                  setEveningReflections([dayEntry.entry_text]);
                }
              } else {
                // Initialize empty reflections based on number of prompts
                setMorningIntention('');
                setEveningReflections([]);
              }
            };

            loadEntryForDay(displayDay);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentTrack, displayDay]);

  const saveEntry = async () => {
    const hasContent = morningIntention.trim() || eveningReflections.some(ref => ref.trim());
    if (!user || !currentTrack || !hasContent) return;
    
    setSaving(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        toast.error('Please sign in to save entries');
        return;
      }

      const accessToken = session.data.session.access_token;

      const entryData = {
        morningIntention: morningIntention.trim(),
        eveningReflections: eveningReflections.map(ref => ref.trim())
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trackName: currentTrack,
          day: displayDay,
          entryText: JSON.stringify(entryData)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save entry');
      }

      const result = await response.json();
      toast.success('Entry saved successfully! 📝');
      
      // Update entries list
      setEntries(prev => {
        const existing = prev.find(e => e.day === displayDay);
        const entryText = JSON.stringify(entryData);
        if (existing) {
          return prev.map(e => e.day === displayDay ? { ...e, entry_text: entryText, updated_at: new Date().toISOString() } : e);
        } else {
          return [...prev, { day: displayDay, entry_text: entryText, created_at: new Date().toISOString() }];
        }
      });
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completeDay = async () => {
    const hasContent = morningIntention.trim() || eveningReflections.some(ref => ref.trim());
    if (!user || !currentTrack || !hasContent) {
      toast.error('Please complete at least your morning intention or evening reflection first!');
      return;
    }

    try {
      // Save the entry first
      await saveEntry();
      
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        toast.error('Please sign in to complete day');
        return;
      }

      const accessToken = session.data.session.access_token;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/complete-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trackName: currentTrack,
          day: displayDay
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete day');
      }

      const result = await response.json();
      
      await refreshProfile();
      
      if (result.trackCompleted) {
        toast.success(`🏆 Congratulations! You've completed the ${currentTrack} track! You're a Stoic AF legend!`);
      } else {
        toast.success(`Day ${displayDay} completed! 🔥 Keep building that streak!`);
        // Auto navigate to next day if not viewing past day and not completed track
        if (!isViewingPastDay && displayDay < 30) {
          setViewingDay(null); // Return to current day (which will now be next day)
        }
      }
      
      setMorningIntention(''); // Clear entries for next day
      setEveningReflections([]);
    } catch (error) {
      console.error('Error completing day:', error);
      toast.error('Failed to complete day. Please try again.');
    }
  };

  const startTrack = async (trackName: string) => {
    setStartingTrack(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        toast.error('Please sign in to start tracks');
        return;
      }

      const accessToken = session.data.session.access_token;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/start-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start track');
      }

      await refreshProfile();
      toast.success(`Started ${trackName} track! 🚀 Let's begin your 30-day journey!`);
    } catch (error) {
      console.error('Error starting track:', error);
      toast.error('Failed to start track. Please try again.');
    } finally {
      setStartingTrack(false);
    }
  };

  const navigateToDay = (dayNumber: number) => {
    if (dayNumber < 1 || dayNumber > currentDay) return;
    setViewingDay(dayNumber === currentDay ? null : dayNumber);
  };

  const canNavigateBack = displayDay > 1;
  const canNavigateForward = displayDay < currentDay;
  const isViewingPastDay = viewingDay !== null && viewingDay < currentDay;
  
  // Check if current day is completed
  const isDayCompleted = profile?.completed_days?.includes(displayDay) || false;

  if (viewingJournal) {
    return (
      <JournalViewer 
        trackName={viewingJournal} 
        onBack={() => setViewingJournal(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <AppHeader onNavigate={onViewChange} />

      <div className="container mx-auto px-4 py-8 pb-20 max-w-3xl">
        {/* Track Selection - Show if no current track */}
        {!currentTrack && purchases.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Choose Your Track
                </CardTitle>
                <CardDescription>
                  Select a track to begin your 30-day journey. You own {purchases.length} track{purchases.length > 1 ? 's' : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {purchases.map((trackName) => {
                    const TrackIcon = trackIcons[trackName as keyof typeof trackIcons];
                    const trackColor = trackColors[trackName as keyof typeof trackColors];
                    const isCompleted = profile?.tracks_completed?.includes(trackName);
                    
                    return (
                      <Card 
                        key={trackName} 
                        className={`cursor-pointer transition-all hover:shadow-md ${isCompleted ? 'opacity-60' : ''}`}
                        onClick={() => !isCompleted && !startingTrack && startTrack(trackName)}
                      >
                        <CardContent className="p-4 text-center">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                            style={{ backgroundColor: `hsl(from ${trackColor} h s l / 0.2)` }}
                          >
                            <TrackIcon className="h-6 w-6" style={{ color: trackColor }} />
                          </div>
                          <h3 className="font-medium">{trackName}</h3>
                          {isCompleted ? (
                            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              Completed
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              className="mt-2 w-full"
                              style={{ backgroundColor: trackColor }}
                              disabled={startingTrack}
                            >
                              {startingTrack ? 'Starting...' : 'Start Track'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No purchases state */}
        {purchases.length === 0 && (
          <div className="mb-8">
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Tracks Available</h3>
                <p className="text-muted-foreground mb-4">
                  Purchase a track to start your journaling journey.
                </p>
                <Button onClick={() => onViewChange?.('dashboard')}>
                  Browse Tracks
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Journal Header - Only show if user has a current track */}
        {currentTrack && (
          <div className="mb-12">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Day <span className="text-3xl font-semibold text-track-discipline">{displayDay}</span> of 30
              </p>
              <h1 className="text-2xl text-foreground font-medium leading-tight">
                {todayTheme || `Day ${displayDay}`}
              </h1>
            </div>
          </div>
        )}

        {/* Today's Content - Only show if user has a current track */}
        {currentTrack && !trackData && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-orange-800">Track Data Not Available</h3>
                </div>
                <p className="text-sm text-orange-700 mb-4">
                  The prompts for this track haven't been seeded yet. You'll need to seed the track data to see daily challenges and quotes.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '#admin'}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Go to Admin Tools
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Today's Content - Only show if user has a current track and track data is loaded */}
        {currentTrack && trackData && (
          <div className="space-y-6 mb-8">
            {/* Quote & Challenge Cards - Stacked */}
            <div className="space-y-6">
              {/* Quote & Translation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Quote className="h-5 w-5" />
                    Today's Wisdom
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <blockquote className="border-l-4 border-accent pl-4 mb-4">
                    <p className="text-base italic mb-2">"{todayQuote}"</p>
                    <cite className="text-sm text-muted-foreground">— {todayAuthor}</cite>
                  </blockquote>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-sm font-medium text-accent mb-1">Translation:</p>
                    <p className="text-sm">{todayBroTranslation}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Challenge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: trackColor }} />
                    Today's Challenge
                  </CardTitle>
                  <CardDescription>
                    Your mission for Day {displayDay}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">{todayChallenge}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">
                      Complete this challenge throughout your day, then reflect on it in your evening journal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Morning Intention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-orange-500" />
                  Morning Intention
                </CardTitle>
                <CardDescription>
                  What's your intention for today?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    {todayIntention || "Start your day with purpose. Set your intention for applying today's wisdom."}
                  </label>
                  <Textarea
                    value={morningIntention}
                    onChange={(e) => setMorningIntention(e.target.value)}
                    placeholder="How will you apply today's Stoic wisdom and complete the challenge? Keep it focused and actionable."
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Evening Reflection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  Evening Reflection
                </CardTitle>
                <CardDescription>
                  Reflect on today's challenge and wisdom. Be honest with yourself - this is your private space for growth.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayPrompts.length > 0 ? (
                  todayPrompts.map((prompt, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium text-foreground block">
                        {prompt}
                      </label>
                      <Textarea
                        value={eveningReflections[index] || ''}
                        onChange={(e) => updateEveningReflection(index, e.target.value)}
                        placeholder="Your reflection..."
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  ))
                ) : (
                  <Textarea
                    value={eveningReflections[0] || ''}
                    onChange={(e) => updateEveningReflection(0, e.target.value)}
                    placeholder="Reflect on your day. How did the challenge go? What did you learn? Be honest with yourself - this is your private space for growth."
                    className="min-h-[200px] resize-none"
                  />
                )}
              </CardContent>
            </Card>

            {/* Day Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToDay(displayDay - 1)}
                disabled={!canNavigateBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous Day</span>
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Save Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveEntry}
                  disabled={saving || (!morningIntention.trim() && !eveningReflections.some(ref => ref.trim()))}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                
                {/* Complete Day / Edit Button */}
                {!isViewingPastDay ? (
                  isDayCompleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={completeDay}
                      disabled={!morningIntention.trim() && !eveningReflections.some(ref => ref.trim())}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Mark Complete</span>
                    </Button>
                  )
                ) : null}
              </div>

              {/* Next Day Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToDay(displayDay + 1)}
                disabled={!canNavigateForward}
                className="flex items-center gap-2"
              >
                <span className="hidden sm:inline">Next Day</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation 
        currentView="daily-entry" 
        onViewChange={onViewChange || (() => {})} 
        hasActiveTrack={!!currentTrack} 
      />
    </div>
  );
}