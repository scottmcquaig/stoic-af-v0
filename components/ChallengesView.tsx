import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  DollarSign, 
  Heart, 
  Target, 
  Brain,
  ShoppingCart,
  CheckCircle,
  Lock,
  CreditCard,
  Loader2,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import StripePaymentForm from './StripePaymentForm';

const tracks = [
  {
    icon: DollarSign,
    name: "Money",
    title: "Master Your Wealth Mindset",
    description: "Stop being broke in your mind before your wallet. Build a healthy relationship with money through Stoic principles.",
    color: "var(--track-money)",
    preview: [
      "Identify toxic money beliefs",
      "Build abundance mindset", 
      "Control spending impulses",
      "Develop financial discipline"
    ]
  },
  {
    icon: Heart,
    name: "Relationships", 
    title: "Control Yourself, Not Others",
    description: "The problem isn't them. It's how you react to them. Master your responses and build stronger connections.",
    color: "var(--track-relationships)",
    preview: [
      "Set real boundaries",
      "Stop people-pleasing",
      "Communicate like an adult",
      "Build authentic connections"
    ]
  },
  {
    icon: Target,
    name: "Discipline",
    title: "Build Unbreakable Habits", 
    description: "Motivation is trash. Discipline is forever. Create systems that make success inevitable.",
    color: "var(--track-discipline)",
    preview: [
      "Master your mornings",
      "Defeat procrastination",
      "Build compound habits",
      "Develop mental toughness"
    ]
  },
  {
    icon: Brain,
    name: "Ego",
    title: "Get Out of Your Own Way",
    description: "Your biggest enemy looks at you in the mirror. Overcome self-sabotage and build real confidence.",
    color: "var(--track-ego)", 
    preview: [
      "Identify ego traps",
      "Build real confidence", 
      "Accept harsh truths",
      "Develop humility"
    ]
  }
];

export default function ChallengesView() {
  const { user, profile, refreshProfile } = useAuth();
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTrack, setStartingTrack] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  // Load user's purchases
  useEffect(() => {
    const loadPurchases = async () => {
      if (!user) return;
      
      try {
        const { projectId } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
        
        if (!session.data.session?.access_token) {
          console.log('No valid session found, skipping purchases load');
          setLoading(false);
          return;
        }

        const accessToken = session.data.session.access_token;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setPurchases(result.purchases || []);
        }
      } catch (error) {
        console.error('Error loading purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, [user]);

  const handlePurchaseClick = (track: any) => {
    setSelectedTrack(track);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedTrack(null);
    // Reload purchases to reflect the new purchase
    const loadPurchases = async () => {
      try {
        const { projectId } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
        
        if (!session.data.session?.access_token) {
          console.log('No valid session found, cannot reload purchases');
          return;
        }

        const accessToken = session.data.session.access_token;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setPurchases(result.purchases || []);
        }
      } catch (error) {
        console.error('Error reloading purchases:', error);
      }
    };
    loadPurchases();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedTrack(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const purchasedTracks = tracks.filter(track => purchases.includes(track.name));
  const availableTracks = tracks.filter(track => !purchases.includes(track.name));
  
  // Sort purchased tracks: active first, then by completion date
  const sortedPurchasedTracks = [...purchasedTracks].sort((a, b) => {
    const aIsActive = profile?.current_track === a.name;
    const bIsActive = profile?.current_track === b.name;
    
    // Active track comes first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    
    // Then sort by completion date (completed tracks last for now - could be enhanced with completion timestamps)
    const aIsCompleted = profile?.tracks_completed?.some(track => track.track === a.name);
    const bIsCompleted = profile?.tracks_completed?.some(track => track.track === b.name);
    
    if (aIsCompleted && !bIsCompleted) return 1;
    if (!aIsCompleted && bIsCompleted) return -1;
    
    // If both are same status, maintain original order
    return 0;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Payment Modal */}
      {selectedTrack && (
        <Dialog open={showPaymentForm} onOpenChange={(open) => !open && handlePaymentCancel()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Your Purchase
              </DialogTitle>
              <DialogDescription>
                Enter your payment information to purchase the {selectedTrack.name} track for $4.00
              </DialogDescription>
            </DialogHeader>
            <StripePaymentForm
              trackName={selectedTrack.name}
              trackColor={selectedTrack.color}
              trackIcon={selectedTrack.icon}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl text-foreground mb-2">Stoic AF Tracks</h1>
        <p className="text-muted-foreground">
          Choose your path to transformation. $4 each, no subscriptions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{purchasedTracks.length}</p>
              <p className="text-sm text-muted-foreground">Purchased</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableTracks.length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tracks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tracks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Proposition */}
      <Card className="bg-slate text-slate-foreground">
        <CardContent className="py-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8" />
              <h3 className="font-medium">One-Time Payment</h3>
              <p className="text-sm text-slate-foreground/80">No subscriptions, no recurring charges</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-8 w-8" />
              <h3 className="font-medium">Instant Access</h3>
              <p className="text-sm text-slate-foreground/80">Start your 30-day journey immediately</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-8 w-8" />
              <h3 className="font-medium">Lifetime Access</h3>
              <p className="text-sm text-slate-foreground/80">Revisit and restart whenever you want</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Tracks - Show first if any exist */}
      {purchasedTracks.length > 0 && (
        <div>
          <h2 className="text-xl text-foreground mb-4">Your Tracks</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {sortedPurchasedTracks.map((track) => {
              const Icon = track.icon;
              const isCompleted = profile?.tracks_completed?.some(t => t.track === track.name);
              const isActive = profile?.current_track === track.name;

              return (
                <Card 
                  key={track.name} 
                  className="hover:shadow-lg transition-shadow border-2 border-black"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className="text-xs px-2 py-0.5 h-5 leading-none flex items-center text-white border-0 bg-black"
                          >
                            {track.name}
                          </Badge>
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {isActive && (
                            <Badge variant="outline" className="border-black text-black bg-black/5">
                              Active
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mb-1 leading-tight">{track.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed mb-3">{track.description}</CardDescription>
                        <div className="space-y-1">
                          {track.preview.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: track.color }} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Button 
                      onClick={() => startTrack(track.name)}
                      disabled={startingTrack || loading}
                      className="w-full bg-black hover:bg-black/90 text-white border-black"
                    >
                      {startingTrack ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : isActive ? (
                        'Continue Journey'
                      ) : isCompleted ? (
                        'Restart Journey'
                      ) : (
                        'Start 30-Day Journey'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tracks */}
      {availableTracks.length > 0 && (
        <div>
          <h2 className="text-xl text-foreground mb-4">Available Tracks</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {availableTracks.map((track) => {
              const Icon = track.icon;

              return (
                <Card key={track.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className="text-xs px-2 py-0.5 h-5 leading-none flex items-center text-white border-0"
                            style={{ backgroundColor: track.color }}
                          >
                            {track.name}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mb-1 leading-tight">{track.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed mb-3">{track.description}</CardDescription>
                        <div className="space-y-1">
                          {track.preview.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: track.color }} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold mb-1">$4</p>
                        <p className="text-xs text-muted-foreground">One-time payment • No subscription</p>
                      </div>
                      <Button 
                        onClick={() => handlePurchaseClick(track)}
                        disabled={loading}
                        variant="outline" 
                        className="w-full transition-colors"
                        style={{ 
                          borderColor: track.color, 
                          color: track.color,
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = track.color;
                            e.currentTarget.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.color = track.color;
                          }
                        }}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Purchase & Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}



      {/* Empty State for no purchases */}
      {purchasedTracks.length === 0 && availableTracks.length === tracks.length && (
        <Card>
          <CardContent className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Ready to Transform Your Life?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your first track above and start your 30-day journey to becoming Stoic AF.
            </p>
            <p className="text-xs text-muted-foreground">
              Each track is just $4 • No subscriptions • Lifetime access
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}