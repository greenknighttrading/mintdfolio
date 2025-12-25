import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HealthScoreCardProps {
  score: number;
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

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const grade = getScoreGrade(score);
  const ScoreIcon = getScoreIcon(score);
  
  // Calculate stroke dasharray for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

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
              <p className="font-semibold mb-2">How Health Score is Calculated:</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-success">+</span>
                  <span><strong>Profit %:</strong> Up to +20 pts for overall portfolio gains</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">+</span>
                  <span><strong>Win Rate:</strong> Up to +15 pts based on % of holdings in profit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">−</span>
                  <span><strong>Concentration:</strong> Up to -15 pts if top position exceeds 15-30%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">+</span>
                  <span><strong>Diversity:</strong> Up to +10 pts for category variety</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">−</span>
                  <span><strong>Deep Losses:</strong> Up to -10 pts for positions down 30%+</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Score starts at 50 and adjusts based on these factors.
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
              stroke={score >= 65 ? 'hsl(var(--success))' : score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums", grade.color)}>
              {score}
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
            Based on profit, diversification, concentration, and loss metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
