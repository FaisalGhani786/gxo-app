import type { Metadata } from "next";
import Link from "next/link";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { dateTime, money } from "@/lib/format";
import { getSettings } from "@/lib/site";
import { requireAdmin } from "@/lib/supabase/server";
import type { Booking, Order, Package, Profile } from "@/lib/types";
import { markOrderPaid, updateBooking } from "../actions";

export const metadata: Metadata = { title: "Bookings" };

type Row = Booking & {
  package: Pick<Package, "title" | "price_pence">;
  profile: Pick<Profile, "full_name" | "email" | "phone">;
  orders: Pick<Order, "id" | "status">[];
};

const VIEWS = { upcoming: "Upcoming", past: "Past", cancelled: "Cancelled" } as const;

export default async function AdminBookings({ searchParams }: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const view = (typeof sp.view === "string" && sp.view in VIEWS ? sp.view : "upcoming") as keyof typeof VIEWS;
  const { supabase } = await requireAdmin();
  const now = new Date().toISOString();
  let q = supabase
    .from("bookings")
    .select("*, package:packages(title, price_pence), profile:profiles(full_name, email, phone), orders(id, status)");
  if (view === "upcoming") q = q.gte("starts_at", now).neq("status", "cancelled").order("starts_at");
  if (view === "past") q = q.lt("starts_at", now).neq("status", "cancelled").order("starts_at", { ascending: false });
  if (view === "cancelled") q = q.eq("status", "cancelled").order("starts_at", { ascending: false });
  const [{ data }, settings] = await Promise.all([q.limit(200).returns<Row[]>(), getSettings()]);
  const rows = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Bookings</h1>
        <div className="row">
          {Object.entries(VIEWS).map(([k, label]) => (
            <Link key={k} href={`?view=${k}`} className={`btn sm${view === k ? "" : " ghost"}`}>{label}</Link>
          ))}
        </div>
      </div>
      {rows.length === 0 ? <div className="empty">No bookings here.</div> : (
        <div className="stack" style={{ gap: 12 }}>
          {rows.map((b) => {
            const order = b.orders[0];
            return (
              <div key={b.id} className="card stack" style={{ gap: 14, padding: 22 }}>
                <div className="spread">
                  <div>
                    <b style={{ fontSize: 18 }}>{dateTime(b.starts_at, settings.timezone)}</b>
                    <div className="muted small">
                      {b.package.title} · {money(b.package.price_pence)} ·{" "}
                      <Link className="link" href={`/admin/clients/${b.user_id}`}>{b.profile.full_name ?? b.profile.email}</Link>
                      {b.profile.phone ? ` · ${b.profile.phone}` : ""}
                    </div>
                  </div>
                  <div className="row">
                    <span className={`badge ${b.status === "confirmed" || b.status === "completed" ? "ok" : b.status === "cancelled" ? "bad" : "warn"}`}>{b.status}</span>
                    <span className={`badge ${b.paid ? "ok" : "bad"}`}>{b.paid ? "paid" : "unpaid"}</span>
                  </div>
                </div>
                {b.notes && <p className="muted small" style={{ whiteSpace: "pre-wrap" }}>“{b.notes}”</p>}
                <div className="row" style={{ alignItems: "start" }}>
                  <AdminForm action={updateBooking.bind(null, b.id)} className="row" style={{ flex: 1 }}>
                    <select name="status" defaultValue={b.status} className="select" style={{ width: 150, height: 40 }}>
                      <option value="requested">requested</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <input name="meeting_link" defaultValue={b.meeting_link ?? ""} placeholder="Call link (Google Meet, Zoom, Discord…)" className="input" style={{ height: 40, flex: 1, minWidth: 220 }} />
                    <SubmitButton className="btn sm">Save</SubmitButton>
                  </AdminForm>
                  {!b.paid && order?.status === "pending" && (
                    <AdminForm action={markOrderPaid.bind(null, order.id)} quiet confirm="Mark this session as paid (bank transfer / cash)?">
                      <SubmitButton className="btn ghost sm">Mark paid</SubmitButton>
                    </AdminForm>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
