import React, { useRef } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function GeneratedReport() {
  const { isDataLoaded, summary, allocation, concentration, milestones, insights, items, allocationTarget, allocationPreset } = usePortfolio();
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadAsPDF = () => {
    window.print();
  };

  const getCollectorType = () => {
    if (!allocation) return { type: 'Balanced Collector', description: '' };
    
    const sealed = allocation.sealed.percent;
    const slabs = allocation.slabs.percent;
    const raw = allocation.rawCards.percent;
    
    if (sealed >= 50) {
      return {
        type: 'The Vault Keeper',
        description: "You're a patient investor who believes in the long game. Your heavy sealed allocation shows you understand the power of scarcity and time."
      };
    } else if (slabs >= 50) {
      return {
        type: 'The Trophy Hunter',
        description: "You chase the grails. Your slab-heavy portfolio shows you value authenticated excellence over quantity."
      };
    } else if (raw >= 50) {
      return {
        type: 'The Volume Player',
        description: "You play the numbers game with raw cards, finding value where others overlook."
      };
    } else if (sealed >= 30 && slabs >= 30) {
      return {
        type: 'The Strategic Diversifier',
        description: "You've built a fortress portfolio with both sealed potential and graded security."
      };
    } else {
      return {
        type: 'The Balanced Collector',
        description: "You appreciate all aspects of the hobby and your portfolio reflects that wisdom."
      };
    }
  };

  const collectorProfile = getCollectorType();
  const topHits = milestones?.slice(0, 5) || [];
  const strengthInsights = insights?.filter(i => i.priority === 'low') || [];
  const riskInsights = insights?.filter(i => i.priority === 'high' || i.priority === 'medium') || [];
  
  const totalGain = summary?.unrealizedPL || 0;
  const totalGainPercent = summary?.unrealizedPLPercent || 0;
  const healthScore = summary?.healthScore || 0;

  const sealed = allocation?.sealed.percent || 0;
  const slabs = allocation?.slabs.percent || 0;
  const raw = allocation?.rawCards.percent || 0;
  
  const isLowSealed = sealed < 20;
  const isSealedSmallest = sealed < slabs && sealed < raw;

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No portfolio data available.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Upload Portfolio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Fixed Download Button */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/report">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button onClick={downloadAsPDF} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download as PDF
        </Button>
      </div>

      {/* Report Content */}
      <div id="printable-report" ref={reportRef} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <header className="text-center mb-16 pb-8 border-b border-primary/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              mintdfolio
            </h1>
            <p className="text-muted-foreground">Portfolio Analysis Report</p>
            <p className="text-sm text-muted-foreground/60 mt-4">
              Generated on {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </header>

          {/* Collector Profile */}
          <section className="glass-card p-8 mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">{collectorProfile.type}</h2>
            <p className="text-foreground/80 leading-relaxed">{collectorProfile.description}</p>
          </section>

          {/* Portfolio Overview */}
          <section className="glass-card p-8 mb-8">
            <h2 className="text-xl font-semibold text-primary mb-6">Portfolio Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  ${summary?.totalMarketValue?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${totalGainPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Unrealized P/L</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{healthScore}</p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{items?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </section>

          {/* Allocation Breakdown */}
          <section className="glass-card p-8 mb-8">
            <h2 className="text-xl font-semibold text-primary mb-6">Allocation Analysis</h2>
            
            {/* Risk Warning */}
            {(isLowSealed || isSealedSmallest) && (
              <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-warning font-medium mb-2">⚠️ Risk Alert</p>
                <p className="text-sm text-foreground/80">
                  {isLowSealed 
                    ? "Your sealed allocation is below 20%. We recommend that sealed take up a substantial part of any collection as it is historically the safest asset to hold."
                    : "Sealed is currently your smallest category. While your approach has merits, consider that sealed products have historically provided the most reliable long-term returns."
                  }
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{sealed.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Sealed</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  ${allocation?.sealed.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{slabs.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Graded</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  ${allocation?.slabs.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{raw.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Raw Cards</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  ${allocation?.rawCards.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
            </div>
          </section>

          {/* Top Performers */}
          {topHits.length > 0 && (
            <section className="glass-card p-8 mb-8">
              <h2 className="text-xl font-semibold text-primary mb-6">Top Performers</h2>
              <div className="space-y-4">
                {topHits.map((milestone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                    <div>
                      <p className="font-medium text-foreground">{milestone.item.productName}</p>
                      <p className="text-sm text-muted-foreground">{milestone.item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">+{milestone.item.gainPercent.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">
                        ${milestone.item.totalMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Strengths & Risks */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {strengthInsights.length > 0 && (
              <section className="glass-card p-8">
                <h2 className="text-xl font-semibold text-success mb-6">Strengths</h2>
                <ul className="space-y-3">
                  {strengthInsights.slice(0, 5).map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-success mt-1">✓</span>
                      <span className="text-foreground/80 text-sm">{insight.message}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {riskInsights.length > 0 && (
              <section className="glass-card p-8">
                <h2 className="text-xl font-semibold text-warning mb-6">Areas to Watch</h2>
                <ul className="space-y-3">
                  {riskInsights.slice(0, 5).map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-warning mt-1">!</span>
                      <span className="text-foreground/80 text-sm">{insight.message}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Footer */}
          <footer className="text-center pt-8 border-t border-primary/20">
            <p className="text-sm text-muted-foreground">
              This report is for informational purposes only and does not constitute financial advice.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              © {new Date().getFullYear()} mintdfolio
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
