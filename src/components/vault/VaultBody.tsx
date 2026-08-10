import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BedDouble,
  Boxes,
  ChevronRight,
  CookingPot,
  Laptop,
  Mic,
  Plus,
  Sofa,
  UtensilsCrossed,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  docPhrase,
  formatValue,
  VAULT_DOCUMENTS,
  VAULT_ROOMS,
  type VaultDocument,
  type VaultRoom,
  type WalkthroughBatch,
} from "../../data/vault";
import {
  buildSections,
  readinessPercent,
} from "../../data/vaultSections";
import { VaultSections } from "./VaultSections";
import { VaultDocsSheet } from "./VaultDocs";
import { VaultUpload } from "./VaultUpload";
import { VaultRoomSheet } from "./VaultRoom";
import { VaultWalkthrough } from "./VaultWalkthrough";
import "./VaultHome.css";

const ROOM_ICONS: Record<string, LucideIcon> = {
  living: Sofa,
  kitchen: CookingPot,
  bedroom: BedDouble,
  office: Laptop,
  garage: Warehouse,
  basement: Boxes,
  dining: UtensilsCrossed,
};

function roomValue(room: VaultRoom): number {
  return room.items.reduce((sum, item) => sum + item.value, 0);
}

/**
 * The Readiness Vault content, without any app chrome of its own.
 *
 * Two hosts render this: the standalone "Readiness Vault" variant, which
 * wraps it in its own dark header and sheet, and the Casita Maquette's
 * Readiness tab, which drops it straight into Casita's existing sheet.
 * Keeping the body chrome-free is what lets both share one implementation
 * instead of forking it.
 */
export function VaultBody() {
  const [documents, setDocuments] = useState<VaultDocument[]>(VAULT_DOCUMENTS);
  const [rooms, setRooms] = useState<VaultRoom[]>(VAULT_ROOMS);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  /* Onboarding hands off with ?vault=docs or ?vault=rooms, so the prepare
     flow lands on whichever half of the vault the user said they wanted
     rather than the top of the page. */
  const [params] = useSearchParams();
  const [docsOpen, setDocsOpen] = useState(() => params.get("vault") === "docs");
  const [uploadDoc, setUploadDoc] = useState<VaultDocument | null>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  const totalValue = useMemo(
    () => rooms.reduce((sum, room) => sum + roomValue(room), 0),
    [rooms],
  );
  const totalItems = useMemo(
    () => rooms.reduce((sum, room) => sum + room.items.length, 0),
    [rooms],
  );
  const roomsStarted = rooms.filter((r) => r.items.length > 0).length;

  /* One figure across documents and assets alike, as a plain count of what's
     done over what's needed. It replaces a 55/45 weighting that had no stated
     reason behind it; a count is something the person can check against what
     they can see on screen. */
  const sections = useMemo(
    () => buildSections(documents, rooms),
    [documents, rooms],
  );
  const ready = readinessPercent(sections);

  /* One task at a time: the next missing document first, then the room
     with the most undocumented items. */
  const nextDoc = documents.find((d) => d.status === "missing") ?? null;
  const nextRoom = nextDoc
    ? null
    : (rooms.find((r) => r.items.some((i) => !i.photo)) ?? null);

  const openRoom = rooms.find((r) => r.id === openRoomId) ?? null;

  const markVerified = (id: string) => {
    setDocuments((docs) =>
      docs.map((d) =>
        d.id === id ? { ...d, status: "verified", meta: "Added just now" } : d,
      ),
    );
    setUploadDoc(null);
  };

  const updateRoom = (next: VaultRoom) => {
    setRooms((all) => all.map((r) => (r.id === next.id ? next : r)));
  };

  /* Walkthrough sessions hand back items grouped by room; rooms that don't
     exist yet (like the dining room) get created on the spot. */
  const saveWalkthrough = (batches: WalkthroughBatch[]) => {
    setRooms((all) => {
      const next = [...all];
      for (const batch of batches) {
        const i = next.findIndex((r) => r.id === batch.roomId);
        if (i >= 0) {
          next[i] = { ...next[i], items: [...next[i].items, ...batch.items] };
        } else {
          next.push({
            id: batch.roomId,
            name: batch.roomName,
            photoCount: 0,
            items: batch.items,
          });
        }
      }
      return next;
    });
  };

  return (
    <div className="vault-body">
      {/* --- Documented value hero ------------------------------------- */}
      <section className="vault-hero" aria-label="Readiness">
        <span className="vault-hero__label">Ready to file</span>
        <motion.span
          key={ready.pct}
          className="vault-hero__value"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {ready.pct}%
        </motion.span>
        <span className="vault-hero__sub">
          {ready.docsDone} of {ready.docsTotal} documents ·{" "}
          {ready.assetsDone} of {ready.assetsTotal} assets documented
        </span>
        <div className="vault-hero__progress">
          <div
            className="vault-hero__meter"
            role="img"
            aria-label={`Readiness ${ready.pct}%`}
          >
            <motion.i
              animate={{ width: `${ready.pct}%` }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        </div>
        <p className="vault-hero__value2">
          <b>{formatValue(totalValue)}</b> documented across {totalItems} items
        </p>
      </section>

      {/* --- One task at a time ----------------------------------------- */}
      <AnimatePresence initial={false}>
        {(nextDoc || nextRoom) && (
          <motion.section
            className="vault-next"
            aria-label="Up next"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="vault-next__card">
              <span className="vault-next__kicker">Up next</span>
              {nextDoc ? (
                <>
                  <p className="vault-next__title">
                    Add your {docPhrase(nextDoc.name)}
                  </p>
                  <p className="vault-next__body">{nextDoc.why}.</p>
                  <button
                    type="button"
                    className="vault-next__cta"
                    onClick={() => setUploadDoc(nextDoc)}
                  >
                    Add document
                  </button>
                </>
              ) : (
                nextRoom && (
                  <>
                    <p className="vault-next__title">
                      Photograph the {nextRoom.name.toLowerCase()}
                    </p>
                    <p className="vault-next__body">
                      {nextRoom.items.filter((i) => !i.photo).length} items
                      there still need photos.
                    </p>
                    <button
                      type="button"
                      className="vault-next__cta"
                      onClick={() => setOpenRoomId(nextRoom.id)}
                    >
                      Open room
                    </button>
                  </>
                )
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- Documents, collapsed ---------------------------------------- */}
      <VaultSections sections={sections} onOpenDocs={() => setDocsOpen(true)} />

      <section className="vault-links" aria-label="Tools">
        <button
          type="button"
          className="vault-link vault-link--walk"
          onClick={() => setWalkthroughOpen(true)}
        >
          <span
            className="vault-link__icon vault-link__icon--mic"
            aria-hidden="true"
          >
            <Mic size={16} strokeWidth={2} />
          </span>
          <span className="vault-link__body">
            <span className="vault-link__name">
              Walk &amp; talk your home
              <span className="vault-link__beta">Beta</span>
            </span>
            <span className="vault-link__meta">
              Voice-document a room in minutes
            </span>
          </span>
          <ChevronRight
            size={16}
            strokeWidth={2}
            className="vault-link__chev"
            aria-hidden="true"
          />
        </button>
      </section>

      {/* --- Rooms -------------------------------------------------------- */}
      <section className="vault-section" aria-label="Your home">
        <header className="vault-section__head">
          <h2 className="vault-section__title">Your home</h2>
          <span className="vault-section__count">
            {roomsStarted} of {rooms.length} rooms
          </span>
        </header>
        <div className="vault-rooms">
          {rooms.map((room) => {
            const Icon = ROOM_ICONS[room.id] ?? Boxes;
            const empty = room.items.length === 0;
            return (
              <button
                key={room.id}
                type="button"
                className={`vault-room${empty ? " is-empty" : ""}`}
                onClick={() => setOpenRoomId(room.id)}
              >
                <span className="vault-room__icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="vault-room__name">{room.name}</span>
                {empty ? (
                  <span className="vault-room__meta">Not started</span>
                ) : (
                  <>
                    <span className="vault-room__value">
                      {formatValue(roomValue(room))}
                    </span>
                    <span className="vault-room__meta">
                      {room.items.length} items
                    </span>
                  </>
                )}
              </button>
            );
          })}
          <button type="button" className="vault-room vault-room--new">
            <span className="vault-room__icon" aria-hidden="true">
              <Plus size={17} strokeWidth={2} />
            </span>
            <span className="vault-room__name">Add room</span>
            <span className="vault-room__meta">Attic, shed, storage…</span>
          </button>
        </div>
      </section>

      <AnimatePresence>
        {docsOpen && (
          <VaultDocsSheet
            key="docs"
            documents={documents}
            onUpload={(doc) => setUploadDoc(doc)}
            onClose={() => setDocsOpen(false)}
          />
        )}
        {openRoom && (
          <VaultRoomSheet
            key={openRoom.id}
            room={openRoom}
            onChange={updateRoom}
            onClose={() => setOpenRoomId(null)}
          />
        )}
        {walkthroughOpen && (
          <VaultWalkthrough
            key="walkthrough"
            rooms={rooms}
            onSave={saveWalkthrough}
            onClose={() => setWalkthroughOpen(false)}
          />
        )}
        {uploadDoc && (
          <VaultUpload
            key={`upload-${uploadDoc.id}`}
            doc={uploadDoc}
            onVerified={markVerified}
            onClose={() => setUploadDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
