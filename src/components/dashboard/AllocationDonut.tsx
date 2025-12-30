import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { ALLOCATION_PRESETS, AllocationPreset } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS = {
  sealed: 'hsl(168, 50%, 45%)',
  slabs: 'hsl(45, 80%, 55%)',
  rawCards: 'hsl(280, 60%, 55%)',
};

const TARGET_COLORS = {
  sealed: 'hsl(168, 50%, 30%)',
  slabs: 'hsl(45, 80%, 35%)',
  rawCards: 'hsl(280, 60%, 35%)',
};

export function AllocationDonut() {
  const { allocation, allocationTarget, allocationPreset, setAllocationPreset } = usePortfolio();

  if (!allocation) return null;

  const data = [
    { 
      name: 'Sealed', 
      value: allocation.sealed.percent, 
      target: allocationTarget.sealed,
      amount: allocation.sealed.value,
      color: COLORS.sealed,
      targetColor: TARGET_COLORS.sealed,
    },
    { 
      name: 'Slabs', 
      value: allocation.slabs.percent, 
      target: allocationTarget.slabs,
      amount: allocation.slabs.value,
      color: COLORS.slabs,
      targetColor: TARGET_COLORS.slabs,
    },
    { 
      name: 'Raw Cards', 
      value: allocation.rawCards.percent, 
      target: allocationTarget.rawCards,
      amount: allocation.rawCards.value,
      color: COLORS.rawCards,
      targetColor: TARGET_COLORS.rawCards,
    },
  ];

  const targetData = data.map(d => ({
    name: `${d.name} Target`,
    value: d.target,
    color: d.targetColor,
  }));

  const presets: { key: AllocationPreset; label: string }[] = [
    { key: 'conservative', label: 'Conservative' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'aggressive', label: 'Aggressive' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="font-medium text-foreground">{item.name}</p>
        <p className="text-muted-foreground">
          {item.value?.toFixed(1)}%
          {item.amount && ` • $${item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        </p>
        {item.target !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Target: {item.target}%
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card p-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Allocation Breakdown</h2>
      </div>

      {/* Preset Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => setAllocationPreset(preset.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              allocationPreset === preset.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Target ring (outer) */}
            <Pie
              data={targetData}
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {targetData.map((entry, index) => (
                <Cell key={`target-${index}`} fill={entry.color} opacity={0.4} />
              ))}
            </Pie>
            {/* Actual allocation (inner) */}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
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
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {data.map((item) => {
          const diff = item.value - item.target;
          return (
            <div key={item.name} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {item.value.toFixed(1)}%
              </p>
              <p className={cn(
                "text-xs tabular-nums",
                Math.abs(diff) > 10 ? (diff > 0 ? "text-warning" : "text-muted-foreground") : "text-muted-foreground"
              )}>
                Target: {item.target}%
                {Math.abs(diff) > 5 && (
                  <span className={diff > 0 ? "text-warning" : "text-success"}>
                    {' '}({diff > 0 ? '+' : ''}{diff.toFixed(0)}%)
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
