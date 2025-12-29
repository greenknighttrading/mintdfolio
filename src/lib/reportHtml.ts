import { AllocationBreakdown, AllocationPreset, AllocationTarget, ConcentrationRisk, EraAllocationBreakdown, Insight, PortfolioItem, PortfolioSummary, ProfitMilestone, ERA_INFO } from "@/lib/types";
import { HealthScoreBreakdown } from "@/contexts/PortfolioContext";

// HTML escape function to prevent XSS attacks from user-supplied data
function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, (m) => escapeMap[m] || m);
}

type BuildPortfolioReportHtmlParams = {
  summary: PortfolioSummary | null;
  allocation: AllocationBreakdown | null;
  concentration: ConcentrationRisk | null;
  milestones: ProfitMilestone[];
  insights: Insight[];
  allocationTarget: AllocationTarget;
  allocationPreset: AllocationPreset;
  items: PortfolioItem[];
  healthScoreBreakdown?: HealthScoreBreakdown | null;
  eraAllocation?: EraAllocationBreakdown | null;
  monthlyBudget?: number;
};

// Archetype definitions
interface Archetype {
  name: string;
  subtitle: string;
  dataShows: string; // Now a single flowing paragraph without subheadings
  whyLooksThisWay: string;
  whatSaysAboutYou: string;
  strengths: string;
  tradeOff: string;
  gentleNudge: string;
}

export function buildPortfolioReportHtml({
  summary,
  allocation,
  concentration,
  milestones,
  insights,
  allocationTarget,
  allocationPreset,
  items,
  healthScoreBreakdown,
  eraAllocation,
  monthlyBudget = 500,
}: BuildPortfolioReportHtmlParams) {
  // Get specific portfolio items for personalized narratives
  const topGainers = [...items].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, 5);
  const topLosers = [...items].filter(i => i.gainPercent < 0).sort((a, b) => a.gainPercent - b.gainPercent).slice(0, 3);
  const biggestHoldings = [...items].sort((a, b) => b.totalMarketValue - a.totalMarketValue).slice(0, 3);
  const sealedItems = items.filter(i => i.assetType === 'Sealed');
  const slabItems = items.filter(i => i.assetType === 'Slab');
  const rawItems = items.filter(i => i.assetType === 'Raw Card');
  const topHits = milestones.filter((m) => m.item.gainPercent >= 100);

  const sealed = allocation?.sealed.percent || 0;
  const slabs = allocation?.slabs.percent || 0;
  const raw = allocation?.rawCards.percent || 0;
  const totalValue = summary?.totalMarketValue || 0;
  const healthScore = healthScoreBreakdown?.overall ?? summary?.healthScore ?? 0;
  const totalGain = summary?.unrealizedPL || 0;
  const totalGainPercent = summary?.unrealizedPLPercent || 0;

  // Identify premium sealed products
  const boosterBoxes = sealedItems.filter(i => 
    i.productName.toLowerCase().includes('booster box') || 
    i.productName.toLowerCase().includes('case')
  );
  const pcEtbs = sealedItems.filter(i => 
    i.productName.toLowerCase().includes('pokemon center') && 
    i.productName.toLowerCase().includes('etb')
  );
  const etbs = sealedItems.filter(i => 
    i.productName.toLowerCase().includes('etb') || 
    i.productName.toLowerCase().includes('elite trainer')
  );

  // Determine Archetype
  const getArchetype = (): Archetype => {
    const topSealedProducts = sealedItems.slice(0, 3).map(i => escapeHtml(i.productName)).join(', ');
    const topSlabs = slabItems.slice(0, 3).map(i => escapeHtml(i.productName)).join(', ');

    // Build sealed quality notes without green highlighting
    const buildSealedQualityNotes = () => {
      const notes: string[] = [];
      if (boosterBoxes.length > 0) {
        notes.push(`You have ${boosterBoxes.length} booster box position${boosterBoxes.length > 1 ? 's' : ''} — the gold standard of Pokémon investing.`);
      }
      if (pcEtbs.length > 0) {
        notes.push(`Plus ${pcEtbs.length} Pokemon Center ETB${pcEtbs.length > 1 ? 's' : ''} — premium products with strong collector demand.`);
      }
      return notes.join(' ');
    };

    // The Sentinel - High sealed (50%+)
    if (sealed >= 50) {
      const sealedQualityNote = buildSealedQualityNotes();
      const sealedDiff = Math.abs(sealed - allocationTarget.sealed).toFixed(0);
      const sealedDirection = sealed > allocationTarget.sealed ? 'above' : 'below';

      return {
        name: "The Sentinel",
        subtitle: "A long-term guardian who trusts time more than noise.",
        dataShows: `You have ${sealed.toFixed(0)}% sealed, well above average, spread across ${sealedItems.length} products${topSealedProducts ? ` including ${topSealedProducts}` : ''}. Your sealed allocation sits ${sealedDiff}% ${sealedDirection} your target, while slabs and raw make up a smaller portion of your portfolio.${sealedQualityNote ? `<br><br>${sealedQualityNote}` : ''}<br><br>High sealed exposure is actually a positive signal for Pokémon investing — sealed products have a 25-year track record of rewarding patience, representing finite and decreasing supply.`,
        whyLooksThisWay: "This tells me you prioritize durability over activity. You're not trying to outsmart the market — you're letting scarcity and time work in your favor. Sealed products represent finite, decreasing supply, and your allocation reflects confidence in this thesis.",
        whatSaysAboutYou: "You're calm under pressure. Price swings don't shake you, and you don't feel the need to constantly \"do something.\" You're comfortable waiting while others react. You'd rather be early than loud.",
        strengths: "Collectors like you tend to perform well over long timelines. You avoid overtrading, reduce decision fatigue, and benefit when patience is rewarded. Booster boxes and premium ETBs have historically shown the strongest appreciation.",
        tradeOff: "Sealed portfolios can feel slow and less flexible. Liquidity isn't instant — but that's a trade you've consciously accepted for long-term appreciation potential.",
        gentleNudge: "If you ever want optionality without abandoning your strategy, slabs can act as pressure valves — not replacements."
      };
    }

    // The Trophy Hunter - High slabs (50%+)
    if (slabs >= 50) {
      return {
        name: "The Trophy Hunter",
        subtitle: "A curator who values authenticated excellence over quantity.",
        dataShows: `Your collection is ${slabs.toFixed(0)}% graded cards${topSlabs ? `, featuring pieces like ${topSlabs}` : ''}. You've assembled ${slabItems.length} graded pieces, each representing a deliberate choice.<br><br>Graded cards offer something sealed collectors don't have: easier exit options and established price discovery. PSA 10s are the gold standard for graded investments, while PSA 9s offer solid value at lower entry points.`,
        whyLooksThisWay: "This tells me you value authentication and condition certainty over quantity. Every graded card passed a deliberate filter: Is it worth the grading fee? Is the condition exceptional? Is there a market for this specific card?",
        whatSaysAboutYou: "You're a curator, not just a collector. You understand that PSA, CGC, or BGS cases aren't just plastic — they're proof of provenance and protection. You've paid for that peace of mind, and that's a valid choice for a serious collection.",
        strengths: "Your approach gives you something sealed collectors don't have: easier exit options. Graded cards have established price discovery on eBay, PWCC, and other platforms. When you need to sell, you can move faster than someone trying to offload sealed product.",
        tradeOff: "You're paying a premium for security and authentication. While graded cards offer liquidity, you may miss the explosive long-term appreciation that sealed products can provide.",
        gentleNudge: "If you're looking to diversify, sealed booster boxes complement graded cards well — they offer the long-term thesis while your slabs provide flexibility."
      };
    }

    // The Detective - High raw (50%+)
    if (raw >= 50) {
      return {
        name: "The Detective",
        subtitle: "A quiet observer who connects dots others miss.",
        dataShows: `You hold ${rawItems.length} raw card positions, making up ${raw.toFixed(0)}% of your portfolio. Many may be grading candidates waiting to unlock value.<br><br>Raw cards represent the highest upside potential when graded correctly. Consider which cards might be PSA 10 candidates — these could significantly increase in value once authenticated.`,
        whyLooksThisWay: "This tells me you trust observation over attention. You see raw cards as options contracts — each one has potential upside if graded, but you're not paying the premium until you know it's worth it. That's arbitrage thinking.",
        whatSaysAboutYou: "You're curious, patient, and detail-oriented. You enjoy the process of discovery — not just the outcome. You'd rather investigate than follow headlines.",
        strengths: "People like you often find value early. You're less influenced by crowd psychology and more comfortable being alone in your thinking. Maximum flexibility, maximum upside potential.",
        tradeOff: "Condition uncertainty affects resale value, and raw cards without authentication can be harder to sell to serious buyers. Being early means waiting — recognition doesn't always come on your timeline.",
        gentleNudge: "When one of your ideas starts gaining attention, don't be afraid to let it run — you earned it. Consider grading your best raw cards to unlock their full potential."
      };
    }

    // The Politician - Balanced (30%+ sealed AND 30%+ slabs)
    if (sealed >= 30 && slabs >= 30) {
      return {
        name: "The Politician",
        subtitle: "A master of balance, negotiation, and compromise.",
        dataShows: `Your portfolio sits close to equilibrium, with ${sealed.toFixed(0)}% sealed, ${slabs.toFixed(0)}% slabs, and ${raw.toFixed(0)}% raw. You're spread across ${items.length} positions with no single category dominating.<br><br>This balanced approach gives you exposure to multiple market conditions — you participate in sealed appreciation while maintaining liquidity through graded cards.`,
        whyLooksThisWay: "This tells me you value flexibility and adaptability. You don't commit everything to one idea — you keep options open and adjust as conditions change.",
        whatSaysAboutYou: "You're thoughtful and pragmatic. You understand trade-offs and don't chase absolutes. You like having leverage — and the ability to pivot.",
        strengths: "This is one of the most resilient styles. You can weather different market environments without being forced into uncomfortable decisions. If sealed products surge, you participate. If graded cards dominate the next bull run, you're there too.",
        tradeOff: "You may never feel fully \"all in\" on one thesis. Sometimes maximum conviction beats balance — but balance protects you from being wrong.",
        gentleNudge: "When you do feel strongly about a position, letting it grow slightly larger can be rewarding."
      };
    }

    // The Balanced Collector - Default
    return {
      name: "The Balanced Collector",
      subtitle: "A pragmatic investor who values diversification over concentration.",
      dataShows: `With ${sealed.toFixed(0)}% sealed, ${slabs.toFixed(0)}% graded, and ${raw.toFixed(0)}% raw across ${items.length} total holdings, you're not putting all your eggs in one basket.<br><br>Your diversification across asset types means you're positioned to benefit from whichever category leads the next market cycle.`,
      whyLooksThisWay: "This tells me you take a pragmatic approach. You haven't committed fully to any single strategy, and that's not weakness — it's flexibility. Your holdings across all three categories mean you can adapt as the market evolves.",
      whatSaysAboutYou: "You're not trying to predict which category will outperform next. You've collected what interests you while maintaining reasonable diversification. That's sustainable.",
      strengths: "By maintaining exposure across categories, you're positioned to benefit from whichever wave comes next. Your diversification across ${items.length} positions shows organic growth rather than a forced strategy.",
      tradeOff: "You may not capture the full explosive upside if one category massively outperforms. But for most collectors, this is the smarter, more sustainable play.",
      gentleNudge: "The challenge is ensuring intentionality — it's easy for this profile to become \"random accumulation\" without clear targets. Keep analyzing your portfolio to stay strategic."
    };
  };

  const archetype = getArchetype();

  // Generate Health Score Explanation
  const getHealthScoreExplanation = () => {
    if (healthScore >= 75) {
      return "This score suggests your portfolio can likely handle 12–24 months of flat or noisy prices without forcing bad decisions. You have good balance across asset types, reasonable liquidity, and controlled concentration.";
    } else if (healthScore >= 65) {
      return "This score indicates moderate resilience. Your portfolio has some areas that could be strengthened — whether that's diversification, allocation balance, or concentration levels. Nothing urgent, but worth monitoring.";
    } else {
      return "This score indicates higher concentration with limited diversification. This isn't necessarily wrong — high-conviction portfolios trade balance for upside — but it does mean you're more exposed to single-thesis risk.";
    }
  };

  // Generate Verdict
  const getVerdict = () => {
    const isHealthy = healthScore >= 75;
    const isModerate = healthScore >= 65 && healthScore < 75;
    const hasTopHits = topHits.length > 0;
    const isProfitable = totalGainPercent >= 0;
    const biggestGap = Math.max(
      Math.abs(sealed - allocationTarget.sealed),
      Math.abs(slabs - allocationTarget.slabs),
      Math.abs(raw - allocationTarget.rawCards)
    );
    const isAligned = biggestGap < 10;

    if (isHealthy && isAligned && isProfitable) {
      return "You're executing your strategy well. The biggest opportunity right now isn't changing direction — it's refining balance and letting time work.";
    } else if (isHealthy && !isAligned) {
      return `You're doing well overall. Your main opportunity is adjusting your allocation — you're ${biggestGap.toFixed(0)}% away from your targets in some areas. Small adjustments over time will get you there.`;
    } else if (isModerate) {
      return "Your portfolio is solid but has room for refinement. Focus on the single area that matters most — whether that's concentration, allocation, or taking some profits from big winners.";
    } else {
      return "Your portfolio shows conviction but higher concentration. If your thesis is right, this pays off. If you want more balance, direct new capital toward underweight categories over time.";
    }
  };

  // Strategy Overview
  const presetLabel = allocationPreset === 'conservative' ? 'The Investor (Conservative)' : 
                      allocationPreset === 'aggressive' ? 'The Purist (Aggressive)' : 
                      allocationPreset === 'balanced' ? 'The Hybrid (Balanced)' : 'Custom';

  const getAllocationStatus = (current: number, target: number) => {
    const diff = current - target;
    if (Math.abs(diff) <= 5) return { label: 'On target', color: '#4ade80' };
    if (diff > 5) return { label: 'Slightly over', color: '#fbbf24' };
    return { label: 'Slightly under', color: '#f59e0b' };
  };

  const sealedStatus = getAllocationStatus(sealed, allocationTarget.sealed);
  const slabsStatus = getAllocationStatus(slabs, allocationTarget.slabs);
  const rawStatus = getAllocationStatus(raw, allocationTarget.rawCards);

  // Why This Strategy Works (condensed)
  const getStrategyBullets = () => {
    const bullets = [];
    if (allocationPreset === 'conservative' || allocationPreset === 'aggressive') {
      bullets.push("Sealed products have a 25-year track record of rewarding patience — they represent finite, decreasing supply.");
    }
    if (allocationPreset === 'aggressive') {
      bullets.push("Booster boxes are the gold standard for long-term appreciation. Pokemon Center ETBs add premium exclusivity.");
    }
    if (allocationPreset === 'conservative' || allocationPreset === 'balanced') {
      bullets.push("Graded cards provide liquidity and proven value — easier exits when you need flexibility.");
    }
    if (allocationPreset === 'balanced') {
      bullets.push("Balanced portfolios can perform in multiple market conditions without being forced into uncomfortable decisions.");
    }
    return bullets.slice(0, 3);
  };

  // Primary Action
  const getPrimaryAction = () => {
    // Find the most underweight category
    const sealedGap = allocationTarget.sealed - sealed;
    const slabsGap = allocationTarget.slabs - slabs;
    const rawGap = allocationTarget.rawCards - raw;
    
    const maxGap = Math.max(sealedGap, slabsGap, rawGap);
    
    if (maxGap <= 5) {
      if (topHits.length > 0) {
        const topWinner = topHits[0];
        return {
          action: `Consider reviewing profits on ${escapeHtml(topWinner.item.productName)}`,
          detail: `At +${topWinner.item.gainPercent.toFixed(0)}%, you could sell half to lock in $${topWinner.sellHalfProfit.toLocaleString()} profit while keeping ${topWinner.sellHalfUnitsRemaining} units. This isn't urgent — just worth considering.`
        };
      }
      return {
        action: "Stay the course",
        detail: "Your portfolio is well-aligned with your targets. Keep monitoring and maintain your current strategy. Direct any new capital proportionally across categories."
      };
    }

    if (sealedGap === maxGap) {
      return {
        action: "Direct your next purchases toward sealed products",
        detail: `You're ${sealedGap.toFixed(0)}% below your sealed target. Consider booster boxes or Pokemon Center ETBs — these are the core of long-term appreciation.`
      };
    }
    if (slabsGap === maxGap) {
      return {
        action: "Add graded cards to your next purchases",
        detail: `You're ${slabsGap.toFixed(0)}% below your graded target. Authenticated cards offer liquidity and proven value.`
      };
    }
    return {
      action: "Explore raw card opportunities",
      detail: `You're ${rawGap.toFixed(0)}% below your raw target. Raw cards offer flexibility and upside if you grade the right ones.`
    };
  };

  const primaryAction = getPrimaryAction();

  // Trade-offs section
  const getTradeOffs = () => {
    const tradeoffs = [];
    
    if (concentration && concentration.top1Percent > 20) {
      tradeoffs.push({
        title: "Concentration over diversification",
        description: `You've chosen to concentrate ${concentration.top1Percent.toFixed(0)}% in your top position. If it performs well, you win bigger. If not, you feel it more.`
      });
    }
    
    if (sealed >= 50) {
      tradeoffs.push({
        title: "Patience over liquidity",
        description: "Sealed products reward long timelines but are slower to exit. You've accepted waiting for the thesis to play out."
      });
    }
    
    if (slabs >= 50) {
      tradeoffs.push({
        title: "Security over maximum upside",
        description: "You're paying a premium for authentication and liquidity. This protects you but may limit explosive gains."
      });
    }
    
    if (raw >= 40) {
      tradeoffs.push({
        title: "Flexibility over certainty",
        description: "Raw cards have condition uncertainty but offer the most upside potential if graded correctly."
      });
    }

    if (tradeoffs.length === 0) {
      tradeoffs.push({
        title: "Balance over conviction",
        description: "You've chosen diversification over concentration. This protects you from single-thesis failure but may cap extreme upside."
      });
    }

    return tradeoffs;
  };

  // Era Allocation Section with Analysis
  const generateEraAllocationSection = () => {
    if (!eraAllocation) return '';

    const eras = [
      { key: 'vintage', label: 'Vintage', info: '1996-2002', value: eraAllocation.vintage },
      { key: 'classic', label: 'Classic', info: '2003-2010', value: eraAllocation.classic },
      { key: 'modern', label: 'Modern', info: '2011-2018', value: eraAllocation.modern },
      { key: 'ultraModern', label: 'Ultra Modern', info: '2019-2022', value: eraAllocation.ultraModern },
      { key: 'current', label: 'Current', info: '2023+', value: eraAllocation.current },
    ];

    const olderEra = eraAllocation.vintage.percent + eraAllocation.classic.percent;
    const midModern = eraAllocation.modern.percent + eraAllocation.ultraModern.percent;
    const currentWindow = eraAllocation.current.percent;

    // Generate era-specific analysis
    const generateEraAnalysis = () => {
      const analyses: string[] = [];

      // Older Era Analysis
      if (olderEra >= 40) {
        analyses.push(`Your ${olderEra.toFixed(0)}% allocation to Older Era (Vintage + Classic) shows a preference for established, battle-tested products. These eras have proven appreciation patterns and are generally considered lower risk — the supply is locked in, demand is established, and nostalgia only grows stronger.`);
      } else if (olderEra >= 20) {
        analyses.push(`Your ${olderEra.toFixed(0)}% Older Era exposure provides a stable foundation. Vintage and Classic products anchor your portfolio with proven appreciation history and lower volatility.`);
      } else if (olderEra > 0) {
        analyses.push(`Your ${olderEra.toFixed(0)}% Older Era allocation is relatively light. While newer products have their place, consider that Vintage and Classic items offer stability and proven long-term performance.`);
      }

      // Mid Modern Analysis
      if (midModern >= 40) {
        analyses.push(`With ${midModern.toFixed(0)}% in Mid Modern (Modern + Ultra Modern), you're positioned in a medium-risk window. These products are past initial release hype but haven't yet achieved full "vintage" status. This is the speculation zone — products that could graduate to classic status or remain in limbo.`);
      } else if (midModern >= 20) {
        analyses.push(`Your ${midModern.toFixed(0)}% Mid Modern allocation balances speculation with established products. This era represents medium risk — past the initial hype cycle but not yet proven over decades.`);
      } else if (midModern > 0) {
        analyses.push(`Your ${midModern.toFixed(0)}% Mid Modern exposure is conservative. This era often offers strong value opportunities for patient investors.`);
      }

      // Current Window Analysis
      if (currentWindow >= 30) {
        analyses.push(`Your ${currentWindow.toFixed(0)}% Current Window allocation is aggressive. New releases carry higher risk — print runs are unknown, demand is unproven, and you're competing with retail availability. That said, identifying winners early can be rewarding if you're selective about which products to hold long-term.`);
      } else if (currentWindow >= 15) {
        analyses.push(`Your ${currentWindow.toFixed(0)}% Current Window exposure is moderate. Newer products add growth potential but carry higher uncertainty about future performance.`);
      } else if (currentWindow > 0) {
        analyses.push(`Your ${currentWindow.toFixed(0)}% Current Window allocation is conservative. You're wisely avoiding the rush on new releases, though selective positions in standout products can add upside.`);
      }

      return analyses.join('<br><br>');
    };

    return `
      <div class="era-summary">
        <div class="era-risk-item">
          <span class="era-label">Older Era (Low Risk)</span>
          <span class="era-value">${olderEra.toFixed(0)}%</span>
        </div>
        <div class="era-risk-item">
          <span class="era-label">Mid Modern (Medium Risk)</span>
          <span class="era-value">${midModern.toFixed(0)}%</span>
        </div>
        <div class="era-risk-item">
          <span class="era-label">Current Window (High Risk)</span>
          <span class="era-value">${currentWindow.toFixed(0)}%</span>
        </div>
      </div>
      <div class="era-breakdown">
        ${eras.map(era => `
          <div class="era-item">
            <div class="era-info">
              <span class="era-name">${era.label}</span>
              <span class="era-years">${era.info}</span>
            </div>
            <div class="era-bar-container">
              <div class="era-bar" style="width: ${era.value.percent}%"></div>
            </div>
            <span class="era-percent">${era.value.percent.toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
      <div class="era-analysis">
        <div class="era-analysis-title">What This Means For You</div>
        <div class="era-analysis-content">${generateEraAnalysis()}</div>
      </div>
    `;
  };

  // Rebalancing Plan with Plain English Explanation
  const generateRebalancingPlan = () => {
    if (!allocation) return '';
    
    const categories = [
      { key: 'sealed', label: 'Sealed Products', current: allocation.sealed, target: allocationTarget.sealed, 
        advice: 'Focus on booster boxes (the gold standard) or Pokemon Center ETBs. These premium sealed products have the strongest historical appreciation.' },
      { key: 'slabs', label: 'Graded Cards', current: allocation.slabs, target: allocationTarget.slabs,
        advice: 'PSA 10s are the gold standard for graded investments — their value is locked in and verified. PSA 9s offer solid value at lower entry points and are perfectly acceptable. Graded cards give you exposure to cards whose value has been authenticated and protected.' },
      { key: 'rawCards', label: 'Raw Cards', current: allocation.rawCards, target: allocationTarget.rawCards,
        advice: 'Look for cards with grading potential. The best raw pickups are those that could become PSA 10s — your profit margin expands significantly when you grade a winner.' },
    ];

    const totalUnderweight = categories.reduce((sum, cat) => {
      const targetValue = (cat.target / 100) * totalValue;
      const delta = targetValue - cat.current.value;
      return sum + (delta > 0 ? delta : 0);
    }, 0);

    const rebalanceItems = categories
      .map(cat => {
        const targetValue = (cat.target / 100) * totalValue;
        const delta = targetValue - cat.current.value;
        const monthlyShare = delta > 0 && totalUnderweight > 0
          ? (delta / totalUnderweight) * monthlyBudget
          : 0;
        const monthsNeeded = delta > 0 && monthlyShare > 0 
          ? Math.ceil(delta / monthlyShare)
          : 0;
        const isOverweight = delta < 0;
        return { ...cat, delta, monthlyShare, monthsNeeded, isOverweight };
      });

    const underweightItems = rebalanceItems.filter(cat => cat.monthlyShare > 0);
    const overweightItems = rebalanceItems.filter(cat => cat.isOverweight);

    if (underweightItems.length === 0) {
      return `<p class="balanced-message">Your portfolio is already balanced according to your targets. Keep doing what you're doing!</p>`;
    }

    const maxMonths = Math.max(...underweightItems.map(cat => cat.monthsNeeded));

    // Generate plain English summary
    const generatePlainEnglishSummary = () => {
      const summaryParts: string[] = [];
      
      summaryParts.push(`<strong>Here's what your $${monthlyBudget.toLocaleString()}/month budget means in plain English:</strong>`);
      
      underweightItems.forEach(cat => {
        const monthlyAmount = Math.round(cat.monthlyShare);
        summaryParts.push(`<br><br>• <strong>Invest $${monthlyAmount.toLocaleString()} per month in ${cat.label}.</strong> ${cat.advice}`);
      });

      if (overweightItems.length > 0) {
        const overweightNames = overweightItems.map(c => c.label).join(' and ');
        summaryParts.push(`<br><br>• <strong>You're already overweight on ${overweightNames}</strong> — no need to add more there. Let your existing positions do the work while you balance out the rest of your portfolio.`);
      }

      return summaryParts.join('');
    };

    return `
      <div class="rebalance-card">
        <div class="rebalance-title">Monthly Investment Budget: $${monthlyBudget.toLocaleString()}/month</div>
        <div class="rebalance-items">
          ${underweightItems.map(cat => `
            <div class="rebalance-item">
              <span class="rebalance-label">${cat.label}</span>
              <span class="rebalance-amount">$${Math.round(cat.monthlyShare).toLocaleString()}/mo</span>
            </div>
          `).join('')}
          ${overweightItems.map(cat => `
            <div class="rebalance-item overweight">
              <span class="rebalance-label">${cat.label}</span>
              <span class="rebalance-status">Already overweight</span>
            </div>
          `).join('')}
        </div>
        <div class="rebalance-explanation">
          ${generatePlainEnglishSummary()}
        </div>
        <div class="rebalance-timeline">
          <strong>Timeline:</strong> Following this plan consistently, you'll reach your target allocation in approximately ${maxMonths} months.
        </div>
      </div>
    `;
  };

  // Optional Review Items
  const getOptionalReviewItems = () => {
    const items = [];
    
    if (topHits.length > 0) {
      items.push({
        title: "Large Winners Worth Reviewing",
        content: topHits.slice(0, 3).map(hit => 
          `<strong>${escapeHtml(hit.item.productName)}</strong>: +${hit.item.gainPercent.toFixed(0)}% — Selling half would lock in $${hit.sellHalfProfit.toLocaleString()}`
        ).join('<br>')
      });
    }

    const milestoneInfo = [];
    const hits400 = milestones.filter(m => m.item.gainPercent >= 400);
    const hits200 = milestones.filter(m => m.item.gainPercent >= 200 && m.item.gainPercent < 400);
    const hits100 = milestones.filter(m => m.item.gainPercent >= 100 && m.item.gainPercent < 200);
    
    if (hits400.length > 0) milestoneInfo.push(`<strong>${hits400.length}</strong> position${hits400.length > 1 ? 's' : ''} at 400%+ gains`);
    if (hits200.length > 0) milestoneInfo.push(`<strong>${hits200.length}</strong> position${hits200.length > 1 ? 's' : ''} at 200%+ gains`);
    if (hits100.length > 0) milestoneInfo.push(`<strong>${hits100.length}</strong> position${hits100.length > 1 ? 's' : ''} at 100%+ gains`);
    
    if (milestoneInfo.length > 0) {
      items.push({
        title: "Profit Milestones",
        content: milestoneInfo.join('<br>') + '<br><br>Consider: At 100%+, sell enough to recoup initial cost. At 200%+, you\'re playing with house money. At 400%+, strongly consider locking in significant profits.'
      });
    }

    return items;
  };

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
      margin-bottom: 32px;
      padding-bottom: 24px;
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
    
    .subtitle { color: #94a3b8; font-size: 14px; }
    .date { color: #64748b; font-size: 12px; margin-top: 12px; }
    
    .section {
      background: rgba(30, 27, 75, 0.5);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 18px;
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
      height: 20px;
      background: linear-gradient(180deg, #a78bfa, #818cf8);
      border-radius: 2px;
    }
    
    /* Portfolio Snapshot */
    .snapshot-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .snapshot-card {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .snapshot-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }
    
    .snapshot-value.positive { color: #4ade80; }
    .snapshot-value.negative { color: #f87171; }
    
    .snapshot-label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .health-score-display {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .health-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    
    .health-circle.good { background: conic-gradient(#4ade80 calc(var(--score) * 3.6deg), rgba(74, 222, 128, 0.2) 0deg); }
    .health-circle.moderate { background: conic-gradient(#fbbf24 calc(var(--score) * 3.6deg), rgba(251, 191, 36, 0.2) 0deg); }
    .health-circle.low { background: conic-gradient(#f87171 calc(var(--score) * 3.6deg), rgba(248, 113, 113, 0.2) 0deg); }
    
    .health-explanation {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    
    /* Verdict */
    .verdict-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(129, 140, 248, 0.1));
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      font-size: 16px;
      color: #e2e8f0;
      line-height: 1.7;
    }
    
    /* Archetype */
    .archetype-header {
      text-align: center;
      padding: 32px 24px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(129, 140, 248, 0.1));
      border-radius: 16px;
      margin-bottom: 20px;
    }
    
    .archetype-name {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }
    
    .archetype-subtitle {
      color: #a78bfa;
      font-size: 15px;
      font-style: italic;
    }
    
    .archetype-section {
      margin-bottom: 20px;
    }
    
    .archetype-section-title {
      font-size: 13px;
      font-weight: 600;
      color: #8b5cf6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .archetype-content {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    
    /* Strategy Overview */
    .strategy-card {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .strategy-name {
      font-size: 16px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 16px;
    }
    
    .allocation-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    }
    
    .allocation-row:last-child { border-bottom: none; }
    
    .allocation-label { color: #cbd5e1; font-size: 14px; }
    .allocation-values { display: flex; align-items: center; gap: 12px; }
    .allocation-current { color: #fff; font-weight: 600; }
    .allocation-target { color: #94a3b8; font-size: 13px; }
    .allocation-status { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
    
    /* Primary Action */
    .primary-action {
      background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
      border: 1px solid rgba(74, 222, 128, 0.3);
      border-radius: 12px;
      padding: 24px;
    }
    
    .primary-action-title {
      font-size: 18px;
      font-weight: 600;
      color: #4ade80;
      margin-bottom: 12px;
    }
    
    .primary-action-detail {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    
    /* Trade-offs */
    .tradeoff-item {
      padding: 16px;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 10px;
      margin-bottom: 12px;
      border-left: 3px solid #f59e0b;
    }
    
    .tradeoff-title {
      font-weight: 600;
      color: #fff;
      margin-bottom: 6px;
    }
    
    .tradeoff-desc {
      font-size: 14px;
      color: #94a3b8;
    }
    
    /* Era Allocation */
    .era-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .era-risk-item {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    
    .era-label { font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px; }
    .era-value { font-size: 20px; font-weight: 700; color: #fff; }
    
    .era-breakdown { margin-top: 16px; }
    
    .era-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
    }
    
    .era-info { width: 120px; }
    .era-name { font-size: 13px; font-weight: 500; color: #fff; display: block; }
    .era-years { font-size: 11px; color: #64748b; }
    
    .era-bar-container {
      flex: 1;
      height: 8px;
      background: rgba(139, 92, 246, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .era-bar {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
      border-radius: 4px;
    }
    
    .era-percent { width: 40px; text-align: right; font-size: 13px; color: #a78bfa; font-weight: 600; }
    
    .era-analysis {
      margin-top: 20px;
      padding: 20px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 12px;
      border-left: 3px solid #8b5cf6;
    }
    
    .era-analysis-title {
      font-size: 14px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 12px;
    }
    
    .era-analysis-content {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    
    /* Rebalancing */
    .rebalance-card {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      padding: 20px;
    }
    
    .rebalance-title {
      font-size: 14px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 16px;
    }
    
    .rebalance-items { margin-bottom: 16px; }
    
    .rebalance-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    }
    
    .rebalance-item.overweight {
      opacity: 0.7;
    }
    
    .rebalance-label { color: #cbd5e1; }
    .rebalance-amount { color: #a78bfa; font-weight: 600; }
    .rebalance-status { color: #64748b; font-size: 13px; font-style: italic; }
    
    .rebalance-explanation {
      background: rgba(15, 23, 42, 0.4);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.8;
    }
    
    .rebalance-timeline {
      background: rgba(139, 92, 246, 0.15);
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      color: #a78bfa;
    }
    
    .balanced-message {
      color: #4ade80;
      text-align: center;
      padding: 20px;
    }
    
    /* Optional Items */
    .optional-item {
      background: rgba(15, 23, 42, 0.4);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;
    }
    
    .optional-title {
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
    }
    
    .optional-content {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.7;
    }
    
    /* Strategy Bullets */
    .strategy-bullets {
      list-style: none;
      padding: 0;
    }
    
    .strategy-bullets li {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      color: #cbd5e1;
    }
    
    .strategy-bullets li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #8b5cf6;
    }
    
    /* Collapsible */
    .collapsible-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: 12px 16px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .collapsible-title {
      font-size: 14px;
      font-weight: 600;
      color: #a78bfa;
    }
    
    .collapsible-content {
      padding: 16px;
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
      color: #64748b;
      font-size: 12px;
    }
    
    @media print {
      body { background: #fff; color: #1e293b; }
      .section { border: 1px solid #e2e8f0; }
      .snapshot-card { background: #f8fafc; }
      .section-title { color: #6366f1; }
    }
  </style>
</head>
<body>
  <div class="container" id="report-root">
    <header class="header">
      <div class="logo">mintdfolio</div>
      <p class="subtitle">Portfolio Analysis Report</p>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </header>
    
    <!-- 1. Portfolio Snapshot -->
    <div class="section">
      <h2 class="section-title">Portfolio Snapshot</h2>
      <div class="snapshot-grid">
        <div class="snapshot-card">
          <div class="snapshot-value">$${totalValue.toLocaleString()}</div>
          <div class="snapshot-label">Total Value</div>
        </div>
        <div class="snapshot-card">
          <div class="snapshot-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}$${totalGain.toLocaleString()} (${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(1)}%)</div>
          <div class="snapshot-label">Unrealized P/L</div>
        </div>
        <div class="snapshot-card">
          <div class="snapshot-value">${healthScore}</div>
          <div class="snapshot-label">Health Score</div>
        </div>
      </div>
      <div class="health-score-display">
        <div class="health-circle ${healthScore >= 75 ? 'good' : healthScore >= 65 ? 'moderate' : 'low'}" style="--score: ${healthScore}">
          ${healthScore}
        </div>
        <div class="health-explanation">
          ${getHealthScoreExplanation()}
        </div>
      </div>
    </div>
    
    <!-- 2. Verdict -->
    <div class="section">
      <h2 class="section-title">The Verdict</h2>
      <div class="verdict-box">
        ${getVerdict()}
      </div>
    </div>
    
    <!-- 3. Archetype Identity -->
    <div class="archetype-header">
      <div style="font-size: 13px; color: #8b5cf6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">What your collection says about you</div>
      <div class="archetype-name">You're ${archetype.name}</div>
      <div class="archetype-subtitle">${archetype.subtitle}</div>
    </div>
    
    <div class="section">
      <div class="archetype-section">
        <div class="archetype-section-title">What the Data Shows</div>
        <div class="archetype-content">${archetype.dataShows}</div>
      </div>
      
      <div class="archetype-section">
        <div class="archetype-section-title">Why Your Portfolio Looks This Way</div>
        <div class="archetype-content">${archetype.whyLooksThisWay}</div>
      </div>
      
      <div class="archetype-section">
        <div class="archetype-section-title">What This Says About You</div>
        <div class="archetype-content">${archetype.whatSaysAboutYou}</div>
      </div>
      
      <div class="archetype-section">
        <div class="archetype-section-title">Your Strengths</div>
        <div class="archetype-content">${archetype.strengths}</div>
      </div>
      
      <div class="archetype-section">
        <div class="archetype-section-title">The Trade-Off</div>
        <div class="archetype-content">${archetype.tradeOff}</div>
      </div>
      
      <div class="archetype-section">
        <div class="archetype-section-title">A Gentle Nudge</div>
        <div class="archetype-content">${archetype.gentleNudge}</div>
      </div>
    </div>
    
    <!-- 4. Strategy Overview -->
    <div class="section">
      <h2 class="section-title">Strategy Overview</h2>
      <div class="strategy-card">
        <div class="strategy-name">${presetLabel}</div>
        <div class="allocation-row">
          <span class="allocation-label">Sealed</span>
          <div class="allocation-values">
            <span class="allocation-current">${sealed.toFixed(0)}%</span>
            <span class="allocation-target">Target: ${allocationTarget.sealed}%</span>
            <span class="allocation-status" style="background: ${sealedStatus.color}20; color: ${sealedStatus.color}">${sealedStatus.label}</span>
          </div>
        </div>
        <div class="allocation-row">
          <span class="allocation-label">Graded</span>
          <div class="allocation-values">
            <span class="allocation-current">${slabs.toFixed(0)}%</span>
            <span class="allocation-target">Target: ${allocationTarget.slabs}%</span>
            <span class="allocation-status" style="background: ${slabsStatus.color}20; color: ${slabsStatus.color}">${slabsStatus.label}</span>
          </div>
        </div>
        <div class="allocation-row">
          <span class="allocation-label">Raw</span>
          <div class="allocation-values">
            <span class="allocation-current">${raw.toFixed(0)}%</span>
            <span class="allocation-target">Target: ${allocationTarget.rawCards}%</span>
            <span class="allocation-status" style="background: ${rawStatus.color}20; color: ${rawStatus.color}">${rawStatus.label}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 5. Why This Strategy Works -->
    <div class="section">
      <div class="collapsible-header">
        <span class="collapsible-title">Why This Strategy Works</span>
        <span style="color: #64748b; font-size: 12px;">Collapsed insight</span>
      </div>
      <ul class="strategy-bullets">
        ${getStrategyBullets().map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
    
    <!-- 6. Primary Action -->
    <div class="section">
      <h2 class="section-title">Primary Action</h2>
      <div class="primary-action">
        <div class="primary-action-title">${primaryAction.action}</div>
        <div class="primary-action-detail">${primaryAction.detail}</div>
      </div>
    </div>
    
    <!-- 7. Optional Review Items -->
    ${getOptionalReviewItems().length > 0 ? `
    <div class="section">
      <h2 class="section-title">Optional Review Items</h2>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px;">These are not urgent — just worth considering when you have time.</p>
      ${getOptionalReviewItems().map(item => `
        <div class="optional-item">
          <div class="optional-title">${item.title}</div>
          <div class="optional-content">${item.content}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- 8. Trade-Offs You've Chosen -->
    <div class="section">
      <h2 class="section-title">Trade-Offs You've Chosen</h2>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px;">These aren't mistakes — they're conscious choices that come with your strategy.</p>
      ${getTradeOffs().map(tradeoff => `
        <div class="tradeoff-item">
          <div class="tradeoff-title">${tradeoff.title}</div>
          <div class="tradeoff-desc">${tradeoff.description}</div>
        </div>
      `).join('')}
    </div>
    
    <!-- Deep Dive: Era Allocation -->
    <div class="section">
      <h2 class="section-title">Era Allocation</h2>
      ${generateEraAllocationSection()}
    </div>
    
    <!-- Deep Dive: Rebalancing Plan -->
    <div class="section">
      <h2 class="section-title">Your Rebalancing Plan</h2>
      ${generateRebalancingPlan()}
    </div>
    
    <footer class="footer">
      <p>Generated by mintdfolio • Your Pokémon Financial Advisor</p>
      <p style="margin-top: 8px;">This report is for informational purposes only. Not financial advice. Market conditions change — always do your own research.</p>
    </footer>
  </div>
</body>
</html>`;
}

// Generate plain text report for .txt download
export function buildPortfolioReportText({
  summary,
  allocation,
  concentration,
  milestones,
  insights,
  allocationTarget,
  allocationPreset,
  items,
}: BuildPortfolioReportHtmlParams): string {
  const topGainers = [...items].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, 5);
  const topLosers = [...items].filter(i => i.gainPercent < 0).sort((a, b) => a.gainPercent - b.gainPercent).slice(0, 3);
  const biggestHoldings = [...items].sort((a, b) => b.totalMarketValue - a.totalMarketValue).slice(0, 5);
  const sealedItems = items.filter(i => i.assetType === 'Sealed');
  const slabItems = items.filter(i => i.assetType === 'Slab');
  const rawItems = items.filter(i => i.assetType === 'Raw Card');
  const topHits = milestones.filter((m) => m.item.gainPercent >= 100);

  const sealed = allocation?.sealed.percent || 0;
  const slabs = allocation?.slabs.percent || 0;
  const raw = allocation?.rawCards.percent || 0;

  // Determine collector type
  let collectorType = "The Balanced Collector";
  if (sealed >= 50) collectorType = "The Sentinel";
  else if (slabs >= 50) collectorType = "The Trophy Hunter";
  else if (raw >= 50) collectorType = "The Detective";
  else if (sealed >= 30 && slabs >= 30) collectorType = "The Politician";

  const presetLabel = allocationPreset === 'conservative' ? 'The Investor (Conservative)' : 
                      allocationPreset === 'aggressive' ? 'The Purist (Aggressive)' : 
                      allocationPreset === 'balanced' ? 'The Hybrid (Balanced)' : 'Custom';

  let report = `
MINTDFOLIO PORTFOLIO ANALYSIS REPORT
Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

================================================================================
PORTFOLIO SNAPSHOT
================================================================================

Total Portfolio Value: $${(summary?.totalMarketValue || 0).toLocaleString()}
Unrealized P/L: ${(summary?.unrealizedPL || 0) >= 0 ? '+' : ''}$${(summary?.unrealizedPL || 0).toLocaleString()} (${(summary?.unrealizedPLPercent || 0) >= 0 ? '+' : ''}${(summary?.unrealizedPLPercent || 0).toFixed(1)}%)
Portfolio Health Score: ${summary?.healthScore || 0}/100

`;

  report += `
================================================================================
YOUR ARCHETYPE: ${collectorType.toUpperCase()}
================================================================================

`;

  if (sealed >= 50) {
    report += `You're a Sentinel — a long-term guardian who trusts time more than noise.

With ${sealed.toFixed(0)}% of your portfolio in sealed products, you prioritize durability over activity. You're not trying to outsmart the market — you're letting scarcity and time work in your favor.

${sealedItems.length > 0 ? `Your sealed holdings include: ${sealedItems.slice(0, 5).map(i => i.productName).join(', ')}` : ''}

`;
  } else if (slabs >= 50) {
    report += `You're a Trophy Hunter — a curator who values authenticated excellence over quantity.

Your collection is ${slabs.toFixed(0)}% graded cards. You've chosen authentication and condition certainty, and each slab represents a deliberate choice.

${slabItems.length > 0 ? `Key graded holdings: ${slabItems.slice(0, 5).map(i => i.productName).join(', ')}` : ''}

`;
  } else if (raw >= 50) {
    report += `You're a Detective — a quiet observer who connects dots others miss.

With ${raw.toFixed(0)}% raw cards, you see raw cards as options contracts — each one has potential upside if graded. That's arbitrage thinking.

`;
  } else if (sealed >= 30 && slabs >= 30) {
    report += `You're a Politician — a master of balance, negotiation, and compromise.

Your portfolio sits close to equilibrium, with ${sealed.toFixed(0)}% sealed and ${slabs.toFixed(0)}% graded. You value flexibility and adaptability.

`;
  } else {
    report += `You're a Balanced Collector — a pragmatic investor who values diversification.

Your ${sealed.toFixed(0)}% sealed / ${slabs.toFixed(0)}% graded / ${raw.toFixed(0)}% raw split across ${items.length} holdings shows you're not putting all your eggs in one basket.

`;
  }

  report += `
================================================================================
STRATEGY OVERVIEW: ${presetLabel}
================================================================================

Current Allocation:
- Sealed:  ${sealed.toFixed(0)}% (Target: ${allocationTarget.sealed}%)
- Graded:  ${slabs.toFixed(0)}% (Target: ${allocationTarget.slabs}%)
- Raw:     ${raw.toFixed(0)}% (Target: ${allocationTarget.rawCards}%)

`;

  report += `
================================================================================
PRIMARY ACTION
================================================================================

`;

  const sealedGap = allocationTarget.sealed - sealed;
  const slabsGap = allocationTarget.slabs - slabs;
  const rawGap = allocationTarget.rawCards - raw;
  const maxGap = Math.max(sealedGap, slabsGap, rawGap);

  if (maxGap <= 5) {
    report += `Your portfolio is well-aligned with your targets. Stay the course and maintain your current strategy.

`;
  } else if (sealedGap === maxGap) {
    report += `Direct your next purchases toward sealed products. You're ${sealedGap.toFixed(0)}% below your sealed target.

`;
  } else if (slabsGap === maxGap) {
    report += `Add graded cards to your next purchases. You're ${slabsGap.toFixed(0)}% below your graded target.

`;
  } else {
    report += `Explore raw card opportunities. You're ${rawGap.toFixed(0)}% below your raw target.

`;
  }

  if (topHits.length > 0) {
    report += `
================================================================================
OPTIONAL: PROFIT MILESTONES
================================================================================

`;
    topHits.forEach((hit, i) => {
      report += `${i + 1}. ${hit.item.productName}
   Gain: +${hit.item.gainPercent.toFixed(0)}% | Selling half would lock in $${hit.sellHalfProfit.toLocaleString()}
   
`;
    });
  }

  report += `
================================================================================
TRADE-OFFS YOU'VE CHOSEN
================================================================================

`;

  if (concentration && concentration.top1Percent > 20) {
    report += `- Concentration over diversification: ${concentration.top1Percent.toFixed(0)}% in your top position.
`;
  }
  if (sealed >= 50) {
    report += `- Patience over liquidity: Sealed products reward long timelines but are slower to exit.
`;
  }
  if (slabs >= 50) {
    report += `- Security over maximum upside: Paying a premium for authentication and liquidity.
`;
  }

  report += `

================================================================================
DISCLAIMER
================================================================================

This report is for informational purposes only. Not financial advice.
Market conditions change — always do your own research.

Generated by mintdfolio • Your Pokemon Financial Advisor
`;

  return report;
}
