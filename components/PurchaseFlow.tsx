import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Lock, CreditCard } from 'lucide-react';
import { tracks } from './landing/data';

interface PurchaseFlowProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack?: string;
  onSignUpRequired: () => void;
}

export default function PurchaseFlow({ 
  isOpen, 
  onClose, 
  selectedTrack,
  onSignUpRequired 
}: PurchaseFlowProps) {
  const { user } = useAuth();
  const [purchasingTrack, setPurchasingTrack] = useState<string | null>(null);

  // Redirect to signup if user is not authenticated
  useEffect(() => {
    if (isOpen && !user) {
      // Dynamically import toast to avoid bundle issues
      import('sonner@2.0.3').then(({ toast }) => {
        toast.info('Please sign up first to purchase a track');
      });
      onSignUpRequired();
      onClose();
    }
  }, [isOpen, user, onSignUpRequired, onClose]);

  const handlePurchaseTrack = async (trackName: string) => {
    if (!user) {
      // Dynamically import toast to avoid bundle issues
      import('sonner@2.0.3').then(({ toast }) => {
        toast.info('Please sign up first to purchase this track');
      });
      onSignUpRequired();
      return;
    }

    try {
      setPurchasingTrack(trackName);
      
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const { supabase } = await import('../utils/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

      console.log(`Creating checkout for track: ${trackName}`);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout creation failed:', errorData);
        
        if (errorData.error === 'Track already purchased') {
          import('sonner@2.0.3').then(({ toast }) => {
            toast.error('You already own this track! Please check your dashboard.');
          });
          onClose();
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const result = await response.json();
      console.log('Checkout session created, redirecting to Stripe...');
      
      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;
      
    } catch (error) {
      console.error('Error purchasing track:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      import('sonner@2.0.3').then(({ toast }) => {
        toast.error(`Purchase failed: ${errorMessage}`);
      });
    } finally {
      setPurchasingTrack(null);
    }
  };

  const trackToShow = selectedTrack ? tracks.find(t => t.name === selectedTrack) : null;
  const tracksToShow = trackToShow ? [trackToShow] : tracks;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {selectedTrack ? `Purchase ${selectedTrack} Track` : 'Choose Your Track'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {selectedTrack 
              ? `Start your 30-day ${selectedTrack} journey for just $4`
              : 'Pick one track to focus on for the next 30 days. You can purchase additional tracks anytime.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className={`grid gap-6 ${tracksToShow.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {tracksToShow.map((track) => {
            if (!track) return null;
            
            const Icon = track.icon;
            const isLoading = purchasingTrack === track.name;
            
            return (
              <Card key={track.name} className="bg-card border-border">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: track.color }} />
                    </div>
                    <div className="flex-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs mb-1"
                        style={{ borderColor: track.color, color: track.color }}
                      >
                        {track.name}
                      </Badge>
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4">{track.description}</p>
                  
                  {/* Preview */}
                  <ul className="space-y-2 mb-6">
                    {track.preview.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: track.color }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Price and Purchase */}
                  <div className="text-center mb-4">
                    <p className="text-2xl mb-1">$4</p>
                    <p className="text-xs text-muted-foreground">One-time payment • No subscription</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    style={{ 
                      borderColor: track.color, 
                      color: track.color
                    }}
                    disabled={isLoading}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = track.color;
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = track.color;
                      }
                    }}
                    onClick={() => handlePurchaseTrack(track.name)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase & Start
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}