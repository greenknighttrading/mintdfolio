import { PortfolioItem, PokemonEra, ERA_SETS, EraAllocationBreakdown, EraAllocationTarget } from './types';

/**
 * Classify a portfolio item into an era based on its category/set name
 * Uses the Set/category column for matching, with dateAdded fallback for Current status
 */
export function classifyItemEra(item: PortfolioItem): PokemonEra {
  const category = item.category?.toLowerCase().trim() || '';
  const productName = item.productName?.toLowerCase().trim() || '';
  const searchText = `${category} ${productName}`;
  
  // First, try to match by set name in category (the Set column from CSV)
  // This takes priority over dateAdded
  let matchedEra: PokemonEra | null = null;
  
  // Check each era's sets - looking for exact or partial matches
  for (const [era, sets] of Object.entries(ERA_SETS) as [Exclude<PokemonEra, 'current'>, string[]][]) {
    for (const set of sets) {
      const setLower = set.toLowerCase();
      // Check if category matches the set name (primary match)
      if (category.includes(setLower) || setLower.includes(category)) {
        matchedEra = era;
        break;
      }
      // Also check product name for set references
      if (productName.includes(setLower)) {
        matchedEra = era;
        break;
      }
    }
    if (matchedEra) break;
  }
  
  // Fallback heuristics if no direct match found
  if (!matchedEra) {
    // Check for common patterns in category/product name
    if (searchText.includes('base set') || searchText.includes('jungle') || searchText.includes('fossil') ||
        searchText.includes('neo') || searchText.includes('expedition') || searchText.includes('skyridge') ||
        searchText.includes('aquapolis') || searchText.includes('1st edition') || searchText.includes('shadowless') ||
        searchText.includes('gym heroes') || searchText.includes('gym challenge') || searchText.includes('team rocket')) {
      matchedEra = 'vintage';
    } else if (searchText.includes('diamond') || searchText.includes('pearl') || searchText.includes('platinum') || 
               searchText.includes('heartgold') || searchText.includes('soulsilver') || 
               searchText.includes('black & white') || searchText.includes('plasma') ||
               searchText.includes('hgss') || searchText.includes('call of legends') ||
               searchText.includes('legendary treasures')) {
      matchedEra = 'classic';
    } else if (searchText.includes('xy') || searchText.includes('sun & moon') || searchText.includes('sun and moon') ||
               searchText.includes('hidden fates') || searchText.includes('evolutions') || 
               searchText.includes('generations') || searchText.includes('shining legends') ||
               searchText.includes('detective pikachu') || searchText.includes('cosmic eclipse') ||
               searchText.includes('burning shadows') || searchText.includes('guardians rising')) {
      matchedEra = 'modern';
    } else if (searchText.includes('sword') || searchText.includes('shield') || 
               searchText.includes('scarlet') || searchText.includes('violet') ||
               searchText.includes('celebrations') || searchText.includes('evolving skies') || 
               searchText.includes('151') || searchText.includes('crown zenith') || 
               searchText.includes('paldea') || searchText.includes('prismatic') ||
               searchText.includes('brilliant stars') || searchText.includes('shining fates') ||
               searchText.includes('fusion strike') || searchText.includes('astral radiance') ||
               searchText.includes('lost origin') || searchText.includes('silver tempest') ||
               searchText.includes('paradox rift') || searchText.includes('temporal forces') ||
               searchText.includes('surging sparks') || searchText.includes('obsidian flames') ||
               searchText.includes('stellar crown') || searchText.includes('journey together') ||
               searchText.includes('twilight masquerade') || searchText.includes('shrouded fable') ||
               searchText.includes('paldean fates') || searchText.includes('destined rivals')) {
      matchedEra = 'ultraModern';
    }
  }
  
  // If still no match, check dateAdded for very recent items (current window)
  // But only assign 'current' if the item was added very recently AND no era match
  if (!matchedEra && item.dateAdded) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    if (item.dateAdded >= twelveMonthsAgo) {
      return 'current';
    }
  }
  
  // Default to the matched era, or ultraModern as fallback
  return matchedEra || 'ultraModern';
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

/**
 * Calculate era health score (0-100)
 * Based on how well the portfolio matches target era allocation
 */
export function calculateEraHealthScore(
  eraAllocation: EraAllocationBreakdown,
  target: EraAllocationTarget = { vintage: 20, classic: 20, modern: 20, ultraModern: 30, current: 10 }
): number {
  let score = 100;
  
  // Penalize deviation from target for each era
  const eras: PokemonEra[] = ['vintage', 'classic', 'modern', 'ultraModern', 'current'];
  eras.forEach(era => {
    const diff = Math.abs(eraAllocation[era].percent - target[era]);
    // Lose 2 points per percentage point of deviation
    score -= diff * 2;
  });
  
  // Additional penalty for high current exposure (>10%)
  if (eraAllocation.current.percent > 10) {
    score -= (eraAllocation.current.percent - 10) * 3;
  }
  
  // Additional penalty for low older-era exposure (<30%)
  const olderEraPercent = eraAllocation.vintage.percent + eraAllocation.classic.percent;
  if (olderEraPercent < 30) {
    score -= (30 - olderEraPercent) * 2;
  }
  
  // Bonus for healthy newer-era exposure (45-55%)
  const newerEraPercent = eraAllocation.modern.percent + eraAllocation.ultraModern.percent + eraAllocation.current.percent;
  if (newerEraPercent >= 45 && newerEraPercent <= 55) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate set concentration score (0-100)
 * Lower concentration = higher score
 */
export function calculateConcentrationHealthScore(
  topSetPercent: number,
  top3SetsPercent: number
): number {
  let score = 100;
  
  // Penalty for top set concentration
  if (topSetPercent > 25) {
    score -= (topSetPercent - 25) * 4; // Heavy penalty above 25%
  } else if (topSetPercent > 15) {
    score -= (topSetPercent - 15) * 2; // Moderate penalty above 15%
  }
  
  // Penalty for top 3 sets concentration
  if (top3SetsPercent > 60) {
    score -= (top3SetsPercent - 60) * 3; // Heavy penalty above 60%
  } else if (top3SetsPercent > 40) {
    score -= (top3SetsPercent - 40) * 1.5; // Moderate penalty above 40%
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate set concentration metrics
 */
export function calculateSetConcentration(items: PortfolioItem[]): {
  topSetPercent: number;
  topSetName: string;
  top3SetsPercent: number;
  top3SetsNames: string[];
  setBreakdown: { name: string; value: number; percent: number; count: number }[];
} {
  const totalValue = items.reduce((sum, item) => sum + item.totalMarketValue, 0);
  
  // Group by set (category)
  const setValues: Record<string, { value: number; count: number }> = {};
  items.forEach(item => {
    const set = item.category || 'Unknown';
    if (!setValues[set]) {
      setValues[set] = { value: 0, count: 0 };
    }
    setValues[set].value += item.totalMarketValue;
    setValues[set].count += 1;
  });
  
  // Sort by value descending
  const sortedSets = Object.entries(setValues)
    .map(([name, data]) => ({
      name,
      value: data.value,
      percent: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);
  
  const top3 = sortedSets.slice(0, 3);
  const top3Value = top3.reduce((sum, s) => sum + s.value, 0);
  
  return {
    topSetPercent: sortedSets[0]?.percent || 0,
    topSetName: sortedSets[0]?.name || 'N/A',
    top3SetsPercent: totalValue > 0 ? (top3Value / totalValue) * 100 : 0,
    top3SetsNames: top3.map(s => s.name),
    setBreakdown: sortedSets,
  };
}
