import { DollarSign, Heart, Target, Brain, Users } from "lucide-react";

export const tracks = [
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

export const problems = [
  {
    icon: DollarSign,
    text: "Your relationship with money is toxic",
    color: "var(--track-money)" // Green
  },
  {
    icon: Users,
    text: "You can't control your reactions to people",
    color: "var(--track-relationships)" // Red
  },
  {
    icon: Target,
    text: "Your discipline is weaker than gas station coffee",
    color: "var(--track-discipline)" // Blue
  },
  {
    icon: Brain,
    text: "Your ego is writing checks your skills can't cash",
    color: "var(--track-ego)" // Purple
  }
];

export const pillars = [
  {
    title: "Ancient Wisdom",
    description: "Daily Stoic quotes translated into modern language"
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

export const testimonials = [
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
    text: "Brutal honesty + daily Stoic quotes = game changer.",
    rating: 5
  }
];