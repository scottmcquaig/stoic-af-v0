import React from 'react';
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

interface FooterCTAProps {
  onSignUp?: () => void;
}

export default function FooterCTA({ onSignUp }: FooterCTAProps) {
  return (
    <section className="py-20 border-t border-border/20" style={{ backgroundColor: 'var(--slate)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-slate-foreground">
          30 Days. $4. No BS.
        </h2>
        <p className="text-xl mb-8" style={{ color: 'hsl(from var(--slate-foreground) h s l / 0.8)' }}>One-time payment. No subscriptions.</p>
        <p className="text-lg mb-8" style={{ color: 'hsl(from var(--slate-foreground) h s l / 0.6)' }}>
          Choose your track above and start your journey today.
        </p>
        <Button 
          size="lg" 
          style={{ 
            backgroundColor: 'var(--accent)', 
            color: 'var(--accent-foreground)' 
          }}
          className="hover:opacity-90 text-xl px-12 py-6 h-auto font-semibold"
          onClick={onSignUp}
        >
          Sign Up to Get Started
          <ArrowRight className="ml-2 h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}