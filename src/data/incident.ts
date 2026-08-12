/* ---------------------------------------------------------------------------
 * The active incident, and what to do about it in order.
 *
 * Ported from the gap simulator's recovery mode. The ordering is the useful
 * part and is kept exactly: safety, then documentation, then a verified damage
 * number, then the claim, then declarations, then deadlines, then whatever
 * emerges months later. Applications come sixth on that list — after the four
 * things that determine what they're worth.
 *
 * SAMPLE DATA. The incident, acreage, centre and distances are illustrative.
 * The programme mechanics — two separate declarations, ~60-day windows — are
 * real and are the reason the list is ordered this way.
 * ------------------------------------------------------------------------- */

export interface TimelineAction {
  kind: "alert" | "place" | "note";
  title: string;
  body: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  body: string;
  state: "now" | "next" | "later";
  video?: { title: string; length: string };
  actions?: TimelineAction[];
  cta?: string;
  cta2?: string;
}

export const INCIDENT = {
  name: "Palisades Fire",
  day: "Day 1",
  acres: "23,713 acres",
  address: "952 Las Lomas",
  /* Real coordinates for the Palisades area, so the map centres correctly. */
  lat: 34.0448,
  lng: -118.5265,
  perimeter: "Your address sits inside the evacuation perimeter",
};

export const RECOVERY_CENTRE = {
  name: "Palisades Rec Center",
  distance: "2.3 mi",
  hours: "Open today until 7 PM",
  offers: "Documents, FEMA staff, one-on-one help",
  lat: 34.0522,
  lng: -118.5426,
};

export const TIMELINE: TimelineStep[] = [
  {
    id: "safety",
    title: "Get to safety",
    body: "Follow evacuation orders. Grab people and pets, not paperwork — your documents are already in your vault.",
    state: "now",
    video: { title: "Getting out safely — the first hour", length: "1:32" },
    actions: [
      {
        kind: "alert",
        title: "Evacuation order active — your zone",
        body: "Leave now. Return only when officials clear it — we'll alert you the moment that changes.",
      },
      {
        kind: "note",
        title: "Tonight's roof",
        body: "Red Cross shelter at Westwood Rec Center, pets OK. Or use your policy's loss-of-use cover for a hotel starting tonight — save every receipt.",
      },
      {
        kind: "place",
        title: "Disaster Recovery Center — 2.3 mi",
        body: "Palisades Rec Center · open until 7 PM · FEMA staff, documents, one-on-one help.",
      },
    ],
    cta: "I'm safe",
    cta2: "See all help resources",
  },
  {
    id: "document",
    title: "Document everything — before touching anything",
    body: "Every room, every angle. Your before-photos give the side-by-side that proves the loss.",
    state: "next",
    video: { title: "Photographing a loss so it holds up", length: "2:05" },
  },
  {
    id: "number",
    title: "Establish your verified damage number",
    body: "A licensed contractor estimate, an industrial hygienist for smoke and toxins, a retrospective appraiser. Every claim keys off this number.",
    state: "next",
  },
  {
    id: "claim",
    title: "File your insurance claim — today",
    body: "Carriers and policy numbers are in your vault. The adjuster photographs the damage; if the home is gone, FEMA satellite assessment can verify it without a visit.",
    state: "next",
  },
  {
    id: "declarations",
    title: "Watch the declarations — there are two",
    body: "FEMA needs the President. SBA has its own declaration with a much lower bar — about 25 damaged properties in a county — so it often turns on when FEMA doesn't. We track both and start your deadline clocks the moment either flips.",
    state: "later",
  },
  {
    id: "apply",
    title: "Apply before the deadlines",
    body: "FEMA and SBA each give about 60 days from declaration. Your vault pre-fills both.",
    state: "later",
  },
  {
    id: "emerging",
    title: "Catch programs as they emerge",
    body: "State grants, property-tax relief, the IRS refund — help keeps appearing for months. We watch and alert you.",
    state: "later",
  },
];
