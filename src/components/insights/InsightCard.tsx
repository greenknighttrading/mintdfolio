import React from 'react';
import { X, Lightbulb, AlertTriangle, TrendingUp, Scale, Clock } from 'lucide-react';
import { Insight } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
}

const typeIcons: Record<Insight['type'], React.ElementType> = {
  profit: TrendingUp,
  concentration: AlertTriangle,
  rebalance: Scale,
  patience: Clock,
  allocation: Lightbulb,
};

const typeColors: Record<Insight['type'], string> = {
  profit: 'text-success bg-success/10 border-success/20',
  concentration: 'text-warning bg-warning/10 border-warning/20',
  rebalance: 'text-primary bg-primary/10 border-primary/20',
  patience: 'text-muted-foreground bg-muted border-border',
  allocation: 'text-accent bg-accent/10 border-accent/20',
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const Icon = typeIcons[insight.type];
  const colorClasses = typeColors[insight.type];

  return (
    <div className={cn(
      "insight-card group relative",
      "animate-slide-up"
    )}>
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all duration-200"
        aria-label="Dismiss insight"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex gap-4">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
          colorClasses
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-foreground leading-relaxed pr-8">
            {insight.message}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {formatDistanceToNow(insight.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>

      {insight.priority === 'high' && (
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-warning" />
      )}
    </div>
  );
}
