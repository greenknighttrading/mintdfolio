import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { FileUpload } from '@/components/upload/FileUpload';
import { PortfolioSummaryCard } from '@/components/dashboard/PortfolioSummaryCard';
import { AllocationDonut } from '@/components/dashboard/AllocationDonut';
import { EraAllocationDonut } from '@/components/dashboard/EraAllocationDonut';
import { StatusChips } from '@/components/dashboard/StatusChips';
import { ConcentrationCard } from '@/components/dashboard/ConcentrationCard';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { StrengthsWeaknesses } from '@/components/dashboard/StrengthsWeaknesses';
import { TrendingUp, Shield, Lightbulb, Scale } from 'lucide-react';

export default function Index() {
  const { isDataLoaded, summary, healthScoreBreakdown } = usePortfolio();

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
              PokeIQ
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Like having a Pokémon financial advisor on demand.
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
            
            {/* Manual Entry Link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  const csvContent = `"Set","Product Name","Grade","Card Condition","Average Cost Paid","Quantity","Market Price","Date Purchased"
"REQUIRED: Set/Series name","REQUIRED: Product or card name","Leave blank if not graded (e.g., PSA 10, BGS 9.5)","Leave blank if sealed (e.g., NM, LP, MP)","Your cost per unit (optional - leave blank if unknown)","REQUIRED: How many you own","REQUIRED: Current market value per unit","When purchased (optional, YYYY-MM-DD)"
"Scarlet & Violet 151","Booster Box","","","89.99","2","159.99","2023-12-01"
"Crown Zenith","Charizard VSTAR #GG70","PSA 10","","150.00","1","285.00","2024-02-14"
"Evolving Skies","Umbreon V Alt Art #215","","NM","45.00","1","180.00",""`;
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mintdfolio-template.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                Don't have Collectr? Manually enter data & Upload CSV →
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground animate-fade-in stagger-3 max-w-md mx-auto leading-relaxed" style={{ opacity: 0 }}>
            Your data is processed privately and never shared. We do not sell or distribute portfolio information. Any improvements to the system use aggregated, non-identifiable data.
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
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <AllocationDonut />
            <EraAllocationDonut />
          </div>
          <div className="mt-0">
            <StrengthsWeaknesses />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {summary && (
            <HealthScoreCard 
              score={healthScoreBreakdown?.overall ?? summary.healthScore} 
              breakdown={healthScoreBreakdown}
            />
          )}
          <ConcentrationCard />
        </div>
      </div>
    </div>
  );
}
