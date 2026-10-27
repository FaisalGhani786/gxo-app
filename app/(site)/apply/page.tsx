import type { Metadata } from "next";
import Link from "next/link";
import { Discord } from "@/components/Icons";
import Reveal from "@/components/Reveal";
import { date } from "@/lib/format";
import { getSession } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "Join the team",
  description: "Edit for gxoeditz. Requirements: Adobe Premiere Pro and CapCut. Approved editors get full Discord access.",
};

export default async function ApplyPage() {
  const { supabase, user, profile } = await getSession();
  const { data: existing } = user
    ? await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle<Application>()
    : { data: null };

  return (
    <div className="wrap section grid-2" style={{ alignItems: "start", gap: 48 }}>
      <Reveal className="stack" >
        <span className="eyebrow"><span className="dot" /> Now hiring editors</span>
        <h1 className="h-lg">Edit for the gxo team.</h1>
        <p className="lead">
          Work on real creator shorts with briefs, feedback and a team that ships every day. Approved editors get full
          access to the team Discord.
        </p>
        <div className="card soft stack" style={{ gap: 14 }}>
          <b>Requirements</b>
          <ul className="checks">
            <li>You edit in <b>Adobe Premiere Pro</b></li>
            <li>You can finish and export edits in <b>CapCut</b></li>
            <li>A portfolio or 3+ short-form edits you&apos;re proud of</li>
            <li>A Discord account — that&apos;s where briefs and feedback live</li>
          </ul>
        </div>
        <p className="row muted small"><Discord size={18} /> Full Discord access unlocks as soon as you&apos;re approved.</p>
      </Reveal>

      <div className="card">
        {existing ? (
          <div className="stack">
            <h2 className="h-md">Application received</h2>
            <p className="muted">Sent {date(existing.created_at)}.</p>
            <span className={`badge ${existing.status === "approved" ? "ok" : existing.status === "rejected" ? "bad" : "warn"}`}>
              {existing.status === "pending" ? "Under review" : existing.status === "approved" ? "Approved" : "Not this time"}
            </span>
            {existing.admin_note && <p className="muted">{existing.admin_note}</p>}
            <Link href="/dashboard" className="btn">Go to dashboard</Link>
          </div>
        ) : user ? (
          <ApplyForm discord={profile?.discord_username ?? ""} />
        ) : (
          <div className="stack">
            <h2 className="h-md">Apply in two minutes</h2>
            <p className="muted">Create a free account first so you can track your application and get your Discord invite.</p>
            <Link href="/signup?next=/apply" className="btn">Create account</Link>
            <Link href="/login?next=/apply" className="btn ghost">I already have one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
