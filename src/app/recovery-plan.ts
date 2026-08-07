import { createContext, useContext } from "react";
import type { RecoveryScenario, SupportCategory } from "../types";

/** Dollar totals per funding source, in the order the overview lists them. */
export type FundingBreakdown = {
  insurance: number;
  personal: number;
  categories: Record<SupportCategory, number>;
  funded: number;
  total: number;
  gap: number;
};

export type RecoveryPlanContextValue = {
  scenario: RecoveryScenario | null;
  supportSelections: string[];
  resourceAmounts: Record<string, number>;
  breakdown: FundingBreakdown | null;
  setScenario: (scenario: RecoveryScenario) => void;
  resetPlan: () => void;
  toggleSupport: (id: string) => void;
  setResourceAmount: (id: string, amount: number) => void;
};

export const RecoveryPlanContext =
  createContext<RecoveryPlanContextValue | null>(null);

export function useRecoveryPlan(): RecoveryPlanContextValue {
  const context = useContext(RecoveryPlanContext);
  if (!context) {
    throw new Error("useRecoveryPlan must be used within RecoveryPlanProvider");
  }
  return context;
}
