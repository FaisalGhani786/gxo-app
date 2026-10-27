import type { Metadata } from "next";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { getSettings } from "@/lib/site";
import { stripeEnabled } from "@/lib/stripe";
import { requireAdmin } from "@/lib/supabase/server";
import { saveSettings } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettings() {
  const { supabase } = await requireAdmin();
  const [s, { data: priv }] = await Promise.all([
    getSettings(),
    supabase.from("private_settings").select("discord_invite").eq("id", 1).maybeSingle<{ discord_invite: string }>(),
  ]);
  return (
    <div className="stack" style={{ gap: 24, maxWidth: 760 }}>
      <div className="page-head"><h1>Settings</h1></div>
      <div className={`alert ${stripeEnabled() ? "ok" : "info"}`}>
        {stripeEnabled()
          ? "Card payments are on (Stripe). Paid orders unlock automatically."
          : "Card payments are off. Orders wait as “pending” until you mark them paid. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel to switch them on."}
      </div>
      <div className="card">
        <AdminForm action={saveSettings}>
          <b>Contact</b>
          <div className="grid-2">
            <div className="field"><label htmlFor="editor_email">Booking email</label><input id="editor_email" name="editor_email" type="email" className="input" defaultValue={s.editor_email} required /></div>
            <div className="field"><label htmlFor="whatsapp_number">WhatsApp number</label><input id="whatsapp_number" name="whatsapp_number" className="input" defaultValue={s.whatsapp_number} placeholder="+44 7700 900000" /></div>
          </div>
          <b>Socials</b>
          <div className="field"><label htmlFor="youtube_url">YouTube</label><input id="youtube_url" name="youtube_url" className="input" defaultValue={s.youtube_url} /></div>
          <div className="grid-2">
            <div className="field"><label htmlFor="tiktok_url">TikTok</label><input id="tiktok_url" name="tiktok_url" className="input" defaultValue={s.tiktok_url} /></div>
            <div className="field"><label htmlFor="instagram_url">Instagram</label><input id="instagram_url" name="instagram_url" className="input" defaultValue={s.instagram_url} /></div>
          </div>
          <b>Booking hours (UK time)</b>
          <div className="grid-2">
            <div className="field"><label htmlFor="first_slot_hour">First slot starts</label><input id="first_slot_hour" name="first_slot_hour" type="number" min={0} max={23} className="input" defaultValue={s.first_slot_hour} /></div>
            <div className="field"><label htmlFor="last_slot_hour">Last slot starts</label><input id="last_slot_hour" name="last_slot_hour" type="number" min={0} max={23} className="input" defaultValue={s.last_slot_hour} /></div>
          </div>
          <b>Discord</b>
          <div className="field">
            <label htmlFor="discord_invite">Invite link</label>
            <input id="discord_invite" name="discord_invite" className="input" defaultValue={priv?.discord_invite ?? ""} placeholder="https://discord.gg/…" />
            <span className="small muted">Only shown to students with Discord access, approved team editors and admins.</span>
          </div>
          <SubmitButton>Save settings</SubmitButton>
        </AdminForm>
      </div>
    </div>
  );
}
