import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { isoFromNow } from "@/lib/format";
import { getSettings } from "@/lib/site";
import { earliestKey, slotKey, upcomingDays } from "@/lib/slots";
import { getSession } from "@/lib/supabase/server";
import type { Package } from "@/lib/types";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book 1-1 mentoring",
  description: "Book a 1-1 video editing mentoring session with gxo — Premiere Pro, CapCut and short-form strategy.",
};

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const sp = await searchParams;
  const [{ supabase, user }, settings] = await Promise.all([getSession(), getSettings()]);
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("kind", "mentoring")
    .eq("active", true)
    .order("sort")
    .returns<Package[]>();

  const days = upcomingDays(31, settings.timezone);
  let taken: string[] = [];
  if (user) {
    const from = isoFromNow(0);
    const to = isoFromNow(32 * 86400000);
    const { data } = await supabase.rpc("booked_slots", { p_from: from, p_to: to });
    taken = ((data as string[] | null) ?? []).map((iso) => slotKey(iso, settings.timezone));
  }

  const hours = [];
  for (let h = settings.first_slot_hour; h <= settings.last_slot_hour; h++) hours.push(h);
  const initial = typeof sp.type === "string" ? sp.type : (packages?.find((p) => p.highlight) ?? packages?.[0])?.slug;

  return (
    <div className="wrap section" style={{ maxWidth: 980 }}>
      <Reveal className="section-head">
        <span className="eyebrow"><span className="dot" /> 1-1 mentoring</span>
        <h1 className="h-lg">Book time with gxo.</h1>
        <p className="lead">Screen-share sessions on your edits, your workflow in Premiere Pro or CapCut, or growing your channel. All times are UK time.</p>
      </Reveal>
      <BookingForm
        packages={packages ?? []}
        initialType={initial}
        days={days}
        hours={hours}
        taken={taken}
        earliest={earliestKey(settings.timezone)}
        signedIn={!!user}
      />
    </div>
  );
}
