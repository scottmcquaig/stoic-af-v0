import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppContent from './components/AppContent';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}