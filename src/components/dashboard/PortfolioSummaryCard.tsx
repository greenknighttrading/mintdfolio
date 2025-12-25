import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function PortfolioSummaryCard() {
  const { summary } = usePortfolio();

  if (!summary) return null;

  const isProfit = summary.unrealizedPL >= 0;

  const metrics = [
    {
      label: 'Total Value',
      value: `$${summary.totalMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      accent: false,
    },
    {
      label: 'Cost Basis',
      value: `$${summary.totalCostBasis.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      icon: Target,
      accent: false,
    },
    {
      label: 'Unrealized P/L',
      value: `${isProfit ? '+' : ''}$${summary.unrealizedPL.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      subValue: `${isProfit ? '+' : ''}${summary.unrealizedPLPercent.toFixed(1)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      accent: true,
      isProfit,
    },
    {
      label: 'In Profit',
      value: `${summary.holdingsInProfitCount}/${summary.totalHoldings}`,
      subValue: `${summary.holdingsInProfitPercent.toFixed(0)}% of holdings`,
      icon: Percent,
      accent: false,
    },
  ];

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-6">Portfolio Summary</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "space-y-2 animate-slide-up",
              `stagger-${index + 1}`
            )}
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                metric.accent && metric.isProfit && "bg-success/10",
                metric.accent && !metric.isProfit && "bg-destructive/10",
                !metric.accent && "bg-secondary"
              )}>
                <metric.icon className={cn(
                  "w-4 h-4",
                  metric.accent && metric.isProfit && "text-success",
                  metric.accent && !metric.isProfit && "text-destructive",
                  !metric.accent && "text-muted-foreground"
                )} />
              </div>
              <span className="metric-label text-xs">{metric.label}</span>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold tracking-tight tabular-nums",
                metric.accent && metric.isProfit && "text-success",
                metric.accent && !metric.isProfit && "text-destructive",
                !metric.accent && "text-foreground"
              )}>
                {metric.value}
              </p>
              {metric.subValue && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {metric.subValue}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
