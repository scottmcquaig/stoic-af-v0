import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { RefreshCw, Bug, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DebugInfo {
  timestamp: string;
  userProfile: any;
  purchases: string[];
  kvHealth: any;
  lastRefresh: string;
  debugData?: any;
  flowTrace?: any;
}

export default function PurchaseFlowDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [testTrack, setTestTrack] = useState('Money');

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      console.log('🔍 Running purchase flow diagnostics...');

      // 1. Check KV store health
      const kvHealthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/health/kv`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const kvHealth = await kvHealthResponse.json();

      // 2. Get user profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/user/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileResponse.json();

      // 3. Get purchases
      const purchasesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const purchasesData = await purchasesResponse.json();

      // 4. Get debug info for current user
      const userId = profileData.user?.id;
      const debugResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/debug/payments/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const debugData = await debugResponse.json();

      setDebugInfo({
        timestamp: new Date().toISOString(),
        userProfile: profileData,
        purchases: purchasesData.purchases || [],
        kvHealth: kvHealth,
        lastRefresh: new Date().toISOString(),
        debugData: debugData
      });

      console.log('🔍 Diagnostics complete:', {
        kvHealth,
        profile: profileData,
        purchases: purchasesData,
        debug: debugData
      });

      toast.success('Diagnostics complete - check console for details');
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      toast.error('Diagnostics failed - check console for details');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentIntentId.trim()) {
      toast.error('Please enter a Payment Intent ID');
      return;
    }

    setLoading(true);
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
        body: JSON.stringify({ paymentIntentId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Payment verification successful');
        // Refresh diagnostics
        await runDiagnostics();
      } else {
        toast.error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshPurchases = async () => {
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/purchases`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const result = await response.json();
      console.log('🔄 Manual purchase refresh:', result);
      
      if (response.ok) {
        toast.success(`Refreshed - Found ${result.purchases?.length || 0} purchases`);
        await runDiagnostics();
      } else {
        toast.error(result.error || 'Failed to refresh purchases');
      }
    } catch (error) {
      console.error('Purchase refresh error:', error);
      toast.error('Failed to refresh purchases');
    } finally {
      setLoading(false);
    }
  };

  const recoverPurchases = async () => {
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      // Get user ID from profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/user/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileResponse.json();
      const userId = profileData.user?.id;

      if (!userId) {
        toast.error('Could not determine user ID');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/debug/recover-purchases/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const result = await response.json();
      console.log('🔧 Purchase recovery result:', result);
      
      if (response.ok) {
        if (result.recoveredTracks && result.recoveredTracks.length > 0) {
          toast.success(`Recovered ${result.recoveredTracks.length} missing track(s): ${result.recoveredTracks.join(', ')}`);
        } else {
          toast.info(result.message || 'No missing purchases found to recover');
        }
        await runDiagnostics();
      } else {
        toast.error(result.error || 'Failed to recover purchases');
      }
    } catch (error) {
      console.error('Purchase recovery error:', error);
      toast.error('Failed to recover purchases');
    } finally {
      setLoading(false);
    }
  };

  const runFullTrace = async () => {
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      // Get user ID from profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/user/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileResponse.json();
      const userId = profileData.user?.id;

      if (!userId) {
        toast.error('Could not determine user ID');
        return;
      }

      console.log('🔍 Running comprehensive flow trace...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/debug/trace-flow/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const result = await response.json();
      console.log('🔍 Flow trace complete:', result);
      
      if (response.ok && result.trace) {
        setDebugInfo(prev => ({
          ...prev,
          flowTrace: result.trace,
          lastRefresh: new Date().toISOString()
        }));

        const { summary } = result.trace;
        if (summary.overall_health === 'healthy') {
          toast.success('System health check passed - all systems operational');
        } else if (summary.overall_health === 'degraded') {
          toast.warning(`System health degraded - ${summary.failed_steps} issue(s) found`);
        } else {
          toast.error(`Critical system issues detected - ${summary.failed_steps} failures`);
        }
      } else {
        toast.error(result.error || 'Failed to run flow trace');
      }
    } catch (error) {
      console.error('Flow trace error:', error);
      toast.error('Failed to run flow trace');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
      const accessToken = session.data.session?.access_token || publicAnonKey;

      // Get user ID from profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/user/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileResponse.json();
      const userId = profileData.user?.id;

      if (!userId) {
        toast.error('Could not determine user ID');
        return;
      }

      console.log(`🧪 Testing webhook processing for track: ${testTrack}`);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/debug/test-webhook/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackName: testTrack }),
      });

      const result = await response.json();
      console.log('🧪 Test webhook result:', result);
      
      if (response.ok) {
        toast.success(result.message || 'Test webhook processed successfully');
        await runDiagnostics();
      } else {
        toast.error(result.error || 'Test webhook failed');
      }
    } catch (error) {
      console.error('Test webhook error:', error);
      toast.error('Test webhook failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Purchase Flow Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
          
          <Button
            onClick={refreshPurchases}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Purchases
          </Button>
          
          <Button
            onClick={recoverPurchases}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-green-500 text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Recover Missing Purchases
          </Button>
          
          <Button
            onClick={runFullTrace}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-purple-500 text-purple-700 hover:bg-purple-50"
          >
            <Bug className="h-4 w-4 mr-2" />
            Full System Trace
          </Button>
        </div>

        {/* Manual Payment Verification */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-orange-800">
            Manual Payment Verification
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Payment Intent ID (pi_...)"
              value={paymentIntentId}
              onChange={(e) => setPaymentIntentId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button
              onClick={verifyPayment}
              disabled={loading || !paymentIntentId.trim()}
              size="sm"
            >
              Verify
            </Button>
          </div>
          <p className="text-xs text-orange-700">
            Find Payment Intent ID in Stripe Dashboard or browser network tab
          </p>
        </div>

        {/* Test Webhook */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-orange-800">
            Test Webhook Processing
          </label>
          <div className="flex gap-2">
            <select
              value={testTrack}
              onChange={(e) => setTestTrack(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="Money">Money</option>
              <option value="Relationships">Relationships</option>
              <option value="Discipline">Discipline</option>
              <option value="Ego">Ego</option>
            </select>
            <Button
              onClick={testWebhook}
              disabled={loading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Test Purchase Flow
            </Button>
          </div>
          <p className="text-xs text-orange-700">
            Simulates the complete webhook processing flow without requiring actual payment
          </p>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* KV Store Health */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {debugInfo.kvHealth.status === 'ok' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">KV Store</span>
                </div>
                <Badge variant={debugInfo.kvHealth.status === 'ok' ? 'default' : 'destructive'}>
                  {debugInfo.kvHealth.kv_store || debugInfo.kvHealth.status}
                </Badge>
              </div>

              {/* Purchases Count */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Purchases</span>
                </div>
                <Badge variant="outline">
                  {debugInfo.purchases.length} tracks
                </Badge>
              </div>

              {/* Profile Status */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Profile</span>
                </div>
                <Badge variant="outline">
                  {debugInfo.userProfile?.profile?.current_track || 'No active track'}
                </Badge>
              </div>
            </div>

            {/* Detailed Info */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-orange-800 mb-2">
                View Raw Debug Data
              </summary>
              <pre className="bg-white p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>

            {/* Purchase List */}
            {debugInfo.purchases.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-800 mb-2">Current Purchases:</p>
                <div className="flex flex-wrap gap-1">
                  {debugInfo.purchases.map((track, idx) => (
                    <Badge key={idx} variant="secondary">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Flow Trace Results */}
            {debugInfo.flowTrace && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-800">System Health Check:</span>
                  <Badge 
                    variant={
                      debugInfo.flowTrace.summary.overall_health === 'healthy' ? 'default' :
                      debugInfo.flowTrace.summary.overall_health === 'degraded' ? 'secondary' : 'destructive'
                    }
                  >
                    {debugInfo.flowTrace.summary.overall_health.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Steps: {debugInfo.flowTrace.summary.successful_steps}/{debugInfo.flowTrace.summary.total_steps}</div>
                  <div>Errors: {debugInfo.flowTrace.summary.errors_found}</div>
                  <div>Status: {debugInfo.flowTrace.summary.overall_health}</div>
                </div>
                
                {/* Step Results */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-800">Step Details:</p>
                  <div className="space-y-1">
                    {debugInfo.flowTrace.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {step.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : step.status === 'failed' ? (
                          <XCircle className="h-3 w-3 text-red-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-gray-500" />
                        )}
                        <span className="font-medium">{step.step.replace(/_/g, ' ')}</span>
                        {step.count !== undefined && <span>({step.count} items)</span>}
                        {step.error && <span className="text-red-600">- {step.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Recommendations */}
                {debugInfo.flowTrace.summary.recommendations?.length > 0 && (
                  <Alert className="border-purple-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {debugInfo.flowTrace.summary.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Analysis and Warnings */}
            {debugInfo.debugData?.debug?.analysis && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-800">Analysis:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total Payments: {debugInfo.debugData.debug.analysis.totalPayments}</div>
                  <div>Successful: {debugInfo.debugData.debug.analysis.successfulPayments}</div>
                  <div>Failed: {debugInfo.debugData.debug.analysis.failedPayments}</div>
                  <div>Current Purchases: {debugInfo.purchases.length}</div>
                </div>
                
                {debugInfo.debugData.debug.analysis.purchasesMightBeMissing && (
                  <Alert className="border-orange-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Issue Detected:</strong> You have successful payments but some tracks might be missing from your purchases. 
                      Try the "Recover Missing Purchases" button above.
                    </AlertDescription>
                  </Alert>
                )}
                
                {debugInfo.debugData.debug.failedPayments?.length > 0 && (
                  <Alert className="border-red-300">
                    <AlertDescription className="text-sm">
                      <strong>Failed Payments Found:</strong> {debugInfo.debugData.debug.failedPayments.length} payment(s) 
                      failed during processing. Contact support with your Payment Intent ID for manual resolution.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <p className="text-xs text-orange-600">
              Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Troubleshooting Steps:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Run diagnostics to check system health</li>
              <li>Check if KV Store is healthy (green checkmark)</li>
              <li>Verify your purchase appears in the purchases list</li>
              <li>If purchase is missing, use manual verification with Payment Intent ID</li>
              <li>If issues persist, check browser console for detailed error logs</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}