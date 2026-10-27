import Link from "next/link";
import { notFound } from "next/navigation";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { date, dateTime, money } from "@/lib/format";
import { whatsappLink } from "@/lib/links";
import { courseProgress } from "@/lib/progress";
import { getSettings } from "@/lib/site";
import { requireAdmin } from "@/lib/supabase/server";
import type { Application, Booking, Order, Package, Profile } from "@/lib/types";
import { grantCourse, revokeCourse, setAdmin } from "../../actions";

export default async function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>();
  if (!p) notFound();

  const [courses, { data: bookings }, { data: orders }, { data: app }, { data: allCourses }, settings] = await Promise.all([
    courseProgress(supabase, id),
    supabase.from("bookings").select("*, package:packages(title)").eq("user_id", id).order("starts_at", { ascending: false }).returns<(Booking & { package: Pick<Package, "title"> })[]>(),
    supabase.from("orders").select("*, package:packages(title)").eq("user_id", id).order("created_at", { ascending: false }).returns<(Order & { package: Pick<Package, "title"> })[]>(),
    supabase.from("applications").select("*").eq("user_id", id).maybeSingle<Application>(),
    supabase.from("packages").select("id, title").eq("kind", "course").order("sort"),
    getSettings(),
  ]);
  const owned = new Set(courses.map((c) => c.pkg.id));

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <Link href="/admin/clients" className="small muted">← Clients</Link>
          <h1>{p.full_name ?? p.email}</h1>
          <span className="muted">{p.email} · joined {date(p.created_at)}{p.discord_username ? ` · Discord: ${p.discord_username}` : ""}</span>
        </div>
        <div className="row">
          <a href={`mailto:${p.email}`} className="btn ghost sm">Email</a>
          {p.phone && <a href={whatsappLink(p.phone, `Hi ${p.full_name?.split(" ")[0] ?? ""}! `)} target="_blank" rel="noopener noreferrer" className="btn wa sm">WhatsApp</a>}
          {p.id !== user.id && (
            <AdminForm action={setAdmin.bind(null, p.id, !p.is_admin)} className="row" quiet confirm={p.is_admin ? "Remove admin rights?" : "Give this person full admin access?"}>
              <SubmitButton className="btn ghost sm">{p.is_admin ? "Remove admin" : "Make admin"}</SubmitButton>
            </AdminForm>
          )}
        </div>
      </div>

      <section className="stack">
        <h2 style={{ fontSize: 22 }}>Course progress</h2>
        {courses.length === 0 ? <div className="empty">No courses.</div> : (
          <div className="grid-2">
            {courses.map((c) => {
              const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <div key={c.pkg.id} className="card stack" style={{ gap: 12, padding: 22 }}>
                  <div className="spread"><b>{c.pkg.title}</b><span className="badge">{c.done}/{c.total} · {pct}%</span></div>
                  <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                  <AdminForm action={revokeCourse.bind(null, p.id, c.pkg.id)} quiet confirm={`Remove ${c.pkg.title} from this client?`}>
                    <SubmitButton className="btn danger sm">Remove access</SubmitButton>
                  </AdminForm>
                </div>
              );
            })}
          </div>
        )}
        <AdminForm action={grantCourse.bind(null, p.id)} className="row">
          <select name="package_id" className="select" style={{ width: 260, height: 42 }} defaultValue="">
            <option value="" disabled>Grant a course…</option>
            {(allCourses ?? []).filter((c) => !owned.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <SubmitButton className="btn sm">Grant access</SubmitButton>
        </AdminForm>
      </section>

      <section className="stack">
        <h2 style={{ fontSize: 22 }}>Bookings</h2>
        {(bookings ?? []).length === 0 ? <div className="empty">No bookings.</div> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>When (UK)</th><th>Session</th><th>Status</th><th>Paid</th><th>Notes</th></tr></thead>
            <tbody>{bookings!.map((b) => (
              <tr key={b.id}>
                <td>{dateTime(b.starts_at, settings.timezone)}</td><td>{b.package.title}</td>
                <td><span className="badge">{b.status}</span></td><td>{b.paid ? "Yes" : "No"}</td>
                <td className="small muted" style={{ maxWidth: 320 }}>{b.notes}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="stack">
        <h2 style={{ fontSize: 22 }}>Orders</h2>
        {(orders ?? []).length === 0 ? <div className="empty">No orders.</div> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Ref</th><th>Date</th><th>Item</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{orders!.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.id.slice(0, 8).toUpperCase()}</td><td>{date(o.created_at)}</td><td>{o.package.title}</td>
                <td>{money(o.amount_pence, o.currency)}</td><td><span className="badge">{o.status}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      {app && (
        <section className="card stack">
          <div className="spread"><h2 style={{ fontSize: 22 }}>Team application</h2><span className="badge">{app.status}</span></div>
          <a href={app.portfolio_url} className="link" target="_blank" rel="noopener noreferrer">{app.portfolio_url}</a>
          <p className="muted">{app.experience}</p>
          <Link href="/admin/applications" className="btn ghost sm" style={{ justifySelf: "start" }}>Review in applications</Link>
        </section>
      )}
    </div>
  );
}
