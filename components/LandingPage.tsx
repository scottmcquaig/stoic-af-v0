import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  DollarSign, 
  Heart, 
  Target, 
  Brain, 
  ArrowRight,
  Star,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";

interface LandingPageProps {
  onLogin?: () => void;
  onSignUp?: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps = {}) {
  const tracks = [
    {
      icon: DollarSign,
      name: "Money",
      title: "Master Your Wealth Mindset",
      description: "Stop being broke in your mind before your wallet",
      color: "var(--track-money)",
      preview: [
        "Identify toxic money beliefs",
        "Build abundance mindset", 
        "Control spending impulses"
      ]
    },
    {
      icon: Heart,
      name: "Relationships", 
      title: "Control Yourself, Not Others",
      description: "The problem isn't them. It's how you react to them.",
      color: "var(--track-relationships)",
      preview: [
        "Set real boundaries",
        "Stop people-pleasing",
        "Communicate like an adult"
      ]
    },
    {
      icon: Target,
      name: "Discipline",
      title: "Build Unbreakable Habits", 
      description: "Motivation is trash. Discipline is forever.",
      color: "var(--track-discipline)",
      preview: [
        "Master your mornings",
        "Defeat procrastination",
        "Build compound habits"
      ]
    },
    {
      icon: Brain,
      name: "Ego",
      title: "Get Out of Your Own Way",
      description: "Your biggest enemy looks at you in the mirror",
      color: "var(--track-ego)", 
      preview: [
        "Identify ego traps",
        "Build real confidence", 
        "Accept harsh truths"
      ]
    }
  ];

  const problems = [
    {
      icon: DollarSign,
      text: "Your relationship with money is toxic"
    },
    {
      icon: Users,
      text: "You can't control your reactions to people"
    },
    {
      icon: Target,
      text: "Your discipline is weaker than gas station coffee"
    },
    {
      icon: Brain,
      text: "Your ego is writing checks your skills can't cash"
    }
  ];

  const pillars = [
    {
      title: "Ancient Wisdom",
      description: "Daily Stoic quotes translated into language you actually understand"
    },
    {
      title: "Real Challenges", 
      description: "Practical challenges that force you to face your BS"
    },
    {
      title: "Lasting Change",
      description: "Evening reflections that cement real change"
    }
  ];

  const testimonials = [
    {
      name: "Marcus K.",
      text: "30 days later, I'm not the same guy. This shit actually works.",
      rating: 5
    },
    {
      name: "David R.", 
      text: "Finally, self-help that doesn't make me want to throw up.",
      rating: 5
    },
    {
      name: "Jake M.",
      text: "Brutal honesty + ancient wisdom = game changer.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--slate)' }}>
        <div className="absolute inset-0 bg-gradient-to-br" style={{ 
          background: `linear-gradient(to bottom right, var(--slate), var(--slate), hsl(from var(--slate) h s calc(l * 0.9)))` 
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight text-slate-foreground">
              Stop Thinking.<br />
              Start Doing.<br />
              Get <span style={{ color: 'var(--accent)' }}>STOIC AF</span>.
            </h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: 'hsl(from var(--slate-foreground) h s l / 0.8)' }}>
              30 days to unfuck your mind using ancient wisdom and modern truth
            </p>
            <Button 
              size="lg" 
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'var(--accent-foreground)' 
              }}
              className="hover:opacity-90 text-lg px-8 py-4 h-auto font-semibold"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-16 text-foreground">
            You Know What Your Problem Is?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <Card key={index} className="bg-card border-border hover:shadow-lg transition-all duration-300" style={{ borderColor: 'hsl(from var(--accent) h s l / 0.3)' }}>
                  <CardContent className="p-6 text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(from var(--accent) h s l / 0.1)' }}
                    >
                      <Icon className="h-8 w-8" style={{ color: 'var(--accent)' }} />
                    </div>
                    <p className="text-card-foreground font-medium">{problem.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Track Preview Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-16 text-foreground">
            Choose Your Battle
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tracks.map((track, index) => {
              const Icon = track.icon;
              return (
                <Card 
                  key={index} 
                  className="bg-card border-border hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `hsl(from ${track.color} h s l / 0.1)` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: track.color }} />
                      </div>
                      <div className="flex-1">
                        <Badge 
                          variant="outline" 
                          className="mb-2"
                          style={{ borderColor: track.color, color: track.color }}
                        >
                          {track.name}
                        </Badge>
                        <h3 className="text-xl font-black text-card-foreground mb-2">{track.title}</h3>
                        <p className="text-muted-foreground mb-4">{track.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {track.preview.map((item, idx) => (
                        <li key={idx} className="text-muted-foreground flex items-center">
                          <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: track.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full hover:opacity-90"
                      style={{ 
                        borderColor: track.color, 
                        color: track.color,
                        '--tw-bg-opacity': '1'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = track.color;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = track.color;
                      }}
                    >
                      Day 1 Preview
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center bg-card p-6 rounded-lg border border-border">
              <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>2,847</div>
              <div className="text-muted-foreground font-medium">Men Committed</div>
            </div>
            <div className="text-center bg-card p-6 rounded-lg border border-border">
              <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>84,210</div>
              <div className="text-muted-foreground font-medium">Days Completed</div>
            </div>
            <div className="text-center bg-card p-6 rounded-lg border border-border">
              <div className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>97%</div>
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
                      <Star key={i} className="h-4 w-4" style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
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

      {/* Footer CTA */}
      <section className="py-20" style={{ backgroundColor: 'var(--slate)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-slate-foreground">
            First 3 Days Free. No BS.
          </h2>
          <p className="text-xl mb-8" style={{ color: 'hsl(from var(--slate-foreground) h s l / 0.8)' }}>Cancel Anytime.</p>
          <Button 
            size="lg" 
            style={{ 
              backgroundColor: 'var(--accent)', 
              color: 'var(--accent-foreground)' 
            }}
            className="hover:opacity-90 text-xl px-12 py-6 h-auto font-semibold"
          >
            Start Day 1 Now
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>
    </div>
  );
}