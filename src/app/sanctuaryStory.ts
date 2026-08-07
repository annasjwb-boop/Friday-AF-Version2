import { createContext, useContext } from "react";
import type { SanctuaryId } from "../types/sanctuary";

/** The three ledger views the working app is organized around. */
export type LedgerTabId = "risk" | "preparedness" | "recovery";

/** Where the story expands from, relative to the app layout. */
export type StoryOrigin = { x: number; y: number; size: number };

/** How much the header avatar visualizes: the clean structure alone, or
 *  the model's true personalized condition (weathering, hazard effects). */
export type AvatarDetail = "structure" | "full";

export type SanctuaryStoryContextValue = {
  /** Whether the immersive "Your Sanctuary" view is (logically) open. */
  storyOpen: boolean;
  /** The avatar rect the shared-element expansion starts and ends at. */
  origin: StoryOrigin | null;
  openStory: (origin: StoryOrigin | null) => void;
  closeStory: () => void;
  /** The user's committed sanctuary model, shared by avatar and story. */
  sanctuaryId: SanctuaryId;
  setSanctuaryId: (id: SanctuaryId) => void;
  /** Controlled ledger view, so the story's final action can route to one. */
  ledgerTab: LedgerTabId;
  setLedgerTab: (tab: LedgerTabId) => void;
  /** What the header avatar renders: structure only or its true condition. */
  avatarDetail: AvatarDetail;
  setAvatarDetail: (detail: AvatarDetail) => void;
};

export const SanctuaryStoryContext =
  createContext<SanctuaryStoryContextValue | null>(null);

export function useSanctuaryStory(): SanctuaryStoryContextValue {
  const value = useContext(SanctuaryStoryContext);
  if (!value) {
    throw new Error(
      "useSanctuaryStory must be used within SanctuaryStoryProvider",
    );
  }
  return value;
}
