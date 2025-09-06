import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PaymentDebuggerProps {
  onPaymentVerified: () => void;
}

export default function PaymentDebugger({ onPaymentVerified }: PaymentDebuggerProps) {
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleVerifyPayment = async () => {
    if (!paymentIntentId.trim()) {
      toast.error('Please enter a payment intent ID');
      return;
    }

    setIsVerifying(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentIntentId: paymentIntentId.trim() }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message);
        onPaymentVerified();
      } else {
        toast.error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefreshPurchases = async () => {
    setIsRefreshing(true);
    try {
      // Just trigger a refresh by calling the callback
      onPaymentVerified();
      toast.success('Purchases refreshed');
    } catch (error) {
      toast.error('Failed to refresh purchases');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" />
          Payment Troubleshooting
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            If you completed a payment but the track isn't unlocked, try these steps:
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {/* Refresh purchases */}
          <div>
            <Button
              onClick={handleRefreshPurchases}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              {isRefreshing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Refreshing...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Refresh Purchases</>
              )}
            </Button>
          </div>

          {/* Manual payment verification */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual Payment Verification</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Payment Intent ID (pi_...)"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleVerifyPayment}
                disabled={isVerifying || !paymentIntentId.trim()}
                variant="secondary"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The Payment Intent ID starts with "pi_" and can be found in your Stripe dashboard or browser console.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}