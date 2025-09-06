import { useState, useEffect } from 'react';
import { ViewMode } from '../types/navigation';

export function useViewNavigation() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [prefillEmail, setPrefillEmail] = useState<string>('');

  // Handle URL parameters (e.g., Stripe success/cancel redirects) - only for unauthenticated users
  // Note: Authenticated users are handled in AppContent.tsx
  useEffect(() => {
    // Import supabase to check auth state
    import('../utils/supabase/client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Only process URL params if user is not authenticated
        if (!session?.user) {
          const urlParams = new URLSearchParams(window.location.search);
          const success = urlParams.get('success');
          const canceled = urlParams.get('canceled');
          const track = urlParams.get('track');

          if (success === 'true') {
            // Dynamically import toast to avoid bundle issues
            import('sonner@2.0.3').then(({ toast }) => {
              toast.success(`Payment successful! ${track ? `${track} track` : 'Track'} is now available. Please sign in to access it.`);
            });
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (canceled === 'true') {
            // Dynamically import toast to avoid bundle issues
            import('sonner@2.0.3').then(({ toast }) => {
              toast.info('Payment was canceled. You can try again anytime.');
            });
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      });
    });
  }, []);

  const navigateToLanding = () => {
    setViewMode('landing');
    setPrefillEmail('');
  };

  const navigateToLogin = (email?: string) => {
    setViewMode('login');
    if (email) setPrefillEmail(email);
  };

  const navigateToSignup = () => {
    setViewMode('signup');
    setPrefillEmail('');
  };

  return {
    viewMode,
    prefillEmail,
    navigateToLanding,
    navigateToLogin,
    navigateToSignup,
  };
}