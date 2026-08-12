/* ---------------------------------------------------------------------------
 * Document categories, and what a scan would pull off each one.
 *
 * The extracted fields are the point of this flow: someone photographing a
 * declarations page wants to know it was worth doing. Listing what came off
 * the page — and what didn't — is the difference between an upload and a
 * useful one.
 *
 * SAMPLE DATA. The field names are the ones these documents really carry; the
 * values are illustrative and nothing is actually read from an image.
 * ------------------------------------------------------------------------- */

export interface DocType {
  id: string;
  name: string;
  /** What a scan would lift off it, in the order it would be shown. */
  fields: [string, string][];
  /** Fields the scan couldn't fill, which the person may need to supply. */
  missing?: string[];
  /** Roughly how many pages this document usually runs to. */
  pages: string;
}

export interface DocCategory {
  id: string;
  name: string;
  sub: string;
  types: DocType[];
}

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: "identity",
    name: "Identity",
    sub: "Proves who you are · unlocks 7 programs",
    types: [
      {
        id: "license",
        name: "Driver's licence or state ID",
        pages: "Front and back",
        fields: [
          ["Full name", "Jane A. Barrett"],
          ["Date of birth", "14 Mar 1981"],
          ["Address on file", "123 Prado Rd NE"],
          ["Expires", "Mar 2029"],
          ["REAL ID", "Yes"],
        ],
      },
      {
        id: "passport",
        name: "Passport",
        pages: "Photo page",
        fields: [
          ["Full name", "Jane Anne Barrett"],
          ["Date of birth", "14 Mar 1981"],
          ["Expires", "Aug 2031"],
        ],
      },
      {
        id: "ssn",
        name: "Social Security card",
        pages: "1 page",
        fields: [["Name", "Jane A. Barrett"]],
        missing: ["Number stored encrypted, never shown"],
      },
    ],
  },
  {
    id: "ownership",
    name: "Property ownership",
    sub: "Deed, title or a utility bill · unlocks 5 programs",
    types: [
      {
        id: "deed",
        name: "Deed or title",
        pages: "Usually 2–4 pages",
        fields: [
          ["Owner of record", "Jane A. Barrett"],
          ["Parcel ID", "14-0043-0009-051"],
          ["Recorded", "12 Jun 2016"],
          ["Legal description", "Lot 9, Block C, Prado Park"],
        ],
      },
      {
        id: "utility",
        name: "Utility bill",
        pages: "1–2 pages",
        fields: [
          ["Service address", "123 Prado Rd NE"],
          ["Account holder", "Jane A. Barrett"],
          ["Statement date", "3 Jul 2026"],
        ],
        missing: ["Occupancy start date not printed on this bill"],
      },
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    sub: "Declarations pages and policy documents",
    types: [
      {
        id: "dec",
        name: "Declarations page",
        pages: "Usually 2–3 pages",
        fields: [
          ["Carrier", "State Farm"],
          ["Policy number", "FL-88-4471-206"],
          ["Dwelling (Cov A)", "$850,000"],
          ["Personal property", "$50,000"],
          ["Named-storm deductible", "5% of dwelling"],
          ["Policy period", "1 Sep 2025 – 1 Sep 2026"],
        ],
        missing: ["Flood is not on this policy — no flood coverage found"],
      },
      {
        id: "flood",
        name: "Flood policy",
        pages: "2 pages",
        fields: [
          ["Carrier", "Not found"],
          ["Building coverage", "Not found"],
        ],
        missing: ["No flood policy on file for this address"],
      },
    ],
  },
  {
    id: "financial",
    name: "Financial",
    sub: "Mortgage statements and tax records",
    types: [
      {
        id: "mortgage",
        name: "Mortgage statement",
        pages: "1–2 pages",
        fields: [
          ["Servicer", "Regions Mortgage"],
          ["Loan number", "0044-91827"],
          ["Principal balance", "$412,660"],
          ["Escrow for insurance", "Yes"],
        ],
      },
      {
        id: "tax",
        name: "Property tax bill",
        pages: "1 page",
        fields: [
          ["Assessed value", "$664,400"],
          ["Tax year", "2025"],
          ["Homestead exemption", "Yes"],
        ],
      },
    ],
  },
];
