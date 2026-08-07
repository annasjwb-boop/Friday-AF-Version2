/* ---------------------------------------------------------------------------
 * Prototype presentation switches.
 *
 * These control what a visitor sees when the deployed URL opens. Everything
 * they hide stays in the codebase — nothing here deletes work, it just
 * narrows what's reachable while the Casita direction is the one being
 * shown to stakeholders.
 * ------------------------------------------------------------------------- */

import type { BackgroundVariant } from "./background";

/**
 * The one design variant that renders. The other nine are still in
 * `src/components/*` and still compile; they're simply unreachable while
 * the picker below is off.
 */
export const ACTIVE_VARIANT: BackgroundVariant = "casita";

/**
 * Shows the "Variants" table of contents beside the device frame. Turn this
 * back on to browse all ten directions again — `ACTIVE_VARIANT` then only
 * decides which one loads first.
 */
export const SHOW_VARIANT_PICKER = false;

export type DeviceModeSetting = "mobile" | "desktop" | "auto";

/**
 * Which layout renders:
 *
 *   "mobile"   always the mobile app (Casita)
 *   "desktop"  always the widescreen layout
 *   "auto"     remembers the on-screen toggle, defaulting to mobile
 *
 * Set this to "mobile" or "desktop" to pin one and hide the toggle button —
 * useful when sending a link to someone who should only see one of them.
 */
export const DEVICE_MODE: DeviceModeSetting = "auto";
