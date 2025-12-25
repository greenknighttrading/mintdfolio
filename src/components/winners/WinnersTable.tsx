import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Filter, ArrowUpDown } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { cn } from '@/lib/utils';
import { PortfolioItem } from '@/lib/types';

type SortField = 'gainPercent' | 'profitDollars' | 'totalMarketValue' | 'quantity' | 'cagr';
type SortDirection = 'asc' | 'desc';
type PerformanceFilter = 'all' | 'winners' | 'underperforming' | 200 | 300 | 500;

// Calculate CAGR (Compound Annual Growth Rate)
function calculateCAGR(item: PortfolioItem): number | null {
  if (!item.dateAdded || item.totalCostBasis <= 0) return null;
  
  const now = new Date();
  const yearsHeld = (now.getTime() - item.dateAdded.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Need at least 30 days to calculate meaningful CAGR
  if (yearsHeld < 0.08) return null;
  
  const endingValue = item.totalMarketValue;
  const beginningValue = item.totalCostBasis;
  
  // CAGR = (Ending Value / Beginning Value)^(1/years) - 1
  const cagr = (Math.pow(endingValue / beginningValue, 1 / yearsHeld) - 1) * 100;
  
  return cagr;
}

export function WinnersTable() {
  const { items, milestones } = usePortfolio();
  const [sortField, setSortField] = useState<SortField>('gainPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Apply performance filter
    switch (performanceFilter) {
      case 'winners':
        filtered = filtered.filter(item => item.gainPercent > 0);
        break;
      case 'underperforming':
        filtered = filtered.filter(item => item.gainPercent < 0);
        break;
      case 200:
      case 300:
      case 500:
        filtered = filtered.filter(item => item.gainPercent >= performanceFilter);
        break;
      default:
        // 'all' - show everything
        break;
    }

    return filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;
      
      if (sortField === 'cagr') {
        aVal = calculateCAGR(a) ?? -Infinity;
        bVal = calculateCAGR(b) ?? -Infinity;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      
      const multiplier = sortDirection === 'desc' ? -1 : 1;
      return (aVal - bVal) * multiplier;
    });
  }, [items, sortField, sortDirection, performanceFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left hover:text-foreground transition-colors group"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'desc' ? (
          <ChevronDown className="w-4 h-4 text-primary" />
        ) : (
          <ChevronUp className="w-4 h-4 text-primary" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  );

  const getMilestoneLabel = (gainPercent: number) => {
    if (gainPercent >= 500) return { label: '500%+', class: 'bg-success/20 text-success' };
    if (gainPercent >= 300) return { label: '300%+', class: 'bg-success/15 text-success' };
    if (gainPercent >= 200) return { label: '200%+', class: 'bg-primary/15 text-primary' };
    if (gainPercent <= -30) return { label: 'Deep Loss', class: 'bg-destructive/15 text-destructive' };
    if (gainPercent <= -15) return { label: 'Loss', class: 'bg-warning/15 text-warning' };
    return null;
  };

  const calculateSellHalf = (item: PortfolioItem) => {
    const halfQuantity = item.quantity / 2;
    const profit = halfQuantity * item.marketPrice - halfQuantity * item.averageCostPaid;
    const remaining = Math.floor(halfQuantity);
    return { profit, remaining };
  };

  const filterOptions: { value: PerformanceFilter; label: string }[] = [
    { value: 'all', label: 'All Holdings' },
    { value: 'winners', label: 'Profitable' },
    { value: 'underperforming', label: 'Underperforming' },
    { value: 200, label: '≥200%' },
    { value: 300, label: '≥300%' },
    { value: 500, label: '≥500%' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Show:</span>
        {filterOptions.map((filter) => (
          <button
            key={String(filter.value)}
            onClick={() => setPerformanceFilter(filter.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              performanceFilter === filter.value
                ? filter.value === 'underperforming'
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="totalMarketValue">Value</SortHeader>
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cost Basis
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="gainPercent">Gain %</SortHeader>
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="cagr">CAGR</SortHeader>
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="profitDollars">Profit $</SortHeader>
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="quantity">Units</SortHeader>
                </th>
                <th className="text-left px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sell-Half Sim
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedItems.map((item, index) => {
                const milestone = getMilestoneLabel(item.gainPercent);
                const sellHalf = calculateSellHalf(item);
                const cagr = calculateCAGR(item);
                
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-secondary/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground line-clamp-1" title={item.productName}>
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        {milestone && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                            milestone.class
                          )}>
                            {milestone.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-foreground">
                      ${item.totalMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                      ${item.totalCostBasis.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "tabular-nums font-medium",
                        item.gainPercent >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {item.gainPercent >= 0 ? '+' : ''}{item.gainPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {cagr !== null ? (
                        <span className={cn(
                          "tabular-nums text-sm",
                          cagr >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={cn(
                      "px-4 py-4 text-right tabular-nums font-medium",
                      item.profitDollars >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {item.profitDollars >= 0 ? '+' : ''}${item.profitDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4">
                      {item.quantity >= 2 && item.gainPercent > 0 ? (
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Lock in{' '}
                            <span className="text-success font-medium">
                              ${sellHalf.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Keep {sellHalf.remaining} unit{sellHalf.remaining !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ) : item.quantity < 2 ? (
                        <span className="text-xs text-muted-foreground">Single unit</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedItems.length === 0 && (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <p>No holdings match the current filter.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        CAGR (Compound Annual Growth Rate) represents annualized return. Sell-half simulations are for reference only.
      </p>
    </div>
  );
}
