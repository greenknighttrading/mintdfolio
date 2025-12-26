import { PortfolioItem, PokemonEra, ERA_SETS, EraAllocationBreakdown, EraAllocationTarget } from './types';

/**
 * Classify a portfolio item into an era based on its category/set name
 * Current is a rolling 12-month status, not a separate era
 */
export function classifyItemEra(item: PortfolioItem): PokemonEra {
  const category = item.category?.toLowerCase() || '';
  const productName = item.productName?.toLowerCase() || '';
  const searchText = `${category} ${productName}`;
  
  // Check if item is "Current" (added within last 12 months)
  if (item.dateAdded) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    if (item.dateAdded >= twelveMonthsAgo) {
      return 'current';
    }
  }
  
  // Check each era's sets
  for (const [era, sets] of Object.entries(ERA_SETS) as [Exclude<PokemonEra, 'current'>, string[]][]) {
    for (const set of sets) {
      if (searchText.includes(set.toLowerCase())) {
        return era;
      }
    }
  }
  
  // Fallback heuristics based on common patterns
  if (searchText.includes('base set') || searchText.includes('jungle') || searchText.includes('fossil') ||
      searchText.includes('neo') || searchText.includes('expedition') || searchText.includes('skyridge') ||
      searchText.includes('aquapolis') || searchText.includes('1st edition') || searchText.includes('shadowless')) {
    return 'vintage';
  }
  
  if (searchText.includes('diamond') || searchText.includes('platinum') || searchText.includes('heartgold') ||
      searchText.includes('soulsilver') || searchText.includes('black & white') || searchText.includes('plasma')) {
    return 'classic';
  }
  
  if (searchText.includes('xy') || searchText.includes('sun & moon') || searchText.includes('hidden fates') ||
      searchText.includes('evolutions') || searchText.includes('generations') || searchText.includes('shining legends')) {
    return 'modern';
  }
  
  if (searchText.includes('sword & shield') || searchText.includes('scarlet') || searchText.includes('violet') ||
      searchText.includes('celebrations') || searchText.includes('evolving skies') || searchText.includes('151') ||
      searchText.includes('crown zenith') || searchText.includes('paldea') || searchText.includes('prismatic')) {
    return 'ultraModern';
  }
  
  // Default to ultraModern for unclassified items (most conservative assumption)
  return 'ultraModern';
}

/**
 * Calculate era allocation breakdown for portfolio items
 */
export function calculateEraAllocationBreakdown(items: PortfolioItem[]): EraAllocationBreakdown {
  const totalValue = items.reduce((sum, item) => sum + item.totalMarketValue, 0);
  
  const eraGroups: Record<PokemonEra, PortfolioItem[]> = {
    vintage: [],
    classic: [],
    modern: [],
    ultraModern: [],
    current: [],
  };
  
  items.forEach(item => {
    const era = classifyItemEra(item);
    eraGroups[era].push(item);
  });
  
  const calculateGroup = (era: PokemonEra) => {
    const group = eraGroups[era];
    const value = group.reduce((sum, item) => sum + item.totalMarketValue, 0);
    return {
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      count: group.length,
    };
  };
  
  return {
    vintage: calculateGroup('vintage'),
    classic: calculateGroup('classic'),
    modern: calculateGroup('modern'),
    ultraModern: calculateGroup('ultraModern'),
    current: calculateGroup('current'),
  };
}

/**
 * Generate era-based health warnings
 */
export interface EraHealthWarning {
  type: 'current_high' | 'newer_era_high' | 'newer_era_low' | 'older_era_low';
  message: string;
  severity: 'warning' | 'info';
}

export function generateEraHealthWarnings(
  eraAllocation: EraAllocationBreakdown,
  target: EraAllocationTarget
): EraHealthWarning[] {
  const warnings: EraHealthWarning[] = [];
  
  // Check Current exposure
  if (eraAllocation.current.percent > 10) {
    warnings.push({
      type: 'current_high',
      message: 'Current exposure is above 10% — portfolio is more speculative.',
      severity: 'warning',
    });
  }
  
  // Check newer-era group (Modern + Ultra Modern + Current)
  const newerEraPercent = eraAllocation.modern.percent + eraAllocation.ultraModern.percent + eraAllocation.current.percent;
  if (newerEraPercent > 55) {
    warnings.push({
      type: 'newer_era_high',
      message: 'Newer-era exposure: High risk',
      severity: 'warning',
    });
  } else if (newerEraPercent < 45) {
    warnings.push({
      type: 'newer_era_low',
      message: 'Newer-era exposure: Lower growth / more conservative',
      severity: 'info',
    });
  }
  
  // Check older-era group (Vintage + Classic)
  const olderEraPercent = eraAllocation.vintage.percent + eraAllocation.classic.percent;
  if (olderEraPercent < 30) {
    warnings.push({
      type: 'older_era_low',
      message: 'Older-era exposure is low — portfolio may be less durable.',
      severity: 'warning',
    });
  }
  
  return warnings;
}

/**
 * Get newer-era status text
 */
export function getNewerEraStatus(eraAllocation: EraAllocationBreakdown): { text: string; status: 'healthy' | 'high' | 'low' } {
  const newerEraPercent = eraAllocation.modern.percent + eraAllocation.ultraModern.percent + eraAllocation.current.percent;
  
  if (newerEraPercent >= 45 && newerEraPercent <= 55) {
    return { text: 'Newer-era exposure: Healthy', status: 'healthy' };
  } else if (newerEraPercent > 55) {
    return { text: 'Newer-era exposure: High risk', status: 'high' };
  } else {
    return { text: 'Newer-era exposure: Lower growth / more conservative', status: 'low' };
  }
}
