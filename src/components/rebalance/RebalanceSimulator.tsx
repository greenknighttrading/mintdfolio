import React, { useState, useMemo } from 'react';
import { ArrowRight, DollarSign, TrendingUp, Scale } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { cn } from '@/lib/utils';
import { AllocationTarget, ALLOCATION_PRESETS, AllocationPreset } from '@/lib/types';
import { Slider } from '@/components/ui/slider';

const CONTRIBUTION_PRESETS = [500, 1000, 2500, 5000];

export function RebalanceSimulator() {
  const { allocation, summary, allocationTarget, allocationPreset, setAllocationPreset, setCustomTarget } = usePortfolio();
  const [customAllocation, setCustomAllocation] = useState<AllocationTarget>(allocationTarget);
  const [contributionAmount, setContributionAmount] = useState(1000);
  const [timeline, setTimeline] = useState<3 | 6 | 12>(6);

  const totalValue = summary?.totalMarketValue || 0;

  const handleSliderChange = (category: keyof AllocationTarget, value: number[]) => {
    const newValue = value[0];
    const diff = newValue - customAllocation[category];
    
    // Distribute the difference among other categories
    const otherCategories = (['sealed', 'slabs', 'rawCards'] as const).filter(c => c !== category);
    const adjustment = diff / otherCategories.length;

    const newAllocation = {
      ...customAllocation,
      [category]: newValue,
    };

    otherCategories.forEach(cat => {
      newAllocation[cat] = Math.max(0, Math.min(100, customAllocation[cat] - adjustment));
    });

    // Normalize to ensure total = 100
    const total = newAllocation.sealed + newAllocation.slabs + newAllocation.rawCards;
    if (total !== 100) {
      const factor = 100 / total;
      newAllocation.sealed = Math.round(newAllocation.sealed * factor);
      newAllocation.slabs = Math.round(newAllocation.slabs * factor);
      newAllocation.rawCards = 100 - newAllocation.sealed - newAllocation.slabs;
    }

    setCustomAllocation(newAllocation);
    setCustomTarget(newAllocation);
  };

  const rebalanceAnalysis = useMemo(() => {
    if (!allocation) return null;

    const categories = [
      { key: 'sealed' as const, label: 'Sealed Products', current: allocation.sealed, target: customAllocation.sealed },
      { key: 'slabs' as const, label: 'Graded Cards', current: allocation.slabs, target: customAllocation.slabs },
      { key: 'rawCards' as const, label: 'Raw Cards', current: allocation.rawCards, target: customAllocation.rawCards },
    ];

    return categories.map(cat => {
      const currentValue = cat.current.value;
      const targetValue = (cat.target / 100) * totalValue;
      const delta = targetValue - currentValue;
      const deltaPercent = cat.target - cat.current.percent;

      // Calculate contribution allocation
      const contributionShare = deltaPercent > 0 
        ? (deltaPercent / categories.filter(c => (c.target - c.current.percent) > 0).reduce((sum, c) => sum + (c.target - c.current.percent), 0)) * contributionAmount
        : 0;

      return {
        ...cat,
        currentValue,
        targetValue,
        delta,
        deltaPercent,
        contributionShare: Math.max(0, contributionShare),
        isOverweight: delta < -100,
        isUnderweight: delta > 100,
      };
    });
  }, [allocation, customAllocation, totalValue, contributionAmount]);

  const presets: { key: AllocationPreset; label: string; description: string }[] = [
    { key: 'conservative', label: 'Conservative', description: '40/40/20' },
    { key: 'balanced', label: 'Balanced', description: '50/30/20' },
    { key: 'aggressive', label: 'Aggressive', description: '70/20/10' },
  ];

  if (!allocation || !rebalanceAnalysis) return null;

  return (
    <div className="space-y-8">
      {/* Target Allocation Controls */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground mb-6">Target Allocation</h2>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => {
                setAllocationPreset(preset.key);
                setCustomAllocation(ALLOCATION_PRESETS[preset.key]);
              }}
              className={cn(
                "px-4 py-3 rounded-xl transition-all duration-200 text-left",
                allocationPreset === preset.key
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <p className="font-medium">{preset.label}</p>
              <p className={cn(
                "text-xs mt-0.5",
                allocationPreset === preset.key ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {preset.description}
              </p>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {rebalanceAnalysis.map((cat) => (
            <div key={cat.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {customAllocation[cat.key]}%
                </span>
              </div>
              <Slider
                value={[customAllocation[cat.key]]}
                onValueChange={(value) => handleSliderChange(cat.key, value)}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Current vs Target Comparison */}
      <div className="glass-card p-6 animate-fade-in stagger-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">Rebalancing Analysis</h2>

        <div className="grid gap-4">
          {rebalanceAnalysis.map((cat) => (
            <div
              key={cat.key}
              className={cn(
                "p-4 rounded-xl border transition-colors",
                cat.isOverweight && "border-warning/30 bg-warning/5",
                cat.isUnderweight && "border-primary/30 bg-primary/5",
                !cat.isOverweight && !cat.isUnderweight && "border-border bg-secondary/30"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground">{cat.label}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="tabular-nums text-muted-foreground">
                    {cat.current.percent.toFixed(1)}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="tabular-nums font-medium text-foreground">
                    {cat.target}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ${cat.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  {' → '}
                  ${cat.targetValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className={cn(
                  "font-medium tabular-nums",
                  cat.delta > 0 ? "text-primary" : cat.delta < 0 ? "text-warning" : "text-muted-foreground"
                )}>
                  {cat.delta >= 0 ? '+' : ''}${cat.delta.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Simulator */}
      <div className="glass-card p-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">
          <span className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Redirect Next Contribution
          </span>
        </h2>

        {/* Amount Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CONTRIBUTION_PRESETS.map((amount) => (
            <button
              key={amount}
              onClick={() => setContributionAmount(amount)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                contributionAmount === amount
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              ${amount.toLocaleString()}
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Suggested Allocation */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Based on your targets, consider allocating your next ${contributionAmount.toLocaleString()}:
          </p>
          
          <div className="grid gap-3">
            {rebalanceAnalysis
              .filter(cat => cat.contributionShare > 0)
              .sort((a, b) => b.contributionShare - a.contributionShare)
              .map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <span className="text-sm text-foreground">{cat.label}</span>
                  <span className="text-sm font-medium text-primary tabular-nums">
                    ${Math.round(cat.contributionShare).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>

          {rebalanceAnalysis.every(cat => cat.contributionShare === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Your portfolio is already balanced according to your targets. Consider maintaining current allocation.
            </p>
          )}
        </div>
      </div>

      {/* Timeline Options */}
      <div className="glass-card p-6 animate-fade-in stagger-3" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">
          <span className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Rebalancing Timeline
          </span>
        </h2>

        <div className="flex gap-3 mb-6">
          {([3, 6, 12] as const).map((months) => (
            <button
              key={months}
              onClick={() => setTimeline(months)}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl transition-all duration-200 text-center",
                timeline === months
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <p className="font-medium">{months} Months</p>
              <p className={cn(
                "text-xs mt-0.5",
                timeline === months ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {months === 3 ? 'Aggressive' : months === 6 ? 'Moderate' : 'Gradual'}
              </p>
            </button>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-secondary/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {timeline === 3 && "A 3-month timeline suggests making larger individual moves. Consider whether market conditions support this approach."}
            {timeline === 6 && "A 6-month timeline balances urgency with market timing flexibility. Historically, gradual rebalancing reduces execution risk."}
            {timeline === 12 && "A 12-month timeline allows you to be opportunistic. You can wait for favorable entry points in underweight categories."}
          </p>
        </div>
      </div>
    </div>
  );
}
