import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
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
  EraAllocationBreakdown,
} from '@/lib/types';
import { processPortfolioData, ColumnMapping } from '@/lib/dataParser';
import {
  calculatePortfolioSummary,
  calculateAllocationBreakdown,
  calculateConcentrationRisk,
  findProfitMilestones,
  generateInsights,
} from '@/lib/portfolioCalculations';
import { 
  calculateEraAllocationBreakdown, 
  calculateEraHealthScore, 
  calculateConcentrationHealthScore,
  calculateSetConcentration
} from '@/lib/eraClassification';
import { supabase } from '@/integrations/supabase/client';

// Health score breakdown by dimension
export interface HealthScoreBreakdown {
  overall: number;
  assetScore: number;    // 45% weight
  eraScore: number;      // 35% weight
  concentrationScore: number; // 20% weight
}

interface PortfolioContextType {
  // Data
  items: PortfolioItem[];
  validation: ValidationResult | null;
  detectedColumns: ColumnMapping | null;
  isDataLoaded: boolean;

  // Metrics
  summary: PortfolioSummary | null;
  allocation: AllocationBreakdown | null;
  eraAllocation: EraAllocationBreakdown | null;
  concentration: ConcentrationRisk | null;
  healthScoreBreakdown: HealthScoreBreakdown | null;
  setConcentration: {
    topSetPercent: number;
    topSetName: string;
    top3SetsPercent: number;
    top3SetsNames: string[];
    setBreakdown: { name: string; value: number; percent: number; count: number }[];
  } | null;
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
  const [detectedColumns, setDetectedColumns] = useState<ColumnMapping | null>(null);
  const [allocationPreset, setAllocationPresetState] = useState<AllocationPreset>('balanced');
  const [customTarget, setCustomTargetState] = useState<AllocationTarget>(ALLOCATION_PRESETS.custom);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize anonymous authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSessionId(session.user.id);
        } else {
          // Sign in anonymously if no session exists
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous auth failed:', error);
          } else if (data.user) {
            setSessionId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setAuthInitialized(true);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSessionId(session.user.id);
      } else {
        setSessionId(null);
      }
    });

    initAuth();

    return () => subscription.unsubscribe();
  }, []);

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

  const eraAllocation = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculateEraAllocationBreakdown(items);
  }, [items, isDataLoaded]);

  const concentration = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculateConcentrationRisk(items);
  }, [items, isDataLoaded]);

  const setConcentrationData = useMemo(() => {
    if (!isDataLoaded) return null;
    return calculateSetConcentration(items);
  }, [items, isDataLoaded]);

  // Multi-dimensional health score: Asset 45%, Era 35%, Concentration 20%
  const healthScoreBreakdown = useMemo((): HealthScoreBreakdown | null => {
    if (!isDataLoaded || !allocation || !eraAllocation || !setConcentrationData) return null;
    
    // Asset health score - based on deviation from balanced target
    const assetTarget = { sealed: 50, slabs: 30, rawCards: 20 }; // balanced
    let assetScore = 100;
    assetScore -= Math.abs(allocation.sealed.percent - assetTarget.sealed) * 1.5;
    assetScore -= Math.abs(allocation.slabs.percent - assetTarget.slabs) * 1.5;
    assetScore -= Math.abs(allocation.rawCards.percent - assetTarget.rawCards) * 1.5;
    assetScore = Math.max(0, Math.min(100, assetScore));
    
    // Era health score
    const eraScore = calculateEraHealthScore(eraAllocation);
    
    // Concentration health score
    const concentrationScore = calculateConcentrationHealthScore(
      setConcentrationData.topSetPercent,
      setConcentrationData.top3SetsPercent
    );
    
    // Weighted overall score
    const overall = Math.round(
      assetScore * 0.45 + 
      eraScore * 0.35 + 
      concentrationScore * 0.20
    );
    
    return {
      overall,
      assetScore: Math.round(assetScore),
      eraScore,
      concentrationScore,
    };
  }, [isDataLoaded, allocation, eraAllocation, setConcentrationData]);

  const milestones = useMemo(() => {
    if (!isDataLoaded) return [];
    return findProfitMilestones(items);
  }, [items, isDataLoaded]);

  const insights = useMemo(() => {
    if (!isDataLoaded || !summary || !concentration || !allocation) return [];
    const allInsights = generateInsights(items, summary, concentration, milestones, allocation, allocationTarget);
    return allInsights.filter(insight => !dismissedInsights.has(insight.id));
  }, [items, isDataLoaded, summary, concentration, milestones, allocation, allocationTarget, dismissedInsights]);

  // Save portfolio data to backend when items change
  useEffect(() => {
    const saveToBackend = async () => {
      // Wait for auth to initialize and ensure we have a session
      if (items.length === 0 || !sessionId || !authInitialized) return;
      
      try {
        const portfolioData = {
          session_id: sessionId,
          raw_csv: '', // We'll store just the parsed data
          items: JSON.parse(JSON.stringify(items)),
          summary: summary ? JSON.parse(JSON.stringify(summary)) : null,
          allocation: allocation ? JSON.parse(JSON.stringify(allocation)) : null,
        };
        
        const { error } = await supabase.from('portfolios').insert(portfolioData);
        if (error) {
          console.error('Failed to save portfolio to backend:', error);
        }
      } catch (error) {
        console.error('Failed to save portfolio to backend:', error);
      }
    };
    
    saveToBackend();
  }, [items, sessionId, authInitialized, summary, allocation]);

  const uploadData = useCallback((csvContent: string) => {
    const result = processPortfolioData(csvContent);
    setItems(result.items);
    setValidation(result.validation);
    setDetectedColumns(result.detectedColumns);
    setDismissedInsights(new Set());
  }, []);

  const clearData = useCallback(() => {
    setItems([]);
    setValidation(null);
    setDetectedColumns(null);
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
    detectedColumns,
    isDataLoaded,
    summary,
    allocation,
    eraAllocation,
    concentration,
    healthScoreBreakdown,
    setConcentration: setConcentrationData,
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
