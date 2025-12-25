import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { FileUpload } from '@/components/upload/FileUpload';
import { PortfolioSummaryCard } from '@/components/dashboard/PortfolioSummaryCard';
import { AllocationDonut } from '@/components/dashboard/AllocationDonut';
import { StatusChips } from '@/components/dashboard/StatusChips';
import { ConcentrationCard } from '@/components/dashboard/ConcentrationCard';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { StrengthsWeaknesses } from '@/components/dashboard/StrengthsWeaknesses';
import { TrendingUp, Shield, Lightbulb, Scale } from 'lucide-react';

export default function Index() {
  const { isDataLoaded, summary } = usePortfolio();

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Portfolio Coach
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Your personal CFO for collectibles. Make calmer, clearer decisions.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-6 animate-slide-up stagger-1" style={{ opacity: 0 }}>
            {[
              { icon: Shield, label: 'Risk Analysis', desc: 'Concentration & liquidity' },
              { icon: Lightbulb, label: 'Smart Insights', desc: 'Actionable guidance' },
              { icon: Scale, label: 'Rebalancing', desc: 'Target allocation' },
            ].map((feature) => (
              <div key={feature.label} className="text-center p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-secondary mb-3">
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-sm">{feature.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div className="animate-slide-up stagger-2" style={{ opacity: 0 }}>
            <FileUpload />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground animate-fade-in stagger-3" style={{ opacity: 0 }}>
            Your data stays in your browser. We never store or transmit your portfolio information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your collectible portfolio
          </p>
        </div>
        <StatusChips />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Column (Summary + Allocation + Strengths flush) */}
        <div className="lg:col-span-2 flex flex-col">
          <PortfolioSummaryCard />
          <div className="mt-4">
            <AllocationDonut />
          </div>
          <div className="mt-0">
            <StrengthsWeaknesses />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {summary && <HealthScoreCard score={summary.healthScore} />}
          <ConcentrationCard />
        </div>
      </div>
    </div>
  );
}
