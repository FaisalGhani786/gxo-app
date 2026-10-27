import Link from "next/link";
import { dateTime, money } from "@/lib/format";
import { getSettings } from "@/lib/site";
import { requireAdmin } from "@/lib/supabase/server";
import type { Booking, Order, Package, Profile } from "@/lib/types";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [clients, paid, pending, apps, upcoming, recent, settings] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("amount_pence, paid_at").eq("status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("bookings")
      .select("*, package:packages(title), profile:profiles(full_name, email)")
      .in("status", ["requested", "confirmed"])
      .gte("starts_at", now.toISOString())
      .order("starts_at")
      .limit(8)
      .returns<(Booking & { package: Pick<Package, "title">; profile: Pick<Profile, "full_name" | "email"> })[]>(),
    supabase
      .from("orders")
      .select("*, package:packages(title), profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<(Order & { package: Pick<Package, "title">; profile: Pick<Profile, "full_name" | "email"> })[]>(),
    getSettings(),
  ]);

  const paidRows = paid.data ?? [];
  const revenue = paidRows.reduce((s, o) => s + o.amount_pence, 0);
  const monthRevenue = paidRows.filter((o) => o.paid_at && o.paid_at >= monthStart).reduce((s, o) => s + o.amount_pence, 0);

  const stats = [
    { label: "Clients", value: String(clients.count ?? 0), href: "/admin/clients" },
    { label: "Revenue this month", value: money(monthRevenue), href: "/admin/orders" },
    { label: "All-time revenue", value: money(revenue), href: "/admin/orders" },
    { label: "Awaiting payment", value: String(pending.count ?? 0), href: "/admin/orders?status=pending" },
  ];

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head"><h1>Overview</h1>{(apps.count ?? 0) > 0 && <Link href="/admin/applications" className="btn sm">{apps.count} team application{apps.count === 1 ? "" : "s"} to review</Link>}</div>
      <div className="grid-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card stat price-card" style={{ padding: 22 }}>
            <span className="small muted">{s.label}</span>
            <b>{s.value}</b>
          </Link>
        ))}
      </div>

      <section className="stack">
        <div className="spread"><h2 style={{ fontSize: 22 }}>Upcoming sessions</h2><Link href="/admin/bookings" className="link small">All bookings</Link></div>
        {(upcoming.data ?? []).length === 0 ? (
          <div className="empty">No upcoming sessions.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When (UK)</th><th>Client</th><th>Session</th><th>Status</th></tr></thead>
              <tbody>
                {upcoming.data!.map((b) => (
                  <tr key={b.id}>
                    <td>{dateTime(b.starts_at, settings.timezone)}</td>
                    <td><Link className="link" href={`/admin/clients/${b.user_id}`}>{b.profile.full_name ?? b.profile.email}</Link></td>
                    <td>{b.package.title}</td>
                    <td className="row"><span className={`badge ${b.status === "confirmed" ? "ok" : "warn"}`}>{b.status}</span>{!b.paid && <span className="badge bad">unpaid</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack">
        <div className="spread"><h2 style={{ fontSize: 22 }}>Latest orders</h2><Link href="/admin/orders" className="link small">All orders</Link></div>
        {(recent.data ?? []).length === 0 ? (
          <div className="empty">No orders yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Client</th><th>Item</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recent.data!.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="link" href={`/admin/clients/${o.user_id}`}>{o.profile.full_name ?? o.profile.email}</Link></td>
                    <td>{o.package.title}</td>
                    <td>{money(o.amount_pence, o.currency)}</td>
                    <td><span className={`badge ${o.status === "paid" ? "ok" : o.status === "pending" ? "warn" : "bad"}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
