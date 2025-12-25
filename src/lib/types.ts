export interface RawPortfolioItem {
  productName: string;
  category: string;
  quantity: string | number;
  marketPrice: string | number;
  averageCostPaid: string | number;
  grade: string;
  cardNumber: string;
  dateAdded: string;
}

export interface PortfolioItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  marketPrice: number;
  averageCostPaid: number;
  grade: string;
  cardNumber: string;
  dateAdded: Date | null;
  // Computed fields
  totalMarketValue: number;
  totalCostBasis: number;
  profitDollars: number;
  gainPercent: number;
  portfolioWeightPercent: number;
  // Classification
  assetType: 'Slab' | 'Raw Card' | 'Sealed';
  liquidityTier: 'High' | 'Medium' | 'Low';
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  holdingsInProfitCount: number;
  holdingsInProfitPercent: number;
  totalHoldings: number;
}

export interface AllocationBreakdown {
  sealed: { value: number; percent: number; count: number };
  slabs: { value: number; percent: number; count: number };
  rawCards: { value: number; percent: number; count: number };
}

export interface AllocationTarget {
  sealed: number;
  slabs: number;
  rawCards: number;
}

export interface ConcentrationRisk {
  top1Percent: number;
  top1Name: string;
  top3Percent: number;
  top3Names: string[];
  top5Percent: number;
  top5Names: string[];
  topSetPercent: number;
  topSetName: string;
}

export interface ProfitMilestone {
  item: PortfolioItem;
  milestone: 200 | 300 | 500;
  sellHalfProfit: number;
  sellHalfUnitsRemaining: number;
}

export interface Insight {
  id: string;
  type: 'profit' | 'concentration' | 'rebalance' | 'patience' | 'allocation';
  priority: 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export interface RebalanceSuggestion {
  category: 'sealed' | 'slabs' | 'rawCards';
  action: 'sell' | 'buy' | 'redirect';
  amount: number;
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type AllocationPreset = 'conservative' | 'balanced' | 'aggressive' | 'custom';

export const ALLOCATION_PRESETS: Record<AllocationPreset, AllocationTarget> = {
  conservative: { sealed: 40, slabs: 40, rawCards: 20 },
  balanced: { sealed: 50, slabs: 30, rawCards: 20 },
  aggressive: { sealed: 70, slabs: 20, rawCards: 10 },
  custom: { sealed: 33, slabs: 34, rawCards: 33 },
};
