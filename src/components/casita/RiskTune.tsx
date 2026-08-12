import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import {
  SEVERITY_LABELS,
  perilPoints,
  totalScore,
  type RiskPeril,
} from "../../data/risks";
import {
  PERIL_FIELDS,
  suggestSeverity,
  type FieldValue,
  type PerilField,
} from "../../data/perilFields";
import "./RiskTune.css";

/* ---------------------------------------------------------------------------
 * Risk tuning — same notion as the recovery view's Tune: a full-screen sheet
 * where the user corrects the model rather than accepting it.
 *
 * The point is that we are guessing from public data. Someone who has watched
 * their street flood twice knows more than the flood map does, and someone on
 * high ground knows the map is being pessimistic. Both need a way to say so,
 * and the score has to move when they do — otherwise the edit is theatre.
 *
 * Covered perils stay in the list but can't be scored up, because a covered
 * peril contributes nothing to the gap no matter how likely it is. That's the
 * distinction the whole screen rests on.
 * ------------------------------------------------------------------------- */

export function RiskTune({
  perils,
  fields,
  onChange,
  onFields,
  onClose,
}: {
  perils: RiskPeril[];
  /** Per-peril physical figures, lifted so edits survive closing the sheet. */
  fields: Record<string, Record<string, FieldValue>>;
  onChange: (next: RiskPeril[]) => void;
  onFields: (next: Record<string, Record<string, FieldValue>>) => void;
  onClose: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const score = totalScore(perils);

  const setSeverity = (id: string, severity: number) =>
    onChange(perils.map((p) => (p.id === id ? { ...p, severity } : p)));

  /**
   * Editing a figure re-derives the severity from it.
   *
   * The severity is a reading of these facts, so leaving it behind when the
   * facts change would make the panel disagree with itself — a limestone depth
   * of 250ft sitting under a severity of High. The chips above stay available
   * as an override, and the next field edit re-derives over them.
   */
  const setField = (perilId: string, fieldId: string, value: FieldValue) => {
    const nextValues = { ...fields[perilId], [fieldId]: value };
    onFields({ ...fields, [perilId]: nextValues });

    const peril = perils.find((p) => p.id === perilId);
    if (!peril || peril.status === "covered") return;

    const suggested = suggestSeverity(perilId, nextValues);
    if (suggested !== null && suggested !== peril.severity) {
      setSeverity(perilId, suggested);
    }
  };

  /* Every other sheet in the app mounts into #app-viewport, which is the phone
     frame. Portaling to document.body instead made `position: absolute` resolve
     against the page, so the sheet escaped the device on desktop. */
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="risk-tune"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="risk-tune__top">
        <div>
          <h2 className="risk-tune__title">Tune your risks</h2>
          <p className="risk-tune__sub">
            We estimate these from public data. Correct anything you know
            better.
          </p>
        </div>
        <button
          type="button"
          className="risk-tune__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="risk-tune__score">
        <span>Risk score</span>
        <motion.b key={score} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
          {score}
        </motion.b>
        <span className="risk-tune__of">of 100</span>
      </div>

      <div className="risk-tune__list">
        {perils.map((p) => {
          const covered = p.status === "covered";
            const defs = PERIL_FIELDS[p.id] ?? [];
            const vals = fields[p.id] ?? {};
            const open = openId === p.id;
            const suggested = suggestSeverity(p.id, vals);

            return (
            <section className="risk-tune__row" key={p.id}>
              <div className="risk-tune__rowhead">
                <p className="risk-tune__name">{p.name}</p>
                {covered ? (
                  <span className="risk-tune__pts risk-tune__pts--none">
                    Covered
                  </span>
                ) : (
                  <span className="risk-tune__pts">+{perilPoints(p)}</span>
                )}
              </div>

              <div
                className="risk-tune__steps"
                role="radiogroup"
                aria-label={`${p.name} severity`}
              >
                {SEVERITY_LABELS.map((label, n) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={p.severity === n}
                    disabled={covered}
                    className={`risk-tune__step${p.severity === n ? " is-on" : ""}`}
                    onClick={() => setSeverity(p.id, n)}
                  >
                    {n === 0 ? "None" : label}
                  </button>
                ))}
              </div>

              {covered && (
                <p className="risk-tune__locked">
                  Covered by your policy, so it adds nothing to your score
                  however likely it is.
                </p>
              )}

              {defs.length > 0 && (
                <>
                  <button
                    type="button"
                    className="risk-tune__more"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : p.id)}
                  >
                    {open ? "Hide details" : "What we assumed"}
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className={open ? "is-open" : undefined}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        className="risk-tune__detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <div className="risk-tune__fields">
                          {defs.map((f) => (
                            <Field
                              key={f.id}
                              def={f}
                              value={vals[f.id] ?? f.default}
                              onChange={(v: FieldValue) =>
                                setField(p.id, f.id, v)
                              }
                            />
                          ))}

                          {!covered && suggested !== null && (
                            <p className="risk-tune__derived">
                              These figures read as{" "}
                              <b>{SEVERITY_LABELS[suggested]}</b>
                              {suggested === p.severity ? (
                                <em>· {perilPoints(p)} points</em>
                              ) : (
                                <em>· set above to {SEVERITY_LABELS[p.severity]}</em>
                              )}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </section>
          );
        })}
      </div>

      <footer className="risk-tune__foot">
        <p className="risk-tune__note">
          Changes here only affect your score. Nothing is sent to an insurer.
        </p>
        <button type="button" className="risk-tune__done" onClick={onClose}>
          Done
        </button>
      </footer>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}

/* ---------------------------------------------------------------------------
 * One editable figure. Sliders rather than text inputs for the numbers: this
 * is someone adjusting an estimate on a phone, not entering a known value, and
 * a slider makes the plausible range visible while they do it.
 * ------------------------------------------------------------------------- */

function fmt(def: PerilField, v: FieldValue): string {
  if (def.unit === "$") return `$${Number(v).toLocaleString()}`;
  return `${v}${def.unit ? `\u2009${def.unit}` : ""}`;
}

function Field({
  def,
  value,
  onChange,
}: {
  def: PerilField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}) {
  return (
    <div className="rt-field">
      <div className="rt-field__head">
        <span className="rt-field__label">{def.label}</span>
        {def.kind === "number" && (
          <span className="rt-field__val">{fmt(def, value)}</span>
        )}
      </div>

      {def.kind === "number" && (
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={Number(value)}
          aria-label={def.label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}

      {def.kind === "toggle" && (
        <div className="rt-field__toggle">
          {[true, false].map((b) => (
            <button
              key={String(b)}
              type="button"
              aria-pressed={value === b}
              className={value === b ? "is-on" : undefined}
              onClick={() => onChange(b)}
            >
              {b ? "Yes" : "No"}
            </button>
          ))}
        </div>
      )}

      {def.kind === "multi" && (
        <div className="rt-field__toggle rt-field__toggle--multi">
          {(def.options ?? []).map((o) => {
            const list = Array.isArray(value) ? value : [];
            const on = list.includes(o);
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                className={on ? "is-on" : undefined}
                onClick={() =>
                  onChange(
                    on ? list.filter((x) => x !== o) : [...list, o],
                  )
                }
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {def.kind === "choice" && (
        <div className="rt-field__toggle">
          {(def.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={value === o}
              className={value === o ? "is-on" : undefined}
              onClick={() => onChange(o)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {def.note && <p className="rt-field__note">{def.note}</p>}
    </div>
  );
}
