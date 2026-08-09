/* ---------------------------------------------------------------------------
 * Grant programs surfaced by the aid flow.
 *
 * SAMPLE DATA. The disaster names and DR numbers are real Florida
 * declarations and the program names are real, but every dollar figure,
 * deadline and eligibility line here is illustrative and needs verifying
 * against OpenFEMA and the administering agency before it reaches anyone.
 *
 * In the built version this comes from an address lookup: declared disasters
 * covering the property's county, then open programs under each.
 * ------------------------------------------------------------------------- */

export interface Grant {
  id: string;
  name: string;
  agency: string;
  /** One sentence, plain language, second person. */
  blurb: string;
  /** Display string — a cap, not an entitlement. */
  max: string;
  due: string;
  /** Loans are shown alongside grants but must never be described as aid. */
  kind: "grant" | "loan";
}

export interface DisasterGroup {
  id: string;
  name: string;
  /** FEMA declaration number. */
  dr: string;
  grants: Grant[];
}

export const OPEN_DISASTERS: DisasterGroup[] = [
  {
    id: "ian",
    name: "Hurricane Ian",
    dr: "DR-4673-FL",
    grants: [
      {
        id: "ia-housing",
        name: "FEMA Housing Assistance",
        agency: "FEMA Individual Assistance",
        blurb:
          "Helps repair storm damage to the parts of your home you need to live in it safely.",
        max: "Up to $42,500",
        due: "Closes 14 Nov 2026",
        kind: "grant",
      },
      {
        id: "cdbg-dr",
        name: "Homeowner Rehabilitation",
        agency: "HUD CDBG-DR",
        blurb:
          "Covers repairs that insurance and FEMA left unfinished, for households under the income cap.",
        max: "Up to $150,000",
        due: "Closes 30 Jan 2027",
        kind: "grant",
      },
    ],
  },
  {
    id: "idalia",
    name: "Hurricane Idalia",
    dr: "DR-4734-FL",
    grants: [
      {
        id: "ona",
        name: "Other Needs Assistance",
        agency: "FEMA Individual Assistance",
        blurb:
          "Covers losses insurance won't — furniture, appliances, a damaged vehicle, medical costs.",
        max: "Up to $42,500",
        due: "Closes 2 Sep 2026",
        kind: "grant",
      },
    ],
  },
];

export const RESILIENCY_GRANT: Grant = {
  id: "msfh",
  name: "My Safe Florida Home",
  agency: "Florida Dept. of Financial Services",
  blurb:
    "Pays toward roof and opening upgrades that reduce what a future storm can do to your home.",
  max: "Up to $10,000",
  due: "Open — funded in rounds",
  kind: "grant",
};

export const ALL_STORM_GRANTS = OPEN_DISASTERS.flatMap((d) =>
  d.grants.map((g) => ({ ...g, disaster: d.name, dr: d.dr })),
);
