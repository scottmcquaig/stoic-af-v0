import React from 'react';
import { Card, CardContent } from "../ui/card";
import { problems } from './data';

export default function ProblemsSection() {
  return (
    <section className="py-20 bg-background border-b border-border/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-16 text-foreground">
          You Know What Your Problem Is?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <Card key={index} className="bg-card border-border hover:shadow-lg transition-all duration-300" style={{ borderColor: `hsl(from ${problem.color} h s l / 0.3)` }}>
                <CardContent className="p-6 text-center">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `hsl(from ${problem.color} h s l / 0.1)` }}
                  >
                    <Icon className="h-8 w-8" style={{ color: problem.color }} />
                  </div>
                  <p className="text-card-foreground font-medium">{problem.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}