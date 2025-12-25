import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  PortfolioItem,
  PortfolioSummary,
  AllocationBreakdown,
  AllocationTarget,
  ConcentrationRisk,
  ProfitMilestone,
  Insight,
  ValidationResult,
  AllocationPreset,
  ALLOCATION_PRESETS,
} from '@/lib/types';
import { processPortfolioData } from '@/lib/dataParser';
import {
  calculatePortfolioSummary,
  calculateAllocationBreakdown,
  calculateConcentrationRisk,
  findProfitMilestones,
  generateInsights,
} from '@/lib/portfolioCalculations';

interface PortfolioContextType {
  // Data
  items: PortfolioItem[];
  validation: ValidationResult | null;
  isDataLoaded: boolean;

  // Metrics
  summary: PortfolioSummary | null;
  allocation: AllocationBreakdown | null;
  concentration: ConcentrationRisk | null;
  milestones: ProfitMilestone[];
  insights: Insight[];

  // Targets
  allocationTarget: AllocationTarget;
  allocationPreset: AllocationPreset;
  setAllocationPreset: (preset: AllocationPreset) => void;
  setCustomTarget: (target: AllocationTarget) => void;

  // Actions
  uploadData: (csvContent: string) => void;
  clearData: () => void;
  dismissInsight: (insightId: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [allocationPreset, setAllocationPresetState] = useState<AllocationPreset>('balanced');
  const [customTarget, setCustomTargetState] = useState<AllocationTarget>(ALLOCATION_PRESETS.custom);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const isDataLoaded = items.length > 0;

  const allocationTarget = useMemo(() => {
    return allocationPreset === 'custom' ? customTarget : ALLOCATION_PRESETS[allocationPreset];
  }, [allocationPreset, customTarget]);

  const summary = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculatePortfolioSummary(items);
  }, [items, isDataLoaded]);

  const allocation = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculateAllocationBreakdown(items);
  }, [items, isDataLoaded]);

  const concentration = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculateConcentrationRisk(items);
  }, [items, isDataLoaded]);

  const milestones = useMemo(() => {
    if (!isDataLoaded) return [];
    return findProfitMilestones(items);
  }, [items, isDataLoaded]);

  const insights = useMemo(() => {
    if (!isDataLoaded || !summary || !concentration || !allocation) return [];
    const allInsights = generateInsights(items, summary, concentration, milestones, allocation, allocationTarget);
    return allInsights.filter(insight => !dismissedInsights.has(insight.id));
  }, [items, isDataLoaded, summary, concentration, milestones, allocation, allocationTarget, dismissedInsights]);

  const uploadData = useCallback((csvContent: string) => {
    const result = processPortfolioData(csvContent);
    setItems(result.items);
    setValidation(result.validation);
    setDismissedInsights(new Set());
  }, []);

  const clearData = useCallback(() => {
    setItems([]);
    setValidation(null);
    setDismissedInsights(new Set());
  }, []);

  const setAllocationPreset = useCallback((preset: AllocationPreset) => {
    setAllocationPresetState(preset);
  }, []);

  const setCustomTarget = useCallback((target: AllocationTarget) => {
    setCustomTargetState(target);
    setAllocationPresetState('custom');
  }, []);

  const dismissInsight = useCallback((insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
  }, []);

  const value: PortfolioContextType = {
    items,
    validation,
    isDataLoaded,
    summary,
    allocation,
    concentration,
    milestones,
    insights,
    allocationTarget,
    allocationPreset,
    setAllocationPreset,
    setCustomTarget,
    uploadData,
    clearData,
    dismissInsight,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
