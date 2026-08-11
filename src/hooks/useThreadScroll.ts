import { useEffect, type RefObject } from "react";

/* ---------------------------------------------------------------------------
 * Thread scrolling.
 *
 * Chat threads normally pin to the bottom, which works while each new message
 * is short. As soon as one is taller than the viewport, pinning to the bottom
 * shows the person the *end* of something they haven't read and makes them
 * scroll back up to find its start.
 *
 * So the target is the top of the newest message, clamped to the bottom of the
 * thread: scrollTop = min(maxScroll, topOfNewest). Short messages still settle
 * at the bottom, because the clamp wins. Tall ones stop with their first line
 * at the top of the view and the person reads downward.
 * ------------------------------------------------------------------------- */

/** Breathing room above the anchored message. */
const PAD = 10;

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function useThreadScroll(
  /** The newest message. Its top edge is what we scroll to. */
  anchorRef: RefObject<HTMLElement | null>,
  deps: unknown[],
  { instant = false }: { instant?: boolean } = {},
) {
  useEffect(() => {
    const entry = anchorRef.current;
    /* A step can nominate the element that should land at the top — a tall
       card whose first useful row is some way down would otherwise open on
       its heading. */
    const anchor =
      entry?.querySelector<HTMLElement>("[data-thread-anchor]") ?? entry;
    const container = scrollParent(anchor);
    if (!container) return;

    const max = container.scrollHeight - container.clientHeight;
    const target = anchor
      ? container.scrollTop +
        anchor.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        PAD
      : max;

    container.scrollTo({
      top: Math.max(0, Math.min(max, target)),
      behavior: instant ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
