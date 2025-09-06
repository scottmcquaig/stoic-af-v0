import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js@4.8.0';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js@2.8.1';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';


// Initialize Stripe
let stripePromise: Promise<any> | null = null;
const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        console.log('Fetching Stripe configuration...');
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const configUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/stripe/config`;
        
        console.log('Making request to:', configUrl);
        const response = await fetch(configUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Config response error:', response.status, errorText);
          throw new Error(`Failed to get Stripe config: ${response.status} ${errorText}`);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse Stripe config response:', parseError);
          throw new Error('Invalid response from Stripe configuration endpoint');
        }
        console.log('Stripe config response:', { hasPublishableKey: !!data.publishableKey });
        
        if (!data.publishableKey) {
          throw new Error('No publishable key received from server');
        }
        
        console.log('Loading Stripe with key:', data.publishableKey.substring(0, 12) + '...');
        const stripe = await loadStripe(data.publishableKey);
        
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }
        
        console.log('Stripe initialized successfully');
        return stripe;
      } catch (error) {
        console.error('Stripe initialization failed:', error);
        throw error;
      }
    })();
  }
  return stripePromise;
};

interface PaymentFormProps {
  trackName: string;
  trackColor: string;
  trackIcon: React.ComponentType<any>;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  trackName,
  trackColor,
  trackIcon: Icon,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded. Please refresh and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.');
      return;
    }

    // Validate card before proceeding
    if (!cardComplete) {
      setError('Please enter a complete card number.');
      return;
    }

    if (cardError) {
      setError(cardError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent on our server
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      console.log('Creating payment intent for track:', trackName);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create payment';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text response for better error info
          try {
            const errorText = await response.text();
            console.error('Server response (non-JSON):', errorText);
            errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
          } catch (textError) {
            errorMessage = `Server error (${response.status}): Unable to parse error response`;
          }
        }
        throw new Error(errorMessage);
      }

      let client_secret;
      try {
        const responseData = await response.json();
        client_secret = responseData.client_secret;
        
        if (!client_secret) {
          throw new Error('No payment intent client secret received from server');
        }
      } catch (parseError) {
        console.error('Failed to parse payment intent response:', parseError);
        throw new Error('Invalid response from payment server. Please try again.');
      }

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (result.error) {
        console.error('Payment failed:', result.error);
        
        // Provide more helpful error messages for common test mode issues
        let errorMessage = result.error.message || 'Payment failed';
        
        if (result.error.decline_code === 'test_mode_live_card') {
          errorMessage = 'Please use a test card number like 4242 4242 4242 4242. Real cards cannot be used in test mode.';
        } else if (result.error.code === 'card_declined') {
          errorMessage = `Card declined: ${result.error.decline_code}. Try using test card 4242 4242 4242 4242.`;
        } else if (result.error.code === 'incomplete_number') {
          errorMessage = 'Please enter a complete card number. Try using 4242 4242 4242 4242.';
        } else if (result.error.type === 'validation_error') {
          errorMessage = `${result.error.message} Please check your card details and try again.`;
        }
        
        setError(errorMessage);
      } else if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', result.paymentIntent.id);
        
        // Process the purchase immediately using the payment intent
        try {
          console.log('Processing purchase on server...');
          const purchaseResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/payments/process-payment-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ 
              paymentIntentId: result.paymentIntent.id,
              trackName 
            }),
          });

          if (purchaseResponse.ok) {
            try {
              const purchaseResult = await purchaseResponse.json();
              console.log('Purchase processed successfully:', purchaseResult);
              toast.success(`🎉 Payment successful! ${trackName} track is now available.`);
            } catch (parseError) {
              console.log('Purchase processed but response parsing failed');
              toast.success(`🎉 Payment successful! ${trackName} track is now available.`);
            }
          } else {
            // Log the error response for debugging
            const errorText = await purchaseResponse.text();
            console.error('Purchase processing failed:', purchaseResponse.status, errorText);
            toast.success(`Payment successful! ${trackName} track will be available shortly.`);
          }
        } catch (purchaseError) {
          console.error('Purchase processing error:', purchaseError);
          toast.success(`Payment successful! ${trackName} track will be available shortly.`);
        }
        
        onSuccess();
      } else {
        console.error('Payment intent status is not succeeded:', result.paymentIntent?.status);
        setError('Payment was not completed successfully. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      // Always reset processing state
      setIsProcessing(false);
      console.log('Payment processing completed, resetting state');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Track Info */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `hsl(from ${trackColor} h s l / 0.1)` }}
        >
          <Icon className="h-6 w-6" style={{ color: trackColor }} />
        </div>
        <div>
          <h3 className="font-medium">Stoic AF Journal - {trackName} Track</h3>
          <p className="text-sm text-muted-foreground">30-day journaling program</p>
          <p className="text-lg font-semibold">$4.00</p>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            <CreditCard className="h-4 w-4 inline mr-2" />
            Card Information
          </label>
          <div className={`p-4 border rounded-lg bg-background transition-colors ${
            cardError ? 'border-destructive' : 
            cardComplete ? 'border-green-500' : 'border-input'
          }`}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'inherit',
                    '::placeholder': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  },
                },
                hidePostalCode: true,
              }}
              onChange={(event) => {
                setCardComplete(event.complete);
                setCardError(event.error ? event.error.message : null);
                // Clear form error when user starts typing
                if (error && event.complete) {
                  setError(null);
                }
              }}
            />
          </div>
          {cardError && (
            <p className="text-sm text-destructive mt-1">{cardError}</p>
          )}
          {cardComplete && !cardError && (
            <p className="text-sm text-green-600 mt-1">✓ Card details are valid</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Secured by Stripe. Your payment information is encrypted and secure.
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete || !!cardError}
          className="flex-1"
          style={{ backgroundColor: trackColor }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $4.00`
          )}
        </Button>
      </div>
    </form>
  );
};

interface StripePaymentFormProps extends PaymentFormProps {}

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        console.log('Initializing Stripe...');
        const stripeInstance = await getStripe();
        console.log('Stripe instance loaded:', !!stripeInstance);
        setStripe(stripeInstance);
        setStripeLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load payment system');
        setStripeLoaded(true); // Still set to true to show error state
      }
    };

    initStripe();
  }, []);

  if (!stripeLoaded) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading payment form...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {loadError}
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={props.onCancel} variant="outline" className="flex-1">
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Stripe failed to initialize. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={props.onCancel} variant="outline" className="flex-1">
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;