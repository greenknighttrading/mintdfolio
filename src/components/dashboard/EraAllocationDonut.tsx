import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ERA_INFO, PokemonEra } from '@/lib/types';
import { cn } from '@/lib/utils';

// Thematic colors distinct from asset allocation chart
const ERA_COLORS: Record<PokemonEra, { main: string; light: string }> = {
  vintage: { main: 'hsl(35, 85%, 45%)', light: 'hsl(35, 85%, 65%)' },       // Warm amber/gold
  classic: { main: 'hsl(185, 60%, 42%)', light: 'hsl(185, 60%, 62%)' },     // Teal
  modern: { main: 'hsl(260, 50%, 55%)', light: 'hsl(260, 50%, 75%)' },      // Purple
  ultraModern: { main: 'hsl(330, 65%, 50%)', light: 'hsl(330, 65%, 70%)' }, // Magenta/Rose
  current: { main: 'hsl(160, 55%, 40%)', light: 'hsl(160, 55%, 60%)' },     // Cyan/Mint
};

const ERA_ORDER: PokemonEra[] = ['vintage', 'classic', 'modern', 'ultraModern', 'current'];

export function EraAllocationDonut() {
  const { eraAllocation } = usePortfolio();

  if (!eraAllocation) return null;

  const data = ERA_ORDER.map(era => ({
    name: ERA_INFO[era].name,
    era,
    value: eraAllocation[era].percent,
    amount: eraAllocation[era].value,
    count: eraAllocation[era].count,
    years: ERA_INFO[era].years,
    color: ERA_COLORS[era].main,
  })).filter(d => d.value > 0);

  // Calculate grouped percentages
  const midModernPercent = eraAllocation.modern.percent + eraAllocation.ultraModern.percent;
  const olderEraPercent = eraAllocation.vintage.percent + eraAllocation.classic.percent;
  const currentPercent = eraAllocation.current.percent;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.years}</p>
        <p className="text-muted-foreground mt-1">
          {item.value?.toFixed(1)}%
          {item.amount && ` • $${item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.count} holding{item.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 animate-fade-in stagger-3" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Era Allocation</h2>
      </div>

      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">Older/Mid</span>
          <span className="text-sm font-bold tabular-nums">
            {olderEraPercent.toFixed(0)}% / {midModernPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Legend with years */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {ERA_ORDER.map((era) => {
          const eraData = eraAllocation[era];
          if (eraData.percent === 0) return null;
          
          return (
            <div key={era} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: ERA_COLORS[era].main }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{ERA_INFO[era].name}</p>
                <p className="text-[10px] text-muted-foreground/70">{ERA_INFO[era].years}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {eraData.percent.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Era health indicators */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Older Era (Vintage + Classic)</span>
          <span className={cn(
            "font-medium tabular-nums",
            olderEraPercent >= 30 ? "text-success" : "text-warning"
          )}>
            {olderEraPercent.toFixed(0)}%
            <span className="text-muted-foreground ml-1">(Low Risk)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Mid Modern (Modern + Ultra Modern)</span>
          <span className={cn(
            "font-medium tabular-nums",
            midModernPercent >= 30 && midModernPercent <= 50 ? "text-success" : 
            midModernPercent > 50 ? "text-warning" : "text-muted-foreground"
          )}>
            {midModernPercent.toFixed(0)}%
            <span className="text-muted-foreground ml-1">(Medium Risk)</span>
          </span>
        </div>
        {currentPercent > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Window</span>
            <span className={cn(
              "font-medium tabular-nums",
              currentPercent > 15 ? "text-destructive" : "text-warning"
            )}>
              {currentPercent.toFixed(0)}%
              <span className="text-muted-foreground ml-1">(High Risk)</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}