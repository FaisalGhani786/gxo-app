import type { Metadata } from "next";
import Link from "next/link";
import { dateTime, money } from "@/lib/format";
import { getSettings } from "@/lib/site";
import { requireUser } from "@/lib/supabase/server";
import type { Booking, Order, Package } from "@/lib/types";
import CancelButton from "./CancelButton";

export const metadata: Metadata = { title: "1-1 sessions" };

type Row = Booking & { package: Package; orders: Pick<Order, "id" | "status">[] };

export default async function BookingsPage() {
  const { supabase, user } = await requireUser("/dashboard/bookings");
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, package:packages(*), orders(id, status)")
      .eq("user_id", user.id)
      .order("starts_at", { ascending: false })
      .returns<Row[]>(),
    getSettings(),
  ]);
  const rows = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>1-1 sessions</h1>
        <Link href="/book" className="btn sm">Book a session</Link>
      </div>
      {rows.length === 0 ? (
        <div className="empty">No sessions yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>When (UK)</th><th>Session</th><th>Status</th><th>Payment</th><th /></tr></thead>
            <tbody>
              {rows.map((b) => {
                const order = b.orders[0];
                return (
                  <tr key={b.id}>
                    <td>{dateTime(b.starts_at, settings.timezone)}</td>
                    <td><b>{b.package.title}</b><div className="muted small">{money(b.package.price_pence)}</div></td>
                    <td><span className={`badge ${b.status === "confirmed" || b.status === "completed" ? "ok" : b.status === "cancelled" ? "bad" : "warn"}`}>{b.status}</span></td>
                    <td>{b.paid ? <span className="badge ok">paid</span> : <span className="badge">unpaid</span>}</td>
                    <td className="actions">
                      {b.meeting_link && b.status === "confirmed" && <a className="btn sm" href={b.meeting_link} target="_blank" rel="noopener noreferrer">Join call</a>}
                      {order && <Link className="btn ghost sm" href={`/orders/${order.id}`}>{b.paid ? "Details" : "Pay / details"}</Link>}
                      {b.status === "requested" && !b.paid && <CancelButton id={b.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
