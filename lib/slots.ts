// Calendar helpers for the booking picker. Everything is expressed as local
// date/hour strings in the editor's timezone, so the browser's own timezone
// never shifts a slot.

const parts = (d: Date, timeZone: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
};

/** "YYYY-MM-DD|H" key for an instant, in the given timezone. */
export const slotKey = (iso: string | Date, timeZone: string) => {
  const { date, hour } = parts(new Date(iso), timeZone);
  return `${date}|${hour}`;
};

export type Day = { date: string; weekday: string; day: string; month: string };

/** The next `count` calendar days in `timeZone`, starting today. */
export function upcomingDays(count: number, timeZone: string): Day[] {
  const [y, m, d] = parts(new Date(), timeZone).date.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i, 12));
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" }).format(dt);
    return { date: dt.toISOString().slice(0, 10), weekday: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "short" }) };
  });
}

/** Earliest bookable local slot (12 hours' notice, matching request_booking). */
export function earliestKey(timeZone: string) {
  const { date, hour } = parts(new Date(Date.now() + 12 * 3600 * 1000), timeZone);
  return { date, hour };
}
