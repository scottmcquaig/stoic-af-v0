import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Target, 
  Flame, 
  Settings, 
  LogOut,
  Edit3,
  DollarSign,
  Heart,
  Brain,
  Star,
  Award
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const trackIcons = {
  Money: DollarSign,
  Relationships: Heart,
  Discipline: Target,
  Ego: Brain
};

export default function ProfileView() {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const completedTracks = profile?.tracks_completed || [];
  const currentTrack = profile?.current_track;
  const streak = profile?.streak || 0;
  const totalDays = profile?.total_days_completed || 0;
  const currentDay = profile?.current_day || 1;

  // Calculate user level based on total days
  const getUserLevel = (totalDays: number) => {
    if (totalDays >= 300) return { level: 10, title: 'Stoic Legend', icon: Award, color: 'text-purple-600' };
    if (totalDays >= 200) return { level: 9, title: 'Wisdom Master', icon: Star, color: 'text-yellow-600' };
    if (totalDays >= 150) return { level: 8, title: 'Philosophy Sage', icon: Trophy, color: 'text-orange-600' };
    if (totalDays >= 120) return { level: 7, title: 'Discipline Lord', icon: Target, color: 'text-blue-600' };
    if (totalDays >= 90) return { level: 6, title: 'Virtue Knight', icon: Award, color: 'text-green-600' };
    if (totalDays >= 60) return { level: 5, title: 'Stoic Warrior', icon: Trophy, color: 'text-red-600' };
    if (totalDays >= 45) return { level: 4, title: 'Mindful Guardian', icon: Target, color: 'text-purple-500' };
    if (totalDays >= 30) return { level: 3, title: 'Wisdom Seeker', icon: Star, color: 'text-blue-500' };
    if (totalDays >= 14) return { level: 2, title: 'Novice Stoic', icon: Target, color: 'text-green-500' };
    return { level: 1, title: 'Apprentice', icon: User, color: 'text-gray-500' };
  };

  const userLevel = getUserLevel(totalDays);
  const LevelIcon = userLevel.icon;

  // Calculate next level requirements
  const nextLevelDays = [14, 30, 45, 60, 90, 120, 150, 200, 300][userLevel.level - 1] || 300;
  const progressToNext = nextLevelDays ? ((totalDays / nextLevelDays) * 100) : 100;

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Your Stoic AF journey and achievements
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3">
                <span>{user?.name || 'Stoic Warrior'}</span>
                <Badge variant="outline" className={`${userLevel.color} border-current`}>
                  <LevelIcon className="h-3 w-3 mr-1" />
                  {userLevel.title}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user?.email}
              </CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Member since {joinDate}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Level {userLevel.level}</span>
              <span className="text-sm font-medium">
                {totalDays}/{nextLevelDays || 300} days
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-accent rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userLevel.level >= 10 ? 'Max level reached!' : `${(nextLevelDays || 300) - totalDays} days to next level`}
            </p>
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-bold text-lg">{streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-accent" />
                <span className="font-bold text-lg">{totalDays}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Days</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-bold text-lg">{completedTracks.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Track */}
      {currentTrack && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                {(() => {
                  const TrackIcon = trackIcons[currentTrack as keyof typeof trackIcons];
                  return <TrackIcon className="h-5 w-5 text-accent" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{currentTrack} Track</h3>
                <p className="text-sm text-muted-foreground">
                  Day {currentDay}/30 - {30 - currentDay} days remaining
                </p>
              </div>
              <Badge variant="outline">Active</Badge>
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
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <TrackIcon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{trackName}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof completedAt === 'string' && completedAt !== 'Recently completed'
                          ? new Date(completedAt).toLocaleDateString()
                          : completedAt
                        }
                      </p>
                    </div>
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile (Coming Soon)
          </Button>
          
          <Button variant="outline" className="w-full justify-start" disabled>
            <Settings className="h-4 w-4 mr-2" />
            Preferences (Coming Soon)
          </Button>
          
          <Separator />
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>

      {/* Achievements Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>
            Your earned badges and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {/* First Entry Achievement */}
            {totalDays > 0 && (
              <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Target className="h-6 w-6 text-green-600 mb-1" />
                <span className="text-xs font-medium text-green-600">First Entry</span>
              </div>
            )}
            
            {/* Week Streak */}
            {streak >= 7 && (
              <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600 mb-1" />
                <span className="text-xs font-medium text-orange-600">7-Day Streak</span>
              </div>
            )}
            
            {/* Track Completion */}
            {completedTracks.length > 0 && (
              <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600 mb-1" />
                <span className="text-xs font-medium text-yellow-600">Track Master</span>
              </div>
            )}
            
            {/* Placeholder for future achievements */}
            <div className="flex flex-col items-center p-3 bg-muted/20 rounded-lg opacity-50">
              <Award className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}