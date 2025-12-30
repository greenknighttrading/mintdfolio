import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Vote, Flame, Briefcase, ScrollText, ChevronRight, Target, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';

const collectorRoles = [
  {
    emoji: '🛡️',
    icon: Shield,
    name: 'The Sentinel',
    tagline: 'Guardian of time and scarcity',
    description: 'Calm, patient, sealed-heavy. You trust time more than timing and believe the strongest move is often no move at all.',
    strength: 'Discipline',
    tradeoff: 'Liquidity and speed'
  },
  {
    emoji: '🗳️',
    icon: Vote,
    name: 'The Politician',
    tagline: 'Master of balance and negotiation',
    description: "Evenly allocated and adaptable. You manage trade-offs instead of chasing absolutes and stay resilient through changing conditions.",
    strength: 'Resilience',
    tradeoff: 'Rarely all-in on one idea'
  },
  {
    emoji: '🔥',
    icon: Flame,
    name: 'The Purist',
    tagline: 'Devotee of conviction and aesthetics',
    description: "Emotion-driven and belief-led. You collect what resonates, not what optimizes. Your collection is personal — and that's the point.",
    strength: 'Authentic conviction',
    tradeoff: 'Higher variance'
  },
  {
    emoji: '💼',
    icon: Briefcase,
    name: 'The Hustler',
    tagline: 'Operator of volume and repetition',
    description: 'Active and process-driven. You stack small edges, stay in motion, and trust consistency over perfection.',
    strength: 'Momentum through action',
    tradeoff: 'Burnout and thin margins'
  },
  {
    emoji: '📜',
    icon: ScrollText,
    name: 'The Archivist',
    tagline: 'Keeper of history',
    description: 'Vintage-focused and hype-averse. You collect what lasts, building a library rather than a trading desk.',
    strength: 'Stability',
    tradeoff: 'Slower growth cycles'
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            PokeIQ
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Understand how you collect. Optimize how you buy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Sign Up Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Problem & Value Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-xl md:text-2xl text-foreground leading-relaxed">
            Most Pokémon collectors don't actually know what kind of collector they are — they just buy more cards.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            PokeIQ starts by identifying your collector personality — how you naturally approach risk, nostalgia, and conviction — so you understand yourself before you try to optimize anything.
          </p>
        </div>
      </section>

      {/* Collector Personality Roles */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-bold">Every collector has a natural role they gravitate toward.</h2>
            <p className="text-lg text-muted-foreground">There's no "best" role — but there is misalignment.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectorRoles.map((role) => (
              <div 
                key={role.name}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{role.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{role.name}</h3>
                    <p className="text-sm text-primary">{role.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {role.description}
                </p>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-success">Strength:</span>{' '}
                    <span className="text-foreground">{role.strength}</span>
                  </div>
                  <div>
                    <span className="text-warning">Trade-off:</span>{' '}
                    <span className="text-foreground">{role.tradeoff}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Intelligence */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Once your role is clear, PokeIQ breaks down your portfolio and shows:</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: AlertTriangle, text: 'where you\'re over-concentrated' },
              { icon: Target, text: 'where you\'re underexposed' },
              { icon: TrendingUp, text: 'what\'s driving returns' },
              { icon: PieChart, text: 'what\'s quietly adding risk' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budgeting & Allocation */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Then it handles the part most collectors skip: intentional budgeting.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Set allocation targets across sealed, singles, slabs, vintage, and modern.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Before you buy anything, PokeIQ shows whether that purchase pulls you toward or away from your stated goals.
          </p>
        </div>
      </section>

      {/* Screenshots Placeholder */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">See PokeIQ in Action</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'Collector Role Result', caption: 'Discover your unique collector personality and what it says about your approach.' },
              { title: 'Portfolio Health Score', caption: 'Get a comprehensive breakdown of your allocation across asset types and eras.' },
              { title: 'Concentration & Risk Analysis', caption: 'Identify where your portfolio is over-concentrated and potential blind spots.' },
              { title: 'Final Portfolio Report', caption: 'Receive actionable insights with charts and written recommendations.' }
            ].map((screen, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Screenshot: {screen.title}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{screen.title}</h3>
                  <p className="text-sm text-muted-foreground">{screen.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Collect With Clarity</h2>
          <p className="text-xl text-muted-foreground">Stop guessing. Start collecting with intention.</p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 py-6 mt-4">
              Sign Up Now
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Free to try. No hype. Built for collectors who want conviction.
          </p>
        </div>
      </section>
    </div>
  );
}
