import { useEffect, useState } from "react";
import {
  Check,
  Plus,
  FileUp,
  Link2,
  MapPin,
  ShieldOff,
  Wind,
  Waves,
  Flame,
} from "lucide-react";
import { OPEN_DISASTERS, RESILIENCY_GRANT } from "../data/grants";
import { NO_STORMS } from "./scripts";
import { policyCoverages } from "../data/home";
import { MAPBOX_TOKEN } from "../components/campaign/FloridaMap";

/* ---------------------------------------------------------------------------
 * The non-chat steps. Each takes an `onDone` and calls it once the user has
 * answered; the engine then moves on.
 *
 * All of these are mocks over sample data. Where a real integration would sit
 * (ATTOM for property records, Canopy Connect for policy data) the widget says
 * so on its face rather than pretending to connect — a demo that looks like it
 * fetched real data invites people to trust numbers that were typed in by hand.
 * ------------------------------------------------------------------------- */

export const DEFAULT_ADDRESS = "1200 Edwards Dr, Fort Myers, FL 33901";

/** Where the static map falls back to if geocoding fails or is unavailable. */
const FALLBACK_CENTER: [number, number] = [-81.87, 26.64];

/**
 * The property on a static map tile.
 *
 * Geocodes the address rather than showing a fixed point, so when someone
 * corrects their address the map actually moves to it — otherwise the retry
 * loop would show the same tile back and quietly assert we'd found them again.
 *
 * Falls back to the original coordinates if geocoding fails or no token is
 * configured, with the address printed underneath either way.
 */
export function MapStep({ address }: { address: string }) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    const url =
      "https://api.mapbox.com/search/geocode/v6/forward?q=" +
      encodeURIComponent(address) +
      "&limit=1&access_token=" +
      MAPBOX_TOKEN;

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled) return;
        const c = data?.features?.[0]?.properties?.coordinates;
        if (c?.longitude != null) setCenter([c.longitude, c.latitude]);
        else setCenter(FALLBACK_CENTER);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  const src =
    MAPBOX_TOKEN && center
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${center[0]},${center[1]},16,0/560x560@2x?access_token=${MAPBOX_TOKEN}`
      : null;

  return (
    <div className="ob-map">
      {src ? (
        <img src={src} alt={`Map showing ${address}`} />
      ) : (
        <div className="ob-map__fallback">
          <MapPin size={22} strokeWidth={1.7} aria-hidden="true" />
          {failed && <span>Map unavailable</span>}
        </div>
      )}
      <span className="ob-map__pin" aria-hidden="true" />
      <p className="ob-map__addr">{address}</p>
    </div>
  );
}

/**
 * Confirming the matched address, with the unit number asked for at the moment
 * it's cheapest to give — a missing apartment number is one of the commonest
 * reasons an application can't be matched to a property record later.
 *
 * "Not my address" is offered because address matching does fail, and a flow
 * that only accepts yes teaches people to click yes.
 */
export function ConfirmAddressStep({
  address,
  onConfirm,
  onReject,
}: {
  address: string;
  onConfirm: (v: string) => void;
  onReject: () => void;
}) {
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <div className="ob-confirm">
      <div className="ob-confirm__card">
        <MapPin size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>
          {address}
          {unit.trim() && <b>{`Unit ${unit.trim()}`}</b>}
        </span>
      </div>

      {adding ? (
        <div className="ob-free">
          <input
            autoFocus
            value={unit}
            placeholder="Apartment or unit number"
            aria-label="Apartment or unit number"
            onChange={(e) => setUnit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setAdding(false);
            }}
          />
          <button
            type="button"
            className="ob-send"
            onClick={() => setAdding(false)}
          >
            Save
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="ob-chip ob-chip--wide"
          onClick={() => setAdding(true)}
        >
          {unit.trim() ? "Change unit number" : "Add an apartment or unit number"}
        </button>
      )}

      <div className="ob-chips">
        <button
          type="button"
          className="ob-chip"
          onClick={onReject}
        >
          That's not my address
        </button>
        <button
          type="button"
          className="ob-send"
          onClick={() =>
            onConfirm(
              unit.trim() ? `Yes — unit ${unit.trim()}` : "Yes, that's my home",
            )
          }
        >
          Yes, that's my home
        </button>
      </div>
    </div>
  );
}

/** Re-entering the address after a bad match. */
export function AskAddressStep({ onDone }: { onDone: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="ob-free">
      <input
        autoFocus
        value={v}
        placeholder="Street, city, state"
        aria-label="Your address"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) onDone(v.trim());
        }}
      />
      <button
        type="button"
        className="ob-send"
        disabled={!v.trim()}
        onClick={() => onDone(v.trim())}
      >
        Find it
      </button>
    </div>
  );
}

export function GrantsStep() {
  /* The thread scrolls to the first program rather than the top of the block,
     so the person lands on something specific instead of a heading. */
  let first = true;
  return (
    <div className="ob-grants">
      {OPEN_DISASTERS.map((d) => (
        <div className="ob-dis" key={d.id}>
          <p className="ob-dis__head">
            {d.name}
            <span>{d.dr}</span>
          </p>
          {d.grants.map((g) => {
            const anchor = first;
            first = false;
            return (
            <div
              className="ob-grant"
              key={g.id}
              {...(anchor ? { "data-thread-anchor": "" } : {})}
            >
              <p className="ob-grant__name">{g.name}</p>
              <p className="ob-grant__agency">{g.agency}</p>
              <p className="ob-grant__blurb">{g.blurb}</p>
              <p className="ob-grant__meta">
                <b>{g.max}</b>
                <span>{g.due}</span>
              </p>
            </div>
            );
          })}
        </div>
      ))}
      <p className="ob-note">
        Sample data. Amounts and deadlines need verifying before anyone relies
        on them.
      </p>
    </div>
  );
}

/**
 * Which storms damaged the property — not which programs to apply for.
 *
 * The programs follow from the storm; a household knows which hurricane took
 * their roof off, and doesn't know whether that maps to Housing Assistance or
 * Other Needs Assistance. Asking the second question is asking them to do our
 * job, and the answer would be unreliable.
 */
export function PickGrantsStep({ onDone }: { onDone: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <div className="ob-pick">
      {OPEN_DISASTERS.map((d) => {
        const on = picked.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            className={`ob-check ob-check--storm${on ? " is-on" : ""}`}
            aria-pressed={on}
            onClick={() =>
              setPicked((p) =>
                p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id],
              )
            }
          >
            <span className="ob-check__box" aria-hidden="true">
              {on && <Check size={13} strokeWidth={3} />}
            </span>
            <span className="ob-check__body">
              <span className="ob-check__name">
                {d.name}
                <em>{d.dr}</em>
              </span>
              <span className="ob-check__when">Landfall {d.landfall}</span>
              <span className="ob-check__meta">
                Damage counts if it happened {d.incident} ·{" "}
                {d.grants.length} program{d.grants.length === 1 ? "" : "s"} open
              </span>
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="ob-send"
        onClick={() =>
          onDone(
            picked.length
              ? OPEN_DISASTERS.filter((d) => picked.includes(d.id))
                  .map((d) => d.name)
                  .join(" and ")
              : NO_STORMS,
          )
        }
      >
        {picked.length ? "Continue" : "Neither damaged my home"}
      </button>
    </div>
  );
}

/**
 * The resiliency grant, with the amount, who qualifies and what it buys.
 *
 * The eligibility line is checked against the policy on file rather than
 * printed as generic marketing. This household's dwelling limit is above the
 * standard-lane cap, and saying so here is the difference between a useful
 * product and one that sends someone to fill in an application they can't win.
 */
export function ResiliencyStep({ onDone }: { onDone: (v: string) => void }) {
  const g = RESILIENCY_GRANT;
  const dwelling =
    policyCoverages.find((c) => c.id === "dwelling")?.limit ?? 0;
  const overCap = dwelling > g.insuredValueCap;

  return (
    <div className="ob-pick">
      <div className="ob-grant ob-grant--solo">
        <p className="ob-grant__name">{g.name}</p>
        <p className="ob-grant__agency">{g.agency}</p>

        <p className="ob-grant__amount">{g.max}</p>
        <p className="ob-grant__blurb">{g.match}</p>

        <p className="ob-grant__k">Who qualifies</p>
        <p className="ob-grant__blurb">{g.who}</p>

        <p className="ob-grant__k">What it pays for</p>
        <p className="ob-grant__blurb">{g.use}</p>

        {overCap && (
          <p className="ob-grant__flag">
            Worth knowing before you apply: your dwelling limit is $
            {dwelling.toLocaleString()}, above the $
            {g.insuredValueCap.toLocaleString()} cap on the standard route. The
            low-income route waives that cap.
          </p>
        )}

        <p className="ob-grant__meta">
          <b>{g.link}</b>
          <span>{g.due}</span>
        </p>
      </div>
      <div className="ob-chips">
        <button
          type="button"
          className="ob-chip"
          onClick={() => onDone("Yes interested")}
        >
          Yes interested
        </button>
        <button
          type="button"
          className="ob-chip"
          onClick={() => onDone("Maybe — save for now")}
        >
          Maybe — save for now
        </button>
        <button
          type="button"
          className="ob-chip"
          onClick={() => onDone("Not right now")}
        >
          Not right now
        </button>
      </div>
    </div>
  );
}

export function ChoiceStep({
  options,
  other,
  onDone,
}: {
  options: string[];
  other?: boolean;
  onDone: (v: string) => void;
}) {
  const [free, setFree] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="ob-chips">
      {options.map((o) => (
        <button key={o} type="button" className="ob-chip" onClick={() => onDone(o)}>
          {o}
        </button>
      ))}
      {other &&
        (open ? (
          <div className="ob-free">
            <input
              autoFocus
              value={free}
              placeholder="Tell me in your own words"
              onChange={(e) => setFree(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && free.trim()) onDone(free.trim());
              }}
            />
            <button
              type="button"
              className="ob-send"
              disabled={!free.trim()}
              onClick={() => onDone(free.trim())}
            >
              Send
            </button>
          </div>
        ) : (
          <button type="button" className="ob-chip" onClick={() => setOpen(true)}>
            Something else
          </button>
        ))}
    </div>
  );
}

export function TextStep({
  placeholder,
  onDone,
}: {
  placeholder: string;
  onDone: (v: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <div className="ob-free">
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) onDone(v.trim());
        }}
      />
      <button
        type="button"
        className="ob-send"
        disabled={!v.trim()}
        onClick={() => onDone(v.trim())}
      >
        Send
      </button>
    </div>
  );
}

/* --- Property ------------------------------------------------------------- */

const FIELDS = [
  { k: "Year built", v: "1998" },
  { k: "Living area", v: "2,410 sq ft" },
  { k: "Bedrooms", v: "4" },
  { k: "Bathrooms", v: "2.5" },
  { k: "Construction", v: "Wood frame, brick veneer" },
  { k: "Roof", v: "Asphalt shingle, replaced 2016" },
];

export function PropertyStep({ onDone }: { onDone: (v: string) => void }) {
  const [fields, setFields] = useState(FIELDS);
  const [cost, setCost] = useState(780_000);

  return (
    <div className="ob-panel">
      <p className="ob-panel__src">From public property records · sample data</p>

      {fields.map((f, i) => (
        <label className="ob-field" key={f.k}>
          <span>{f.k}</span>
          <input
            value={f.v}
            onChange={(e) =>
              setFields((all) =>
                all.map((x, n) => (n === i ? { ...x, v: e.target.value } : x)),
              )
            }
          />
        </label>
      ))}

      <div className="ob-slider">
        <p className="ob-slider__head">
          Estimated rebuild cost
          <b>${cost.toLocaleString()}</b>
        </p>
        <input
          type="range"
          min={450_000}
          max={1_200_000}
          step={10_000}
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          aria-label="Estimated rebuild cost"
        />
        <p className="ob-slider__note">
          $780,000 is the average for homes of this size in your area. Move it
          if you know your build costs more or less.
        </p>
      </div>

      <button
        type="button"
        className="ob-send"
        onClick={() => onDone("Details look right")}
      >
        These look right
      </button>
    </div>
  );
}

/* --- Risks ---------------------------------------------------------------- */

const RISKS = [
  {
    id: "wind",
    label: "Wind",
    icon: Wind,
    detail: "Gusts to 110 mph modelled",
    sev: 1,
  },
  {
    id: "flood",
    label: "Flood",
    icon: Waves,
    detail: "Zone X, outside the 100-year floodplain",
    sev: 1,
  },
  {
    id: "fire",
    label: "Wildfire",
    icon: Flame,
    detail: "Low — no wildland interface within 5 mi",
    sev: 1,
  },
];

/* Three positions rather than a severity score. The person isn't re-rating the
   hazard — they're telling us whether our reading matches theirs, which is the
   only thing they're actually in a position to know.
 *
 * Index 1 is the midpoint and every risk starts there: the slider opens on
 * what the models say, so moving it is always a deliberate disagreement. */
const TUNE_LABELS = ["Less concerned", "As expected", "More concerned"];

export function RisksStep({ onDone }: { onDone: (v: string) => void }) {
  const [risks, setRisks] = useState(RISKS);
  const [added, setAdded] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  /* Anything away from the midpoint is a correction the person made. */
  const moved = risks.filter((r) => r.sev !== 1).length;

  return (
    <div className="ob-panel">
      <p className="ob-panel__src">
        Modelled from NASA, NOAA and hazard model data for your county · sample
        data
      </p>

      {risks.map((r, i) => {
        const Icon = r.icon;
        return (
          <div className="ob-risk" key={r.id}>
            <div className="ob-risk__head">
              <span className="ob-risk__icon" aria-hidden="true">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <div className="ob-risk__body">
                <p className="ob-risk__label">{r.label}</p>
                <p className="ob-risk__detail">{r.detail}</p>
              </div>
            </div>

            {/* Same shape as the rebuild-cost control: a slider under the
                figure it adjusts, with the current position named. */}
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={r.sev}
              aria-label={`${r.label} — ${TUNE_LABELS[r.sev]}`}
              onChange={(e) =>
                setRisks((all) =>
                  all.map((x, m) =>
                    m === i ? { ...x, sev: Number(e.target.value) } : x,
                  ),
                )
              }
            />
            <div className="ob-risk__scale" aria-hidden="true">
              {TUNE_LABELS.map((t, n) => (
                <span key={t} className={n === r.sev ? "is-on" : undefined}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {added.map((a) => (
        <div className="ob-risk ob-risk--added" key={a}>
          <div className="ob-risk__head">
            <span className="ob-risk__icon" aria-hidden="true">
              <Plus size={15} strokeWidth={2} />
            </span>
            <div className="ob-risk__body">
              <p className="ob-risk__label">{a}</p>
              <p className="ob-risk__detail">Added by you</p>
            </div>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="ob-free">
          <input
            autoFocus
            value={draft}
            placeholder="Sinkholes, mudslide, tidal flooding…"
            aria-label="Another risk"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                setAdded((all) => [...all, draft.trim()]);
                setDraft("");
                setAdding(false);
              }
            }}
          />
          <button
            type="button"
            className="ob-send"
            disabled={!draft.trim()}
            onClick={() => {
              setAdded((all) => [...all, draft.trim()]);
              setDraft("");
              setAdding(false);
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="ob-chip ob-chip--wide"
          onClick={() => setAdding(true)}
        >
          Add a risk we missed
        </button>
      )}

      {/* Sets expectation before the ask closes: this isn't the only chance to
          name a hazard, which makes it easier to move on. */}
      <p className="ob-panel__src">
        You can add other risks to your profile once we get your account set up,
        if there's anything else you want to scan your policy for.
      </p>

      <button
        type="button"
        className="ob-send"
        onClick={() =>
          onDone(
            [
              moved ? `Tuned ${moved} risk${moved === 1 ? "" : "s"}` : null,
              added.length ? `added ${added.join(", ")}` : null,
            ]
              .filter(Boolean)
              .join(" and ") || "These look right",
          )
        }
      >
        {moved || added.length ? "Save these" : "These look right"}
      </button>
    </div>
  );
}

/* --- Insurance ------------------------------------------------------------ */

export function InsuranceStep({ onDone }: { onDone: (v: string) => void }) {
  const opts = [
    {
      id: "canopy",
      icon: Link2,
      label: "Connect my policy",
      sub: "Through Canopy Connect — not wired up in this prototype",
      answer: "Connected my policy",
    },
    {
      id: "upload",
      icon: FileUp,
      label: "Upload my declarations page",
      sub: "The page listing your coverage limits",
      answer: "Uploaded my declarations page",
    },
    {
      id: "self",
      icon: ShieldOff,
      label: "I don't carry insurance",
      sub: "We'll build your recovery plan around that",
      answer: "I don't carry insurance",
    },
  ];

  return (
    <div className="ob-opts">
      {opts.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            className="ob-opt"
            onClick={() => onDone(o.answer)}
          >
            <span className="ob-opt__icon" aria-hidden="true">
              <Icon size={17} strokeWidth={1.8} />
            </span>
            <span>
              <span className="ob-opt__label">{o.label}</span>
              <span className="ob-opt__sub">{o.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* --- Account -------------------------------------------------------------- */

/**
 * Account creation: the two social providers first, then name, email and
 * password for anyone who'd rather not use them.
 *
 * Social sits above the form because it's the shorter path and this is the
 * last gate before the app — anything that shortens it matters here.
 *
 * The password field is deliberately inert. It's marked as a new password so
 * managers don't offer a saved one, nothing is read from it beyond checking
 * it's non-empty, and the card says outright that nothing is stored. A
 * prototype that looks like it's taking a real password will be given real
 * passwords.
 */
export function AccountStep({ onDone }: { onDone: (v: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const ready = name.trim() && email.includes("@") && password.length >= 8;

  return (
    <div className="ob-account">
      <div className="ob-account__social">
        <button
          type="button"
          className="ob-social ob-social--google"
          onClick={() => onDone("Signed up with Google")}
        >
          <span className="ob-social__mark" aria-hidden="true">
            G
          </span>
          Continue with Google
        </button>
        <button
          type="button"
          className="ob-social ob-social--facebook"
          onClick={() => onDone("Signed up with Facebook")}
        >
          <span className="ob-social__mark" aria-hidden="true">
            f
          </span>
          Continue with Facebook
        </button>
      </div>

      <p className="ob-account__or">
        <span>or use your email</span>
      </p>

      <div className="ob-panel">
        <label className="ob-field ob-field--stack">
          <span>Full name</span>
          <input
            value={name}
            autoComplete="name"
            placeholder="Jane Barrett"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="ob-field ob-field--stack">
          <span>Email</span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="ob-field ob-field--stack">
          <span>Password</span>
          <input
            type="password"
            value={password}
            /* new-password stops a manager offering a real saved credential
               to a prototype that cannot protect it. */
            autoComplete="new-password"
            placeholder="At least 8 characters"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <p className="ob-panel__src">
          Prototype — nothing is stored, no account is created, and this
          password goes nowhere. Don't enter one you use elsewhere.
        </p>

        <button
          type="button"
          className="ob-send"
          disabled={!ready}
          onClick={() => onDone("Account created")}
        >
          Create account
        </button>
      </div>
    </div>
  );
}
