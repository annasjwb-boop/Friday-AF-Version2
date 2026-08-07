import "./LedgerBackground.css";

/**
 * "Recovery Ledger" backdrop: a cool graphite-black field with a faint cold
 * glow high on the screen and a whisper of grain — a quiet instrument-panel
 * surface for the financial overview, colder and darker than the dusk grain.
 */
export function LedgerBackground() {
  return (
    <div className="ledger-bg" aria-hidden="true">
      <div className="ledger-bg__mesh" />
      <div className="ledger-bg__grain" />
    </div>
  );
}
