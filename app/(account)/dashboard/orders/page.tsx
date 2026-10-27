import type { Metadata } from "next";
import Link from "next/link";
import { date, money } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Order, Package } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const { supabase, user } = await requireUser("/dashboard/orders");
  const { data } = await supabase
    .from("orders")
    .select("*, package:packages(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<(Order & { package: Pick<Package, "title"> })[]>();
  const rows = data ?? [];
  return (
    <div>
      <div className="page-head"><h1>Orders</h1></div>
      {rows.length === 0 ? (
        <div className="empty">No orders yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Ref</th><th>Date</th><th>Item</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id.slice(0, 8).toUpperCase()}</td>
                  <td>{date(o.created_at)}</td>
                  <td>{o.package.title}</td>
                  <td>{money(o.amount_pence, o.currency)}</td>
                  <td><span className={`badge ${o.status === "paid" ? "ok" : o.status === "pending" ? "warn" : "bad"}`}>{o.status}</span></td>
                  <td><Link href={`/orders/${o.id}`} className="btn ghost sm">{o.status === "pending" ? "Pay" : "View"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
