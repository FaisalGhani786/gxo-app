"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import FormMessage from "@/components/FormMessage";
import SubmitButton from "@/components/SubmitButton";
import { hourLabel, money } from "@/lib/format";
import type { Day } from "@/lib/slots";
import type { Package } from "@/lib/types";
import { requestBooking } from "../commerce-actions";

export default function BookingForm({
  packages,
  initialType,
  days,
  hours,
  taken,
  earliest,
  signedIn,
}: {
  packages: Package[];
  initialType?: string;
  days: Day[];
  hours: number[];
  taken: string[];
  earliest: { date: string; hour: number };
  signedIn: boolean;
}) {
  const [state, action] = useActionState(requestBooking, undefined);
  const [type, setType] = useState(initialType);
  const takenSet = new Set(taken);
  const open = (date: string, h: number) =>
    !takenSet.has(`${date}|${h}`) && (date > earliest.date || (date === earliest.date && h >= earliest.hour));
  const bookableDays = days.filter((d) => hours.some((h) => open(d.date, h)));
  const [date, setDate] = useState(bookableDays[0]?.date);
  const [hour, setHour] = useState<number | null>(null);
  const selected = packages.find((p) => p.slug === type);

  const next = `/book${type ? `?type=${type}` : ""}`;

  return (
    <form action={action} className="grid-2" style={{ alignItems: "start", gap: 28 }}>
      <input type="hidden" name="type" value={type ?? ""} />
      <input type="hidden" name="date" value={date ?? ""} />
      <input type="hidden" name="hour" value={hour ?? ""} />

      <div className="stack" style={{ gap: 14 }}>
        <span className="label">1 · Session type</span>
        <div className="options">
          {packages.map((p) => (
            <button type="button" key={p.slug} className="option" aria-pressed={type === p.slug} onClick={() => setType(p.slug)}>
              <b>{p.title}</b>
              <b>{money(p.price_pence, p.currency)}</b>
              <span className="muted small">{p.tagline}</span>
              <span className="muted small mono">{p.sessions > 1 ? `${p.sessions}×` : ""}{p.duration_minutes}m</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {selected && (
            <motion.ul
              key={selected.slug}
              className="checks card soft"
              style={{ padding: 20 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {selected.features.map((f) => <li key={f}>{f}</li>)}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <span className="label">2 · Day</span>
        <div className="days" role="group" aria-label="Day">
          {bookableDays.map((d) => (
            <button
              type="button"
              key={d.date}
              className="day"
              aria-pressed={date === d.date}
              onClick={() => {
                setDate(d.date);
                setHour(null);
              }}
            >
              <small>{d.weekday}</small>
              <b>{d.day}</b>
              <small>{d.month}</small>
            </button>
          ))}
        </div>
        <span className="label">3 · Time (UK)</span>
        <div className="slots" role="group" aria-label="Time">
          {hours.map((h) => (
            <button
              type="button"
              key={h}
              className="slot"
              aria-pressed={hour === h}
              disabled={!date || !open(date, h)}
              onClick={() => setHour(h)}
            >
              {hourLabel(h)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="notes">4 · What do you want to work on? (optional)</label>
          <textarea id="notes" name="notes" className="textarea" placeholder="e.g. My retention drops after 5 seconds — can we look at my hooks?" maxLength={2000} />
        </div>
        <FormMessage state={state} />
        {signedIn ? (
          <SubmitButton className="btn block" pendingText="Holding your slot…">
            {selected && hour !== null ? `Request ${hourLabel(hour)} · ${money(selected.price_pence, selected.currency)}` : "Choose a time"}
          </SubmitButton>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn block">Log in to book</Link>
        )}
        <p className="small muted">You&apos;ll be able to pay and send gxo the details by email or WhatsApp on the next screen.</p>
      </div>
    </form>
  );
}
