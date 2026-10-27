import type { Metadata } from "next";
import Link from "next/link";
import { date, money } from "@/lib/format";
import { requireAdmin } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Clients" };

type Row = Profile & {
  enrolments: { count: number }[];
  bookings: { count: number }[];
  orders: { amount_pence: number; status: string }[];
};

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("profiles")
    .select("*, enrolments(count), bookings(count), orders(amount_pence, status)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,discord_username.ilike.%${safe}%`);
  }
  const { data } = await query.returns<Row[]>();
  const rows = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Clients</h1>
        <form className="row">
          <input name="q" className="input" defaultValue={q} placeholder="Search name, email or Discord" style={{ width: 280, height: 42 }} />
          <button className="btn sm">Search</button>
        </form>
      </div>
      {rows.length === 0 ? (
        <div className="empty">No clients found.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Courses</th><th>Sessions</th><th>Spent</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><Link className="link" href={`/admin/clients/${p.id}`}><b>{p.full_name ?? "—"}</b></Link>{p.is_admin && <> <span className="badge dark">admin</span></>}</td>
                  <td>{p.email}</td>
                  <td>{date(p.created_at)}</td>
                  <td>{p.enrolments[0]?.count ?? 0}</td>
                  <td>{p.bookings[0]?.count ?? 0}</td>
                  <td>{money(p.orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount_pence, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
