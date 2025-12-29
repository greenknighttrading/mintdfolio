import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, DollarSign, Calendar, Clock, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { cn } from '@/lib/utils';
import { 
  EraAllocationTarget, 
  ERA_ALLOCATION_PRESETS, 
  ERA_ALLOCATION_PRESET_INFO, 
  EraAllocationPreset,
  ERA_INFO,
  PokemonEra
} from '@/lib/types';
import { calculateEraAllocationBreakdown, generateEraHealthWarnings, getNewerEraStatus } from '@/lib/eraClassification';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CONTRIBUTION_PRESETS = [250, 500, 1000, 2500];
const TIMELINE_PRESETS = [3, 6, 12];

type RebalanceMode = 'monthly-budget' | 'target-date';

const ERA_ORDER: PokemonEra[] = ['current', 'ultraModern', 'modern', 'classic', 'vintage'];

export function EraRebalanceSimulator() {
  const { items, summary, eraAllocationTarget, eraAllocationPreset, setEraAllocationPreset, setCustomEraTarget } = usePortfolio();
  
  // Pending custom allocation (independent sliders that don't auto-adjust)
  const [pendingAllocation, setPendingAllocation] = useState<EraAllocationTarget>(eraAllocationTarget);
  // Applied custom allocation (what's actually used for analysis)
  const [appliedAllocation, setAppliedAllocation] = useState<EraAllocationTarget>(eraAllocationTarget);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [targetMonths, setTargetMonths] = useState(6);
  const [rebalanceMode, setRebalanceMode] = useState<RebalanceMode>('monthly-budget');

  const totalValue = summary?.totalMarketValue || 0;

  // Sync local state with context's eraAllocationTarget when it changes
  useEffect(() => {
    if (!isCustomMode) {
      setPendingAllocation(eraAllocationTarget);
      setAppliedAllocation(eraAllocationTarget);
    }
  }, [eraAllocationTarget, isCustomMode]);
  // Calculate era allocation from portfolio items
  const eraAllocation = useMemo(() => {
    return calculateEraAllocationBreakdown(items);
  }, [items]);

  // Calculate pending total
  const pendingTotal = pendingAllocation.vintage + pendingAllocation.classic + pendingAllocation.modern + 
                       pendingAllocation.ultraModern + pendingAllocation.current;
  const isValidTotal = pendingTotal === 100;
  const hasUnappliedChanges = isCustomMode && (
    pendingAllocation.vintage !== appliedAllocation.vintage ||
    pendingAllocation.classic !== appliedAllocation.classic ||
    pendingAllocation.modern !== appliedAllocation.modern ||
    pendingAllocation.ultraModern !== appliedAllocation.ultraModern ||
    pendingAllocation.current !== appliedAllocation.current
  );

  // Check if target Current > 10%
  const isCurrentTargetHigh = pendingAllocation.current > 10;

  const handleSliderChange = (category: keyof EraAllocationTarget, value: number[]) => {
    const newValue = value[0];
    setPendingAllocation(prev => ({
      ...prev,
      [category]: newValue,
    }));
    setIsCustomMode(true);
  };

  const handleApplyCustomAllocation = () => {
    if (isValidTotal) {
      setAppliedAllocation(pendingAllocation);
      setCustomEraTarget(pendingAllocation);
    }
  };

  const handlePresetClick = (presetKey: EraAllocationPreset) => {
    const presetAllocation = ERA_ALLOCATION_PRESETS[presetKey];
    setIsCustomMode(false);
    setEraAllocationPreset(presetKey);
    setPendingAllocation(presetAllocation);
    setAppliedAllocation(presetAllocation);
  };

  const rebalanceAnalysis = useMemo(() => {
    if (!eraAllocation) return null;

    const categories = ERA_ORDER.map(era => ({
      key: era,
      label: ERA_INFO[era].name,
      years: ERA_INFO[era].years,
      description: ERA_INFO[era].description,
      current: eraAllocation[era],
      target: appliedAllocation[era],
    }));

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
  }, [eraAllocation, appliedAllocation, totalValue, monthlyBudget, targetMonths]);

  // Health warnings
  const healthWarnings = useMemo(() => {
    return generateEraHealthWarnings(eraAllocation, appliedAllocation);
  }, [eraAllocation, appliedAllocation]);

  const newerEraStatus = useMemo(() => {
    return getNewerEraStatus(eraAllocation);
  }, [eraAllocation]);

  const totalMonthlyRequired = useMemo(() => {
    if (!rebalanceAnalysis) return 0;
    return rebalanceAnalysis.reduce((sum, cat) => sum + cat.requiredMonthly, 0);
  }, [rebalanceAnalysis]);

  const estimatedMonthsToBalance = useMemo(() => {
    if (!rebalanceAnalysis) return 0;
    const maxMonths = Math.max(...rebalanceAnalysis.map(cat => cat.monthsNeeded));
    return maxMonths;
  }, [rebalanceAnalysis]);

  const presets: { key: EraAllocationPreset; label: string; description: string; title: string }[] = [
    { key: 'conservative', label: 'Conservative', ...ERA_ALLOCATION_PRESET_INFO.conservative },
    { key: 'balanced', label: 'Balanced', ...ERA_ALLOCATION_PRESET_INFO.balanced },
    { key: 'aggressive', label: 'Aggressive', ...ERA_ALLOCATION_PRESET_INFO.aggressive },
  ];

  if (!eraAllocation || !rebalanceAnalysis) return null;

  return (
    <div className="space-y-8">
      {/* Health Status Indicators */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex flex-wrap gap-3">
          {/* Newer Era Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
            newerEraStatus.status === 'healthy' && "bg-success/10 text-success",
            newerEraStatus.status === 'high' && "bg-warning/10 text-warning",
            newerEraStatus.status === 'low' && "bg-muted text-muted-foreground"
          )}>
            {newerEraStatus.status === 'healthy' ? (
              <Check className="w-4 h-4" />
            ) : newerEraStatus.status === 'high' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <span>{newerEraStatus.text}</span>
          </div>

          {/* Warnings */}
          {healthWarnings.map((warning, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                warning.severity === 'warning' && "bg-warning/10 text-warning",
                warning.severity === 'info' && "bg-muted text-muted-foreground"
              )}
            >
              {warning.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Allocation Controls */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground mb-6">Target Era Allocation</h2>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset.key)}
              className={cn(
                "px-4 py-3 rounded-xl transition-all duration-200 text-left min-w-[140px]",
                eraAllocationPreset === preset.key && !isCustomMode
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <p className="font-medium">{preset.label}</p>
              <p className={cn(
                "text-xs mt-0.5",
                eraAllocationPreset === preset.key && !isCustomMode ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {preset.title} • {preset.description}
              </p>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {ERA_ORDER.map((era) => (
            <div key={era} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{ERA_INFO[era].name}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground">({ERA_INFO[era].years})</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{ERA_INFO[era].description}</p>
                      {era === 'current' && (
                        <p className="text-xs text-muted-foreground mt-1">Rolling 12-month window of active releases</p>
                      )}
                      {(era === 'vintage' || era === 'classic') && (
                        <p className="text-xs text-muted-foreground mt-1">Older-era stability anchor</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  {era === 'current' && isCurrentTargetHigh && (
                    <span className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Above 10% increases risk
                    </span>
                  )}
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {pendingAllocation[era]}%
                </span>
              </div>
              <Slider
                value={[pendingAllocation[era]]}
                onValueChange={(value) => handleSliderChange(era, value)}
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
              <span className="text-sm text-muted-foreground">Using {eraAllocationPreset} allocation</span>
            </div>
          )}
        </div>
      </div>

      {/* Current vs Target Comparison */}
      <div className="glass-card p-6 animate-fade-in stagger-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">Era Rebalancing Analysis</h2>

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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">({cat.years})</span>
                </div>
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
              
              <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>

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
            <Clock className="w-5 h-5 text-primary" />
            Rebalance Calculator
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
                How much can you invest each month toward rebalancing your era exposure?
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
                Suggested monthly allocation by era:
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
                      <div>
                        <span className="text-sm text-foreground">{cat.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({cat.years})</span>
                      </div>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        ${Math.round(cat.monthlyShare).toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
              </div>

              {rebalanceAnalysis.every(cat => cat.monthlyShare === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Your portfolio is already balanced according to your era targets.
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
                When do you want to reach your target era allocation?
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
                      {months === 3 && 'Quick adjustment'}
                      {months === 6 && 'Moderate pace'}
                      {months === 12 && 'Patient approach'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Required Monthly by Era */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Required monthly investment per era:
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
                        <span className="text-xs text-muted-foreground ml-2">({cat.years})</span>
                      </div>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        ${Math.round(cat.requiredMonthly).toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
              </div>

              {rebalanceAnalysis.every(cat => cat.requiredMonthly === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Your portfolio is already balanced according to your era targets.
                </p>
              )}
            </div>

            {/* Total Required */}
            {totalMonthlyRequired > 0 && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Total monthly investment needed:</span>{' '}
                  <span className="text-primary font-semibold">
                    ${Math.round(totalMonthlyRequired).toLocaleString()}/mo
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  To reach your target era allocation in {targetMonths} months
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investment Philosophy Note */}
      <div className="glass-card p-4 animate-fade-in stagger-3" style={{ opacity: 0 }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Time horizon beats product selection.</strong> The biggest edge 
              in Pokémon investing is staying invested long enough for fundamentals to matter.
            </p>
            <p>
              Vintage and Classic eras anchor portfolios with fixed scarcity. Modern, Ultra Modern, and Current 
              offer growth potential but require patience through volatility. A balanced approach combines 
              newer-era opportunity with older-era stability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
