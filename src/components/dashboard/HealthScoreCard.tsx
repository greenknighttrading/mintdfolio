import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, TrendingDown, Minus, Info, Package, Clock, Target } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HealthScoreBreakdown } from '@/contexts/PortfolioContext';

interface HealthScoreCardProps {
  score: number;
  breakdown?: HealthScoreBreakdown | null;
}

function getScoreGrade(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-success', bgColor: 'bg-success/10' };
  if (score >= 65) return { label: 'Good', color: 'text-primary', bgColor: 'bg-primary/10' };
  if (score >= 50) return { label: 'Fair', color: 'text-warning', bgColor: 'bg-warning/10' };
  if (score >= 35) return { label: 'Needs Attention', color: 'text-warning', bgColor: 'bg-warning/10' };
  return { label: 'At Risk', color: 'text-destructive', bgColor: 'bg-destructive/10' };
}

function getScoreIcon(score: number) {
  if (score >= 65) return TrendingUp;
  if (score >= 40) return Minus;
  return TrendingDown;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 65) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function HealthScoreCard({ score, breakdown }: HealthScoreCardProps) {
  const displayScore = breakdown?.overall ?? score;
  const grade = getScoreGrade(displayScore);
  const ScoreIcon = getScoreIcon(displayScore);
  
  // Calculate stroke dasharray for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", grade.bgColor)}>
            <Heart className={cn("w-5 h-5", grade.color)} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Health Score</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs p-4">
              <p className="font-semibold mb-2">Multi-Dimensional Health Score:</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <Package className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span><strong>Asset Allocation (45%):</strong> How well your sealed/slabs/raw mix matches target</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span><strong>Era Balance (35%):</strong> Distribution across vintage to current eras</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span><strong>Concentration (20%):</strong> Diversification across different sets</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                A balanced portfolio across all dimensions scores highest.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={displayScore >= 65 ? 'hsl(var(--success))' : displayScore >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums", grade.color)}>
              {displayScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Grade Label */}
        <div className="flex-1">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-3",
            grade.bgColor, grade.color
          )}>
            <ScoreIcon className="w-3.5 h-3.5" />
            {grade.label}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on asset allocation, era balance, and set concentration.
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      {breakdown && (
        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3 h-3" />
                Asset Allocation
              </span>
              <span className={cn("font-medium tabular-nums", getScoreColor(breakdown.assetScore))}>
                {breakdown.assetScore}/100
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  breakdown.assetScore >= 65 ? "bg-success" : breakdown.assetScore >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${breakdown.assetScore}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Era Balance
              </span>
              <span className={cn("font-medium tabular-nums", getScoreColor(breakdown.eraScore))}>
                {breakdown.eraScore}/100
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  breakdown.eraScore >= 65 ? "bg-success" : breakdown.eraScore >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${breakdown.eraScore}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Set Concentration
              </span>
              <span className={cn("font-medium tabular-nums", getScoreColor(breakdown.concentrationScore))}>
                {breakdown.concentrationScore}/100
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  breakdown.concentrationScore >= 65 ? "bg-success" : breakdown.concentrationScore >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${breakdown.concentrationScore}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Weights: Asset 45% • Era 35% • Concentration 20%
          </p>
        </div>
      )}
    </div>
  );
}
