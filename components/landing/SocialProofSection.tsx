import React from 'react';
import { Card, CardContent } from "../ui/card";
import { Star } from "lucide-react";
import { testimonials } from './data';

export default function SocialProofSection() {
  return (
    <section className="py-20 bg-muted border-b border-border/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center bg-card p-6 rounded-lg border border-border">
            <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>127</div>
            <div className="text-muted-foreground font-medium">Men Committed</div>
          </div>
          <div className="text-center bg-card p-6 rounded-lg border border-border">
            <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>1,840</div>
            <div className="text-muted-foreground font-medium">Days Completed</div>
          </div>
          <div className="text-center bg-card p-6 rounded-lg border border-border">
            <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>89%</div>
            <div className="text-muted-foreground font-medium">Finish Rate</div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4" style={{ fill: '#FFD700', color: '#FFD700' }} />
                  ))}
                </div>
                <p className="text-card-foreground mb-4">"{testimonial.text}"</p>
                <p className="text-muted-foreground">— {testimonial.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}