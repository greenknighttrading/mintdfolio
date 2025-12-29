import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { RebalanceSimulator } from '@/components/rebalance/RebalanceSimulator';
import { Scale, Inbox } from 'lucide-react';

export default function Rebalance() {
  const { isDataLoaded } = usePortfolio();

  if (!isDataLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Upload your portfolio to use the rebalancing simulator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rebalance Calculator</h1>
        </div>
        <p className="text-muted-foreground">
          Set target allocations and explore rebalancing strategies
        </p>
      </div>

      {/* Simulator */}
      <RebalanceSimulator />

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> This simulator provides guidance based on your target allocations, 
          not financial advice. Market conditions, liquidity, and personal circumstances should inform your actual decisions. 
          Consider consulting a financial advisor for personalized guidance.
        </p>
      </div>
    </div>
  );
}
