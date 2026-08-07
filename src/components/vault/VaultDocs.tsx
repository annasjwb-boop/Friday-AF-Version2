import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  CreditCard,
  FileText,
  Landmark,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { VaultDocument } from "../../data/vault";
import "./VaultDocs.css";

const DOC_ICONS: Record<string, LucideIcon> = {
  deed: Landmark,
  policy: ShieldCheck,
  mortgage: FileText,
  id: CreditCard,
  utility: Zap,
  appraisal: FileText,
};

type VaultDocsSheetProps = {
  documents: VaultDocument[];
  onUpload: (doc: VaultDocument) => void;
  onClose: () => void;
};

/** Full-screen document list — the detail the home screen keeps collapsed. */
export function VaultDocsSheet({
  documents,
  onUpload,
  onClose,
}: VaultDocsSheetProps) {
  const verified = documents.filter((d) => d.status === "verified").length;
  const host = document.getElementById("app-viewport");

  const sheet = (
    <motion.div
      className="vault-docs-sheet"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="vault-docs-sheet__head">
        <button
          type="button"
          className="vault-docs-sheet__back"
          aria-label="Back"
          onClick={onClose}
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div className="vault-docs-sheet__heading">
          <h1 className="vault-docs-sheet__title">Documents</h1>
          <span className="vault-docs-sheet__sub">
            {verified} of {documents.length} on file
          </span>
        </div>
        <span className="vault-docs-sheet__spacer" aria-hidden="true" />
      </header>

      <div className="vault-docs-sheet__scroll">
        <p className="vault-docs-sheet__lede">
          These pre-fill applications and back up claims, so you never hunt
          for paperwork after a disaster.
        </p>
        <ul className="vault-docs">
          {documents.map((doc) => {
            const Icon = DOC_ICONS[doc.id] ?? FileText;
            return (
              <li key={doc.id} className="vault-doc">
                <span
                  className={`vault-doc__icon is-${doc.status}`}
                  aria-hidden="true"
                >
                  <Icon size={15} strokeWidth={2} />
                </span>
                <div className="vault-doc__body">
                  <span className="vault-doc__name">{doc.name}</span>
                  <span className="vault-doc__meta">
                    {doc.meta ?? doc.why}
                  </span>
                </div>
                {doc.status === "verified" ? (
                  <span className="vault-doc__chip is-verified">
                    <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                    Verified
                  </span>
                ) : doc.status === "pending" ? (
                  <span className="vault-doc__chip is-pending">Verifying…</span>
                ) : (
                  <button
                    type="button"
                    className="vault-doc__add"
                    onClick={() => onUpload(doc)}
                  >
                    Add
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );

  return host ? createPortal(sheet, host) : sheet;
}
