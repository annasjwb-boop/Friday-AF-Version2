import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, Plus } from "lucide-react";
import type { AssetCategory, AssetItem } from "../../types";
import { assetCategoryTotal, assetLibraryTotals } from "../../data/finance";
import { formatMoney } from "../../data/recovery";
import "./AssetLibrarySheet.css";

type AssetLibrarySheetProps = {
  open: boolean;
  categories: AssetCategory[];
  /** Full-contents replacement estimate the documented total is tracked against. */
  estimate: number;
  /** Dark instrument panel (ledger) or light editorial paper (4.B). */
  appearance?: "dark" | "light";
  onAddItem: (categoryId: string, item: AssetItem) => void;
  onClose: () => void;
};

const OPEN_DURATION = 300;

/**
 * Drill-in from the ledger's asset library card: documented belongings with
 * estimated replacement costs, grouped by category, with a lightweight
 * add-item flow. Values are estimates for documentation — everything here
 * pre-fills insurance claims and aid applications after a disaster.
 */
export function AssetLibrarySheet({
  open,
  categories,
  estimate,
  appearance = "dark",
  onAddItem,
  onClose,
}: AssetLibrarySheetProps) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftValue, setDraftValue] = useState("");

  // Mount for the enter transition; keep mounted through the exit transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    setAddingId(null);
    const timer = window.setTimeout(() => setMounted(false), OPEN_DURATION);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const totals = assetLibraryTotals(categories);
  const pct = Math.min(Math.round((totals.value / estimate) * 100), 100);

  const toggleCategory = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
    setAddingId(null);
  };

  const startAdding = (id: string) => {
    setAddingId(id);
    setDraftName("");
    setDraftValue("");
  };

  const submitItem = (event: FormEvent, categoryId: string) => {
    event.preventDefault();
    const name = draftName.trim();
    const value = Math.round(Number(draftValue));
    if (!name || !Number.isFinite(value) || value <= 0) return;
    onAddItem(categoryId, {
      id: `${categoryId}-${Date.now()}`,
      name,
      value,
    });
    setAddingId(null);
  };

  const target = document.getElementById("app-device") ?? document.body;

  return createPortal(
    <div
      className={`asset-sheet${appearance === "light" ? " asset-sheet--light" : ""}${entered ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Asset library"
    >
      <header className="asset-sheet__header">
        <button
          type="button"
          className="asset-sheet__back"
          onClick={onClose}
          aria-label="Go back"
        >
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="asset-sheet__heading">Asset library</p>
      </header>

      <div className="asset-sheet__scroll">
        <section className="asset-sheet__summary">
          <p className="asset-sheet__label">Documented value</p>
          <p className="asset-sheet__figure">{formatMoney(totals.value)}</p>
          <div className="asset-sheet__progress" aria-hidden="true">
            <span
              className="asset-sheet__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="asset-sheet__meta">
            {totals.items} items · {pct}% of {formatMoney(estimate)} estimate
          </p>
          <p className="asset-sheet__note">
            Values are estimates for documentation. Everything here pre-fills
            insurance claims and aid applications after a disaster — you tell
            your story once.
          </p>
        </section>

        <ul className="asset-sheet__categories">
          {categories.map((category) => {
            const expanded = expandedId === category.id;
            const adding = addingId === category.id;
            return (
              <li key={category.id} className="asset-sheet__category">
                <button
                  type="button"
                  className="asset-sheet__category-row"
                  aria-expanded={expanded}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="asset-sheet__category-name">
                    {category.label}
                    <span className="asset-sheet__category-count">
                      {category.items.length}{" "}
                      {category.items.length === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <span className="asset-sheet__category-total">
                    {formatMoney(assetCategoryTotal(category))}
                  </span>
                  <ChevronDown
                    className={`asset-sheet__category-chevron${expanded ? " is-open" : ""}`}
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className="asset-sheet__items">
                    {category.items.map((item) => (
                      <div key={item.id} className="asset-sheet__item">
                        <span className="asset-sheet__item-name">
                          {item.name}
                        </span>
                        <span className="asset-sheet__item-value">
                          {formatMoney(item.value)}
                        </span>
                      </div>
                    ))}

                    {adding ? (
                      <form
                        className="asset-sheet__form"
                        onSubmit={(event) => submitItem(event, category.id)}
                      >
                        <input
                          className="asset-sheet__input"
                          type="text"
                          placeholder="Item name"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          // The form appears on tap; focus moves with intent.
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                        />
                        <input
                          className="asset-sheet__input asset-sheet__input--value"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          placeholder="Est. $"
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                        />
                        <button type="submit" className="asset-sheet__save">
                          Add
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="asset-sheet__add"
                        onClick={() => startAdding(category.id)}
                      >
                        <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
                        Add item
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    target,
  );
}
