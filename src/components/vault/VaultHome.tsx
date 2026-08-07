import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryFull,
  BedDouble,
  Boxes,
  ChevronRight,
  CookingPot,
  FolderClosed,
  Laptop,
  Mic,
  Plus,
  Signal,
  Sofa,
  UtensilsCrossed,
  Warehouse,
  Wifi,
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

export function VaultHome() {
  const [documents, setDocuments] = useState<VaultDocument[]>(VAULT_DOCUMENTS);
  const [rooms, setRooms] = useState<VaultRoom[]>(VAULT_ROOMS);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
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
  const verifiedDocs = documents.filter((d) => d.status === "verified").length;
  const roomsStarted = rooms.filter((r) => r.items.length > 0).length;
  const readiness = Math.round(
    (verifiedDocs / documents.length) * 55 + (roomsStarted / rooms.length) * 45,
  );

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
        d.id === id
          ? { ...d, status: "verified", meta: "Added just now" }
          : d,
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
    <div className="vault">
      <header className="vault__top">
        <div className="vault__status" aria-hidden="true">
          <span className="vault__time">9:41</span>
          <span className="vault__status-icons">
            <Signal size={14} strokeWidth={2.2} />
            <Wifi size={14} strokeWidth={2.2} />
            <BatteryFull size={18} strokeWidth={1.8} />
          </span>
        </div>
        <div className="vault__bar">
          <div>
            <h1 className="vault__title">Readiness</h1>
            <p className="vault__address">123 Prado Rd NE, Atlanta, GA</p>
          </div>
          <button type="button" className="vault__avatar" aria-label="Profile">
            <span aria-hidden="true">JB</span>
          </button>
        </div>
      </header>

      <div className="vault__sheet">
        {/* --- Documented value hero ----------------------------------- */}
        <section className="vault-hero" aria-label="Documented value">
          <span className="vault-hero__label">Documented value</span>
          <motion.span
            key={totalValue}
            className="vault-hero__value"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {formatValue(totalValue)}
          </motion.span>
          <span className="vault-hero__sub">
            {totalItems} items · proof on file if you ever need to claim
          </span>
          <div className="vault-hero__progress">
            <div
              className="vault-hero__meter"
              role="img"
              aria-label={`Readiness ${readiness}%`}
            >
              <motion.i
                animate={{ width: `${readiness}%` }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            <span className="vault-hero__percent">{readiness}% ready</span>
          </div>
        </section>

        {/* --- One task at a time ---------------------------------------- */}
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
        <section className="vault-links" aria-label="Documents">
          <button
            type="button"
            className="vault-link"
            onClick={() => setDocsOpen(true)}
          >
            <span className="vault-link__icon" aria-hidden="true">
              <FolderClosed size={17} strokeWidth={1.9} />
            </span>
            <span className="vault-link__body">
              <span className="vault-link__name">Documents</span>
              <span className="vault-link__meta">
                {verifiedDocs} of {documents.length} on file
              </span>
            </span>
            <ChevronRight
              size={16}
              strokeWidth={2}
              className="vault-link__chev"
              aria-hidden="true"
            />
          </button>

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

        {/* --- Rooms ----------------------------------------------------- */}
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

      </div>

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
