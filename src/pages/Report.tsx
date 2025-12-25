import React, { useState, useRef } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { FileText, Download, Inbox, Sparkles, TrendingUp, Shield, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Report() {
  const { isDataLoaded, summary, allocation, concentration, milestones, insights, items, allocationTarget, allocationPreset } = usePortfolio();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    
    // Build the report content
    const reportContent = generateReportContent();
    
    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mintdfolio-portfolio-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsGenerating(false);
  };

  const getCollectorType = () => {
    if (!allocation) return { type: 'Balanced Collector', description: '' };
    
    const sealed = allocation.sealed.percent;
    const slabs = allocation.slabs.percent;
    const raw = allocation.rawCards.percent;
    
    if (sealed >= 50) {
      return {
        type: 'The Vault Keeper',
        description: "You're a patient investor who believes in the long game. Your heavy sealed allocation shows you understand the power of scarcity and time. You're the type who sees an ETB and thinks \"future vintage.\""
      };
    } else if (slabs >= 50) {
      return {
        type: 'The Trophy Hunter',
        description: "You chase the grails. Your slab-heavy portfolio shows you value authenticated excellence over quantity. Each piece in your collection tells a story of pursuit and triumph."
      };
    } else if (raw >= 50) {
      return {
        type: 'The Volume Player',
        description: "You play the numbers game with raw cards, finding value where others overlook. You're nimble, quick to move, and always hunting for the next undervalued gem."
      };
    } else if (sealed >= 30 && slabs >= 30) {
      return {
        type: 'The Strategic Diversifier',
        description: "You've built a fortress portfolio with both sealed potential and graded security. You understand that balance isn't boring—it's smart."
      };
    } else {
      return {
        type: 'The Balanced Collector',
        description: "You appreciate all aspects of the hobby and your portfolio reflects that wisdom. You're not putting all your eggs in one basket, and that's a strength."
      };
    }
  };

  const generateReportContent = () => {
    const collectorProfile = getCollectorType();
    const topHits = milestones.slice(0, 5);
    const strengthInsights = insights.filter(i => i.priority === 'low');
    const riskInsights = insights.filter(i => i.priority === 'high' || i.priority === 'medium');
    
    const totalGain = summary?.unrealizedPL || 0;
    const totalGainPercent = summary?.unrealizedPLPercent || 0;
    const healthScore = summary?.healthScore || 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mintdfolio Portfolio Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      color: #e2e8f0;
      line-height: 1.6;
      min-height: 100vh;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3);
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
    }
    
    .date {
      color: #64748b;
      font-size: 12px;
      margin-top: 16px;
    }
    
    .section {
      background: rgba(30, 27, 75, 0.5);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-title::before {
      content: '';
      width: 4px;
      height: 24px;
      background: linear-gradient(180deg, #a78bfa, #818cf8);
      border-radius: 2px;
    }
    
    .collector-profile {
      text-align: center;
      padding: 40px 24px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(129, 140, 248, 0.1));
      border-radius: 16px;
      margin-bottom: 24px;
    }
    
    .collector-type {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
    }
    
    .collector-desc {
      color: #cbd5e1;
      max-width: 600px;
      margin: 0 auto;
      font-size: 15px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }
    
    .stat-value.positive { color: #4ade80; }
    .stat-value.negative { color: #f87171; }
    
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .allocation-bar {
      display: flex;
      height: 32px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    .allocation-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }
    
    .sealed { background: #8b5cf6; }
    .slabs { background: #06b6d4; }
    .raw { background: #f59e0b; }
    
    .allocation-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 12px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #cbd5e1;
    }
    
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .hit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 10px;
      margin-bottom: 12px;
    }
    
    .hit-name {
      font-weight: 500;
      color: #fff;
    }
    
    .hit-gain {
      font-weight: 600;
      color: #4ade80;
    }
    
    .insight-item {
      padding: 16px;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 10px;
      margin-bottom: 12px;
      border-left: 3px solid;
    }
    
    .insight-item.strength { border-color: #4ade80; }
    .insight-item.risk { border-color: #f59e0b; }
    
    .insight-title {
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    
    .insight-desc {
      font-size: 14px;
      color: #94a3b8;
    }
    
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 10px;
      margin-bottom: 12px;
    }
    
    .action-number {
      width: 28px;
      height: 28px;
      background: #8b5cf6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .action-content {
      flex: 1;
    }
    
    .action-title {
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    
    .action-desc {
      font-size: 14px;
      color: #94a3b8;
    }
    
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
      color: #64748b;
      font-size: 12px;
    }
    
    .health-score {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(#8b5cf6 ${healthScore * 3.6}deg, rgba(139, 92, 246, 0.2) 0deg);
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin: 16px 0;
    }
    
    @media print {
      body { background: #fff; color: #1e293b; }
      .section { border: 1px solid #e2e8f0; }
      .stat-card { background: #f8fafc; }
      .section-title { color: #6366f1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">mintdfolio</div>
      <p class="subtitle">Portfolio Analysis Report</p>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </header>
    
    <!-- Collector Profile -->
    <div class="collector-profile">
      <div class="collector-type">${collectorProfile.type}</div>
      <p class="collector-desc">${collectorProfile.description}</p>
    </div>
    
    <!-- Portfolio Overview -->
    <div class="section">
      <h2 class="section-title">Portfolio Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">$${(summary?.totalMarketValue || 0).toLocaleString()}</div>
          <div class="stat-label">Total Value</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}$${totalGain.toLocaleString()}</div>
          <div class="stat-label">Unrealized P/L</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${totalGainPercent >= 0 ? 'positive' : 'negative'}">${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(1)}%</div>
          <div class="stat-label">Return</div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 8px;">Portfolio Health Score</p>
        <div class="health-score">${healthScore}</div>
      </div>
    </div>
    
    <!-- Allocation Breakdown -->
    <div class="section">
      <h2 class="section-title">Current Allocation</h2>
      <div class="allocation-bar">
        <div class="allocation-segment sealed" style="width: ${allocation?.sealed.percent || 0}%">${(allocation?.sealed.percent || 0).toFixed(0)}%</div>
        <div class="allocation-segment slabs" style="width: ${allocation?.slabs.percent || 0}%">${(allocation?.slabs.percent || 0).toFixed(0)}%</div>
        <div class="allocation-segment raw" style="width: ${allocation?.rawCards.percent || 0}%">${(allocation?.rawCards.percent || 0).toFixed(0)}%</div>
      </div>
      <div class="allocation-legend">
        <div class="legend-item"><div class="legend-dot" style="background: #8b5cf6"></div>Sealed ($${(allocation?.sealed.value || 0).toLocaleString()})</div>
        <div class="legend-item"><div class="legend-dot" style="background: #06b6d4"></div>Graded ($${(allocation?.slabs.value || 0).toLocaleString()})</div>
        <div class="legend-item"><div class="legend-dot" style="background: #f59e0b"></div>Raw ($${(allocation?.rawCards.value || 0).toLocaleString()})</div>
      </div>
      
      <div style="margin-top: 24px; padding: 16px; background: rgba(15, 23, 42, 0.4); border-radius: 10px;">
        <p style="font-size: 14px; color: #94a3b8;">Your current strategy: <strong style="color: #fff;">${allocationPreset.charAt(0).toUpperCase() + allocationPreset.slice(1)}</strong></p>
        <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Target: ${allocationTarget.sealed}% Sealed / ${allocationTarget.slabs}% Graded / ${allocationTarget.rawCards}% Raw</p>
      </div>
    </div>
    
    <!-- Top Hits -->
    ${topHits.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Top Performers</h2>
      ${topHits.map(hit => `
        <div class="hit-item">
          <span class="hit-name">${hit.item.productName}</span>
          <span class="hit-gain">+${hit.milestone}%+</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Strengths -->
    <div class="section">
      <h2 class="section-title">Portfolio Strengths</h2>
      ${strengthInsights.length > 0 ? strengthInsights.slice(0, 4).map(insight => `
        <div class="insight-item strength">
          <div class="insight-title">${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</div>
          <div class="insight-desc">${insight.message}</div>
        </div>
      `).join('') : `
        <p style="color: #94a3b8; text-align: center; padding: 20px;">Your portfolio shows solid fundamentals with good diversification across categories.</p>
      `}
    </div>
    
    <!-- Risks & Considerations -->
    <div class="section">
      <h2 class="section-title">Risks & Considerations</h2>
      ${riskInsights.length > 0 ? riskInsights.slice(0, 4).map(insight => `
        <div class="insight-item risk">
          <div class="insight-title">${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</div>
          <div class="insight-desc">${insight.message}</div>
        </div>
      `).join('') : `
        <p style="color: #94a3b8; text-align: center; padding: 20px;">No significant risks detected. Your portfolio appears well-balanced.</p>
      `}
    </div>
    
    <!-- Action Plan -->
    <div class="section">
      <h2 class="section-title">Your Action Plan</h2>
      ${generateActionPlan()}
    </div>
    
    <!-- Alternative Strategies -->
    <div class="section">
      <h2 class="section-title">Other Paths to Consider</h2>
      <p style="color: #94a3b8; margin-bottom: 16px;">Based on your portfolio, here are alternative collecting strategies you might explore:</p>
      
      <div class="action-item">
        <div class="action-content">
          <div class="action-title">The Sealed Strategy</div>
          <div class="action-desc">Focus 60%+ on sealed products for long-term appreciation. Best for patient collectors who can hold 3-5+ years.</div>
        </div>
      </div>
      
      <div class="action-item">
        <div class="action-content">
          <div class="action-title">The Grading Play</div>
          <div class="action-desc">Shift toward graded cards for liquidity and authenticity. Ideal for those who want easier exit strategies.</div>
        </div>
      </div>
      
      <div class="action-item">
        <div class="action-content">
          <div class="action-title">The Raw Edge</div>
          <div class="action-desc">Stay nimble with raw cards, capitalizing on market inefficiencies and quick flips. Higher risk, higher reward potential.</div>
        </div>
      </div>
    </div>
    
    <footer class="footer">
      <p>Generated by mintdfolio • Your Pokémon Financial Advisor</p>
      <p style="margin-top: 8px;">This report is for informational purposes only. Not financial advice. Market conditions change—always do your own research.</p>
    </footer>
  </div>
</body>
</html>`;
  };

  const generateActionPlan = () => {
    const actions: { title: string; desc: string }[] = [];
    
    if (allocation) {
      const sealedDiff = allocationTarget.sealed - allocation.sealed.percent;
      const slabsDiff = allocationTarget.slabs - allocation.slabs.percent;
      const rawDiff = allocationTarget.rawCards - allocation.rawCards.percent;
      
      if (Math.abs(sealedDiff) > 5) {
        if (sealedDiff > 0) {
          actions.push({
            title: 'Increase Sealed Allocation',
            desc: `You're ${sealedDiff.toFixed(0)}% below your target. Consider picking up some sealed products on your next purchase.`
          });
        } else {
          actions.push({
            title: 'Consider Reducing Sealed',
            desc: `You're ${Math.abs(sealedDiff).toFixed(0)}% above target in sealed. If you need liquidity, this could be an area to trim.`
          });
        }
      }
      
      if (Math.abs(slabsDiff) > 5) {
        if (slabsDiff > 0) {
          actions.push({
            title: 'Add More Graded Cards',
            desc: `You're ${slabsDiff.toFixed(0)}% below your graded target. Authenticated cards offer both security and liquidity.`
          });
        } else {
          actions.push({
            title: 'Graded Position is Heavy',
            desc: `You're ${Math.abs(slabsDiff).toFixed(0)}% above target. Great for liquidity, but consider diversifying into other categories.`
          });
        }
      }
      
      if (Math.abs(rawDiff) > 5) {
        if (rawDiff > 0) {
          actions.push({
            title: 'Explore Raw Cards',
            desc: `You're ${rawDiff.toFixed(0)}% below your raw card target. Raw cards offer flexibility and upside if you grade the right ones.`
          });
        } else {
          actions.push({
            title: 'Raw Exposure is High',
            desc: `You're ${Math.abs(rawDiff).toFixed(0)}% above target in raw. Consider grading your best raw cards to protect value.`
          });
        }
      }
    }
    
    // Add milestone-based actions
    const highGainMilestones = milestones.filter(m => m.item.gainPercent >= 100);
    if (highGainMilestones.length > 0) {
      actions.push({
        title: 'Take Some Profits',
        desc: `You have ${highGainMilestones.length} positions with 100%+ gains. Consider the "sell half" strategy to lock in your initial investment.`
      });
    }
    
    if (concentration && concentration.top1Percent > 20) {
      actions.push({
        title: 'Address Concentration Risk',
        desc: `Your top holding (${concentration.top1Name}) is ${concentration.top1Percent.toFixed(0)}% of your portfolio. Consider spreading risk across more positions.`
      });
    }
    
    if (actions.length === 0) {
      actions.push({
        title: 'Stay the Course',
        desc: `Your portfolio is well-aligned with your targets. Keep monitoring the market and maintain your current strategy.`
      });
    }
    
    return actions.map((action, i) => `
      <div class="action-item">
        <div class="action-number">${i + 1}</div>
        <div class="action-content">
          <div class="action-title">${action.title}</div>
          <div class="action-desc">${action.desc}</div>
        </div>
      </div>
    `).join('');
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Upload your portfolio to generate a report</p>
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
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Generate Report</h1>
        </div>
        <p className="text-muted-foreground">
          Download a comprehensive portfolio analysis report
        </p>
      </div>

      {/* Report Preview Card */}
      <div className="glass-card p-8 animate-fade-in">
        <div className="text-center max-w-xl mx-auto">
          {/* Icon Display */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">
            Your Personal Portfolio Report Card
          </h2>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get a beautifully designed 2-3 page PDF that breaks down everything about your collection. 
            Discover what kind of collector you are, celebrate your top hits, understand your risks, 
            and get a clear action plan tailored to your goals.
          </p>

          {/* What's Included */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            {[
              { icon: Sparkles, label: 'Collector Profile', desc: 'Your unique collecting personality' },
              { icon: TrendingUp, label: 'Top Performers', desc: 'Your biggest wins highlighted' },
              { icon: Shield, label: 'Risk Analysis', desc: 'Concentration & diversification' },
              { icon: Target, label: 'Action Plan', desc: 'Clear next steps for your goals' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateReport}
            disabled={isGenerating}
            size="lg"
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-primary/25"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate & Download Report
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Downloads as an HTML file you can view in any browser or print to PDF
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> This report provides analysis based on your uploaded data, 
          not financial advice. Market conditions change and past performance doesn't guarantee future results. 
          Always do your own research before making collecting decisions.
        </p>
      </div>
    </div>
  );
}
