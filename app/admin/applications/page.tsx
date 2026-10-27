import type { Metadata } from "next";
import Link from "next/link";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { date } from "@/lib/format";
import { requireAdmin } from "@/lib/supabase/server";
import type { Application, Profile } from "@/lib/types";
import { reviewApplication } from "../actions";

export const metadata: Metadata = { title: "Team applications" };

export default async function AdminApplications() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("applications")
    .select("*, profile:profiles(full_name, email, phone)")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<(Application & { profile: Pick<Profile, "full_name" | "email" | "phone"> })[]>();
  const rows = (data ?? []).sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head"><h1>Team applications</h1></div>
      <p className="muted small">Approving gives the editor the Discord invite in their dashboard. Add them to the right roles in Discord once they join.</p>
      {rows.length === 0 && <div className="empty">No applications yet.</div>}
      {rows.map((a) => (
        <div key={a.id} className="card stack" style={{ gap: 14, padding: 22 }}>
          <div className="spread">
            <div>
              <Link href={`/admin/clients/${a.user_id}`} className="link"><b style={{ fontSize: 18 }}>{a.profile.full_name ?? a.profile.email}</b></Link>
              <div className="small muted">{a.profile.email} · Discord: {a.discord_username} · applied {date(a.created_at)}</div>
            </div>
            <span className={`badge ${a.status === "approved" ? "ok" : a.status === "rejected" ? "bad" : "warn"}`}>{a.status}</span>
          </div>
          <div className="row">
            <span className="badge">{a.uses_premiere ? "✓" : "✗"} Premiere Pro</span>
            <span className="badge">{a.uses_capcut ? "✓" : "✗"} CapCut</span>
            <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="link small">Portfolio ↗</a>
          </div>
          {a.experience && <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{a.experience}</p>}
          <AdminForm action={reviewApplication.bind(null, a.id)} className="row">
            <input name="admin_note" className="input" placeholder="Note shown to the applicant (optional)" defaultValue={a.admin_note ?? ""} style={{ flex: 1, minWidth: 240, height: 42 }} />
            <SubmitButton className="btn sm" name="decision" value="approved">Approve</SubmitButton>
            <SubmitButton className="btn danger sm" name="decision" value="rejected">Reject</SubmitButton>
          </AdminForm>
        </div>
      ))}
    </div>
  );
}
