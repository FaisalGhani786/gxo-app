import type { Metadata } from "next";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/supabase/server";
import { toEmbed } from "@/lib/video";
import type { ShowcaseItem } from "@/lib/types";
import { addShowcase, deleteShowcase, updateShowcase } from "../actions";

export const metadata: Metadata = { title: "Showcase" };

export default async function AdminShowcase() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("showcase").select("*").order("sort").order("created_at", { ascending: false }).returns<ShowcaseItem[]>();
  const rows = data ?? [];
  return (
    <div className="stack" style={{ gap: 24, maxWidth: 900 }}>
      <div className="page-head"><h1>Showcase shorts</h1></div>
      <div className="card">
        <AdminForm action={addShowcase}>
          <b>Add a short</b>
          <p className="muted small">Paste a YouTube Shorts, TikTok or Instagram Reel link (or a direct .mp4). Lower order numbers show first; newest first otherwise.</p>
          <div className="grid-3">
            <div className="field" style={{ gridColumn: "span 2" }}><label>Link</label><input name="url" className="input" required placeholder="https://youtube.com/shorts/…" /></div>
            <div className="field"><label>Order</label><input name="sort" type="number" className="input" defaultValue={0} /></div>
          </div>
          <div className="field"><label>Title (optional)</label><input name="title" className="input" placeholder="e.g. Podcast clip for @creator" /></div>
          <SubmitButton>Add to site</SubmitButton>
        </AdminForm>
      </div>
      {rows.length === 0 && <div className="empty">No shorts yet — the homepage shows “new edit dropping soon” placeholders until you add some.</div>}
      {rows.map((s) => {
        const e = toEmbed(s.url);
        return (
          <div key={s.id} className="card row" style={{ padding: 18, alignItems: "start" }}>
            {e.kind === "youtube" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.thumb} alt="" width={72} height={128} style={{ width: 72, height: 128, objectFit: "cover", borderRadius: 12 }} />
            ) : (
              <div style={{ width: 72, height: 128, borderRadius: 12, background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }} className="mono">{e.kind}</div>
            )}
            <div className="stack" style={{ flex: 1, gap: 10, minWidth: 240 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="link small" style={{ wordBreak: "break-all" }}>{s.url}</a>
              <AdminForm action={updateShowcase.bind(null, s.id)} className="row">
                <input name="title" className="input" defaultValue={s.title} placeholder="Title" style={{ flex: 1, minWidth: 180, height: 40 }} />
                <input name="sort" type="number" className="input" defaultValue={s.sort} style={{ width: 80, height: 40 }} />
                <label className="row small"><input type="checkbox" name="active" defaultChecked={s.active} /> Visible</label>
                <SubmitButton className="btn sm">Save</SubmitButton>
              </AdminForm>
              <AdminForm action={deleteShowcase.bind(null, s.id)} quiet confirm="Remove this short from the site?">
                <SubmitButton className="btn danger sm">Remove</SubmitButton>
              </AdminForm>
            </div>
          </div>
        );
      })}
    </div>
  );
}
