import type { Metadata } from "next";
import Link from "next/link";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { date, money } from "@/lib/format";
import { requireAdmin } from "@/lib/supabase/server";
import type { Order, Package, Profile } from "@/lib/types";
import { cancelOrder, markOrderPaid } from "../actions";

export const metadata: Metadata = { title: "Orders" };

const FILTERS = ["all", "pending", "paid", "cancelled"] as const;

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = FILTERS.includes(sp.status as (typeof FILTERS)[number]) ? (sp.status as string) : "all";
  const { supabase } = await requireAdmin();
  let q = supabase
    .from("orders")
    .select("*, package:packages(title, kind), profile:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q.returns<(Order & { package: Pick<Package, "title" | "kind">; profile: Pick<Profile, "full_name" | "email"> })[]>();
  const rows = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Orders</h1>
        <div className="row">
          {FILTERS.map((f) => <Link key={f} href={`?status=${f}`} className={`btn sm${status === f ? "" : " ghost"}`}>{f}</Link>)}
        </div>
      </div>
      {rows.length === 0 ? <div className="empty">No orders.</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Ref</th><th>Date</th><th>Client</th><th>Item</th><th>Amount</th><th>Status</th><th>Via</th><th /></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id.slice(0, 8).toUpperCase()}</td>
                  <td>{date(o.created_at)}</td>
                  <td><Link className="link" href={`/admin/clients/${o.user_id}`}>{o.profile.full_name ?? o.profile.email}</Link></td>
                  <td>{o.package.title}<div className="small muted">{o.package.kind === "course" ? "Course" : "1-1"}</div></td>
                  <td>{money(o.amount_pence, o.currency)}</td>
                  <td><span className={`badge ${o.status === "paid" ? "ok" : o.status === "pending" ? "warn" : "bad"}`}>{o.status}</span></td>
                  <td className="small muted">{o.status === "paid" ? o.provider : "—"}</td>
                  <td>
                    {o.status === "pending" && (
                      <div className="actions">
                        <AdminForm action={markOrderPaid.bind(null, o.id)} quiet confirm="Mark as paid? This unlocks the course / session.">
                          <SubmitButton className="btn sm">Mark paid</SubmitButton>
                        </AdminForm>
                        <AdminForm action={cancelOrder.bind(null, o.id)} quiet confirm="Cancel this order?">
                          <SubmitButton className="btn danger sm">Cancel</SubmitButton>
                        </AdminForm>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
