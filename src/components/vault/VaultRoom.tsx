import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Play,
  Plus,
  ReceiptText,
} from "lucide-react";
import { formatValue, type VaultItem, type VaultRoom } from "../../data/vault";
import { VaultCapture } from "./VaultCapture";
import "./VaultRoom.css";

/** Generic items offered when the member taps "Add item". */
const ITEM_POOL: Omit<VaultItem, "id">[] = [
  { name: "Floor lamp", value: 220, photo: false, receipt: false },
  { name: "Bookshelf + books", value: 540, photo: false, receipt: false },
  { name: "Bluetooth speaker", value: 180, photo: false, receipt: false },
  { name: "Ceramic planters", value: 140, photo: false, receipt: false },
];

function itemStatus(item: VaultItem): string {
  if (item.photo && item.receipt) return "Fully documented";
  if (item.photo) return "No receipt yet";
  if (item.receipt) return "No photo yet";
  return "Needs photo and receipt";
}

type VaultRoomSheetProps = {
  room: VaultRoom;
  onChange: (room: VaultRoom) => void;
  onClose: () => void;
};

/**
 * Room detail: photo strip up top, then one calm row per item — value and a
 * quiet status line. Tapping a row reveals just the actions that item still
 * needs.
 */
export function VaultRoomSheet({ room, onChange, onClose }: VaultRoomSheetProps) {
  const [poolIndex, setPoolIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /* Camera target: "room" for the photo strip, or an item id so the shots
     also mark that item as photographed. */
  const [captureFor, setCaptureFor] = useState<string | null>(null);
  /* Item id whose receipt upload is "in flight". */
  const [receiptPending, setReceiptPending] = useState<string | null>(null);

  const total = room.items.reduce((sum, item) => sum + item.value, 0);
  const gaps = room.items.filter((i) => !i.photo || !i.receipt).length;
  const videos = room.videoCount ?? 0;

  const addCaptures = (photos: number, vids: number) => {
    onChange({
      ...room,
      photoCount: room.photoCount + photos,
      videoCount: videos + vids,
      items:
        captureFor && captureFor !== "room" && photos + vids > 0
          ? room.items.map((item) =>
              item.id === captureFor ? { ...item, photo: true } : item,
            )
          : room.items,
    });
    setCaptureFor(null);
  };

  const resolveReceipt = (itemId: string) => {
    setReceiptPending(itemId);
    setTimeout(() => {
      setReceiptPending(null);
      onChange({
        ...room,
        items: room.items.map((item) =>
          item.id === itemId ? { ...item, receipt: true } : item,
        ),
      });
    }, 1100);
  };

  const addItem = () => {
    const next = ITEM_POOL[poolIndex % ITEM_POOL.length];
    setPoolIndex((i) => i + 1);
    const id = `new-${Date.now()}`;
    onChange({
      ...room,
      items: [...room.items, { ...next, id }],
    });
    setExpandedId(id);
  };

  const host = document.getElementById("app-viewport");

  const sheet = (
    <motion.div
      className="vault-sheet"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="vault-sheet__head">
        <button
          type="button"
          className="vault-sheet__back"
          aria-label="Back"
          onClick={onClose}
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div className="vault-sheet__heading">
          <h1 className="vault-sheet__title">{room.name}</h1>
          <span className="vault-sheet__sub">
            {room.items.length} items · {formatValue(total)}
          </span>
        </div>
        <span className="vault-sheet__spacer" aria-hidden="true" />
      </header>

      <div className="vault-sheet__scroll">
        <section aria-label="Photos and video">
          <header className="vault-sheet__section-head">
            <h2 className="vault-sheet__section-title">Photos &amp; video</h2>
            <span className="vault-sheet__section-count">
              {room.photoCount + videos > 0
                ? `${room.photoCount} photos${videos ? ` · ${videos} video${videos === 1 ? "" : "s"}` : ""}`
                : "None yet"}
            </span>
          </header>
          <div className="vault-photos">
            <button
              type="button"
              className="vault-photos__add"
              aria-label="Open camera"
              onClick={() => setCaptureFor("room")}
            >
              <Camera size={18} strokeWidth={1.9} />
            </button>
            {Array.from({ length: videos }, (_, i) => (
              <div
                key={`v${i}`}
                className="vault-photos__tile is-video"
                aria-hidden="true"
              >
                <Play size={15} strokeWidth={2} />
                <span className="vault-photos__badge">0:24</span>
              </div>
            ))}
            {Array.from({ length: room.photoCount }, (_, i) => (
              <div key={i} className="vault-photos__tile" aria-hidden="true">
                <ImageIcon size={16} strokeWidth={1.8} />
                {i === 0 && videos === 0 && (
                  <span className="vault-photos__badge">Main</span>
                )}
              </div>
            ))}
            {room.photoCount + videos === 0 && (
              <div className="vault-photos__empty">
                Start with one shot of the whole room
              </div>
            )}
          </div>
        </section>

        <section aria-label="Items">
          <header className="vault-sheet__section-head">
            <h2 className="vault-sheet__section-title">Items</h2>
            {gaps > 0 && (
              <span className="vault-sheet__section-count">
                {gaps} to finish
              </span>
            )}
          </header>
          <ul className="vault-items">
            {room.items.map((item) => {
              const complete = item.photo && item.receipt;
              const expanded = expandedId === item.id;
              return (
                <li key={item.id} className="vault-item">
                  <button
                    type="button"
                    className="vault-item__row"
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedId(expanded ? null : item.id)
                    }
                  >
                    <span
                      className={`vault-item__dot${complete ? " is-done" : ""}`}
                      aria-hidden="true"
                    >
                      {complete && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span className="vault-item__body">
                      <span className="vault-item__name">{item.name}</span>
                      <span className="vault-item__status">
                        {itemStatus(item)}
                      </span>
                    </span>
                    <span className="vault-item__value">
                      {formatValue(item.value)}
                    </span>
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className={`vault-item__chev${expanded ? " is-open" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && !complete && (
                      <motion.div
                        className="vault-item__actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.32, 0.72, 0, 1],
                        }}
                      >
                        <div className="vault-item__actions-inner">
                          {!item.photo && (
                            <button
                              type="button"
                              className="vault-item__action"
                              onClick={() => setCaptureFor(item.id)}
                            >
                              <Camera
                                size={13}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              Take photo
                            </button>
                          )}
                          {!item.receipt &&
                            (receiptPending === item.id ? (
                              <span className="vault-item__action is-busy">
                                <Loader2
                                  size={13}
                                  strokeWidth={2.2}
                                  className="vault-item__spin"
                                  aria-hidden="true"
                                />
                                Uploading…
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="vault-item__action"
                                onClick={() => resolveReceipt(item.id)}
                              >
                                <ReceiptText
                                  size={13}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                                Add receipt
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
            {room.items.length === 0 && (
              <li className="vault-items__empty">
                Nothing documented here yet. Everything you add becomes proof
                for claims and aid applications.
              </li>
            )}
          </ul>
        </section>
      </div>

      <footer className="vault-sheet__foot">
        <button type="button" className="vault-sheet__cta" onClick={addItem}>
          <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
          Add item
        </button>
      </footer>

      <AnimatePresence>
        {captureFor && (
          <VaultCapture
            roomName={
              captureFor === "room"
                ? room.name
                : (room.items.find((i) => i.id === captureFor)?.name ??
                  room.name)
            }
            onDone={addCaptures}
            onClose={() => setCaptureFor(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return host ? createPortal(sheet, host) : sheet;
}
