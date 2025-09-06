import React, { useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function DemoAccountSetup() {
  useEffect(() => {
    const setupDemo = async () => {
      try {
        console.log('🎭 Setting up demo account...');
        
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/dev/create-demo-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Demo account ready:', result.credentials);
        } else {
          console.log('📝 Demo account setup info:', result.message || result.error);
        }
      } catch (error) {
        console.log('Demo setup (non-critical):', error);
      }
    };

    // Set up demo account after a short delay
    const timer = setTimeout(setupDemo, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}