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
          <p className="text-muted-foreground">Upload your portfolio to see winners</p>
        </div>
      </div>
    );
  }

  const milestone500 = milestones.filter(m => m.milestone === 500).length;
  const milestone300 = milestones.filter(m => m.milestone === 300).length;
  const milestone200 = milestones.filter(m => m.milestone === 200).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Return Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze performance, review returns, and evaluate profit-taking strategies
        </p>
      </div>

      {/* Milestone Summary */}
      {(milestone500 + milestone300 + milestone200) > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
          {[
            { threshold: 500, count: milestone500, label: '500%+ Gains' },
            { threshold: 300, count: milestone300, label: '300%+ Gains' },
            { threshold: 200, count: milestone200, label: '200%+ Gains' },
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
