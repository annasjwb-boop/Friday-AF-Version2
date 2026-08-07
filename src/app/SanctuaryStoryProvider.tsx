import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SanctuaryId } from "../types/sanctuary";
import {
  SanctuaryStoryContext,
  type AvatarDetail,
  type LedgerTabId,
  type StoryOrigin,
} from "./sanctuaryStory";

// Shared with the 4.B hero so the avatar mirrors whichever model the user
// committed to there.
const STORAGE_KEY = "aidfinder:sanctuary-b";
const DETAIL_KEY = "aidfinder:sanctuary-avatar-detail";

function loadSanctuary(): SanctuaryId {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (
    stored === "castle" ||
    stored === "crystal" ||
    stored === "mountain" ||
    stored === "island" ||
    stored === "sky"
  ) {
    return stored;
  }
  return "castle";
}

/**
 * Owns the "Your Sanctuary" story state: whether the immersive view is
 * open, the avatar rect it expands from, the committed sanctuary model,
 * and the active ledger view (so the story's final action can land the
 * user on the relevant detailed section).
 */
export function SanctuaryStoryProvider({ children }: { children: ReactNode }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [origin, setOrigin] = useState<StoryOrigin | null>(null);
  const [sanctuaryId, setSanctuaryId] = useState<SanctuaryId>(loadSanctuary);
  const [ledgerTab, setLedgerTab] = useState<LedgerTabId>("risk");
  const [avatarDetail, setAvatarDetail] = useState<AvatarDetail>(() =>
    localStorage.getItem(DETAIL_KEY) === "full" ? "full" : "structure",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sanctuaryId);
  }, [sanctuaryId]);

  useEffect(() => {
    localStorage.setItem(DETAIL_KEY, avatarDetail);
  }, [avatarDetail]);

  const value = useMemo(
    () => ({
      storyOpen,
      origin,
      openStory: (from: StoryOrigin | null) => {
        setOrigin(from);
        setStoryOpen(true);
      },
      closeStory: () => setStoryOpen(false),
      sanctuaryId,
      setSanctuaryId,
      ledgerTab,
      setLedgerTab,
      avatarDetail,
      setAvatarDetail,
    }),
    [storyOpen, origin, sanctuaryId, ledgerTab, avatarDetail],
  );

  return (
    <SanctuaryStoryContext.Provider value={value}>
      {children}
    </SanctuaryStoryContext.Provider>
  );
}
