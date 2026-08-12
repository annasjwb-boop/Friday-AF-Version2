import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Check, ChevronRight, MapPin, Play, Siren } from "lucide-react";
import satellite from "../../assets/incident/milton-satellite.jpg";
import { INCIDENT, RECOVERY_CENTRE, TIMELINE } from "../../data/incident";
import "./DisasterHome.css";

/* ---------------------------------------------------------------------------
 * Disaster mode home: where the fire is, where help is, and what to do next.
 *
 * The order of the timeline is the substance here. Applying for aid comes
 * sixth — after safety, documentation, a verified damage number, the insurance
 * claim, and the declarations that decide whether federal programmes exist at
 * all. A product that led with "apply for FEMA" would have people applying
 * against a number they hadn't established yet.
 *
 * Only the current step is expanded. Everything below it is visible but quiet,
 * because someone on day one should be able to see the shape of the months
 * ahead without being asked to act on all of it now.
 * ------------------------------------------------------------------------- */

export function DisasterHome({ onOpenDamage }: { onOpenDamage: () => void }) {
  const [done, setDone] = useState<string[]>([]);

  return (
    <div className="dh">
      <header className="dh__banner">
        <p className="dh__mode">
          <span className="dh__pulse" aria-hidden="true" />
          Recovery mode · {INCIDENT.day}
        </p>
        <h2 className="dh__name">{INCIDENT.name}</h2>
        <p className="dh__acres">
          {INCIDENT.strength}
        </p>
        <p className="dh__acres">{INCIDENT.perimeter}</p>
      </header>

      {/* A satellite frame rather than a slippy map: the storm's structure is
          the information, and no basemap style conveys it. Markers are placed
          as percentages of the image, so they hold at any width. */}
      <section className="dh-map" aria-label={`Satellite view of ${INCIDENT.name}`}>
        <img src={satellite} alt="" className="dh-map__img" />
        <span
          className="dh-map__home"
          style={{ left: `${INCIDENT.markerX}%`, top: `${INCIDENT.markerY}%` }}
        >
          <em>Your home</em>
        </span>
        <span
          className="dh-map__centre"
          style={{
            left: `${RECOVERY_CENTRE.markerX}%`,
            top: `${RECOVERY_CENTRE.markerY}%`,
          }}
        >
          D
        </span>
      </section>
      <button type="button" className="dh-centre">
        <span className="dh-centre__pin" aria-hidden="true">
          <MapPin size={15} strokeWidth={2} />
        </span>
        <span className="dh-centre__body">
          <span className="dh-centre__title">
            Nearest Disaster Recovery Center — {RECOVERY_CENTRE.distance}
          </span>
          <span className="dh-centre__sub">
            {RECOVERY_CENTRE.name} · {RECOVERY_CENTRE.hours} ·{" "}
            {RECOVERY_CENTRE.offers}
          </span>
        </span>
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      <h3 className="dh__heading">Your recovery timeline</h3>

      <ol className="dh-time">
        {TIMELINE.map((step) => {
          const complete = done.includes(step.id);
          const open = step.state === "now" && !complete;

          return (
            <li
              className={`dh-step is-${step.state}${complete ? " is-done" : ""}`}
              key={step.id}
            >
              <span className="dh-step__dot" aria-hidden="true">
                {complete && <Check size={11} strokeWidth={3.4} />}
              </span>

              <div className="dh-step__body">
                <p className="dh-step__title">{step.title}</p>
                <p className="dh-step__text">{step.body}</p>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      className="dh-step__more"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <div className="dh-step__inner">
                        {step.video && (
                          <button type="button" className="dh-video">
                            <span className="dh-video__thumb" aria-hidden="true">
                              <Play size={15} strokeWidth={2.4} />
                              <em>{step.video.length}</em>
                            </span>
                            <span className="dh-video__body">
                              <span className="dh-video__k">Watch</span>
                              <span className="dh-video__t">
                                {step.video.title}
                              </span>
                            </span>
                          </button>
                        )}

                        {step.actions?.map((a) => (
                          <div
                            className={`dh-act dh-act--${a.kind}`}
                            key={a.title}
                          >
                            <span className="dh-act__icon" aria-hidden="true">
                              {a.kind === "alert" ? (
                                <Siren size={14} strokeWidth={2.2} />
                              ) : (
                                <MapPin size={14} strokeWidth={2.2} />
                              )}
                            </span>
                            <span>
                              <b>{a.title}</b>
                              <em>{a.body}</em>
                            </span>
                          </div>
                        ))}

                        <div className="dh-step__acts">
                          {step.cta && (
                            <button
                              type="button"
                              className="dh-step__cta"
                              onClick={() => setDone((d) => [...d, step.id])}
                            >
                              {step.cta}
                            </button>
                          )}
                          {step.cta2 && (
                            <button type="button" className="dh-step__alt">
                              {step.cta2}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step.id === "document" && (
                  <button
                    type="button"
                    className="dh-step__link"
                    onClick={onOpenDamage}
                  >
                    Start documenting
                    <ChevronRight size={14} strokeWidth={2.4} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
