import React from 'react';
import { pillars } from './data';

export default function SolutionSection() {
  return (
    <section className="py-20 bg-muted border-b border-border/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-4 text-foreground">
          Ancient Wisdom. Modern Language.
        </h2>
        <h3 className="text-2xl sm:text-3xl font-black text-center mb-16" style={{ color: 'var(--accent)' }}>
          Real Results.
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div key={index} className="text-center bg-card p-8 rounded-lg border border-border">
              <h4 className="text-xl font-black mb-4 text-foreground">{pillar.title}</h4>
              <p className="text-muted-foreground text-lg">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}