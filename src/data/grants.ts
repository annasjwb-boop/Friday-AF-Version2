/* ---------------------------------------------------------------------------
 * Grant programs surfaced by the aid flow.
 *
 * SAMPLE DATA. The disaster names, DR numbers and landfall dates are real
 * Florida declarations; the program names are real. Every dollar figure,
 * deadline, incident period and eligibility line is illustrative and needs
 * verifying against OpenFEMA and the administering agency before it reaches
 * anyone — incident periods especially, since eligibility turns on whether
 * damage fell inside the window.
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
  /** When it hit — what someone actually remembers. */
  landfall: string;
  /**
   * The incident period is the legally operative window: damage has to fall
   * inside it to be eligible, which is why it's shown rather than just the
   * declaration date.
   */
  incident: string;
  grants: Grant[];
}

export const OPEN_DISASTERS: DisasterGroup[] = [
  {
    id: "ian",
    name: "Hurricane Ian",
    dr: "DR-4673-FL",
    landfall: "28 September 2022",
    incident: "23 Sep – 4 Nov 2022",
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
    landfall: "30 August 2023",
    incident: "27 Aug – 4 Sep 2023",
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

/* ---------------------------------------------------------------------------
 * The resiliency grant.
 *
 * Unlike the figures above, these are real and checked against the program's
 * own material: a 2:1 state match to a $10,000 ceiling, no match required for
 * households at or below 80% of county AMI, a $700,000 insured-value cap that
 * the low-income route waives, homestead property permitted before 2008, and
 * funds restricted to what the free wind inspection recommends.
 *
 * Program parameters change by funding cycle, so mysafeflhome.com is the
 * authoritative source and is linked rather than summarised away.
 * ------------------------------------------------------------------------- */

export const RESILIENCY_GRANT = {
  id: "msfh",
  name: "My Safe Florida Home",
  agency: "Florida Dept. of Financial Services",
  max: "Up to $10,000",
  match: "State pays $2 for every $1 you put in — $5,000 from you unlocks the full $10,000.",
  who: "Homesteaded single-family homes permitted before 2008, with insurance in force and an insured value of $700,000 or less; households at or below 80% of county median income skip both the match and that cap.",
  use: "Only the upgrades the free wind inspection recommends — impact windows and doors, shutters, and roof reinforcement.",
  due: "First come, first served within priority groups, by funding cycle",
  link: "mysafeflhome.com",
  /** Standard-lane cap on Coverage A. Compared against the policy on file. */
  insuredValueCap: 700_000,
};

export const ALL_STORM_GRANTS = OPEN_DISASTERS.flatMap((d) =>
  d.grants.map((g) => ({ ...g, disaster: d.name, dr: d.dr })),
);
