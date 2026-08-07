import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  CreditCard,
  Heart,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PersonalResourceOption } from "../types";
import { useRecoveryPlan } from "../app/recovery-plan";
import { RecoveryHeader } from "../components/recovery/RecoveryHeader";
import { FundingSummary } from "../components/recovery/FundingSummary";
import { RecoverySheet } from "../components/recovery/RecoverySheet";
import { formatMoney, personalResourceOptions } from "../data/recovery";
import "./RecoveryOverviewScreen.css";
import "./PersonalResourcesScreen.css";

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  savings: Wallet,
  "emergency-fund": PiggyBank,
  investments: TrendingUp,
  family: Heart,
  credit: CreditCard,
  retirement: Coins,
};

export function PersonalResourcesScreen() {
  const navigate = useNavigate();
  const { scenario, breakdown, resourceAmounts, setResourceAmount } =
    useRecoveryPlan();
  const [editing, setEditing] = useState<PersonalResourceOption | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scenario) navigate("/recovery/setup", { replace: true });
  }, [scenario, navigate]);

  useEffect(() => {
    if (sheetOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [sheetOpen]);

  if (!scenario || !breakdown) return null;

  const openSheet = (resource: PersonalResourceOption) => {
    const existing = resourceAmounts[resource.id];
    setDraft(existing ? String(existing) : "");
    setEditing(resource);
    setSheetOpen(true);
  };

  const commit = () => {
    if (!editing) return;
    setResourceAmount(editing.id, Number(draft) || 0);
    setSheetOpen(false);
  };

  const onDraftChange = (value: string) => {
    setDraft(value.replace(/[^0-9]/g, "").slice(0, 9));
  };

  const editingExisting = editing ? resourceAmounts[editing.id] > 0 : false;
  const draftDisplay = draft ? Number(draft).toLocaleString("en-US") : "";

  return (
    <div className="recovery-screen personal-resources">
      <RecoveryHeader title="Personal resources" />

      <FundingSummary breakdown={breakdown} />

      <h2 className="personal-resources__heading">Potential resources</h2>

      <div className="personal-resources__list">
        {personalResourceOptions.map((resource) => {
          const Icon = RESOURCE_ICONS[resource.id];
          const amount = resourceAmounts[resource.id];
          const added = amount > 0;
          return (
            <button
              key={resource.id}
              type="button"
              className="resource-row"
              onClick={() => openSheet(resource)}
            >
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
              <span className="resource-row__copy">
                <span className="resource-row__name">{resource.name}</span>
                {added ? (
                  <span className="resource-row__amount">
                    {formatMoney(amount)}
                  </span>
                ) : (
                  <span className="resource-row__desc">
                    {resource.description}
                  </span>
                )}
              </span>
              {added ? (
                <span className="resource-row__edit">Edit</span>
              ) : (
                <Plus
                  className="resource-row__plus"
                  size={24}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <RecoverySheet
        open={sheetOpen}
        label={editing ? `Amount from ${editing.name}` : "Resource amount"}
        onClose={() => setSheetOpen(false)}
      >
        {editing && (
          <form
            className="resource-sheet"
            onSubmit={(event) => {
              event.preventDefault();
              commit();
            }}
          >
            <h2 className="resource-sheet__title">
              How much would you count on from {editing.name.toLowerCase()}?
            </h2>

            <label className="resource-sheet__field">
              <span className="resource-sheet__currency" aria-hidden="true">
                $
              </span>
              <input
                ref={inputRef}
                className="resource-sheet__input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Amount in dollars"
                placeholder="0"
                value={draftDisplay}
                onChange={(event) => onDraftChange(event.target.value)}
              />
            </label>

            <button type="submit" className="recovery-pill recovery-pill--dark">
              {editingExisting
                ? Number(draft) > 0
                  ? "Update plan"
                  : "Remove from plan"
                : "Add to plan"}
            </button>
          </form>
        )}
      </RecoverySheet>
    </div>
  );
}
