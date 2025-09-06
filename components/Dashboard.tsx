import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DollarSign, Heart, Target, Brain, LogOut, Trophy, Flame, AlertTriangle } from 'lucide-react';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';
import JournalDashboard from './JournalDashboard';
import ProgressView from './ProgressView';
import ChallengesView from './ChallengesView';
import ProfileView from './ProfileView';
import DashboardView from './DashboardView';
import TrackPurchase from './TrackPurchase';
import PaymentDebugger from './PaymentDebugger';
import PurchaseFlowDebugger from './PurchaseFlowDebugger';

import { toast } from 'sonner@2.0.3';

type NavigationView = 'dashboard' | 'daily-entry' | 'progress' | 'challenges' | 'profile';

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  const [currentView, setCurrentView] = useState<NavigationView>(() => {
    // Always start with dashboard view
    return 'dashboard';
  });

  const tracks = [
    {
      icon: DollarSign,
      name: "Money",
      title: "Master Your Wealth Mindset", 
      color: "var(--track-money)",
      description: "Stop being broke in your mind before your wallet"
    },
    {
      icon: Heart,
      name: "Relationships",
      title: "Control Yourself, Not Others",
      color: "var(--track-relationships)", 
      description: "The problem isn't them. It's how you react to them."
    },
    {
      icon: Target,
      name: "Discipline",
      title: "Build Unbreakable Habits",
      color: "var(--track-discipline)",
      description: "Motivation is trash. Discipline is forever."
    },
    {
      icon: Brain,
      name: "Ego", 
      title: "Get Out of Your Own Way",
      color: "var(--track-ego)",
      description: "Your biggest enemy looks at you in the mirror"
    }
  ];

  // Fetch user purchases and handle initial navigation
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const { projectId } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
        
        if (!session.data.session?.access_token) {
          console.log('No valid session found, skipping purchases fetch');
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
          console.log('Dashboard: Loaded purchases:', result.purchases);
        } else {
          console.error('Failed to fetch purchases:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPurchases();
      
      // Check if we need to refresh due to a recent purchase
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      if (success === 'true') {
        // If we came from a successful payment, trigger the same refresh logic
        console.log('Dashboard: Detected successful payment redirect, processing like handlePurchaseSuccess');
        setProcessingPayment(true);
        
        // Add multiple refresh attempts with delays to ensure webhook processing completes
        setTimeout(async () => {
          await fetchPurchases();
          // Try again after another delay
          setTimeout(async () => {
            await fetchPurchases();
            await refreshProfile();
            setProcessingPayment(false);
          }, 2000);
        }, 3000);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  const hasActiveTrack = Boolean(profile?.current_track);

  const refreshPurchases = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        console.log('No valid session found, cannot refresh purchases');
        return [];
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
        setShowDebugger(false); // Hide debugger if refresh is successful
        return result.purchases || [];
      } else {
        console.error('Failed to refresh purchases:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error refreshing purchases:', error);
    }
    return [];
  };

  // DEV: Grant all tracks for development
  const devGrantAllTracks = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        toast.error('No valid session found');
        return;
      }

      const accessToken = session.data.session.access_token;

      const trackNames = ['Money', 'Relationships', 'Discipline', 'Ego'];
      
      for (const trackName of trackNames) {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/dev/grant-track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ trackName }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to grant ${trackName}:`, error);
        }
      }

      // Refresh purchases to show the new tracks
      await refreshPurchases();
      toast.success('🎉 All tracks granted! Ready to start your journey!');
    } catch (error) {
      console.error('Error granting tracks:', error);
      toast.error('Failed to grant tracks');
    }
  };

  const handlePurchaseSuccess = async () => {
    console.log('Payment success callback triggered');
    setProcessingPayment(true);
    
    // Store current purchases count to compare after refresh
    const currentPurchasesCount = purchases.length;
    
    // Add a delay to ensure webhook has processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Refresh purchases
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        console.log('No valid session found, cannot refresh after payment');
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
        console.log('Purchases refreshed after payment:', result.purchases);
      }
      
      await refreshProfile();
      toast.success('Track is now available! Click "Start 30-Day Journey" to begin.');
    } catch (error) {
      console.error('Error refreshing data after payment:', error);
      toast.error('Payment processed but had trouble refreshing. Use the troubleshooting tool below.');
      setShowDebugger(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePurchaseTrack = async (trackName: string) => {
    try {
      console.log(`Initiating purchase for track: ${trackName}`);
      const { projectId } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session.data.session?.access_token) {
        toast.error('Please sign in to purchase tracks');
        return;
      }

      const accessToken = session.data.session.access_token;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Checkout creation failed:', error);
        
        if (error.error === 'Track already purchased') {
          toast.error('You already own this track!');
          // Refresh purchases to update UI
          setTimeout(async () => {
            try {
              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
              });
              if (response.ok) {
                const result = await response.json();
                setPurchases(result.purchases || []);
              }
            } catch (error) {
              console.error('Error refreshing purchases:', error);
            }
          }, 500);
          return;
        }
        
        toast.error(`Payment error: ${error.error || 'Unknown error'}`);
        return;
      }

      const result = await response.json();
      console.log('Checkout session created, redirecting to Stripe...');
      
      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Payment processing error. Please try again.');
    }
  };

  const handleStartTrack = async (trackName: string) => {
    try {
      console.log(`Starting track: ${trackName}`);
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
        console.error('Failed to start track:', error);
        
        if (error.error === 'Track not purchased') {
          toast.error('Please purchase this track first');
          return;
        }
        
        toast.error(`Failed to start track: ${error.error || 'Unknown error'}`);
        return;
      }

      const result = await response.json();
      console.log('Track started successfully:', result);
      
      // Refresh profile to show new track
      await refreshProfile();
      toast.success(`Started ${trackName} track! Your 30-day journey begins now! 💪`);
      
      // Navigate back to the dashboard view to see the updated state
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error starting track:', error);
      toast.error('Error starting track. Please try again.');
    }
  };

  const renderNoActiveTrackView = () => (
    <div>
      <div className="container mx-auto px-4 py-8 pb-20 max-w-3xl">
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Active Track</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a track from the dashboard to begin your daily journaling
            </p>
            <Button onClick={() => setCurrentView('dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation 
        currentView={currentView}
        onViewChange={setCurrentView}
        hasActiveTrack={hasActiveTrack}
      />
    </div>
  );

  // Show processing overlay if payment is being processed
  if (processingPayment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl mb-2">Processing Your Purchase</h2>
          <p className="text-muted-foreground mb-4">
            Setting up your new track and updating your dashboard...
          </p>
          <div className="bg-muted/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">
              This usually takes just a few seconds. Please don't refresh the page.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setProcessingPayment(false);
                window.location.reload();
              }}
              className="text-xs"
            >
              Having trouble? Click to refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle different views
  switch (currentView) {
    case 'dashboard':
      // If user has no purchases, show challenges view as the main landing page
      if (purchases.length === 0 && !loading) {
        return (
          <div className="bg-background min-h-screen">
            <AppHeader onNavigate={setCurrentView} />
            <div className="container mx-auto px-4 py-8 max-w-3xl">
              <ChallengesView />
            </div>
            <BottomNavigation 
              currentView="challenges"
              onViewChange={setCurrentView}
              hasActiveTrack={hasActiveTrack}
            />
          </div>
        );
      }
      
      return (
        <div className="bg-background min-h-screen">
          <AppHeader onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <DashboardView onViewChange={setCurrentView} />
          </div>
          <BottomNavigation 
            currentView={currentView}
            onViewChange={setCurrentView}
            hasActiveTrack={hasActiveTrack}
          />
        </div>
      );
    
    case 'daily-entry':
      return hasActiveTrack ? (
        <JournalDashboard onViewChange={setCurrentView} />
      ) : (
        <div className="bg-background min-h-screen">
          <AppHeader onNavigate={setCurrentView} />
          {renderNoActiveTrackView()}
        </div>
      );
    
    case 'progress':
      return (
        <div className="bg-background min-h-screen">
          <AppHeader onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <ProgressView />
          </div>
          <BottomNavigation 
            currentView={currentView}
            onViewChange={setCurrentView}
            hasActiveTrack={hasActiveTrack}
          />
        </div>
      );
    
    case 'challenges':
      return (
        <div className="bg-background min-h-screen">
          <AppHeader onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <ChallengesView />
          </div>
          <BottomNavigation 
            currentView={currentView}
            onViewChange={setCurrentView}
            hasActiveTrack={hasActiveTrack}
          />
        </div>
      );
    
    case 'profile':
      return (
        <div className="bg-background min-h-screen">
          <AppHeader onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <ProfileView />
          </div>
          <BottomNavigation 
            currentView={currentView}
            onViewChange={setCurrentView}
            hasActiveTrack={hasActiveTrack}
          />
        </div>
      );
    
    default:
      // Fallback to original dashboard if something goes wrong
      break;
  }



  // This should never be reached now due to the switch statement above
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl mb-2">Loading Dashboard...</h2>
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}