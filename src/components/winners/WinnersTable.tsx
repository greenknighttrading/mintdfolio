import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Filter, ArrowUpDown } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { cn } from '@/lib/utils';
import { PortfolioItem } from '@/lib/types';

type SortField = 'gainPercent' | 'profitDollars' | 'totalMarketValue' | 'quantity';
type SortDirection = 'asc' | 'desc';
type MilestoneFilter = 'all' | 200 | 300 | 500;

export function WinnersTable() {
  const { items, milestones } = usePortfolio();
  const [sortField, setSortField] = useState<SortField>('gainPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [milestoneFilter, setMilestoneFilter] = useState<MilestoneFilter>('all');

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items].filter(item => item.gainPercent > 0);

    if (milestoneFilter !== 'all') {
      filtered = filtered.filter(item => item.gainPercent >= milestoneFilter);
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'desc' ? -1 : 1;
      return (aVal - bVal) * multiplier;
    });
  }, [items, sortField, sortDirection, milestoneFilter]);

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
    return null;
  };

  const calculateSellHalf = (item: PortfolioItem) => {
    const halfQuantity = item.quantity / 2;
    const profit = halfQuantity * item.marketPrice - halfQuantity * item.averageCostPaid;
    const remaining = Math.floor(halfQuantity);
    return { profit, remaining };
  };

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Show:</span>
        {(['all', 200, 300, 500] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setMilestoneFilter(filter)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              milestoneFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {filter === 'all' ? 'All Winners' : `≥${filter}%`}
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
                  <SortHeader field="profitDollars">Profit $</SortHeader>
                </th>
                <th className="text-right px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <SortHeader field="quantity">Units</SortHeader>
                </th>
                <th className="text-left px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sell-Half Simulation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedItems.map((item, index) => {
                const milestone = getMilestoneLabel(item.gainPercent);
                const sellHalf = calculateSellHalf(item);
                
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
                      <span className="tabular-nums font-medium text-success">
                        +{item.gainPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums font-medium text-success">
                      +${item.profitDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4">
                      {item.quantity >= 2 ? (
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
                      ) : (
                        <span className="text-xs text-muted-foreground">Single unit</span>
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
        Sell-half simulations are for reference only. Actual proceeds may vary based on market conditions.
      </p>
    </div>
  );
}
