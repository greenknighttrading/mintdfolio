import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", grade.bgColor)}>
          <Heart className={cn("w-4 h-4", grade.color)} />
        </div>
        <h3 className="font-semibold text-foreground">Health Score</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={score >= 65 ? 'hsl(var(--success))' : score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold tabular-nums", grade.color)}>
              {score}
            </span>
          </div>
        </div>

        {/* Grade Label */}
        <div className="flex-1">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-2",
            grade.bgColor, grade.color
          )}>
            <ScoreIcon className="w-3.5 h-3.5" />
            {grade.label}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on profit, diversification, and concentration metrics
          </p>
        </div>
      </div>
    </div>
  );
}
