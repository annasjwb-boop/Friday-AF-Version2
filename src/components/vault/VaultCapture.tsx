import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Play, X } from "lucide-react";
import "./VaultCapture.css";

type Mode = "photo" | "video";

type VaultCaptureProps = {
  roomName: string;
  onDone: (photos: number, videos: number) => void;
  onClose: () => void;
};

/**
 * Simulated camera for room evidence: a viewfinder with frame guides, a
 * photo/video mode switch, and a shutter that fills a capture strip.
 */
export function VaultCapture({ roomName, onDone, onClose }: VaultCaptureProps) {
  const [mode, setMode] = useState<Mode>("photo");
  const [photos, setPhotos] = useState(0);
  const [videos, setVideos] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const shutter = () => {
    if (mode === "photo") {
      setPhotos((p) => p + 1);
      setFlash((f) => f + 1);
    } else if (recording) {
      setRecording(false);
      setVideos((v) => v + 1);
      setRecSeconds(0);
    } else {
      setRecording(true);
    }
  };

  const captured = photos + videos;
  const host = document.getElementById("app-viewport");

  const overlay = (
    <motion.div
      className="vault-capture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Shutter flash */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            className="vault-capture__flash"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <header className="vault-capture__top">
        <button
          type="button"
          className="vault-capture__close"
          aria-label="Close camera"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
        <span className="vault-capture__room">{roomName}</span>
        {recording ? (
          <span className="vault-capture__rec">
            <i aria-hidden="true" />
            0:{String(recSeconds).padStart(2, "0")}
          </span>
        ) : (
          <span className="vault-capture__spacer" aria-hidden="true" />
        )}
      </header>

      <div className="vault-capture__finder" aria-hidden="true">
        <span className="vault-capture__corner is-tl" />
        <span className="vault-capture__corner is-tr" />
        <span className="vault-capture__corner is-bl" />
        <span className="vault-capture__corner is-br" />
        <p className="vault-capture__hint">
          {mode === "photo"
            ? "Get the whole room in frame, then close-ups of anything valuable"
            : recording
              ? "Pan slowly — AI pulls stills from your video"
              : "Video is the fastest way to cover a room"}
        </p>
      </div>

      <footer className="vault-capture__bottom">
        <div className="vault-capture__strip">
          <AnimatePresence initial={false}>
            {Array.from({ length: photos }, (_, i) => (
              <motion.span
                key={`p${i}`}
                className="vault-capture__thumb"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <ImageIcon size={12} strokeWidth={1.8} />
              </motion.span>
            ))}
            {Array.from({ length: videos }, (_, i) => (
              <motion.span
                key={`v${i}`}
                className="vault-capture__thumb is-video"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <Play size={11} strokeWidth={2.2} />
              </motion.span>
            ))}
          </AnimatePresence>
          {captured === 0 && (
            <span className="vault-capture__strip-empty">
              Captures land here
            </span>
          )}
        </div>

        <div className="vault-capture__controls">
          <div className="vault-capture__modes" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "photo"}
              className={`vault-capture__mode${mode === "photo" ? " is-active" : ""}`}
              onClick={() => setMode("photo")}
              disabled={recording}
            >
              Photo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              className={`vault-capture__mode${mode === "video" ? " is-active" : ""}`}
              onClick={() => setMode("video")}
            >
              Video
            </button>
          </div>
          <button
            type="button"
            className={`vault-capture__shutter${mode === "video" ? " is-video" : ""}${recording ? " is-recording" : ""}`}
            aria-label={
              mode === "photo"
                ? "Take photo"
                : recording
                  ? "Stop recording"
                  : "Start recording"
            }
            onClick={shutter}
          >
            <i aria-hidden="true" />
          </button>
          <button
            type="button"
            className="vault-capture__done"
            disabled={captured === 0 && !recording}
            onClick={() => onDone(photos, videos)}
          >
            {captured > 0 ? `Done · ${captured}` : "Done"}
          </button>
        </div>
      </footer>
    </motion.div>
  );

  return host ? createPortal(overlay, host) : overlay;
}
