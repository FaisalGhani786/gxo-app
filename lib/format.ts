export function money(pence: number, currency = "gbp") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function dateTime(iso: string, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function date(iso: string, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone }).format(
    new Date(iso),
  );
}

export function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** ISO timestamp `ms` milliseconds from now (negative for the past). */
export function isoFromNow(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}
