/* ---------------------------------------------------------------------------
 * What a video walkthrough of a room would come back with.
 *
 * Two values per object, because they are the two numbers a claim turns on:
 *
 *   acv  actual cash value — what it's worth now, after depreciation. This is
 *        what a policy pays unless it says otherwise.
 *   rcv  replacement cost — what buying it again today costs.
 *
 * The gap between them is the thing most households discover during a claim
 * rather than before one, which is why both are shown here rather than a
 * single "value".
 *
 * SAMPLE DATA. Object lists and both values are illustrative.
 * ------------------------------------------------------------------------- */

export interface ScanObject {
  name: string;
  /** Worth now, depreciated. */
  acv: number;
  /** Cost to replace new. */
  rcv: number;
}

export interface ScanArea {
  /** Matches a vault room id where one exists, so items land in the right room. */
  id: string;
  name: string;
  hint: string;
  objects: ScanObject[];
}

export const SCAN_AREAS: ScanArea[] = [
  {
    id: "living",
    name: "Living room",
    hint: "Sofa, television, rugs, art on the walls",
    objects: [
      { name: "Sectional sofa", acv: 1450, rcv: 2600 },
      { name: '65" television', acv: 620, rcv: 1100 },
      { name: "Media console", acv: 340, rcv: 700 },
      { name: "Wool area rug", acv: 480, rcv: 950 },
      { name: "Floor lamp, pair", acv: 130, rcv: 280 },
      { name: "Framed prints, three", acv: 260, rcv: 520 },
      { name: "Bookcase", acv: 190, rcv: 400 },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    hint: "Appliances, cookware, anything built in",
    objects: [
      { name: "Refrigerator", acv: 900, rcv: 2200 },
      { name: "Range and oven", acv: 700, rcv: 1600 },
      { name: "Dishwasher", acv: 380, rcv: 900 },
      { name: "Stand mixer", acv: 180, rcv: 430 },
      { name: "Cookware set", acv: 220, rcv: 500 },
      { name: "Small appliances, four", acv: 190, rcv: 380 },
    ],
  },
  {
    id: "bedroom",
    name: "Primary bedroom",
    hint: "Bed, wardrobe, what's inside the wardrobe",
    objects: [
      { name: "King bed and mattress", acv: 1100, rcv: 2400 },
      { name: "Wardrobe", acv: 520, rcv: 1050 },
      { name: "Dresser", acv: 300, rcv: 640 },
      { name: "Clothing, estimated", acv: 1800, rcv: 3600 },
      { name: "Jewellery box contents", acv: 900, rcv: 1400 },
    ],
  },
  {
    id: "office",
    name: "Office",
    hint: "Computers, desk, anything you work on",
    objects: [
      { name: "Laptop", acv: 700, rcv: 1500 },
      { name: "Monitor, two", acv: 260, rcv: 560 },
      { name: "Desk", acv: 210, rcv: 480 },
      { name: "Office chair", acv: 240, rcv: 520 },
      { name: "Printer", acv: 90, rcv: 240 },
    ],
  },
  {
    id: "garage",
    name: "Garage",
    hint: "Tools, bikes, anything stored out there",
    objects: [
      { name: "Power tools, assorted", acv: 640, rcv: 1300 },
      { name: "Bicycles, two", acv: 520, rcv: 1200 },
      { name: "Workbench", acv: 180, rcv: 380 },
      { name: "Lawn mower", acv: 210, rcv: 520 },
      { name: "Ladder", acv: 70, rcv: 160 },
    ],
  },
];

export function areaById(id: string): ScanArea | undefined {
  return SCAN_AREAS.find((a) => a.id === id);
}

export function sumAcv(objects: ScanObject[]): number {
  return objects.reduce((n, o) => n + o.acv, 0);
}

export function sumRcv(objects: ScanObject[]): number {
  return objects.reduce((n, o) => n + o.rcv, 0);
}
