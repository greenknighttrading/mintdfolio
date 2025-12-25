import React, { useState, useMemo } from 'react';
import { ArrowRight, DollarSign, Calendar, Scale, Check, AlertCircle } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { cn } from '@/lib/utils';
import { AllocationTarget, ALLOCATION_PRESETS, ALLOCATION_PRESET_INFO, AllocationPreset } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const CONTRIBUTION_PRESETS = [250, 500, 1000, 2500];
const TIMELINE_PRESETS = [3, 6, 12];

type RebalanceMode = 'monthly-budget' | 'target-date';

export function RebalanceSimulator() {
  const { allocation, summary, allocationTarget, allocationPreset, setAllocationPreset, setCustomTarget } = usePortfolio();
  
  // Pending custom allocation (independent sliders that don't auto-adjust)
  const [pendingAllocation, setPendingAllocation] = useState<AllocationTarget>(allocationTarget);
  // Applied custom allocation (what's actually used for analysis)
  const [appliedAllocation, setAppliedAllocation] = useState<AllocationTarget>(allocationTarget);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [targetMonths, setTargetMonths] = useState(6);
  const [rebalanceMode, setRebalanceMode] = useState<RebalanceMode>('monthly-budget');

  const totalValue = summary?.totalMarketValue || 0;

  // Calculate pending total
  const pendingTotal = pendingAllocation.sealed + pendingAllocation.slabs + pendingAllocation.rawCards;
  const isValidTotal = pendingTotal === 100;
  const hasUnappliedChanges = isCustomMode && (
    pendingAllocation.sealed !== appliedAllocation.sealed ||
    pendingAllocation.slabs !== appliedAllocation.slabs ||
    pendingAllocation.rawCards !== appliedAllocation.rawCards
  );

  const handleSliderChange = (category: keyof AllocationTarget, value: number[]) => {
    const newValue = value[0];
    // Independent slider - only update the category being changed
    setPendingAllocation(prev => ({
      ...prev,
      [category]: newValue,
    }));
    setIsCustomMode(true);
  };

  const handleApplyCustomAllocation = () => {
    if (isValidTotal) {
      setAppliedAllocation(pendingAllocation);
      setCustomTarget(pendingAllocation);
      setAllocationPreset('custom');
    }
  };

  const handlePresetClick = (presetKey: AllocationPreset) => {
    const presetAllocation = ALLOCATION_PRESETS[presetKey];
    setAllocationPreset(presetKey);
    setPendingAllocation(presetAllocation);
    setAppliedAllocation(presetAllocation);
    setCustomTarget(presetAllocation);
    setIsCustomMode(false);
  };

  const rebalanceAnalysis = useMemo(() => {
    if (!allocation) return null;

    const categories = [
      { key: 'sealed' as const, label: 'Sealed Products', current: allocation.sealed, target: appliedAllocation.sealed },
      { key: 'slabs' as const, label: 'Graded Cards', current: allocation.slabs, target: appliedAllocation.slabs },
      { key: 'rawCards' as const, label: 'Raw Cards', current: allocation.rawCards, target: appliedAllocation.rawCards },
    ];

    // Calculate total underweight amount (what needs to be added)
    const totalUnderweight = categories.reduce((sum, cat) => {
      const targetValue = (cat.target / 100) * totalValue;
      const delta = targetValue - cat.current.value;
      return sum + (delta > 0 ? delta : 0);
    }, 0);

    return categories.map(cat => {
      const currentValue = cat.current.value;
      const targetValue = (cat.target / 100) * totalValue;
      const delta = targetValue - currentValue;
      const deltaPercent = cat.target - cat.current.percent;

      // For monthly budget mode: calculate share of monthly budget
      const monthlyShare = deltaPercent > 0 && totalUnderweight > 0
        ? (delta / totalUnderweight) * monthlyBudget
        : 0;

      // For target date mode: calculate required monthly contribution
      const monthsToRebalance = targetMonths;
      const requiredMonthly = delta > 0 ? delta / monthsToRebalance : 0;

      // Calculate how many months needed at current monthly budget
      const monthsNeeded = delta > 0 && monthlyShare > 0 
        ? Math.ceil(delta / monthlyShare)
        : 0;

      return {
        ...cat,
        currentValue,
        targetValue,
        delta,
        deltaPercent,
        monthlyShare: Math.max(0, monthlyShare),
        requiredMonthly: Math.max(0, requiredMonthly),
        monthsNeeded,
        isOverweight: delta < -100,
        isUnderweight: delta > 100,
      };
    });
  }, [allocation, appliedAllocation, totalValue, monthlyBudget, targetMonths]);

  const totalMonthlyRequired = useMemo(() => {
    if (!rebalanceAnalysis) return 0;
    return rebalanceAnalysis.reduce((sum, cat) => sum + cat.requiredMonthly, 0);
  }, [rebalanceAnalysis]);

  const estimatedMonthsToBalance = useMemo(() => {
    if (!rebalanceAnalysis) return 0;
    const maxMonths = Math.max(...rebalanceAnalysis.map(cat => cat.monthsNeeded));
    return maxMonths;
  }, [rebalanceAnalysis]);

  const presets: { key: AllocationPreset; label: string; description: string; title: string }[] = [
    { key: 'conservative', label: 'Conservative', ...ALLOCATION_PRESET_INFO.conservative },
    { key: 'balanced', label: 'Balanced', ...ALLOCATION_PRESET_INFO.balanced },
    { key: 'aggressive', label: 'Aggressive', ...ALLOCATION_PRESET_INFO.aggressive },
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
              onClick={() => handlePresetClick(preset.key)}
              className={cn(
                "px-4 py-3 rounded-xl transition-all duration-200 text-left min-w-[140px]",
                allocationPreset === preset.key && !isCustomMode
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <p className="font-medium">{preset.label}</p>
              <p className={cn(
                "text-xs mt-0.5",
                allocationPreset === preset.key && !isCustomMode ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {preset.title} • {preset.description}
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
                  {pendingAllocation[cat.key]}%
                </span>
              </div>
              <Slider
                value={[pendingAllocation[cat.key]]}
                onValueChange={(value) => handleSliderChange(cat.key, value)}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Total Indicator and Custom Allocation Button */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className={cn(
                "text-lg font-bold tabular-nums",
                isValidTotal ? "text-success" : "text-destructive"
              )}>
                {pendingTotal}%
              </span>
              {isValidTotal ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
            {isCustomMode && !isValidTotal && (
              <span className="text-xs text-destructive">
                Must equal 100% ({pendingTotal > 100 ? `-${pendingTotal - 100}%` : `+${100 - pendingTotal}%`})
              </span>
            )}
          </div>
          
          {isCustomMode ? (
            <Button
              onClick={handleApplyCustomAllocation}
              disabled={!isValidTotal || !hasUnappliedChanges}
              className="w-full"
              variant={hasUnappliedChanges && isValidTotal ? "default" : "secondary"}
            >
              {hasUnappliedChanges && isValidTotal ? "Apply Custom Allocation" : 
               !isValidTotal ? "Allocation must equal 100%" : "Custom Allocation Applied"}
            </Button>
          ) : (
            <div className="w-full px-4 py-3 rounded-lg bg-secondary/50 text-center">
              <span className="text-sm text-muted-foreground">Using default allocation</span>
            </div>
          )}
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

      {/* Rebalancing Mode Selector */}
      <div className="glass-card p-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">
          <span className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Rebalancing Strategy
          </span>
        </h2>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-secondary rounded-xl mb-6">
          <button
            onClick={() => setRebalanceMode('monthly-budget')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              rebalanceMode === 'monthly-budget'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="w-4 h-4" />
            Monthly Budget
          </button>
          <button
            onClick={() => setRebalanceMode('target-date')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              rebalanceMode === 'target-date'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4" />
            Target Date
          </button>
        </div>

        {/* Monthly Budget Mode */}
        {rebalanceMode === 'monthly-budget' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                How much can you invest each month toward rebalancing?
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {CONTRIBUTION_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setMonthlyBudget(amount)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      monthlyBudget === amount
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    ${amount.toLocaleString()}/mo
                  </button>
                ))}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 bg-transparent text-sm text-foreground focus:outline-none tabular-nums"
                    placeholder="Custom"
                  />
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </div>
            </div>

            {/* Monthly Allocation Breakdown */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Suggested monthly allocation:
              </p>
              
              <div className="grid gap-3">
                {rebalanceAnalysis
                  .filter(cat => cat.monthlyShare > 0)
                  .sort((a, b) => b.monthlyShare - a.monthlyShare)
                  .map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <span className="text-sm text-foreground">{cat.label}</span>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        ${Math.round(cat.monthlyShare).toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
              </div>

              {rebalanceAnalysis.every(cat => cat.monthlyShare === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Your portfolio is already balanced according to your targets.
                </p>
              )}
            </div>

            {/* Timeline Estimate */}
            {estimatedMonthsToBalance > 0 && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Estimated time to balance:</span>{' '}
                  <span className="text-primary font-semibold">
                    {estimatedMonthsToBalance} month{estimatedMonthsToBalance > 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  At ${monthlyBudget.toLocaleString()}/month contribution rate
                </p>
              </div>
            )}
          </div>
        )}

        {/* Target Date Mode */}
        {rebalanceMode === 'target-date' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                When do you want to reach your target allocation?
              </p>
              
              <div className="flex gap-3 mb-4">
                {TIMELINE_PRESETS.map((months) => (
                  <button
                    key={months}
                    onClick={() => setTargetMonths(months)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl transition-all duration-200 text-center",
                      targetMonths === months
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <p className="font-medium">{months} Months</p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      targetMonths === months ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {months === 3 ? 'Aggressive' : months === 6 ? 'Moderate' : 'Gradual'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Required Monthly Contributions */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Required monthly investment:
              </p>
              
              <div className="grid gap-3">
                {rebalanceAnalysis
                  .filter(cat => cat.requiredMonthly > 0)
                  .sort((a, b) => b.requiredMonthly - a.requiredMonthly)
                  .map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <div>
                        <span className="text-sm text-foreground">{cat.label}</span>
                        <p className="text-xs text-muted-foreground">
                          Need ${Math.round(cat.delta).toLocaleString()} total
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        ${Math.round(cat.requiredMonthly).toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
              </div>

              {rebalanceAnalysis.every(cat => cat.requiredMonthly === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Your portfolio is already balanced according to your targets.
                </p>
              )}
            </div>

            {/* Total Required */}
            {totalMonthlyRequired > 0 && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Total monthly investment:</span>{' '}
                  <span className="text-primary font-semibold">
                    ${Math.round(totalMonthlyRequired).toLocaleString()}/month
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  To reach your target allocation in {targetMonths} months
                </p>
              </div>
            )}

            {/* Timeline Description */}
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {targetMonths === 3 && "A 3-month timeline requires larger monthly investments but gets you to your target quickly. Consider whether market conditions support this aggressive approach."}
                {targetMonths === 6 && "A 6-month timeline balances urgency with flexibility. You can adjust based on market opportunities while making steady progress."}
                {targetMonths === 12 && "A 12-month timeline allows for smaller monthly contributions and more opportunistic timing. Best for patient investors who want flexibility."}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
