import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RecoveryScenario, SupportCategory } from "../types";
import {
  insuranceEstimate,
  scenarioCosts,
  supportOptions,
} from "../data/recovery";
import { RecoveryPlanContext, type FundingBreakdown } from "./recovery-plan";

const STORAGE_KEY = "aidfinder.recovery-plan.v1";

type PersistedState = {
  scenario: RecoveryScenario | null;
  supportSelections: string[];
  resourceAmounts: Record<string, number>;
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // Corrupt or unavailable storage falls back to the empty state.
  }
  return { scenario: null, supportSelections: [], resourceAmounts: {} };
}

export function RecoveryPlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadPersisted);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistence is best-effort in the prototype.
    }
  }, [state]);

  const setScenario = useCallback((scenario: RecoveryScenario) => {
    setState((current) => ({ ...current, scenario }));
  }, []);

  const resetPlan = useCallback(() => {
    setState({ scenario: null, supportSelections: [], resourceAmounts: {} });
  }, []);

  const toggleSupport = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      supportSelections: current.supportSelections.includes(id)
        ? current.supportSelections.filter((s) => s !== id)
        : [...current.supportSelections, id],
    }));
  }, []);

  const setResourceAmount = useCallback((id: string, amount: number) => {
    setState((current) => {
      const next = { ...current.resourceAmounts };
      if (amount > 0) next[id] = amount;
      else delete next[id];
      return { ...current, resourceAmounts: next };
    });
  }, []);

  const breakdown = useMemo<FundingBreakdown | null>(() => {
    if (!state.scenario) return null;

    const costs = scenarioCosts(state.scenario);
    const insurance = insuranceEstimate(state.scenario);

    const categories: Record<SupportCategory, number> = {
      "cash-grants": 0,
      loans: 0,
      services: 0,
      "tax-relief": 0,
    };
    for (const id of state.supportSelections) {
      const option = supportOptions.find((o) => o.id === id);
      if (option) categories[option.category] += option.estimatedAmount;
    }

    const personal = Object.values(state.resourceAmounts).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    const funded = Math.min(
      insurance +
        personal +
        categories["cash-grants"] +
        categories.loans +
        categories.services +
        categories["tax-relief"],
      costs.total,
    );

    return {
      insurance,
      personal,
      categories,
      funded,
      total: costs.total,
      gap: Math.max(0, costs.total - funded),
    };
  }, [state]);

  const value = useMemo(
    () => ({
      scenario: state.scenario,
      supportSelections: state.supportSelections,
      resourceAmounts: state.resourceAmounts,
      breakdown,
      setScenario,
      resetPlan,
      toggleSupport,
      setResourceAmount,
    }),
    [state, breakdown, setScenario, resetPlan, toggleSupport, setResourceAmount],
  );

  return (
    <RecoveryPlanContext.Provider value={value}>
      {children}
    </RecoveryPlanContext.Provider>
  );
}
