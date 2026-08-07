import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronRight,
  FileText,
  FileUp,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import { docPhrase, type VaultDocument } from "../../data/vault";
import "./VaultUpload.css";

type Stage = "source" | "uploading" | "verifying" | "done";

const AI_CHECKS = [
  "Legible and complete",
  "Name matches Jarad Bell",
  "Address matches 123 Prado Rd NE",
];

const SOURCES = [
  { id: "camera", icon: Camera, label: "Take a photo" },
  { id: "file", icon: FileUp, label: "Choose a file" },
  { id: "scan", icon: ScanLine, label: "Scan with camera" },
];

type VaultUploadProps = {
  doc: VaultDocument;
  onVerified: (id: string) => void;
  onClose: () => void;
};

/**
 * Document upload as a bottom sheet: pick a source, watch the file land,
 * then the AI reads it and confirms it matches your profile — no forms.
 */
export function VaultUpload({ doc, onVerified, onClose }: VaultUploadProps) {
  const [stage, setStage] = useState<Stage>("source");
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState(0);

  /* Simulated upload: progress fills, then the AI reads the document. */
  useEffect(() => {
    if (stage !== "uploading") return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return p;
        return Math.min(p + 9 + Math.random() * 10, 100);
      });
    }, 110);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "uploading" || progress < 100) return;
    const id = setTimeout(() => setStage("verifying"), 350);
    return () => clearTimeout(id);
  }, [stage, progress]);

  useEffect(() => {
    if (stage !== "verifying") return;
    if (checks >= AI_CHECKS.length) {
      const id = setTimeout(() => setStage("done"), 500);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setChecks((c) => c + 1), 750);
    return () => clearTimeout(id);
  }, [stage, checks]);

  useEffect(() => {
    if (stage !== "done") return;
    const id = setTimeout(() => onVerified(doc.id), 1200);
    return () => clearTimeout(id);
  }, [stage, doc.id, onVerified]);

  const fileName = `${doc.id}-front.jpg`;
  const host = document.getElementById("app-viewport");

  const overlay = (
    <motion.div
      className="vault-upload"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        className="vault-upload__scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        className="vault-upload__sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <span className="vault-upload__grabber" aria-hidden="true" />
        <button
          type="button"
          className="vault-upload__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={15} strokeWidth={2.2} />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {stage === "source" && (
            <motion.div
              key="source"
              className="vault-upload__body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <h1 className="vault-upload__title">
                Add your {docPhrase(doc.name)}
              </h1>
              <p className="vault-upload__lede">{doc.why}.</p>
              <div className="vault-upload__options">
                {SOURCES.map((source) => {
                  const Icon = source.icon;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className="vault-upload__option"
                      onClick={() => setStage("uploading")}
                    >
                      <span
                        className="vault-upload__option-icon"
                        aria-hidden="true"
                      >
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      {source.label}
                      <ChevronRight
                        size={15}
                        strokeWidth={2}
                        className="vault-upload__option-chev"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
              <p className="vault-upload__note">
                Encrypted and stored only in your vault.
              </p>
            </motion.div>
          )}

          {stage === "uploading" && (
            <motion.div
              key="uploading"
              className="vault-upload__body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <h1 className="vault-upload__title">Uploading</h1>
              <div className="vault-upload__file">
                <span className="vault-upload__file-icon" aria-hidden="true">
                  <FileText size={17} strokeWidth={1.9} />
                </span>
                <div className="vault-upload__file-body">
                  <span className="vault-upload__file-name">{fileName}</span>
                  <span className="vault-upload__file-meta">
                    2.1 MB · {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="vault-upload__bar" aria-hidden="true">
                <i style={{ width: `${progress}%` }} />
              </div>
            </motion.div>
          )}

          {stage === "verifying" && (
            <motion.div
              key="verifying"
              className="vault-upload__body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <h1 className="vault-upload__title">
                <Sparkles
                  size={16}
                  strokeWidth={2}
                  className="vault-upload__spark"
                  aria-hidden="true"
                />
                Reading your document
              </h1>
              <ul className="vault-upload__checks">
                {AI_CHECKS.map((check, i) => (
                  <motion.li
                    key={check}
                    className={i < checks ? "is-done" : undefined}
                    initial={false}
                    animate={{ opacity: i <= checks ? 1 : 0.35 }}
                  >
                    <span
                      className="vault-upload__check-mark"
                      aria-hidden="true"
                    >
                      {i < checks && <Check size={11} strokeWidth={2.8} />}
                    </span>
                    {check}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              key="done"
              className="vault-upload__body vault-upload__body--done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <span className="vault-upload__done-check" aria-hidden="true">
                <Check size={20} strokeWidth={2.4} />
              </span>
              <h1 className="vault-upload__title">Verified and on file</h1>
              <p className="vault-upload__lede">
                Your {docPhrase(doc.name)} will pre-fill every application
                that needs it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  return host ? createPortal(overlay, host) : overlay;
}
