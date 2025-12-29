import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { WinnersTable } from '@/components/winners/WinnersTable';
import { Trophy, Inbox } from 'lucide-react';

export default function Winners() {
  const { isDataLoaded, milestones } = usePortfolio();

  if (!isDataLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Upload your portfolio to see top performers</p>
        </div>
      </div>
    );
  }

  // Updated thresholds: 400%+, 200%+, 100%+
  const milestone400 = milestones.filter(m => m.item.gainPercent >= 400).length;
  const milestone200 = milestones.filter(m => m.item.gainPercent >= 200).length;
  const milestone100 = milestones.filter(m => m.item.gainPercent >= 100).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Top Performers</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze performance, review returns, and evaluate profit-taking strategies
        </p>
      </div>

      {/* Milestone Summary */}
      {(milestone400 + milestone200 + milestone100) > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
          {[
            { threshold: 400, count: milestone400, label: '400%+ Gains' },
            { threshold: 200, count: milestone200, label: '200%+ Gains' },
            { threshold: 100, count: milestone100, label: '100%+ Gains' },
          ].map((stat) => (
            <div
              key={stat.threshold}
              className="glass-card p-4 text-center"
            >
              <p className="text-3xl font-bold text-success tabular-nums">{stat.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Winners Table */}
      <WinnersTable />
    </div>
  );
}
