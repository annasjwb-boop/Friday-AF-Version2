/* ---------------------------------------------------------------------------
 * Local inspectors and contractors.
 *
 * SAMPLE DATA. These firms are invented, and so are the ratings, licence
 * numbers and contact details — the pattern is real, the entries are not. A
 * built version would come from a licensing board feed plus a review source,
 * and the licence number matters more than the rating: in Florida, post-storm
 * unlicensed contracting is one of the commonest ways survivors lose money.
 * ------------------------------------------------------------------------- */

export interface Inspector {
  id: string;
  name: string;
  /** What they're strongest at, matched against the damage on file. */
  speciality: string;
  rating: number;
  reviews: number;
  /** Miles from the property. */
  distance: number;
  phone: string;
  email: string;
  website: string;
  licence: string;
  lat: number;
  lng: number;
  /** Why this one is surfaced for this property. */
  why: string;
}

/** The property, for centring the map. */
export const HOME = { lat: 26.6406, lng: -81.8723 };

export const INSPECTORS: Inspector[] = [
  {
    id: "gulf",
    name: "Gulf Coast Restoration",
    speciality: "Flood & surge damage",
    rating: 4.9,
    reviews: 312,
    distance: 1.8,
    phone: "(239) 555-0142",
    email: "estimates@gulfcoastrestoration.example",
    website: "gulfcoastrestoration.example",
    licence: "CGC1524880",
    lat: 26.6512,
    lng: -81.8661,
    why: "Handles surge lines and drywall replacement — matches your documented damage",
  },
  {
    id: "harbor",
    name: "Harbor Point Builders",
    speciality: "Structural repair",
    rating: 4.8,
    reviews: 187,
    distance: 3.2,
    phone: "(239) 555-0198",
    email: "office@harborpointbuilders.example",
    website: "harborpointbuilders.example",
    licence: "CBC1259031",
    lat: 26.6218,
    lng: -81.8905,
    why: "Licensed general contractor — writes estimates FEMA and SBA accept",
  },
  {
    id: "calusa",
    name: "Calusa Inspection Group",
    speciality: "Insurance & FEMA estimates",
    rating: 4.7,
    reviews: 96,
    distance: 4.6,
    phone: "(239) 555-0176",
    email: "intake@calusainspect.example",
    website: "calusainspect.example",
    licence: "HI11284",
    lat: 26.6749,
    lng: -81.8412,
    why: "Writes to Xactimate, which is the format adjusters price from",
  },
  {
    id: "edison",
    name: "Edison Home Services",
    speciality: "Kitchens, cabinetry, appliances",
    rating: 4.6,
    reviews: 241,
    distance: 5.1,
    phone: "(239) 555-0113",
    email: "hello@edisonhomeservices.example",
    website: "edisonhomeservices.example",
    licence: "CRC1331902",
    lat: 26.6104,
    lng: -81.8338,
    why: "Strong on the lower cabinets and appliances you've flagged as major",
  },
  {
    id: "estero",
    name: "Estero Bay Contracting",
    speciality: "Roofing & exterior",
    rating: 4.5,
    reviews: 154,
    distance: 6.9,
    phone: "(239) 555-0165",
    email: "quotes@esterobay.example",
    website: "esterobay.example",
    licence: "CCC1330558",
    lat: 26.5871,
    lng: -81.8102,
    why: "Covers the screen enclosure and exterior items on your list",
  },
];

/** Best first, which is how the list reads and how the map is labelled. */
export function rankedInspectors(): Inspector[] {
  return [...INSPECTORS].sort(
    (a, b) => b.rating - a.rating || a.distance - b.distance,
  );
}
