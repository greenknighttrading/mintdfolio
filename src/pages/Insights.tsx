import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { InsightCard } from '@/components/insights/InsightCard';
import { Lightbulb, Inbox } from 'lucide-react';

export default function Insights() {
  const { insights, dismissInsight, isDataLoaded } = usePortfolio();

  if (!isDataLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Upload your portfolio to see insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Insight Feed</h1>
        </div>
        <p className="text-muted-foreground">
          Personalized guidance based on your portfolio analysis
        </p>
      </div>

      {/* Insights List */}
      {insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
              className="animate-slide-up"
            >
              <InsightCard insight={insight} onDismiss={dismissInsight} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">All Clear</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No actionable insights at the moment. Your portfolio is well-balanced
            according to your targets. Check back after making changes.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        Insights are generated from your portfolio data. They're suggestions, not financial advice.
        Always do your own research.
      </p>
    </div>
  );
}
