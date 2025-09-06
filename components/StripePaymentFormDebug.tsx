import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';

interface DebugPaymentFormProps {
  trackName: string;
  trackColor: string;
  trackIcon: React.ComponentType<any>;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentFormDebug: React.FC<DebugPaymentFormProps> = ({
  trackName,
  trackColor,
  trackIcon: Icon,
  onSuccess,
  onCancel
}) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addDebugLine = (message: string) => {
    console.log('[Stripe Debug]', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const testStripeConfig = async () => {
      try {
        addDebugLine('Starting Stripe configuration test...');
        
        // Test 1: Check if we can get project info
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        addDebugLine(`Project ID: ${projectId}`);
        addDebugLine(`Public key exists: ${!!publicAnonKey}`);
        
        // Test 2: Try to fetch Stripe config
        const configUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/stripe/config`;
        addDebugLine(`Fetching config from: ${configUrl}`);
        
        const response = await fetch(configUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        addDebugLine(`Config response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          addDebugLine(`Config error response: ${errorText}`);
          throw new Error(`Config request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        addDebugLine(`Config response received: ${JSON.stringify(data)}`);
        
        if (data.error) {
          addDebugLine(`Config error: ${data.error}`);
          throw new Error(data.error);
        }
        
        if (!data.publishableKey) {
          addDebugLine('No publishable key in response');
          throw new Error('No publishable key received');
        }
        
        addDebugLine(`Publishable key received: ${data.publishableKey.substring(0, 12)}...`);
        addDebugLine('Stripe configuration test completed successfully!');
        
      } catch (error) {
        console.error('Stripe config test failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addDebugLine(`ERROR: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    testStripeConfig();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Payment System Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Debug Info */}
        <div className="space-y-3">
          <h4 className="font-medium">Debug Information:</h4>
          
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Running diagnostics...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Configuration Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-64 overflow-y-auto bg-muted/50 p-3 rounded font-mono text-xs space-y-1">
            {debugInfo.map((line, index) => (
              <div key={index} className="text-muted-foreground">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h4 className="font-medium">Instructions:</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>If you see "Stripe not configured" error:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Stripe dashboard</li>
              <li>Navigate to Developers → API keys</li>
              <li>Copy your Publishable key (starts with pk_test_...)</li>
              <li>Add it to the STRIPE_PUBLISHABLE_KEY environment variable</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Retry Test'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePaymentFormDebug;