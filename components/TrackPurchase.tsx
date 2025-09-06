import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, Lock, CheckCircle, CreditCard } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';

interface TrackPurchaseProps {
  track: {
    icon: React.ComponentType<any>;
    name: string;
    title: string;
    color: string;
    description: string;
  };
  isPurchased: boolean;
  onPurchase: (trackName: string) => Promise<void>;
  onStart: (trackName: string) => Promise<void>;
  onPurchaseSuccess: () => void;
  isLoading: boolean;
}

export default function TrackPurchase({ 
  track, 
  isPurchased, 
  onPurchase, 
  onStart,
  onPurchaseSuccess,
  isLoading 
}: TrackPurchaseProps) {
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const Icon = track.icon;

  const handlePurchase = () => {
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    onPurchaseSuccess();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const handleStart = async () => {
    setStartLoading(true);
    try {
      await onStart(track.name);
    } finally {
      setStartLoading(false);
    }
  };

  return (
    <>
      {/* Payment Modal */}
      <Dialog open={showPaymentForm} onOpenChange={(open) => !open && handlePaymentCancel()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Purchase
            </DialogTitle>
            <DialogDescription>
              Enter your payment information to purchase the {track.name} track for $4.00
            </DialogDescription>
          </DialogHeader>
          <StripePaymentForm
            trackName={track.name}
            trackColor={track.color}
            trackIcon={track.icon}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Track Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start mb-2 gap-2">
                <Badge 
                  className="text-xs px-2 py-0.5 h-5 leading-none flex items-center text-white border-0"
                  style={{ backgroundColor: track.color }}
                >
                  {track.name}
                </Badge>
                {isPurchased && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              <CardTitle className="text-lg mb-1 leading-tight">{track.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{track.description}</CardDescription>
            </div>
            <div className="flex-shrink-0">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
              >
                <Icon className="h-4 w-4" style={{ color: track.color }} />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isPurchased ? (
            <Button 
              onClick={handleStart}
              disabled={startLoading || isLoading}
              className="w-full"
              style={{ 
                backgroundColor: track.color,
                borderColor: track.color,
                color: 'white'
              }}
            >
              {startLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start 30-Day Journey'
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-2xl mb-1">$4</p>
                <p className="text-xs text-muted-foreground">One-time payment • No subscription</p>
              </div>
              <Button 
                onClick={handlePurchase}
                disabled={isLoading}
                variant="outline" 
                className="w-full transition-colors"
                style={{ 
                  borderColor: track.color, 
                  color: track.color,
                  backgroundColor: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = track.color;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = track.color;
                  }
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Purchase & Start
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}