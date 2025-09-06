import React from 'react';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onLogin?: () => void;
  onSignUp?: () => void;
}

export default function HeroSection({ onLogin, onSignUp }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/20" style={{ backgroundColor: 'var(--slate)' }}>
      <div className="absolute inset-0 bg-gradient-to-br" style={{ 
        background: `linear-gradient(to bottom right, var(--slate), var(--slate), hsl(from var(--slate) h s calc(l * 0.9)))` 
      }} />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        {/* Book Attribution Badge */}
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          <Badge 
            className="bg-primary text-primary-foreground border-0 text-sm px-4 py-1 font-medium"
          >
            From the book STOIC AF
          </Badge>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight text-slate-foreground">
            Stop Thinking.<br />
            Start Doing.<br />
            Get <span style={{ color: 'var(--accent)' }}>STOIC AF</span>.
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: 'hsl(from var(--slate-foreground) h s l / 0.8)' }}>
            30 days to unfuck your mind using daily Stoic quotes and modern truth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'var(--accent-foreground)' 
              }}
              className="hover:opacity-90 text-lg px-8 py-4 h-auto font-semibold"
              onClick={onSignUp}
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 h-auto font-semibold border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={onLogin}
            >
              I'm Already a Member
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}