import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Discord } from "@/components/Icons";
import { dateTime, isoFromNow } from "@/lib/format";
import { courseProgress } from "@/lib/progress";
import { getSettings } from "@/lib/site";
import { requireUser } from "@/lib/supabase/server";
import type { Application, Booking, Package } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const [courses, { data: invite }, { data: bookings }, { data: application }, settings] = await Promise.all([
    courseProgress(supabase, user.id),
    supabase.rpc("discord_invite"),
    supabase
      .from("bookings")
      .select("*, package:packages(title, duration_minutes)")
      .eq("user_id", user.id)
      .in("status", ["requested", "confirmed"])
      .gte("starts_at", isoFromNow(-2 * 3600 * 1000))
      .order("starts_at")
      .limit(3)
      .returns<(Booking & { package: Pick<Package, "title" | "duration_minutes"> })[]>(),
    supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle<Application>(),
    getSettings(),
  ]);

  const first = profile.full_name?.split(" ")[0];

  return (
    <div className="stack" style={{ gap: 28 }}>
      {sp.applied === "1" && <div className="alert ok">Application sent! We&apos;ll review it and update you here.</div>}
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Dashboard</span>
          <h1>Hey{first ? ` ${first}` : ""} 👋</h1>
        </div>
        <div className="row">
          <Link href="/#courses" className="btn ghost sm">Browse courses</Link>
          <Link href="/book" className="btn sm">Book a 1-1</Link>
        </div>
      </div>

      {invite ? (
        <div className="card row" style={{ background: "#5865f2", color: "#fff", borderColor: "#5865f2", justifyContent: "space-between" }}>
          <div className="row"><Discord size={32} /><div><b>You&apos;re in the Discord</b><p className="small" style={{ opacity: 0.85 }}>Join the private community and say hi.</p></div></div>
          <a href={invite as string} target="_blank" rel="noopener noreferrer" className="btn light sm">Join server <Arrow size={16} /></a>
        </div>
      ) : (
        <div className="card soft row" style={{ justifyContent: "space-between" }}>
          <div className="row"><Discord size={28} /><div><b>Discord access</b><p className="small muted">Included with Short-Form Pro, Agency Track, the Mentorship Pack, or by joining the team.</p></div></div>
          <Link href="/#courses" className="btn ghost sm">See options</Link>
        </div>
      )}

      <section className="stack">
        <h2 style={{ fontSize: 24 }}>Your courses</h2>
        {courses.length === 0 ? (
          <div className="empty">No courses yet. <Link className="link" href="/#courses">Pick one to start</Link>.</div>
        ) : (
          <div className="grid-2">
            {courses.map((c) => {
              const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <Link key={c.pkg.id} href={`/learn/${c.pkg.slug}${c.nextLessonId ? `?lesson=${c.nextLessonId}` : ""}`} className="card stack price-card" style={{ gap: 14 }}>
                  <div className="spread"><b style={{ fontSize: 20 }}>{c.pkg.title}</b><span className="badge">{pct}%</span></div>
                  <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                  <span className="small muted">{c.done} of {c.total} lessons · {pct === 100 ? "Completed 🎉" : "Continue"} →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="stack">
        <div className="spread"><h2 style={{ fontSize: 24 }}>Upcoming 1-1s</h2><Link href="/dashboard/bookings" className="link small">All sessions</Link></div>
        {(bookings ?? []).length === 0 ? (
          <div className="empty">Nothing booked. <Link href="/book" className="link">Book a session</Link>.</div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {bookings!.map((b) => (
              <div key={b.id} className="card spread" style={{ padding: 20 }}>
                <div><b>{b.package.title}</b><p className="small muted">{dateTime(b.starts_at, settings.timezone)} · {b.package.duration_minutes} min</p></div>
                <div className="row">
                  <span className={`badge ${b.status === "confirmed" ? "ok" : "warn"}`}>{b.status}</span>
                  {!b.paid && <span className="badge bad">unpaid</span>}
                  {b.meeting_link && <a href={b.meeting_link} target="_blank" rel="noopener noreferrer" className="btn sm">Join call</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {application && (
        <section className="card spread">
          <div><b>Team application</b><p className="small muted">{application.admin_note ?? "We review applications within a week."}</p></div>
          <span className={`badge ${application.status === "approved" ? "ok" : application.status === "rejected" ? "bad" : "warn"}`}>
            {application.status === "pending" ? "Under review" : application.status}
          </span>
        </section>
      )}
    </div>
  );
}
