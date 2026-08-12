/* ---------------------------------------------------------------------------
 * What the person calls their home.
 *
 * Stored rather than held in state: renaming your home and finding it reverted
 * on the next visit would read as the app not having listened. Browser-only,
 * like everything else stored in this prototype.
 * ------------------------------------------------------------------------- */

const KEY = "aidfinder:home-name";

export const DEFAULT_HOME_NAME = "Casita";

export function loadHomeName(): string {
  try {
    return localStorage.getItem(KEY) || DEFAULT_HOME_NAME;
  } catch {
    return DEFAULT_HOME_NAME;
  }
}

export function saveHomeName(name: string) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    /* Private browsing can refuse writes; the name still holds for this
       session, which is better than failing the rename outright. */
  }
}
