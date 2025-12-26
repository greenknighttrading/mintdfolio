import { AllocationBreakdown, AllocationPreset, AllocationTarget, ConcentrationRisk, Insight, PortfolioSummary, ProfitMilestone } from "@/lib/types";

type BuildPortfolioReportHtmlParams = {
  summary: PortfolioSummary | null;
  allocation: AllocationBreakdown | null;
  concentration: ConcentrationRisk | null;
  milestones: ProfitMilestone[];
  insights: Insight[];
  allocationTarget: AllocationTarget;
  allocationPreset: AllocationPreset;
};

export function buildPortfolioReportHtml({
  summary,
  allocation,
  concentration,
  milestones,
  insights,
  allocationTarget,
  allocationPreset,
}: BuildPortfolioReportHtmlParams) {
  const getCollectorType = () => {
    if (!allocation) return { type: "Balanced Collector", description: "" };

    const sealed = allocation.sealed.percent;
    const slabs = allocation.slabs.percent;
    const raw = allocation.rawCards.percent;

    if (sealed >= 50) {
      return {
        type: "The Vault Keeper",
        description:
          "You're a patient investor who believes in the long game. Your heavy sealed allocation shows you understand the power of scarcity and time. You're the type who sees an ETB and thinks \"future vintage.\"",
      };
    } else if (slabs >= 50) {
      return {
        type: "The Trophy Hunter",
        description:
          "You chase the grails. Your slab-heavy portfolio shows you value authenticated excellence over quantity. Each piece in your collection tells a story of pursuit and triumph.",
      };
    } else if (raw >= 50) {
      return {
        type: "The Volume Player",
        description:
          "You play the numbers game with raw cards, finding value where others overlook. You're nimble, quick to move, and always hunting for the next undervalued gem.",
      };
    } else if (sealed >= 30 && slabs >= 30) {
      return {
        type: "The Strategic Diversifier",
        description:
          "You've built a fortress portfolio with both sealed potential and graded security. You understand that balance isn't boring—it's smart.",
      };
    }

    return {
      type: "The Balanced Collector",
      description:
        "You appreciate all aspects of the hobby and your portfolio reflects that wisdom. You're not putting all your eggs in one basket, and that's a strength.",
    };
  };

  const getNarrativeContent = () => {
    const sealed = allocation?.sealed.percent || 0;
    const slabs = allocation?.slabs.percent || 0;
    const raw = allocation?.rawCards.percent || 0;
    const healthScore = summary?.healthScore || 0;
    const totalGainPercent = summary?.unrealizedPLPercent || 0;
    const topHits = milestones.filter((m) => m.item.gainPercent >= 100);

    // Collector type narrative
    let collectorNarrative = "";
    if (sealed >= 50) {
      collectorNarrative = `When I say "Vault Keeper," I don't mean passive. I mean <em>intentional</em>.<br><br>
A heavy sealed allocation tells me you understand something most people don't: time is the real multiplier in Pokémon. You're not chasing week-to-week price action. You're betting on scarcity, nostalgia, and the fact that Pokémon has a 25-year history of rewarding patience.<br><br>
You're the type of collector who can look at an ETB or a premium collection and already see it as future vintage — not because it's guaranteed, but because you're comfortable holding through boredom, sideways movement, and market noise.<br><br>
That mindset is a strength. But it also comes with trade-offs — and we'll talk about those honestly in this report.`;
    } else if (slabs >= 50) {
      collectorNarrative = `Trophy Hunters don't collect — they <em>curate</em>.<br><br>
Your slab-heavy portfolio tells me you value authenticated excellence over quantity. Every graded card in your collection represents a deliberate choice: the hunt, the evaluation, the commitment to quality.<br><br>
This approach has real advantages. Graded cards offer liquidity, authenticity, and a clear market. You can exit positions faster than sealed holders, and you have proof of condition that raw collectors don't.<br><br>
The trade-off? You're paying a premium for that security, and you may miss the explosive upside that comes from sealed appreciation. But that's a conscious choice — and this report will help you optimize around it.`;
    } else if (raw >= 50) {
      collectorNarrative = `Volume Players see what others miss.<br><br>
Your raw-heavy portfolio tells me you're comfortable with uncertainty. You're hunting for mispriced cards, grading candidates, and opportunities that require a trained eye to spot.<br><br>
This approach offers maximum flexibility. You can pivot quickly, capitalize on market inefficiencies, and your upside on any single card is theoretically unlimited if you grade the right one.<br><br>
The risk? Raw cards carry condition uncertainty, and liquidity can be harder. But you already know that — and this report will help you manage those trade-offs.`;
    } else {
      collectorNarrative = `Balanced collectors often get underestimated — but I see it differently.<br><br>
A diversified portfolio isn't boring. It's <em>resilient</em>. You've spread your conviction across sealed appreciation, graded security, and raw flexibility.<br><br>
This means you can weather different market conditions. When sealed stagnates, your graded cards provide liquidity. When raw prices spike, you're positioned to benefit. You're not betting everything on one thesis.<br><br>
The trade-off is that you may not capture the full upside of any single category. But for most collectors, that's the right call — and this report will help you fine-tune your balance.`;
    }

    // Overview narrative
    const overviewNarrative =
      totalGainPercent >= 0
        ? `At a glance, this portfolio is doing its job.<br><br>
A ${totalGainPercent >= 10 ? "strong " : ""}${totalGainPercent.toFixed(1)}% unrealized return tells me two things at once:<br><br>
<strong>1.</strong> You're positioned correctly long-term.<br>
<strong>2.</strong> You're not overexposed to hype-driven, short-term spikes.<br><br>
That's a good thing — even if it doesn't feel exciting.<br><br>
The total value reflects real conviction capital, not flipping capital. This isn't money that needs to move tomorrow, and that gives you leverage most collectors don't have.`
        : `Let's be honest: seeing red isn't fun.<br><br>
A ${Math.abs(totalGainPercent).toFixed(1)}% unrealized loss tells me you're in drawdown territory. But here's what matters more than the number: <em>why</em> you're down and <em>what</em> you're holding.<br><br>
If your positions are fundamentally sound — sealed products from recent sets, quality graded cards, undervalued raw gems — then this drawdown is temporary. Markets don't move in straight lines.<br><br>
The question isn't whether you're down. It's whether your thesis is still intact. And this report will help you evaluate that.`;

    // Health score narrative
    let healthNarrative = "";
    if (healthScore >= 80) {
      healthNarrative = `A score of ${healthScore} tells me this portfolio is <em>well-constructed</em>.<br><br>
You have strong allocation balance, reasonable liquidity, controlled concentration, and disciplined profit-taking. This is the profile of a collector who thinks like an investor.`;
    } else if (healthScore >= 60) {
      healthNarrative = `A ${healthScore} tells me this: You have strong conviction and solid positioning — but the portfolio is tilted, not optimized.<br><br>
And that's not inherently bad.<br><br>
The score isn't punishing you for believing in your strategy. It's simply reflecting that high-conviction portfolios trade balance for upside.<br><br>
If your thesis plays out, this score will rise naturally. If the market stagnates, the current tilt becomes the drag.`;
    } else {
      healthNarrative = `A ${healthScore} tells me there's work to do — but it's not a crisis.<br><br>
Lower health scores typically mean one of a few things: heavy concentration in one category, limited liquidity, or positions that have drawn down significantly.<br><br>
The good news? These are all addressable. This report will give you specific steps to improve your score without abandoning your core thesis.`;
    }

    // Allocation narrative - with sealed risk warning
    let allocationNarrative = "";
    const isLowSealed = sealed < 20;
    const isSealedSmallest = sealed < slabs && sealed < raw;

    // Add sealed risk warning if applicable
    let sealedWarning = "";
    if (isLowSealed) {
      sealedWarning = `<strong style="color: #f59e0b;">⚠️ Risk Alert:</strong> Your sealed allocation is below 20%. We recommend that sealed take up a substantial part of any collection as it is historically the safest asset to hold. Sealed products — especially booster boxes and ETBs — have shown the most consistent long-term appreciation because they represent finite supply that only decreases over time.<br><br>`;
    } else if (isSealedSmallest) {
      sealedWarning = `<strong style="color: #f59e0b;">⚠️ Note:</strong> Sealed is currently your smallest category. While your approach has merits, consider that sealed products have historically provided the most reliable long-term returns. Booster boxes and ETBs in particular are never reprinted, making them natural stores of value.<br><br>`;
    }

    if (sealed >= 70) {
      allocationNarrative = `On paper, this allocation doesn't look balanced.<br><br>
${sealed.toFixed(0)}% sealed is aggressive — no sugarcoating that.<br><br>
But balance isn't about symmetry. It's about <em>alignment with intent</em>.<br><br>
This portfolio is balanced for a high-conviction sealed strategy because:<br>
<strong>•</strong> Your sealed exposure is spread across multiple products, not one bet<br>
<strong>•</strong> You still maintain graded and raw exposure for liquidity and flexibility<br>
<strong>•</strong> You're not relying on sealed to fund short-term expenses<br><br>
In other words: This isn't reckless concentration — it's <em>deliberate</em> concentration.<br><br>
That said, there's a difference between conviction and fragility, and that's where the next sections matter.`;
    } else if (slabs >= 70) {
      allocationNarrative = `${sealedWarning}A ${slabs.toFixed(0)}% graded allocation is a strong statement.<br><br>
You've prioritized authenticated, liquid assets over long-term sealed plays or speculative raw cards. That's a defensive posture — and there's nothing wrong with that.<br><br>
The upside: you can exit positions quickly if needed. The downside: you may be paying a premium for that security, and sealed products often outperform over multi-year horizons.<br><br>
This allocation makes sense if you value flexibility over maximum upside. Let's make sure the rest of your portfolio supports that goal.`;
    } else {
      allocationNarrative = `${sealedWarning}Your current mix of ${sealed.toFixed(0)}% sealed, ${slabs.toFixed(0)}% graded, and ${raw.toFixed(0)}% raw reflects a balanced approach.<br><br>
You're not betting everything on one category, which means you can weather different market conditions. Sealed gives you long-term upside, graded provides liquidity and authenticity, and raw offers flexibility.<br><br>
The trade-off is that you won't capture the full explosive upside if one category massively outperforms. But for most collectors, this balanced approach is the smarter play.`;
    }

    // Top performers narrative
    const topPerformersNarrative =
      topHits.length > 0
        ? `A 100%+ gain isn't a victory lap — it's a <em>decision point</em>.<br><br>
Big winners are dangerous, not because they're bad, but because they trick you into thinking "I don't need a plan anymore."<br><br>
Historically, this is where disciplined collectors do one of three things:<br><br>
<strong>1.</strong> Sell half to lock in original capital<br>
<strong>2.</strong> Rotate profits into underweighted categories (graded or raw)<br>
<strong>3.</strong> Hold intentionally because the item has structural scarcity<br><br>
The key word is <em>intentional</em>.<br><br>
If you're holding, you should be able to explain why — not just hope it goes higher.`
        : `You don't have any 100%+ gainers yet — and that's okay.<br><br>
Patience is the name of the game in Pokémon collecting. Most successful portfolios took years to show their best returns.<br><br>
The key is to stay positioned in fundamentally sound products and let time do the work.`;

    // Strengths narrative
    const strengthsNarrative = `The biggest strength here isn't performance — it's <em>restraint</em>.<br><br>
You haven't panic-sold drawdowns. You haven't over-rotated into whatever's trending. You've stayed consistent.<br><br>
That matters more than timing.<br><br>
Any underweights aren't failures — they're opportunities. You already did the hard part by building conviction capital.`;

    // Risks narrative
    const risksNarrative = `There are three real risks in this portfolio — and none of them are about Pokémon collapsing.<br><br>
<strong>Risk #1: Liquidity Compression</strong><br>
$${sealed >= 50 ? "Sealed performs best over long timelines, but it's slower to exit. If you ever need liquidity quickly, you'll feel that friction." : "Your current mix has reasonable liquidity, but keep an eye on how quickly you could exit if needed."}<br><br>
<strong>Risk #2: Opportunity Cost</strong><br>
$${sealed >= 60 ? `Being ${sealed.toFixed(0)}%+ sealed means you may miss tactical opportunities in graded or raw cards when markets misprice them.` : "Your diversified approach minimizes this risk, but stay alert to opportunities across all categories."}<br><br>
<strong>Risk #3: Emotional Over-Attachment</strong><br>
High-conviction portfolios can make it harder to trim winners objectively — especially items you love.<br><br>
None of these invalidate the strategy. They just require awareness.`;

    // Action plan narrative
    const actionNarrative = `If this were my portfolio, I wouldn't rush.<br><br>
I'd rebalance slowly and intentionally, using strength — not fear.<br><br>
That might look like:<br><br>
<strong>•</strong> Trimming 5–10% of overweighted categories only from oversized winners<br>
<strong>•</strong> Redirecting that capital into underweighted positions<br>
<strong>•</strong> Building liquidity gradually, not all at once<br><br>
The goal isn't to abandon your thesis. It's to let your winners <em>fund flexibility</em>.`;

    // Rebalancing narrative
    const rebalanceNarrative = `If you moved closer to your target allocation over time:<br><br>
<strong>•</strong> Your health score improves (less concentration risk)<br>
<strong>•</strong> Your liquidity increases<br>
<strong>•</strong> Your downside becomes more manageable in flat markets<br><br>
The trade-off? You may slightly cap upside if one category outperforms everything else.<br><br>
That's the deal. There's no free lunch — only intentional trade-offs.`;

    // Closing narrative
    const closingNarrative = `This is a strong portfolio.<br><br>
Not because it's perfect — but because it's <em>honest</em>.<br><br>
You know what you believe in. You're not chasing noise. And you're already ahead of most collectors just by having a framework.<br><br>
The next level isn't changing your thesis.<br><br>
It's <em>refining execution</em>.`;

    return {
      collectorNarrative,
      overviewNarrative,
      healthNarrative,
      allocationNarrative,
      topPerformersNarrative,
      strengthsNarrative,
      risksNarrative,
      actionNarrative,
      rebalanceNarrative,
      closingNarrative,
    };
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
            title: "Increase Sealed Allocation",
            desc: `You're ${sealedDiff.toFixed(0)}% below your target. Consider picking up some sealed products on your next purchase.`,
          });
        } else {
          actions.push({
            title: "Consider Reducing Sealed",
            desc: `You're ${Math.abs(sealedDiff).toFixed(0)}% above target in sealed. If you need liquidity, this could be an area to trim.`,
          });
        }
      }

      if (Math.abs(slabsDiff) > 5) {
        if (slabsDiff > 0) {
          actions.push({
            title: "Add More Graded Cards",
            desc: `You're ${slabsDiff.toFixed(0)}% below your graded target. Authenticated cards offer both security and liquidity.`,
          });
        } else {
          actions.push({
            title: "Graded Position is Heavy",
            desc: `You're ${Math.abs(slabsDiff).toFixed(0)}% above target. Great for liquidity, but consider diversifying into other categories.`,
          });
        }
      }

      if (Math.abs(rawDiff) > 5) {
        if (rawDiff > 0) {
          actions.push({
            title: "Explore Raw Cards",
            desc: `You're ${rawDiff.toFixed(0)}% below your raw card target. Raw cards offer flexibility and upside if you grade the right ones.`,
          });
        } else {
          actions.push({
            title: "Raw Exposure is High",
            desc: `You're ${Math.abs(rawDiff).toFixed(0)}% above target in raw. Consider grading your best raw cards to protect value.`,
          });
        }
      }
    }

    // Add milestone-based actions
    const highGainMilestones = milestones.filter((m) => m.item.gainPercent >= 100);
    if (highGainMilestones.length > 0) {
      actions.push({
        title: "Take Some Profits",
        desc: `You have ${highGainMilestones.length} positions with 100%+ gains. Consider the "sell half" strategy to lock in your initial investment.`,
      });
    }

    if (concentration && concentration.top1Percent > 20) {
      actions.push({
        title: "Address Concentration Risk",
        desc: `Your top holding (${concentration.top1Name}) is ${concentration.top1Percent.toFixed(0)}% of your portfolio. Consider spreading risk across more positions.`,
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: "Stay the Course",
        desc: "Your portfolio is well-aligned with your targets. Keep monitoring the market and maintain your current strategy.",
      });
    }

    return actions
      .map(
        (action, i) => `
      <div class="action-item">
        <div class="action-number">${i + 1}</div>
        <div class="action-content">
          <div class="action-title">${action.title}</div>
          <div class="action-desc">${action.desc}</div>
        </div>
      </div>
    `
      )
      .join("");
  };

  const collectorProfile = getCollectorType();
  const topHits = milestones.slice(0, 5);
  const strengthInsights = insights.filter((i) => i.priority === "low");
  const riskInsights = insights.filter((i) => i.priority === "high" || i.priority === "medium");
  const narratives = getNarrativeContent();

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
    
    .narrative-block {
      background: rgba(15, 23, 42, 0.4);
      border-left: 3px solid rgba(139, 92, 246, 0.5);
      border-radius: 0 10px 10px 0;
      padding: 20px 24px;
      margin-top: 24px;
      font-size: 15px;
      line-height: 1.8;
      color: #cbd5e1;
    }
    
    .narrative-block em {
      color: #a78bfa;
      font-style: italic;
    }
    
    .narrative-block strong {
      color: #fff;
    }
    
    .narrative-title {
      font-size: 14px;
      font-weight: 600;
      color: #8b5cf6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
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

    .closing-section {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(129, 140, 248, 0.1));
      border: 1px solid rgba(139, 92, 246, 0.3);
      text-align: center;
      padding: 40px 32px;
    }

    .closing-section .section-title {
      justify-content: center;
    }

    .closing-section .section-title::before {
      display: none;
    }

    @media print {
      body { background: #fff; color: #1e293b; }
      .section { border: 1px solid #e2e8f0; }
      .stat-card { background: #f8fafc; }
      .section-title { color: #6366f1; }
      .narrative-block { background: #f8fafc; color: #475569; }
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
    
    <!-- What This Says About You -->
    <div class="section">
      <h2 class="section-title">What This Actually Says About You</h2>
      <div class="narrative-block">
        ${narratives.collectorNarrative}
      </div>
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
      
      <div class="narrative-block">
        <div class="narrative-title">How I'm Reading These Numbers</div>
        ${narratives.overviewNarrative}
      </div>
    </div>
    
    <!-- Health Score -->
    <div class="section">
      <h2 class="section-title">Portfolio Health Score</h2>
      <div style="text-align: center;">
        <div class="health-score">${healthScore}</div>
        <p style="color: #94a3b8; font-size: 14px;">out of 100</p>
      </div>
      
      <div class="narrative-block">
        <div class="narrative-title">How the Health Score Is Calculated — and Why It's Fair</div>
        <p style="margin-bottom: 16px;">The health score isn't about how much money you've made. It's about how resilient your portfolio is if the market does absolutely nothing for the next 12–24 months.</p>
        <p style="margin-bottom: 16px;"><strong>Here's what's being weighed:</strong><br>
        • Allocation balance – how far you are from your stated targets<br>
        • Liquidity mix – how easily positions can be exited if needed<br>
        • Concentration risk – how much of the portfolio is exposed to one thesis<br>
        • Drawdown exposure – how many positions are deep red<br>
        • Profit discipline – whether large winners are being managed intentionally</p>
        ${narratives.healthNarrative}
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
      
      <div class="narrative-block">
        <div class="narrative-title">Allocation Analysis</div>
        ${narratives.allocationNarrative}
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
      
      <div class="narrative-block">
        <div class="narrative-title">What to Do With Big Winners (This Is Where Most People Mess Up)</div>
        ${narratives.topPerformersNarrative}
      </div>
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
      
      <div class="narrative-block">
        <div class="narrative-title">What You're Actually Doing Well</div>
        ${narratives.strengthsNarrative}
      </div>
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
      
      <div class="narrative-block">
        <div class="narrative-title">Let's Be Honest About the Risks</div>
        ${narratives.risksNarrative}
      </div>
    </div>
    
    <!-- Action Plan -->
    <div class="section">
      <h2 class="section-title">Your Action Plan</h2>
      ${generateActionPlan()}
      
      <div class="narrative-block">
        <div class="narrative-title">How I'd Actually Execute This (Not Theoretical)</div>
        ${narratives.actionNarrative}
      </div>
    </div>
    
    <!-- Rebalancing Considerations -->
    <div class="section">
      <h2 class="section-title">What Happens If You Rebalance?</h2>
      <div class="narrative-block">
        ${narratives.rebalanceNarrative}
      </div>
    </div>
    
    <!-- My Takeaway (Closing) -->
    <div class="section closing-section">
      <h2 class="section-title">My Takeaway</h2>
      <div class="narrative-block" style="border-left: none; text-align: center; max-width: 600px; margin: 0 auto;">
        ${narratives.closingNarrative}
      </div>
    </div>
    
    <footer class="footer">
      <p>Generated by mintdfolio • Your Pokémon Financial Advisor</p>
      <p style="margin-top: 8px;">This report is for informational purposes only. Not financial advice. Market conditions change—always do your own research.</p>
    </footer>
  </div>
</body>
</html>`;
}
