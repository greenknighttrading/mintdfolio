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
  const newerSets = items.filter(i => {
    const name = i.productName.toLowerCase();
    return name.includes('151') || name.includes('obsidian') || name.includes('paldea') || 
           name.includes('prismatic') || name.includes('surging') || name.includes('twilight') ||
           name.includes('shrouded') || name.includes('stellar') || name.includes('2024') || name.includes('2023');
  });

  // Determine archetype based on portfolio characteristics
  const getCollectorArchetype = () => {
    if (!allocation) return null;

    const sealed = allocation.sealed.percent;
    const slabs = allocation.slabs.percent;
    const raw = allocation.rawCards.percent;
    const positionCount = items.length;
    const avgPositionValue = items.length > 0 ? (summary?.totalMarketValue || 0) / items.length : 0;
    
    // Era calculations
    const vintageItems = items.filter(i => {
      const name = i.productName.toLowerCase();
      return name.includes('base set') || name.includes('jungle') || name.includes('fossil') || 
             name.includes('team rocket') || name.includes('gym') || name.includes('neo') ||
             name.includes('1st edition') || name.includes('shadowless') || name.includes('1999') || 
             name.includes('2000') || name.includes('2001') || name.includes('2002');
    });
    const vintagePercent = vintageItems.length > 0 ? (vintageItems.reduce((sum, i) => sum + i.totalMarketValue, 0) / (summary?.totalMarketValue || 1)) * 100 : 0;
    
    const newerItems = items.filter(i => {
      const name = i.productName.toLowerCase();
      return name.includes('151') || name.includes('obsidian') || name.includes('paldea') || 
             name.includes('prismatic') || name.includes('surging') || name.includes('twilight') ||
             name.includes('shrouded') || name.includes('stellar') || name.includes('2024') || name.includes('2023');
    });
    const newerPercent = newerItems.length > 0 ? (newerItems.reduce((sum, i) => sum + i.totalMarketValue, 0) / (summary?.totalMarketValue || 1)) * 100 : 0;
    
    // Top position concentration
    const sortedByValue = [...items].sort((a, b) => b.totalMarketValue - a.totalMarketValue);
    const top1Percent = sortedByValue.length > 0 ? (sortedByValue[0].totalMarketValue / (summary?.totalMarketValue || 1)) * 100 : 0;
    const top3Percent = sortedByValue.slice(0, 3).reduce((sum, i) => sum + i.totalMarketValue, 0) / (summary?.totalMarketValue || 1) * 100;
    
    // Determine archetype
    // 🛡️ The Sentinel - Sealed-heavy, broad spread, long holds
    if (sealed >= 50 && positionCount >= 5) {
      return 'sentinel';
    }
    // 🗳️ The Politician - Even mix, flexible positioning
    if (Math.abs(sealed - slabs) < 15 && Math.abs(slabs - raw) < 15 && sealed > 20 && slabs > 20 && raw > 20) {
      return 'politician';
    }
    // 🔥 The Purist - Raw and slab heavy, strong attachment
    if ((raw + slabs) >= 60 && raw >= 25 && slabs >= 25) {
      return 'purist';
    }
    // 💼 The Hustler - Many positions, smaller average size
    if (positionCount >= 20 && avgPositionValue < 500) {
      return 'hustler';
    }
    // 📜 The Archivist - Vintage focus, long holds
    if (vintagePercent >= 30) {
      return 'archivist';
    }
    // 🧭 The Wayfinder - Newer sets, attention-aware
    if (newerPercent >= 40) {
      return 'wayfinder';
    }
    // 🗺️ The Cartographer - Deep focus on specific sets
    if (top3Percent >= 50 && positionCount <= 15) {
      return 'cartographer';
    }
    // 🧱 The Keystone - Iconic Pokemon, blue-chip, cross-era
    if (top1Percent >= 20 && slabs >= 30) {
      return 'keystone';
    }
    // 🚩 The Pathbreaker - Few concentrated positions, contrarian
    if (positionCount <= 10 && top1Percent >= 25) {
      return 'pathbreaker';
    }
    // 🕵️ The Detective - Under-the-radar, long quiet holds
    if (newerPercent < 20 && vintagePercent < 20 && positionCount >= 8) {
      return 'detective';
    }
    // Default to Sentinel for sealed-heavy or Politician for balanced
    if (sealed >= 40) return 'sentinel';
    return 'politician';
  };

  const archetypeData: Record<string, {
    emoji: string;
    name: string;
    subtitle: string;
    role: string;
    howTheyCollect: string[];
    whatItSays: string;
    coreStrength: string;
    tradeOff: string;
  }> = {
    sentinel: {
      emoji: '🛡️',
      name: 'The Sentinel',
      subtitle: 'A patient guardian.',
      role: 'Guardian of time and scarcity',
      howTheyCollect: ['Sealed-heavy', 'Broad spread across products', 'Low turnover, long holds'],
      whatItSays: "You're calm, patient, and unreactive. You don't feel pressure to constantly act, and you trust that time is your strongest ally. While others chase momentum, you stand watch. You believe the best moves are often the ones you don't make.",
      coreStrength: 'Discipline',
      tradeOff: 'Liquidity and speed'
    },
    politician: {
      emoji: '🗳️',
      name: 'The Politician',
      subtitle: 'A master negotiator.',
      role: 'Master of balance and negotiation',
      howTheyCollect: ['Even mix of sealed, slabs, and raw', 'Flexible positioning', 'Willing to adjust allocations over time'],
      whatItSays: "You're pragmatic and adaptable. You don't fall in love with absolutes — you manage trade-offs. You like having options and leverage, and you're comfortable shifting when conditions change. You win by staying reasonable when others polarize.",
      coreStrength: 'Resilience',
      tradeOff: 'Rarely all-in on one idea'
    },
    purist: {
      emoji: '🔥',
      name: 'The Purist',
      subtitle: 'A devotee of conviction.',
      role: 'Devotee of conviction and aesthetics',
      howTheyCollect: ['Raw- and slab-heavy', 'Strong attachment to specific Pokémon, artists, or themes', 'Less concern for optimization'],
      whatItSays: "You collect with your gut. You care about how a card feels, not just how it performs. Volatility doesn't scare you because belief matters more than comfort. Your collection is personal — and that's the point.",
      coreStrength: 'Authentic conviction',
      tradeOff: 'Higher variance'
    },
    hustler: {
      emoji: '💼',
      name: 'The Hustler',
      subtitle: 'A grinding operator.',
      role: 'Operator of volume and repetition',
      howTheyCollect: ['Many positions', 'Smaller average position size', 'Frequent activity and turnover'],
      whatItSays: "You trust process over perfection. You're comfortable grinding edges and stacking small wins. You don't need every move to be a home run — consistency is your weapon. You stay active while others overthink.",
      coreStrength: 'Momentum through action',
      tradeOff: 'Burnout and thin margins'
    },
    archivist: {
      emoji: '📜',
      name: 'The Archivist',
      subtitle: 'A keeper of history.',
      role: 'Keeper of history',
      howTheyCollect: ['Vintage and early-era focus', 'Long hold times', 'Low exposure to current hype'],
      whatItSays: "You value permanence. You're drawn to cards that have already proven their place in the canon. You're less interested in what's next and more interested in what lasts. Your collection feels like a library, not a trading desk.",
      coreStrength: 'Stability',
      tradeOff: 'Slower growth cycles'
    },
    wayfinder: {
      emoji: '🧭',
      name: 'The Wayfinder',
      subtitle: 'A navigator of trends.',
      role: 'Navigator of shifting terrain',
      howTheyCollect: ['Newer sets and rising cards', 'Shorter-to-medium holds', 'Attention-aware positioning'],
      whatItSays: "You read the room well. You understand that value follows attention, and you're comfortable moving with it. You don't fight the tide — you learn how to travel it.",
      coreStrength: 'Timing',
      tradeOff: 'Volatility exposure'
    },
    cartographer: {
      emoji: '🗺️',
      name: 'The Cartographer',
      subtitle: 'A mapper of worlds.',
      role: 'Mapper of worlds',
      howTheyCollect: ['Deep focus on specific sets or eras', 'High internal coherence', 'Completion-oriented behavior'],
      whatItSays: "You like understanding the whole picture. Finishing something matters to you. Your collection feels intentional and structured — not random. You collect systems, not just cards.",
      coreStrength: 'Coherence',
      tradeOff: 'Concentration risk'
    },
    keystone: {
      emoji: '🧱',
      name: 'The Keystone',
      subtitle: 'A foundation builder.',
      role: 'Foundation builder',
      howTheyCollect: ['Iconic Pokémon and blue-chip cards', 'Cross-era anchors', 'Low turnover, high confidence'],
      whatItSays: "You build around pieces meant to last. You want your collection to hold weight — emotionally and structurally. Everything else connects back to a few central pillars.",
      coreStrength: 'Endurance',
      tradeOff: 'Less experimentation'
    },
    pathbreaker: {
      emoji: '🚩',
      name: 'The Pathbreaker',
      subtitle: 'A pioneer of belief.',
      role: 'Pioneer of belief',
      howTheyCollect: ['Few, highly concentrated positions', 'Early or contrarian bets', 'Strong personal thesis'],
      whatItSays: "You're comfortable standing alone. You don't need consensus to act — you need belief. You accept being early, even wrong for a while, because you trust where the road leads.",
      coreStrength: 'Asymmetry',
      tradeOff: 'Drawdowns before payoff'
    },
    detective: {
      emoji: '🕵️',
      name: 'The Detective',
      subtitle: 'A seeker of hidden signals.',
      role: 'Seeker of hidden signals',
      howTheyCollect: ['Under-the-radar sets and cards', 'Long quiet holds', 'Low hype exposure'],
      whatItSays: "You notice details others miss. You're curious, observant, and patient. You don't need validation right away — discovery is the reward. When something finally clicks, you're already there.",
      coreStrength: 'Early insight',
      tradeOff: 'Long waits for recognition'
    }
  };

  const generateArchetypeSection = () => {
    const archetypeKey = getCollectorArchetype();
    if (!archetypeKey || !archetypeData[archetypeKey]) return '';
    
    const archetype = archetypeData[archetypeKey];
    const sealed = allocation?.sealed.percent || 0;
    const slabs = allocation?.slabs.percent || 0;
    const raw = allocation?.rawCards.percent || 0;
    const sealedCount = sealedItems.length;
    const topSealedNames = sealedItems.slice(0, 3).map(i => escapeHtml(i.productName)).join(', ');
    const topSlabNames = slabItems.slice(0, 3).map(i => escapeHtml(i.productName)).join(', ');
    
    // Get era and category concentration
    const eraConcentration = eraAllocation ? Object.entries(eraAllocation).sort((a, b) => b[1].percent - a[1].percent)[0] : null;
    const dominantEra = eraConcentration ? eraConcentration[0] : 'mixed';
    const dominantEraPercent = eraConcentration ? eraConcentration[1].percent : 0;
    
    // Determine values for data section
    const sealedDiff = allocationTarget.sealed - sealed;
    const overUnder = sealedDiff > 0 ? 'under' : 'over';
    const diffAmount = Math.abs(sealedDiff);
    
    // Personality traits based on archetype
    const personalityTraits: Record<string, string[]> = {
      sentinel: ["You don't panic easily.", "You'd rather be early than loud.", "You trust time more than timing."],
      politician: ["You like having options.", "You're comfortable with compromise.", "You adapt without abandoning."],
      purist: ["You trust your instincts, even when others don't.", "Aesthetics matter to you.", "You collect with conviction."],
      hustler: ["You'd rather act than wait.", "You learn by doing.", "Small wins compound."],
      archivist: ["History speaks to you.", "You respect what has lasted.", "Patience is your edge."],
      wayfinder: ["You read momentum well.", "You're not afraid to move.", "Attention is information."],
      cartographer: ["Completion drives you.", "You see systems, not just pieces.", "Structure matters."],
      keystone: ["You build around pillars.", "Quality over quantity.", "Your core is intentional."],
      pathbreaker: ["You're comfortable being early.", "Conviction beats consensus.", "You accept temporary pain."],
      detective: ["You notice what others miss.", "Discovery is the reward.", "Quiet confidence."]
    };
    
    const strengthsByArchetype: Record<string, string[]> = {
      sentinel: ["People like you tend to do well in flat or boring markets.", "Your style rewards patience and conviction.", "You're less likely to make emotional decisions."],
      politician: ["This is one of the most resilient styles.", "You can weather different market environments.", "Flexibility protects you from being wrong."],
      purist: ["Your conviction creates natural holding power.", "You won't sell at the wrong time from fear.", "Personal connection drives discipline."],
      hustler: ["Activity builds market intuition.", "You learn faster than passive collectors.", "Volume creates opportunities."],
      archivist: ["Vintage has proven staying power.", "Your collection has historical significance.", "You hold what others wish they had."],
      wayfinder: ["Timing can multiply returns.", "You capture attention-driven moves.", "You're positioned for new cycles."],
      cartographer: ["Deep knowledge creates edge.", "Completion adds premium value.", "You understand your niche."],
      keystone: ["Blue-chips anchor through volatility.", "Your core positions are battle-tested.", "Quality compounds over time."],
      pathbreaker: ["Concentration creates outsized wins.", "You're positioned for asymmetric upside.", "Conviction is your competitive edge."],
      detective: ["Early positioning pays off.", "You avoid crowded trades.", "Patience reveals hidden value."]
    };
    
    const tradeOffByArchetype: Record<string, string> = {
      sentinel: "liquidity — sealed can be slower to exit if you ever need cash quickly.",
      politician: "you may never feel fully committed to one idea, which can limit maximum upside.",
      purist: "volatility — when markets move against you, conviction cuts both ways.",
      hustler: "margin erosion and burnout. Activity doesn't always equal progress.",
      archivist: "opportunity cost — vintage moves slowly, and you may miss newer cycles.",
      wayfinder: "volatility exposure — attention fades, and newer sets can correct sharply.",
      cartographer: "concentration risk — depth in one area means exposure to that area's fate.",
      keystone: "less experimentation — you may miss emerging opportunities outside your pillars.",
      pathbreaker: "drawdowns before payoff — being early often means being uncomfortable first.",
      detective: "long waits for recognition — your thesis may take years to play out."
    };
    
    const gentleNudges: Record<string, string> = {
      sentinel: "If you ever want more flexibility, slabs can act as pressure valves — not replacements.",
      politician: "When you do feel strongly about a position, letting it grow slightly larger can be rewarding.",
      purist: "Consider grading your best raw pieces to lock in their value.",
      hustler: "Build a small 'anchor' position you never trade. It'll keep you grounded.",
      archivist: "A small allocation to newer sets keeps you connected to the current market.",
      wayfinder: "Consider holding 1-2 positions longer than usual — some trades become investments.",
      cartographer: "If concentration feels heavy, one or two positions outside your focus can reduce risk.",
      keystone: "Every few months, explore something new. Your pillars are strong enough.",
      pathbreaker: "Size matters — make sure you can survive being wrong longer than expected.",
      detective: "When one of your ideas starts gaining attention, don't be afraid to let it run — you earned it."
    };
    
    const traits = personalityTraits[archetypeKey] || [];
    const strengths = strengthsByArchetype[archetypeKey] || [];
    const tradeOff = tradeOffByArchetype[archetypeKey] || '';
    const nudge = gentleNudges[archetypeKey] || '';
    
    // Build portfolio analysis as flowing paragraphs (no subheadings)
    const dataShowsParagraph = `You have <strong>${sealed.toFixed(0)}%</strong> sealed${sealedCount > 0 ? `, spread across ${sealedCount} products${topSealedNames ? `, including ${topSealedNames}` : ''}` : ''}. Your allocation leans <strong>${overUnder}</strong> your target by <strong>${diffAmount.toFixed(0)}%</strong>.${dominantEraPercent > 30 ? ` You've concentrated most of your value in the <strong>${dominantEra}</strong> era (${dominantEraPercent.toFixed(0)}%).` : ''}`;
    
    const whyParagraph = `This tells me you value <strong>${archetypeKey === 'sentinel' || archetypeKey === 'archivist' ? 'stability' : archetypeKey === 'politician' || archetypeKey === 'hustler' ? 'flexibility' : archetypeKey === 'purist' || archetypeKey === 'pathbreaker' ? 'conviction' : 'discovery'}</strong> over <strong>${archetypeKey === 'sentinel' || archetypeKey === 'archivist' ? 'speed' : archetypeKey === 'wayfinder' || archetypeKey === 'hustler' ? 'stability' : 'short-term wins'}</strong>. You're comfortable letting time do the work instead of forcing outcomes. ${traits.join(' ')}`;
    
    const strengthsParagraph = `${strengths.join(' ')} The downside of this style is <strong>${tradeOff}</strong> This doesn't mean it's wrong — it just means you've chosen a specific game.`;
    
    const nudgeParagraph = `${nudge} You don't need to change — just be aware.`;

    return `
      <div class="collector-profile">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Collector Profile Is:</div>
        <div class="collector-type">${archetype.emoji} ${archetype.name}</div>
        <p style="color: #a78bfa; font-style: italic; margin-bottom: 8px;">${archetype.subtitle}</p>
        <p class="collector-desc" style="font-size: 14px;">Role: ${archetype.role}</p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; justify-content: center;">
          ${archetype.howTheyCollect.map(trait => `<span style="background: rgba(139, 92, 246, 0.2); padding: 6px 12px; border-radius: 16px; font-size: 13px; color: #a78bfa;">${trait}</span>`).join('')}
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">What This Says About You</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8;">${archetype.whatItSays} Your core strength is <strong style="color: #4ade80;">${archetype.coreStrength}</strong>, though this comes with a trade-off: <strong style="color: #fbbf24;">${archetype.tradeOff}</strong>.</p>
      </div>
    `;
  };

  // Store portfolio analysis data for later use in the template
  const getPortfolioAnalysisContent = () => {
    const archetypeKey = getCollectorArchetype();
    if (!archetypeKey || !archetypeData[archetypeKey]) return { dataShowsParagraph: '', whyParagraph: '', strengthsParagraph: '', nudgeParagraph: '' };
    
    const sealed = allocation?.sealed.percent || 0;
    const sealedCount = sealedItems.length;
    const topSealedNames = sealedItems.slice(0, 3).map(i => escapeHtml(i.productName)).join(', ');
    
    const eraConcentration = eraAllocation ? Object.entries(eraAllocation).sort((a, b) => b[1].percent - a[1].percent)[0] : null;
    const dominantEra = eraConcentration ? eraConcentration[0] : 'mixed';
    const dominantEraPercent = eraConcentration ? eraConcentration[1].percent : 0;
    
    const sealedDiff = allocationTarget.sealed - sealed;
    const overUnder = sealedDiff > 0 ? 'under' : 'over';
    const diffAmount = Math.abs(sealedDiff);
    
    const traits = personalityTraits[archetypeKey] || [];
    const strengths = strengthsByArchetype[archetypeKey] || [];
    const tradeOff = tradeOffByArchetype[archetypeKey] || '';
    const nudge = gentleNudges[archetypeKey] || '';
    
    const dataShowsParagraph = `You have <strong>${sealed.toFixed(0)}%</strong> sealed${sealedCount > 0 ? `, spread across ${sealedCount} products${topSealedNames ? `, including ${topSealedNames}` : ''}` : ''}. Your allocation leans <strong>${overUnder}</strong> your target by <strong>${diffAmount.toFixed(0)}%</strong>.${dominantEraPercent > 30 ? ` You've concentrated most of your value in the <strong>${dominantEra}</strong> era (${dominantEraPercent.toFixed(0)}%).` : ''}`;
    
    const whyParagraph = `This tells me you value <strong>${archetypeKey === 'sentinel' || archetypeKey === 'archivist' ? 'stability' : archetypeKey === 'politician' || archetypeKey === 'hustler' ? 'flexibility' : archetypeKey === 'purist' || archetypeKey === 'pathbreaker' ? 'conviction' : 'discovery'}</strong> over <strong>${archetypeKey === 'sentinel' || archetypeKey === 'archivist' ? 'speed' : archetypeKey === 'wayfinder' || archetypeKey === 'hustler' ? 'stability' : 'short-term wins'}</strong>. You're comfortable letting time do the work instead of forcing outcomes. ${traits.join(' ')}`;
    
    const strengthsParagraph = `${strengths.join(' ')} The downside of this style is <strong>${tradeOff}</strong> This doesn't mean it's wrong — it just means you've chosen a specific game.`;
    
    const nudgeParagraph = `${nudge} You don't need to change — just be aware.`;
    
    return { dataShowsParagraph, whyParagraph, strengthsParagraph, nudgeParagraph };
  };
  
  const personalityTraits: Record<string, string[]> = {
    sentinel: ["You don't panic easily.", "You'd rather be early than loud.", "You trust time more than timing."],
    politician: ["You like having options.", "You're comfortable with compromise.", "You adapt without abandoning."],
    purist: ["You trust your instincts, even when others don't.", "Aesthetics matter to you.", "You collect with conviction."],
    hustler: ["You'd rather act than wait.", "You learn by doing.", "Small wins compound."],
    archivist: ["History speaks to you.", "You respect what has lasted.", "Patience is your edge."],
    wayfinder: ["You read momentum well.", "You're not afraid to move.", "Attention is information."],
    cartographer: ["Completion drives you.", "You see systems, not just pieces.", "Structure matters."],
    keystone: ["You build around pillars.", "Quality over quantity.", "Your core is intentional."],
    pathbreaker: ["You're comfortable being early.", "Conviction beats consensus.", "You accept temporary pain."],
    detective: ["You notice what others miss.", "Discovery is the reward.", "Quiet confidence."]
  };
  
  const strengthsByArchetype: Record<string, string[]> = {
    sentinel: ["People like you tend to do well in flat or boring markets.", "Your style rewards patience and conviction.", "You're less likely to make emotional decisions."],
    politician: ["This is one of the most resilient styles.", "You can weather different market environments.", "Flexibility protects you from being wrong."],
    purist: ["Your conviction creates natural holding power.", "You won't sell at the wrong time from fear.", "Personal connection drives discipline."],
    hustler: ["Activity builds market intuition.", "You learn faster than passive collectors.", "Volume creates opportunities."],
    archivist: ["Vintage has proven staying power.", "Your collection has historical significance.", "You hold what others wish they had."],
    wayfinder: ["Timing can multiply returns.", "You capture attention-driven moves.", "You're positioned for new cycles."],
    cartographer: ["Deep knowledge creates edge.", "Completion adds premium value.", "You understand your niche."],
    keystone: ["Blue-chips anchor through volatility.", "Your core positions are battle-tested.", "Quality compounds over time."],
    pathbreaker: ["Concentration creates outsized wins.", "You're positioned for asymmetric upside.", "Conviction is your competitive edge."],
    detective: ["Early positioning pays off.", "You avoid crowded trades.", "Patience reveals hidden value."]
  };
  
  const tradeOffByArchetype: Record<string, string> = {
    sentinel: "liquidity — sealed can be slower to exit if you ever need cash quickly.",
    politician: "you may never feel fully committed to one idea, which can limit maximum upside.",
    purist: "volatility — when markets move against you, conviction cuts both ways.",
    hustler: "margin erosion and burnout. Activity doesn't always equal progress.",
    archivist: "opportunity cost — vintage moves slowly, and you may miss newer cycles.",
    wayfinder: "volatility exposure — attention fades, and newer sets can correct sharply.",
    cartographer: "concentration risk — depth in one area means exposure to that area's fate.",
    keystone: "less experimentation — you may miss emerging opportunities outside your pillars.",
    pathbreaker: "drawdowns before payoff — being early often means being uncomfortable first.",
    detective: "long waits for recognition — your thesis may take years to play out."
  };
  
  const gentleNudges: Record<string, string> = {
    sentinel: "If you ever want more flexibility, slabs can act as pressure valves — not replacements.",
    politician: "When you do feel strongly about a position, letting it grow slightly larger can be rewarding.",
    purist: "Consider grading your best raw pieces to lock in their value.",
    hustler: "Build a small 'anchor' position you never trade. It'll keep you grounded.",
    archivist: "A small allocation to newer sets keeps you connected to the current market.",
    wayfinder: "Consider holding 1-2 positions longer than usual — some trades become investments.",
    cartographer: "If concentration feels heavy, one or two positions outside your focus can reduce risk.",
    keystone: "Every few months, explore something new. Your pillars are strong enough.",
    pathbreaker: "Size matters — make sure you can survive being wrong longer than expected.",
    detective: "When one of your ideas starts gaining attention, don't be afraid to let it run — you earned it."
  };

  const getNarrativeContent = () => {
    const sealed = allocation?.sealed.percent || 0;
    const slabs = allocation?.slabs.percent || 0;
    const raw = allocation?.rawCards.percent || 0;
    const healthScore = summary?.healthScore || 0;
    const totalGainPercent = summary?.unrealizedPLPercent || 0;
    const topHits = milestones.filter((m) => m.item.gainPercent >= 100);

    // Build specific item references - escape all product names
    const topGainerName = escapeHtml(topGainers[0]?.productName);
    const topGainerPercent = topGainers[0]?.gainPercent || 0;
    const biggestPosition = escapeHtml(biggestHoldings[0]?.productName);
    const biggestPositionValue = biggestHoldings[0]?.totalMarketValue || 0;
    const top1Name = escapeHtml(concentration?.top1Name);

    // Collector type narrative - more specific based on holdings
    let collectorNarrative = "";
    if (sealed >= 50) {
      const sealedCount = sealedItems.length;
      const avgSealedValue = sealedItems.reduce((sum, i) => sum + i.totalMarketValue, 0) / (sealedCount || 1);
      const firstSealed = escapeHtml(sealedItems[0]?.productName);
      const secondSealed = escapeHtml(sealedItems[1]?.productName);
      collectorNarrative = `Your ${sealedCount} sealed positions averaging $${avgSealedValue.toLocaleString()} each tell me you're building for the future, not chasing short-term gains.<br><br>
${sealedItems.length > 0 ? `Products like <strong>${firstSealed}</strong>${sealedItems[1] ? ` and <strong>${secondSealed}</strong>` : ''} show you understand that Pokémon sealed has a 25-year track record of rewarding patience.` : ''}<br><br>
You're comfortable holding through market noise. That's a real edge — but it comes with trade-offs we'll discuss.`;
    } else if (slabs >= 50) {
      const avgGrade = slabItems.filter(i => i.grade).length > 0 ? 'graded' : 'authenticated';
      const firstSlab = escapeHtml(slabItems[0]?.productName);
      const secondSlab = escapeHtml(slabItems[1]?.productName);
      collectorNarrative = `You've assembled ${slabItems.length} ${avgGrade} pieces, each representing a deliberate choice.<br><br>
${slabItems.length > 0 ? `Holdings like <strong>${firstSlab}</strong>${slabItems[1] ? ` and <strong>${secondSlab}</strong>` : ''} show you value authenticated excellence.` : ''}<br><br>
Graded cards offer liquidity and proof of condition. You can exit faster than sealed holders. The trade-off? You're paying a premium for that security.`;
    } else if (raw >= 50) {
      const firstRaw = escapeHtml(rawItems[0]?.productName);
      const secondRaw = escapeHtml(rawItems[1]?.productName);
      collectorNarrative = `Your ${rawItems.length} raw card positions show you're comfortable with uncertainty — hunting for grading candidates and mispriced opportunities.<br><br>
${rawItems.length > 0 ? `Cards like <strong>${firstRaw}</strong>${rawItems[1] ? ` and <strong>${secondRaw}</strong>` : ''} could be PSA 10 candidates waiting to unlock value.` : ''}<br><br>
Maximum flexibility, maximum upside potential. The risk? Condition uncertainty and potentially harder liquidity.`;
    } else {
      collectorNarrative = `Your diversified approach across ${items.length} holdings — ${sealed.toFixed(0)}% sealed, ${slabs.toFixed(0)}% graded, ${raw.toFixed(0)}% raw — shows resilience over speculation.<br><br>
${biggestPosition ? `Your largest position, <strong>${biggestPosition}</strong> at $${biggestPositionValue.toLocaleString()}, anchors the portfolio` : 'Your spread-out positions mean you can weather different market conditions'}.<br><br>
When sealed stagnates, graded provides liquidity. When raw spikes, you're positioned. You're not betting everything on one thesis.`;
    }

    // Overview narrative - include specific numbers
    const topLoserName = escapeHtml(topLosers[0]?.productName);
    const overviewNarrative =
      totalGainPercent >= 0
        ? `Your $${(summary?.totalMarketValue || 0).toLocaleString()} portfolio is up ${totalGainPercent.toFixed(1)}% — that's $${(summary?.unrealizedPL || 0).toLocaleString()} in unrealized gains.<br><br>
${topGainerName ? `<strong>${topGainerName}</strong> leads the way at +${topGainerPercent.toFixed(0)}%.` : ''}<br><br>
${summary?.holdingsInProfitPercent ? `${summary.holdingsInProfitPercent.toFixed(0)}% of your ${items.length} positions are in profit.` : ''} This isn't hype money — it's conviction capital built for the long term.`
        : `Let's be honest: a ${Math.abs(totalGainPercent).toFixed(1)}% unrealized loss (-$${Math.abs(summary?.unrealizedPL || 0).toLocaleString()}) doesn't feel good.<br><br>
${topLosers.length > 0 ? `<strong>${topLoserName}</strong> at ${topLosers[0].gainPercent.toFixed(0)}% is your biggest drawdown.` : ''}<br><br>
The question isn't whether you're down — it's whether your thesis is still intact. Markets don't move in straight lines.`;

    // Health score narrative
    let healthNarrative = "";
    if (healthScore >= 80) {
      healthNarrative = `A ${healthScore} tells me this portfolio is well-constructed across ${items.length} holdings.<br><br>
Strong allocation balance, reasonable liquidity, controlled concentration. This is the profile of a collector who thinks like an investor.`;
    } else if (healthScore >= 60) {
      healthNarrative = `A ${healthScore} reflects solid positioning with some tilt — not optimized, but not reckless either.<br><br>
${concentration && concentration.top1Percent > 15 ? `Your top position (${top1Name}) at ${concentration.top1Percent.toFixed(0)}% is worth monitoring.` : 'Your diversification is reasonable.'}<br><br>
High-conviction portfolios trade balance for upside. If your thesis plays out, this score rises naturally.`;
    } else {
      healthNarrative = `A ${healthScore} means there's work to do — but it's not a crisis.<br><br>
${concentration && concentration.top1Percent > 25 ? `Heavy concentration in ${top1Name} (${concentration.top1Percent.toFixed(0)}% of portfolio) is the main factor.` : 'Limited diversification or significant drawdowns are weighing on the score.'}<br><br>
The good news? These are addressable without abandoning your thesis.`;
    }

    // Allocation narrative - with sealed risk warning
    let allocationNarrative = "";
    const isLowSealed = sealed < 20;
    const isSealedSmallest = sealed < slabs && sealed < raw;

    let sealedWarning = "";
    if (isLowSealed) {
      sealedWarning = `<strong style="color: #f59e0b;">⚠️ Risk Alert:</strong> Your sealed allocation is only ${sealed.toFixed(0)}%. Historically, sealed products have shown the most consistent long-term appreciation because they represent finite, decreasing supply.<br><br>`;
    } else if (isSealedSmallest) {
      sealedWarning = `<strong style="color: #f59e0b;">⚠️ Note:</strong> Sealed is your smallest category at ${sealed.toFixed(0)}%. Consider that booster boxes and ETBs are never reprinted — they're natural stores of value.<br><br>`;
    }

    if (sealed >= 70) {
      const sealedProductNames = sealedItems.slice(0, 2).map(i => escapeHtml(i.productName));
      // Identify premium sealed products (booster boxes, Pokemon Center ETBs)
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
      
      let sealedPositiveNote = "";
      if (boosterBoxes.length > 0) {
        sealedPositiveNote = `<strong style="color: #4ade80;">✓ Gold Standard:</strong> You have ${boosterBoxes.length} booster box position${boosterBoxes.length > 1 ? 's' : ''} — this is the gold standard of Pokémon investing. Booster boxes have historically shown the strongest appreciation.<br><br>`;
      }
      if (pcEtbs.length > 0) {
        sealedPositiveNote += `<strong style="color: #4ade80;">✓ Premium Product:</strong> Pokemon Center ETBs are exclusive and highly sought after. Great addition to your portfolio.<br><br>`;
      }
      if (etbs.length > 0 && pcEtbs.length === 0) {
        sealedPositiveNote += `<strong style="color: #4ade80;">✓ Solid Choice:</strong> ETBs are popular entry points and hold value well.<br><br>`;
      }
      
      allocationNarrative = `${sealed.toFixed(0)}% sealed is aggressive for Pokémon investing — <strong>and that's a good thing.</strong><br><br>
${sealedPositiveNote}${sealedItems.length > 0 ? `Your sealed exposure spans ${sealedItems.length} products${sealedProductNames.length > 0 ? `, including <strong>${sealedProductNames.join('</strong> and <strong>')}</strong>` : ''}.` : ''}<br><br>
This isn't reckless concentration — sealed products represent finite, decreasing supply. As long as you're focused on premium products (booster boxes, PC ETBs, special sets), this is a sound strategy.`;
    } else if (slabs >= 70) {
      const firstSlabName = escapeHtml(slabItems[0]?.productName);
      allocationNarrative = `${sealedWarning}${slabs.toFixed(0)}% graded is a strong defensive posture.<br><br>
${slabItems.length > 0 ? `Cards like <strong>${firstSlabName}</strong> give you liquidity and authenticated value.` : ''}<br><br>
The upside: quick exits if needed. The downside: you may be paying a premium for security while sealed could outperform long-term.`;
    } else {
      allocationNarrative = `${sealedWarning}Your ${sealed.toFixed(0)}% sealed / ${slabs.toFixed(0)}% graded / ${raw.toFixed(0)}% raw mix is balanced.<br><br>
This means you can weather different market conditions. You won't capture the full explosive upside if one category massively outperforms, but for most collectors, this is the smarter play.`;
    }

    // Top performers narrative - focus on SELLING to reduce risk and profit milestones
    let topPerformersNarrative = "";
    if (topHits.length > 0) {
      const specificWinners = topHits.slice(0, 3).map(m => `<strong>${escapeHtml(m.item.productName)}</strong> (+${m.item.gainPercent.toFixed(0)}%)`).join(', ');
      const firstHitName = escapeHtml(topHits[0].item.productName);
      const newerSetNames = newerSets.slice(0, 2).map(i => escapeHtml(i.productName)).join(', ');
      topPerformersNarrative = `You have ${topHits.length} position${topHits.length > 1 ? 's' : ''} with 100%+ gains: ${specificWinners}.<br><br>
<strong>This is where most collectors mess up.</strong> Big winners feel great, but they also increase your concentration risk. Consider:<br><br>
<strong>• Sell some to reduce risk:</strong> Taking partial profits on ${firstHitName} would lock in gains and reduce position-specific exposure.<br>
<strong>• Rotate into underweighted categories:</strong> Use profits to balance your allocation.<br><br>
<strong>Profit Milestones to Think About:</strong><br>
• <strong>100% gain</strong> — First milestone. Consider selling enough to recoup your initial cost.<br>
• <strong>200% gain</strong> — You've tripled. Trimming here lets you "play with house money."<br>
• <strong>5x (400%+)</strong> — Rare territory. Strongly consider locking in significant profits.<br><br>
${newerSets.length > 0 ? `<strong>Note on newer sets:</strong> ${newerSetNames} may have higher ceilings — consider letting some runners run.` : ''}`;
    } else {
      topPerformersNarrative = `You don't have any 100%+ gainers yet — that's okay.<br><br>
Patience is the game. Most successful portfolios took years to show their best returns.<br><br>
<strong>Your profit milestones ahead:</strong><br>
• <strong>100% gain</strong> — First target. Consider selling enough to recoup initial cost.<br>
• <strong>200% gain</strong> — Triple your money. Trimming here lets you "play with house money."<br>
• <strong>5x (400%+)</strong> — Exceptional. Lock in significant profits when you get here.<br><br>
Stay positioned in fundamentally sound products and let time work.`;
    }

    // Strengths narrative - specific to their portfolio
    const topGainerForStrengths = escapeHtml(topGainers[0]?.productName);
    const strengthsNarrative = `${summary && summary.holdingsInProfitPercent > 60 ? `<strong>${summary.holdingsInProfitPercent.toFixed(0)}% of your holdings are in profit</strong> — that's disciplined buying.` : ''}<br><br>
${items.length >= 10 ? `With ${items.length} positions, you have real diversification, not just a few concentrated bets.` : `You've kept your portfolio focused on ${items.length} positions — easier to monitor and manage.`}<br><br>
${topGainers.length > 0 && topGainers[0].gainPercent > 50 ? `<strong>${topGainerForStrengths}</strong> at +${topGainers[0].gainPercent.toFixed(0)}% shows you can pick winners.` : 'You haven\'t panic-sold drawdowns. You\'ve stayed consistent.'}<br><br>
Any underweights aren't failures — they're opportunities for your next purchases.`;

    // Risks narrative - specific to their portfolio
    const topLoserNameForRisks = escapeHtml(topLosers[0]?.productName);
    const risksNarrative = `<strong>Risk #1: ${concentration && concentration.top1Percent > 20 ? 'Concentration' : 'Liquidity'}</strong><br>
${concentration && concentration.top1Percent > 20 ? `<strong>${top1Name}</strong> is ${concentration.top1Percent.toFixed(0)}% of your portfolio. If it drops 50%, that's a ${(concentration.top1Percent * 0.5).toFixed(0)}% hit to your total value.` : sealed >= 50 ? 'Sealed performs best over long timelines, but it\'s slower to exit. If you ever need liquidity quickly, you\'ll feel that friction.' : 'Your current mix has reasonable liquidity, but keep an eye on how quickly you could exit if needed.'}<br><br>
<strong>Risk #2: ${topLosers.length > 0 ? 'Drawdown Positions' : 'Opportunity Cost'}</strong><br>
${topLosers.length > 0 ? `<strong>${topLoserNameForRisks}</strong> is down ${Math.abs(topLosers[0].gainPercent).toFixed(0)}%. Decide: hold for recovery or tax-loss harvest?` : sealed >= 60 ? `Being ${sealed.toFixed(0)}%+ sealed means you may miss tactical opportunities in graded or raw when markets misprice them.` : 'Your diversified approach minimizes this, but stay alert to opportunities.'}<br><br>
<strong>Risk #3: Time Horizon</strong><br>
What's your actual timeline? ${sealed >= 40 ? 'Sealed requires patience — 3-5+ years minimum for most products to appreciate meaningfully.' : 'Make sure your asset mix matches when you actually need the money.'}`;

    // Action plan narrative - specific based on allocation preset
    const presetName = allocationPreset === 'conservative' ? 'The Investor (Conservative)' : 
                       allocationPreset === 'aggressive' ? 'The Purist (Aggressive)' : 
                       allocationPreset === 'balanced' ? 'The Hybrid (Balanced)' : 'Custom';
    
    const actionNarrative = `Based on your <strong>${presetName}</strong> target allocation (${allocationTarget.sealed}% Sealed / ${allocationTarget.slabs}% Graded / ${allocationTarget.rawCards}% Raw):<br><br>
${Math.abs(sealed - allocationTarget.sealed) > 10 ? `• You're ${sealed > allocationTarget.sealed ? 'over' : 'under'}weight in sealed by ${Math.abs(sealed - allocationTarget.sealed).toFixed(0)}%` : '• Your sealed allocation is on target'}<br>
${Math.abs(slabs - allocationTarget.slabs) > 10 ? `• You're ${slabs > allocationTarget.slabs ? 'over' : 'under'}weight in graded by ${Math.abs(slabs - allocationTarget.slabs).toFixed(0)}%` : '• Your graded allocation is on target'}<br>
${Math.abs(raw - allocationTarget.rawCards) > 10 ? `• You're ${raw > allocationTarget.rawCards ? 'over' : 'under'}weight in raw by ${Math.abs(raw - allocationTarget.rawCards).toFixed(0)}%` : '• Your raw allocation is on target'}<br><br>
<strong>Don't rush rebalancing.</strong> Use strength, not fear. Trim from oversized winners, redirect capital gradually, and let your winners fund flexibility.`;

    // Rebalancing narrative
    const rebalanceNarrative = `If you moved closer to your ${presetName} target over time:<br><br>
• Your health score improves (less concentration risk)<br>
• Your liquidity increases<br>
• Your downside becomes more manageable in flat markets<br><br>
The trade-off? You may slightly cap upside if one category outperforms everything else.<br><br>
<strong>Note:</strong> Your action plan changes based on your target allocation. Conservative collectors get different advice than aggressive ones — the simulator on the Rebalance page lets you experiment.`;

    // Closing narrative - Summary with hopeful note
    const archetypeForClosing = getCollectorArchetype();
    const archetypeInfo = archetypeForClosing ? archetypeData[archetypeForClosing] : null;
    
    const closingNarrative = `<strong>Summary of Your Portfolio</strong><br><br>
${archetypeInfo ? `<strong>Your Strength:</strong> ${archetypeInfo.coreStrength}. ${archetypeInfo.whatItSays.split('.')[0]}.<br><br>` : ''}
${archetypeInfo ? `<strong>Your Trade-off:</strong> ${archetypeInfo.tradeOff}. This isn't a flaw — it's the cost of your chosen strategy.<br><br>` : ''}
${summary && summary.holdingsInProfitPercent > 50 ? `With ${summary.holdingsInProfitPercent.toFixed(0)}% of your holdings in profit, you're doing something right. ` : ''}${items.length >= 5 ? `Your ${items.length} positions show intentional building, not random accumulation.` : ''}<br><br>
<strong style="color: #4ade80;">Keep going.</strong> You've built something worth protecting. Continue doing what you're doing — the conviction that got you here will carry you forward.<br><br>
<strong style="color: #fbbf24;">Stay aware of the risks.</strong> ${concentration && concentration.top1Percent > 20 ? `Your concentration in ${top1Name} deserves monitoring.` : 'Market cycles test patience.'} But awareness isn't anxiety — it's preparation.<br><br>
<strong style="color: #a78bfa;">And finally: collect what you love.</strong> The collectors who hold through volatility are the ones who genuinely care about what they own. Conviction comes from connection. If you love your cards, you'll have the patience to let them appreciate.<br><br>
<em style="color: #94a3b8;">This isn't just a portfolio — it's a reflection of how you think about value, time, and what matters to you. Trust that.</em>`;

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
            desc: `You're ${sealedDiff.toFixed(0)}% below your ${allocationTarget.sealed}% target. Consider sealed products on your next purchase.`,
          });
        } else {
          actions.push({
            title: "Consider Reducing Sealed",
            desc: `You're ${Math.abs(sealedDiff).toFixed(0)}% above your ${allocationTarget.sealed}% target. If you need liquidity, this could be an area to trim.`,
          });
        }
      }

      if (Math.abs(slabsDiff) > 5) {
        if (slabsDiff > 0) {
          actions.push({
            title: "Add More Graded Cards",
            desc: `You're ${slabsDiff.toFixed(0)}% below your ${allocationTarget.slabs}% target. Authenticated cards offer security and liquidity.`,
          });
        } else {
          actions.push({
            title: "Graded Position is Heavy",
            desc: `You're ${Math.abs(slabsDiff).toFixed(0)}% above your ${allocationTarget.slabs}% target. Consider diversifying into other categories.`,
          });
        }
      }

      if (Math.abs(rawDiff) > 5) {
        if (rawDiff > 0) {
          actions.push({
            title: "Explore Raw Cards",
            desc: `You're ${rawDiff.toFixed(0)}% below your ${allocationTarget.rawCards}% target. Raw cards offer flexibility and upside if you grade the right ones.`,
          });
        } else {
          actions.push({
            title: "Raw Exposure is High",
            desc: `You're ${Math.abs(rawDiff).toFixed(0)}% above your ${allocationTarget.rawCards}% target. Consider grading your best raw cards.`,
          });
        }
      }
    }

    // Add milestone-based actions with specific items
    const highGainMilestones = milestones.filter((m) => m.item.gainPercent >= 100);
    if (highGainMilestones.length > 0) {
      const topWinner = highGainMilestones[0];
      const topWinnerName = escapeHtml(topWinner.item.productName);
      actions.push({
        title: `Take Profits on ${topWinnerName}`,
        desc: `At +${topWinner.item.gainPercent.toFixed(0)}%, consider selling half to lock in $${topWinner.sellHalfProfit.toLocaleString()} profit while keeping ${topWinner.sellHalfUnitsRemaining} units.`,
      });
    }

    if (concentration && concentration.top1Percent > 20) {
      const escapedTop1Name = escapeHtml(concentration.top1Name);
      actions.push({
        title: `Reduce ${escapedTop1Name} Concentration`,
        desc: `At ${concentration.top1Percent.toFixed(0)}% of your portfolio, consider trimming to reduce position-specific risk.`,
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: "Stay the Course",
        desc: "Your portfolio is well-aligned with your targets. Keep monitoring and maintain your current strategy.",
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

  const topHits = milestones.slice(0, 5);
  const strengthInsights = insights.filter((i) => i.priority === "low");
  const riskInsights = insights.filter((i) => i.priority === "high" || i.priority === "medium");
  const narratives = getNarrativeContent();
  const archetypeKey = getCollectorArchetype();
  const archetype = archetypeKey ? archetypeData[archetypeKey] : null;

  const totalGain = summary?.unrealizedPL || 0;
  const totalGainPercent = summary?.unrealizedPLPercent || 0;
  // Use multi-dimensional health score from breakdown if available, fallback to summary
  const healthScore = healthScoreBreakdown?.overall ?? summary?.healthScore ?? 0;
  const totalValue = summary?.totalMarketValue || 0;

  // Calculate rebalancing recommendations based on monthly budget
  const generateRebalancingPlan = () => {
    if (!allocation) return '';
    
    const sealed = allocation.sealed.percent;
    const slabs = allocation.slabs.percent;
    const raw = allocation.rawCards.percent;
    
    const categories = [
      { key: 'sealed', label: 'Sealed Products', current: allocation.sealed, target: allocationTarget.sealed },
      { key: 'slabs', label: 'Graded Cards', current: allocation.slabs, target: allocationTarget.slabs },
      { key: 'rawCards', label: 'Raw Cards', current: allocation.rawCards, target: allocationTarget.rawCards },
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
        return { ...cat, delta, monthlyShare, monthsNeeded };
      })
      .filter(cat => cat.monthlyShare > 0);

    if (rebalanceItems.length === 0) {
      return `<p style="color: #4ade80; text-align: center; padding: 20px;">Your portfolio is already balanced according to your targets. No rebalancing needed!</p>`;
    }

    const maxMonths = Math.max(...rebalanceItems.map(cat => cat.monthsNeeded));
    
    // Generate plain English summary
    const plainEnglishAdvice: string[] = [];
    
    rebalanceItems.forEach(cat => {
      const shareAmount = Math.round(cat.monthlyShare);
      if (cat.key === 'slabs' && shareAmount > 0) {
        plainEnglishAdvice.push(`<strong>Invest $${shareAmount.toLocaleString()}/month in graded cards.</strong> PSA 10s are the gold standard — they have proven liquidity and strong appreciation. PSA 9s are okay too, especially for vintage where 10s are rare. ${slabs > allocationTarget.slabs ? "You're already overweight here, so be selective." : "Focus on iconic Pokémon and cards with strong market history."}`);
      }
      if (cat.key === 'rawCards' && shareAmount > 0) {
        plainEnglishAdvice.push(`<strong>Invest $${shareAmount.toLocaleString()}/month in raw cards.</strong> Look for Near Mint (NM) or Mint (M) condition copies. Ideally, find "gradeable" copies so you have the option of submitting to PSA later. Raw cards give you flexibility — you can hold as-is or grade when the time is right.`);
      }
      if (cat.key === 'sealed' && shareAmount > 0) {
        plainEnglishAdvice.push(`<strong>Invest $${shareAmount.toLocaleString()}/month in sealed products.</strong> Prioritize booster boxes (the gold standard) and Pokemon Center ETBs (premium exclusives). Sealed products appreciate through scarcity — they can never be reprinted.`);
      }
    });
    
    // Add context about what they're already overweight on
    const overweightCategories = categories.filter(cat => cat.current.percent > cat.target);
    if (overweightCategories.length > 0) {
      const overweightNames = overweightCategories.map(c => c.label.toLowerCase()).join(' and ');
      plainEnglishAdvice.push(`<em style="color: #94a3b8;">Note: You're already overweight on ${overweightNames}, so no additional investment needed there right now.</em>`);
    }

    return `
      <div class="target-allocation-card">
        <div class="target-title">Monthly Investment Budget: $${monthlyBudget.toLocaleString()}/month</div>
        <div style="margin-top: 16px;">
          <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 12px;"><strong>Suggested Monthly Allocation:</strong></p>
          ${rebalanceItems.map(cat => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
              <span style="color: #cbd5e1;">${cat.label}</span>
              <span style="color: #a78bfa; font-weight: 600;">$${Math.round(cat.monthlyShare).toLocaleString()}/mo</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 16px; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
          <p style="color: #a78bfa; font-weight: 600; font-size: 14px;">
            Estimated time to reach targets: <span style="color: #fff;">${maxMonths} month${maxMonths > 1 ? 's' : ''}</span>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
            At $${monthlyBudget.toLocaleString()}/month contribution rate
          </p>
        </div>
      </div>
      
      <div style="margin-top: 24px;">
        <div class="narrative-title">What This Means In Plain English</div>
        <div class="narrative-block" style="margin-top: 12px;">
          ${plainEnglishAdvice.map(advice => `<p style="margin-bottom: 16px;">${advice}</p>`).join('')}
          <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(139, 92, 246, 0.2); color: #a78bfa;">
            <strong>Remember:</strong> Graded cards give you exposure to cards whose value has been "locked in" by third-party authentication. This removes condition uncertainty and makes future selling easier.
          </p>
        </div>
      </div>
    `;
  };

  // Generate era allocation section
  const generateEraAllocationSection = () => {
    if (!eraAllocation) return '';
    
    const eras = [
      { key: 'vintage', ...eraAllocation.vintage, info: ERA_INFO.vintage, risk: 'Low Risk' },
      { key: 'classic', ...eraAllocation.classic, info: ERA_INFO.classic, risk: 'Low Risk' },
      { key: 'modern', ...eraAllocation.modern, info: ERA_INFO.modern, risk: 'Medium Risk' },
      { key: 'ultraModern', ...eraAllocation.ultraModern, info: ERA_INFO.ultraModern, risk: 'Medium Risk' },
      { key: 'current', ...eraAllocation.current, info: ERA_INFO.current, risk: 'High Risk' },
    ];

    const olderEraPercent = eraAllocation.vintage.percent + eraAllocation.classic.percent;
    const midModernPercent = eraAllocation.modern.percent + eraAllocation.ultraModern.percent;
    const currentPercent = eraAllocation.current.percent;

    return `
    <div class="section">
      <h2 class="section-title">Era Allocation</h2>
      
      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-value" style="color: #4ade80; font-size: 20px;">${olderEraPercent.toFixed(0)}%</div>
          <div class="stat-label">Older Era</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Low Risk</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #f59e0b; font-size: 20px;">${midModernPercent.toFixed(0)}%</div>
          <div class="stat-label">Mid Modern</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Medium Risk</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #f87171; font-size: 20px;">${currentPercent.toFixed(0)}%</div>
          <div class="stat-label">Current</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">High Risk</div>
        </div>
      </div>

      <div style="display: grid; gap: 12px;">
        ${eras.filter(era => era.percent > 0).map(era => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(15, 23, 42, 0.4); border-radius: 10px;">
            <div>
              <div style="color: #fff; font-weight: 500;">${era.info.name}</div>
              <div style="color: #64748b; font-size: 12px;">${era.info.years}</div>
            </div>
            <div style="text-align: right;">
              <div style="color: #a78bfa; font-weight: 600;">${era.percent.toFixed(1)}%</div>
              <div style="color: #64748b; font-size: 12px;">$${era.value.toLocaleString()}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="narrative-block">
        <div class="narrative-title">Era Risk Analysis</div>
        <p style="margin-bottom: 12px;">Your era distribution affects portfolio risk:</p>
        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1;">
          <li><strong style="color: #4ade80;">Older Era (${olderEraPercent.toFixed(0)}%)</strong>: Vintage and Classic sets have proven scarcity and established value. ${olderEraPercent >= 30 ? 'Your exposure here is solid.' : 'Consider increasing your vintage/classic exposure for stability.'}</li>
          <li><strong style="color: #f59e0b;">Mid Modern (${midModernPercent.toFixed(0)}%)</strong>: Modern and Ultra Modern sets are normalizing post-boom. ${midModernPercent >= 30 && midModernPercent <= 50 ? 'Well balanced.' : midModernPercent > 50 ? 'Heavy exposure — monitor for print run concerns.' : 'Room to add quality modern sets.'}</li>
          <li><strong style="color: #f87171;">Current Window (${currentPercent.toFixed(0)}%)</strong>: Active print products carry the highest risk. ${currentPercent <= 15 ? 'Your current window exposure is appropriate.' : 'High exposure to active print — be prepared for volatility.'}</li>
        </ul>
      </div>
    </div>
    `;
  };

  // Preset info for report card
  const presetLabel = allocationPreset === 'conservative' ? 'The Investor (Conservative)' : 
                      allocationPreset === 'aggressive' ? 'The Purist (Aggressive)' : 
                      allocationPreset === 'balanced' ? 'The Hybrid (Balanced)' : 'Custom';

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

    .target-allocation-card {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }

    .target-title {
      font-size: 14px;
      font-weight: 600;
      color: #a78bfa;
      margin-bottom: 8px;
    }

    .target-info {
      font-size: 13px;
      color: #94a3b8;
    }

    .target-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      font-style: italic;
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

    /* Position Performance Table */
    .positions-table-container {
      overflow-x: auto;
      margin-top: 24px;
    }

    .positions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .positions-table th {
      background: rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      font-weight: 600;
      padding: 12px 10px;
      text-align: left;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3);
    }

    .positions-table th:hover {
      background: rgba(139, 92, 246, 0.3);
    }

    .positions-table th .sort-icon {
      margin-left: 6px;
      opacity: 0.5;
    }

    .positions-table th.sorted .sort-icon {
      opacity: 1;
    }

    .positions-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
      color: #cbd5e1;
    }

    .positions-table tr:hover td {
      background: rgba(139, 92, 246, 0.05);
    }

    .positions-table .positive { color: #4ade80; }
    .positions-table .negative { color: #f87171; }

    .positions-table .product-name {
      font-weight: 500;
      color: #fff;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sort-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .sort-btn {
      padding: 6px 12px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 6px;
      color: #a78bfa;
      font-size: 12px;
      cursor: pointer;
    }

    .sort-btn:hover {
      background: rgba(139, 92, 246, 0.2);
    }

    .sort-btn.active {
      background: #8b5cf6;
      color: #fff;
    }

    @media print {
      body { background: #fff; color: #1e293b; }
      .section { border: 1px solid #e2e8f0; }
      .stat-card { background: #f8fafc; }
      .section-title { color: #6366f1; }
      .narrative-block { background: #f8fafc; color: #475569; }
      .positions-table th { background: #f1f5f9; color: #6366f1; }
      .positions-table td { color: #475569; border-color: #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Collector Profile Section (Archetype) -->
    ${generateArchetypeSection()}
    
    <!-- Portfolio Analysis - moved right after What This Says About You -->
    <div class="section">
      <h2 class="section-title">Portfolio Analysis</h2>
      <div class="narrative-block">
        <p style="margin-bottom: 16px;">${getPortfolioAnalysisContent().dataShowsParagraph}</p>
        <p style="margin-bottom: 16px;">${getPortfolioAnalysisContent().whyParagraph}</p>
        <p style="margin-bottom: 16px;">${getPortfolioAnalysisContent().strengthsParagraph}</p>
        <p style="color: #a78bfa;">${getPortfolioAnalysisContent().nudgeParagraph}</p>
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
    </div>
    
    <!-- Health Score -->
    <div class="section">
      <h2 class="section-title">Portfolio Health Score</h2>
      <div style="text-align: center;">
        <div class="health-score">${healthScore}</div>
        <p style="color: #94a3b8; font-size: 14px;">out of 100</p>
      </div>
      
      ${healthScoreBreakdown ? (() => {
        const assetPercent = Math.round((healthScoreBreakdown.assetScore / 45) * 100);
        const eraPercent = Math.round((healthScoreBreakdown.eraScore / 35) * 100);
        const concentrationPercent = Math.round((healthScoreBreakdown.concentrationScore / 20) * 100);
        
        // Determine which area needs caution
        const lowestScore = Math.min(assetPercent, eraPercent, concentrationPercent);
        let cautionArea = '';
        if (lowestScore === assetPercent && assetPercent < 70) {
          cautionArea = 'asset allocation';
        } else if (lowestScore === eraPercent && eraPercent < 70) {
          cautionArea = 'era balance';
        } else if (lowestScore === concentrationPercent && concentrationPercent < 70) {
          cautionArea = 'concentration';
        }
        
        return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; margin-bottom: 24px;">
        <div style="background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-size: 13px;">Asset Allocation</span>
            <span style="color: ${assetPercent >= 78 ? '#4ade80' : assetPercent >= 55 ? '#fbbf24' : '#f87171'}; font-weight: 600;">${assetPercent}/100</span>
          </div>
          <div style="background: rgba(139, 92, 246, 0.2); border-radius: 4px; height: 6px; margin-top: 8px; overflow: hidden;">
            <div style="background: ${assetPercent >= 78 ? '#4ade80' : assetPercent >= 55 ? '#fbbf24' : '#f87171'}; border-radius: 4px; height: 100%; width: ${Math.min(assetPercent, 100)}%;"></div>
          </div>
          <p style="color: #64748b; font-size: 11px; margin-top: 8px;">Sealed/graded/raw mix vs targets</p>
        </div>
        <div style="background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-size: 13px;">Era Balance</span>
            <span style="color: ${eraPercent >= 80 ? '#4ade80' : eraPercent >= 57 ? '#fbbf24' : '#f87171'}; font-weight: 600;">${eraPercent}/100</span>
          </div>
          <div style="background: rgba(139, 92, 246, 0.2); border-radius: 4px; height: 6px; margin-top: 8px; overflow: hidden;">
            <div style="background: ${eraPercent >= 80 ? '#4ade80' : eraPercent >= 57 ? '#fbbf24' : '#f87171'}; border-radius: 4px; height: 100%; width: ${Math.min(eraPercent, 100)}%;"></div>
          </div>
          <p style="color: #64748b; font-size: 11px; margin-top: 8px;">Vintage, modern, current distribution</p>
        </div>
        <div style="background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-size: 13px;">Concentration</span>
            <span style="color: ${concentrationPercent >= 80 ? '#4ade80' : concentrationPercent >= 50 ? '#fbbf24' : '#f87171'}; font-weight: 600;">${concentrationPercent}/100</span>
          </div>
          <div style="background: rgba(139, 92, 246, 0.2); border-radius: 4px; height: 6px; margin-top: 8px; overflow: hidden;">
            <div style="background: ${concentrationPercent >= 80 ? '#4ade80' : concentrationPercent >= 50 ? '#fbbf24' : '#f87171'}; border-radius: 4px; height: 100%; width: ${Math.min(concentrationPercent, 100)}%;"></div>
          </div>
          <p style="color: #64748b; font-size: 11px; margin-top: 8px;">Position and set diversification</p>
        </div>
      </div>
      <p style="color: #cbd5e1; font-size: 14px; text-align: center; margin-top: 16px;">
        Your portfolio health score is <strong>${healthScore}</strong>.${cautionArea ? ` Your <strong style="color: #fbbf24;">${cautionArea}</strong> is an area of caution to monitor.` : ' All areas are looking healthy.'}
      </p>
      `;
      })() : ''}
    
    <!-- Allocation Breakdown with Target -->
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
      
      <!-- Target Allocation Card -->
      <div class="target-allocation-card">
        <div class="target-title">Your Target Allocation: ${presetLabel}</div>
        <div class="target-info">
          <strong>${allocationTarget.sealed}%</strong> Sealed / <strong>${allocationTarget.slabs}%</strong> Graded / <strong>${allocationTarget.rawCards}%</strong> Raw
        </div>
        <div class="target-note">
          💡 Your action plan is customized based on this target. Different allocation strategies (Conservative, Balanced, Aggressive, Custom) will generate different recommendations.
        </div>
      </div>
      
      <div class="narrative-block">
        <div class="narrative-title">Allocation Analysis</div>
        ${narratives.allocationNarrative}
      </div>
    </div>
    
    <!-- Era Allocation -->
    ${generateEraAllocationSection()}
    
    <!-- Top Hits -->
    ${topHits.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Top Performers</h2>
      ${topHits.map(hit => `
        <div class="hit-item">
          <span class="hit-name">${hit.item.productName}</span>
          <span class="hit-gain">+${hit.item.gainPercent.toFixed(0)}%</span>
        </div>
      `).join('')}
      
      <div class="narrative-block">
        <div class="narrative-title">What to Do With Big Winners (This Is Where Most People Mess Up)</div>
        ${narratives.topPerformersNarrative}
      </div>
    </div>
    ` : ''}
    
    <!-- Position Performance Table removed for cleaner PDF export -->
    
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
    
    <!-- Risks & Tradeoffs -->
    <div class="section">
      <h2 class="section-title">Risks & Tradeoffs</h2>
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
        <div class="narrative-title">How I'd Actually Execute This</div>
        ${narratives.actionNarrative}
      </div>
    </div>
    
    <!-- Rebalancing Considerations -->
    <div class="section">
      <h2 class="section-title">Your Rebalancing Plan</h2>
      ${generateRebalancingPlan()}
      <div class="narrative-block">
        ${narratives.rebalanceNarrative}
      </div>
    </div>
    
    <!-- In Summary (Closing) -->
    <div class="section closing-section">
      <h2 class="section-title">In Summary</h2>
      <div class="narrative-block" style="border-left: none; text-align: left; max-width: 600px; margin: 0 auto;">
        ${narratives.closingNarrative}
      </div>
    </div>
    
    <footer class="footer">
      <p>Report generated by MintdFolio</p>
      <p style="margin-top: 8px;">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top: 8px; font-size: 11px; color: #64748b;">This report is for informational purposes only. Not financial advice. Market conditions change—always do your own research.</p>
    </footer>
  </div>
  <script>
    let sortDirection = {};
    function sortTable(columnIndex, type) {
      const table = document.getElementById('positionsTable');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const th = table.querySelectorAll('th')[columnIndex];
      
      sortDirection[columnIndex] = !sortDirection[columnIndex];
      const dir = sortDirection[columnIndex] ? 1 : -1;
      
      rows.sort((a, b) => {
        let aVal = a.cells[columnIndex].textContent.trim();
        let bVal = b.cells[columnIndex].textContent.trim();
        
        if (type === 'number') {
          aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
          bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
          return (aVal - bVal) * dir;
        }
        return aVal.localeCompare(bVal) * dir;
      });
      
      rows.forEach(row => tbody.appendChild(row));
      table.querySelectorAll('th').forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = dir === 1 ? '↑' : '↓';
    }
  </script>
</body>
</html>`;
}

// Generate plain text report for .doc download
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
  if (sealed >= 50) collectorType = "The Vault Keeper";
  else if (slabs >= 50) collectorType = "The Trophy Hunter";
  else if (raw >= 50) collectorType = "The Volume Player";
  else if (sealed >= 30 && slabs >= 30) collectorType = "The Strategic Diversifier";

  const presetLabel = allocationPreset === 'conservative' ? 'The Investor (Conservative)' : 
                      allocationPreset === 'aggressive' ? 'The Purist (Aggressive)' : 
                      allocationPreset === 'balanced' ? 'The Hybrid (Balanced)' : 'Custom';

  let report = `
MINTDFOLIO PORTFOLIO ANALYSIS REPORT
Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

================================================================================
YOUR COLLECTOR PROFILE: ${collectorType.toUpperCase()}
================================================================================

`;

  if (sealed >= 50) {
    report += `With ${sealed.toFixed(0)}% of your portfolio in sealed products, you're clearly playing the long game. You understand that sealed products only become more scarce over time.

${sealedItems.length > 0 ? `Your sealed holdings include: ${sealedItems.slice(0, 5).map(i => i.productName).join(', ')}` : ''}

`;
  } else if (slabs >= 50) {
    report += `Your collection is ${slabs.toFixed(0)}% graded cards. You've chosen authenticated excellence over quantity, and each slab represents a deliberate choice.

${slabItems.length > 0 ? `Key graded holdings: ${slabItems.slice(0, 5).map(i => i.productName).join(', ')}` : ''}

`;
  } else {
    report += `Your balanced ${sealed.toFixed(0)}% sealed / ${slabs.toFixed(0)}% graded / ${raw.toFixed(0)}% raw split across ${items.length} holdings shows you're not putting all your eggs in one basket.

`;
  }

  report += `
================================================================================
PORTFOLIO OVERVIEW
================================================================================

Total Portfolio Value: $${(summary?.totalMarketValue || 0).toLocaleString()}
Total Cost Basis: $${(summary?.totalCostBasis || 0).toLocaleString()}
Unrealized Profit/Loss: ${(summary?.unrealizedPL || 0) >= 0 ? '+' : ''}$${(summary?.unrealizedPL || 0).toLocaleString()} (${(summary?.unrealizedPLPercent || 0) >= 0 ? '+' : ''}${(summary?.unrealizedPLPercent || 0).toFixed(1)}%)
Total Holdings: ${items.length}
Holdings in Profit: ${summary?.holdingsInProfitCount || 0} (${(summary?.holdingsInProfitPercent || 0).toFixed(0)}%)
Portfolio Health Score: ${summary?.healthScore || 0}/100

`;

  report += `
================================================================================
CURRENT ALLOCATION
================================================================================

Sealed:  ${sealed.toFixed(0)}% ($${(allocation?.sealed.value || 0).toLocaleString()}) - ${allocation?.sealed.count || 0} items
Graded:  ${slabs.toFixed(0)}% ($${(allocation?.slabs.value || 0).toLocaleString()}) - ${allocation?.slabs.count || 0} items
Raw:     ${raw.toFixed(0)}% ($${(allocation?.rawCards.value || 0).toLocaleString()}) - ${allocation?.rawCards.count || 0} items

YOUR TARGET ALLOCATION: ${presetLabel}
Target: ${allocationTarget.sealed}% Sealed / ${allocationTarget.slabs}% Graded / ${allocationTarget.rawCards}% Raw

Note: Your action plan is customized based on this target. Different allocation strategies (Conservative, Balanced, Aggressive, Custom) will generate different recommendations.

`;

  report += `
================================================================================
TOP 5 HOLDINGS BY VALUE
================================================================================

`;
  biggestHoldings.forEach((item, i) => {
    report += `${i + 1}. ${item.productName}
   Value: $${item.totalMarketValue.toLocaleString()} | Cost: $${item.totalCostBasis.toLocaleString()} | Gain: ${item.gainPercent >= 0 ? '+' : ''}${item.gainPercent.toFixed(0)}%
   
`;
  });

  if (topHits.length > 0) {
    report += `
================================================================================
TOP PERFORMERS (100%+ GAINS)
================================================================================

`;
    topHits.forEach((hit, i) => {
      report += `${i + 1}. ${hit.item.productName}
   Gain: +${hit.item.gainPercent.toFixed(0)}% | Current Value: $${hit.item.totalMarketValue.toLocaleString()}
   
`;
    });

    report += `
RECOMMENDATION: Consider taking some profits on these winners.

Profit Milestones to Think About:
- 100% gain: First milestone. Consider selling enough to recoup your initial cost.
- 200% gain: You've tripled. Trimming here lets you "play with house money."
- 5x (400%+): Rare territory. Strongly consider locking in significant profits.

Specifically:
`;
    topHits.slice(0, 3).forEach(hit => {
      report += `- ${hit.item.productName}: Selling half would lock in $${hit.sellHalfProfit.toLocaleString()} profit while keeping ${hit.sellHalfUnitsRemaining} units.
`;
    });
  }

  if (topLosers.length > 0) {
    report += `
================================================================================
POSITIONS IN DRAWDOWN
================================================================================

`;
    topLosers.forEach((item, i) => {
      report += `${i + 1}. ${item.productName}
   Loss: ${item.gainPercent.toFixed(0)}% | Current Value: $${item.totalMarketValue.toLocaleString()}
   
`;
    });

    report += `
RECOMMENDATION: Review whether your thesis still holds for these positions. If yes, this could be accumulation territory. If not, consider tax-loss harvesting before year-end.

`;
  }

  report += `
================================================================================
ACTION PLAN
================================================================================

Based on your ${presetLabel} target allocation:

`;

  const sealedDiff = allocationTarget.sealed - sealed;
  const slabsDiff = allocationTarget.slabs - slabs;
  const rawDiff = allocationTarget.rawCards - raw;

  if (Math.abs(sealedDiff) > 5) {
    if (sealedDiff > 0) {
      report += `□ INCREASE SEALED ALLOCATION
  You're ${sealedDiff.toFixed(0)}% below your ${allocationTarget.sealed}% target. Consider sealed products on your next purchase.

`;
    } else {
      report += `□ CONSIDER REDUCING SEALED
  You're ${Math.abs(sealedDiff).toFixed(0)}% above your ${allocationTarget.sealed}% target. If you need liquidity, this could be an area to trim.

`;
    }
  }

  if (Math.abs(slabsDiff) > 5) {
    if (slabsDiff > 0) {
      report += `□ ADD MORE GRADED CARDS
  You're ${slabsDiff.toFixed(0)}% below your ${allocationTarget.slabs}% target. Authenticated cards offer security and liquidity.

`;
    } else {
      report += `□ GRADED POSITION IS HEAVY
  You're ${Math.abs(slabsDiff).toFixed(0)}% above your ${allocationTarget.slabs}% target. Consider diversifying into other categories.

`;
    }
  }

  if (Math.abs(rawDiff) > 5) {
    if (rawDiff > 0) {
      report += `□ EXPLORE RAW CARDS
  You're ${rawDiff.toFixed(0)}% below your ${allocationTarget.rawCards}% target. Raw cards offer flexibility and upside if you grade the right ones.

`;
    } else {
      report += `□ RAW EXPOSURE IS HIGH
  You're ${Math.abs(rawDiff).toFixed(0)}% above your ${allocationTarget.rawCards}% target. Consider grading your best raw cards.

`;
    }
  }

  if (concentration && concentration.top1Percent > 20) {
    report += `□ ADDRESS CONCENTRATION RISK
  ${concentration.top1Name} is ${concentration.top1Percent.toFixed(0)}% of your portfolio. Consider trimming to reduce position-specific risk.

`;
  }

  if (topHits.length > 0) {
    report += `□ TAKE PROFITS ON WINNERS
  You have ${topHits.length} position(s) with 100%+ gains. Consider selling some to lock in profits and reduce risk.

`;
  }

  report += `
================================================================================
MY TAKEAWAY
================================================================================

`;

  if (topHits.length > 0 && topGainers[0].gainPercent > 100) {
    report += `Your ${topHits.length} position(s) with 100%+ gains (${topHits.slice(0, 2).map(m => m.item.productName).join(', ')}) are the highlight.

Consider taking some profits — at least enough to recoup your initial investment. Then you're playing with house money.

`;
  }

  if (concentration && concentration.top1Percent > 20) {
    report += `Watch your concentration in ${concentration.top1Name} at ${concentration.top1Percent.toFixed(0)}% of your portfolio. Trimming here could reduce risk without abandoning your thesis.

`;
  }

  report += `Your $${(summary?.totalMarketValue || 0).toLocaleString()} portfolio across ${items.length} holdings shows thoughtful construction.

You know what you believe in. You're not chasing noise. The next level isn't changing your thesis — it's refining execution.

================================================================================

Generated by mintdfolio - Your Pokémon Financial Advisor

This report is for informational purposes only. Not financial advice.
Market conditions change — always do your own research.
`;

  return report;
}
