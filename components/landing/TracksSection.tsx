import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Lock, CreditCard, Star, Zap } from "lucide-react";
import { tracks } from './data';
import { toast } from 'sonner@2.0.3';

interface TracksSectionProps {
  onSignUp?: () => void;
}

export default function TracksSection({ onSignUp }: TracksSectionProps) {
  const [purchasingTrack, setPurchasingTrack] = useState<string | null>(null);
  const [purchasingBundle, setPurchasingBundle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and load purchases
  useEffect(() => {
    const checkAuthAndPurchases = async () => {
      try {
        const { supabase } = await import('../../utils/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsAuthenticated(true);
          
          // Fetch user purchases
          const { projectId } = await import('../../utils/supabase/info');
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            setUserPurchases(result.purchases || []);
          }
        } else {
          setIsAuthenticated(false);
          setUserPurchases([]);
        }
      } catch (error) {
        console.warn('Failed to check auth/purchases:', error);
      }
    };

    checkAuthAndPurchases();
  }, []);

  // Calculate bundle pricing based on purchases
  const getBundlePrice = () => {
    const purchaseCount = userPurchases.length;
    if (purchaseCount === 0) return { price: 10, originalPrice: 16 };
    if (purchaseCount === 1) return { price: 8, originalPrice: 12 };
    if (purchaseCount === 2) return { price: 5, originalPrice: 8 };
    if (purchaseCount === 3) return { price: 2, originalPrice: 4 };
    return { price: 0, originalPrice: 0 }; // All tracks owned
  };

  const handlePurchaseBundle = async () => {
    try {
      setPurchasingBundle(true);
      setError(null);
      
      const { supabase } = await import('../../utils/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.info('Please sign up first to purchase the bundle');
        if (onSignUp) {
          onSignUp();
        }
        return;
      }

      // Create bundle checkout
      const { projectId } = await import('../../utils/supabase/info');
      const bundlePrice = getBundlePrice();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/create-bundle-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          bundlePrice: bundlePrice.price,
          existingPurchases: userPurchases.length 
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'All tracks already purchased') {
          toast.info('You already own all tracks! Check your dashboard.');
          return;
        }
        throw new Error(responseData.error || 'Failed to create bundle checkout');
      }

      window.location.href = responseData.checkout_url;
      
    } catch (error) {
      console.error('Error purchasing bundle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Bundle purchase failed: ${errorMessage}`);
      toast.error(`Bundle purchase failed: ${errorMessage}`);
    } finally {
      setPurchasingBundle(false);
    }
  };

  const handlePurchaseTrack = async (trackName: string) => {
    try {
      setPurchasingTrack(trackName);
      setError(null);
      
      console.log(`Attempting to purchase track: ${trackName}`);
      
      // Check if user is authenticated
      const { supabase } = await import('../../utils/supabase/client');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
      }
      
      if (!session?.user) {
        // User not authenticated - redirect to signup with track context
        console.log('User not authenticated, redirecting to signup');
        toast.info('Please sign up first to purchase this track');
        if (onSignUp) {
          onSignUp();
        }
        return;
      }

      // User is authenticated - proceed with purchase
      const { projectId, publicAnonKey } = await import('../../utils/supabase/info');
      const accessToken = session.access_token;

      console.log(`Creating checkout for authenticated user: ${session.user.id}, track: ${trackName}`);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName }),
      });

      const responseData = await response.json();
      console.log('Checkout API response:', responseData);

      if (!response.ok) {
        console.error('Checkout creation failed:', responseData);
        
        if (responseData.error === 'Track already purchased') {
          toast.error('You already own this track! Please check your dashboard.');
          return;
        }
        
        if (responseData.error === 'Unauthorized') {
          toast.error('Authentication expired. Please sign in again.');
          return;
        }
        
        throw new Error(responseData.error || `HTTP ${response.status}: Failed to create checkout`);
      }

      if (!responseData.checkout_url) {
        throw new Error('No checkout URL received from server');
      }

      console.log('Checkout session created successfully, redirecting to Stripe...');
      console.log('Checkout URL:', responseData.checkout_url);
      
      // Redirect to Stripe Checkout
      window.location.href = responseData.checkout_url;
      
    } catch (error) {
      console.error('Error purchasing track:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Purchase failed: ${errorMessage}`);
      toast.error(`Purchase failed: ${errorMessage}`);
    } finally {
      setPurchasingTrack(null);
    }
  };

  const bundlePrice = getBundlePrice();
  const remainingTracks = tracks.filter(track => !userPurchases.includes(track.name));
  const showBundle = isAuthenticated && remainingTracks.length > 1 && bundlePrice.price > 0;

  return (
    <section className="py-20 bg-background border-b border-border/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-16 text-foreground">
          Choose Your Battle
        </h2>
        
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Bundle Deal */}
        {showBundle && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-accent text-accent-foreground font-semibold">
                  <Star className="h-3 w-3 mr-1" />
                  BEST DEAL
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="h-6 w-6 text-accent" />
                      <h3 className="text-2xl font-black text-foreground">Complete Transformation Bundle</h3>
                    </div>
                    <p className="text-muted-foreground text-lg mb-4">
                      Get all {remainingTracks.length} remaining tracks and master every aspect of your life
                    </p>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-2xl font-black line-through text-muted-foreground">
                        ${bundlePrice.originalPrice}
                      </span>
                      <span className="text-3xl font-black text-accent">
                        ${bundlePrice.price}
                      </span>
                      <Badge variant="outline" className="text-accent border-accent">
                        Save ${bundlePrice.originalPrice - bundlePrice.price}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {remainingTracks.map((track) => {
                        const Icon = track.icon;
                        return (
                          <div key={track.name} className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4" style={{ color: track.color }} />
                            <span>{track.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="ml-8">
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4"
                      disabled={purchasingBundle}
                      onClick={handlePurchaseBundle}
                    >
                      {purchasingBundle ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Get All Tracks
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tracks.map((track, index) => {
            const Icon = track.icon;
            const isLoading = purchasingTrack === track.name;
            const isOwned = userPurchases.includes(track.name);
            
            return (
              <Card 
                key={index} 
                className={`bg-card border-border hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                  isOwned ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-8">
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <Badge 
                        variant="outline" 
                        className="text-sm font-medium px-3 py-1 mb-3 inline-block"
                        style={{ borderColor: track.color, color: track.color }}
                      >
                        {track.name}
                      </Badge>
                      <h3 className="text-2xl font-black text-card-foreground mb-2 leading-tight">{track.title}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">{track.description}</p>
                    </div>
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ml-4"
                      style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: track.color }} />
                    </div>
                  </div>
                  {/* Preview List */}
                  <ul className="space-y-3 mb-8">
                    {track.preview.map((item, idx) => (
                      <li key={idx} className="text-muted-foreground flex items-start text-base">
                        <div className="w-2 h-2 rounded-full mt-2.5 mr-4 flex-shrink-0" style={{ backgroundColor: track.color }} />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Purchase Button */}
                  <Button 
                    variant="outline" 
                    className="w-full hover:opacity-90 py-3 text-base font-semibold transition-colors"
                    style={{ 
                      borderColor: track.color, 
                      color: isOwned ? 'var(--muted-foreground)' : track.color,
                      backgroundColor: 'transparent'
                    }}
                    disabled={isLoading || isOwned}
                    onMouseEnter={(e) => {
                      if (!isLoading && !isOwned) {
                        e.currentTarget.style.backgroundColor = track.color;
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading && !isOwned) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = track.color;
                      }
                    }}
                    onClick={() => !isOwned && handlePurchaseTrack(track.name)}
                  >
                    {isOwned ? (
                      <>
                        <Star className="h-4 w-4 mr-2 fill-current" />
                        Owned
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Start This Track - $4
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}