import Link from "next/link";
import { getSettings } from "@/lib/site";
import { mailtoLink, whatsappLink } from "@/lib/links";

export default async function Footer() {
  const s = await getSettings();
  return (
    <footer className="footer">
      <div className="wrap cols">
        <div className="stack" style={{ gap: 10, maxWidth: 320 }}>
          <span className="brand">gxoeditz!</span>
          <p className="muted">Short-form editing courses, 1-1 mentoring and an editing team built on Premiere Pro &amp; CapCut.</p>
        </div>
        <nav aria-label="Learn">
          <b>Learn</b>
          <Link href="/#courses">Courses</Link>
          <Link href="/book">1-1 Mentoring</Link>
          <Link href="/apply">Join the team</Link>
        </nav>
        <nav aria-label="Contact">
          <b>Contact</b>
          <a href={mailtoLink(s.editor_email, "Hello from gxoeditz.com", "")}>{s.editor_email}</a>
          <a href={whatsappLink(s.whatsapp_number, "Hi gxo! ")} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </nav>
        <nav aria-label="Social">
          <b>Follow</b>
          {s.youtube_url && <a href={s.youtube_url} target="_blank" rel="noopener noreferrer">YouTube</a>}
          {s.tiktok_url && <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer">TikTok</a>}
          {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a>}
        </nav>
      </div>
      <div className="wrap" style={{ marginTop: 36 }}>
        <p className="muted small">© {new Date().getFullYear()} gxoeditz. Premiere Pro is a trademark of Adobe. CapCut is a trademark of Bytedance. Not affiliated.</p>
      </div>
    </footer>
  );
}
