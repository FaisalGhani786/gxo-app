import Link from "next/link";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Pricing from "@/components/Pricing";
import Reveal from "@/components/Reveal";
import Shorts from "@/components/Shorts";
import { Arrow, Briefcase, Calendar, Card, Discord, Mail, Palette, Type, Video, Wave, WhatsApp, Zap } from "@/components/Icons";
import { mailtoLink, whatsappLink } from "@/lib/links";
import { getSettings } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { Package, ShowcaseItem } from "@/lib/types";

const SKILLS = [
  { Icon: Zap, title: "Hooks that hold", text: "Open strong and keep people watching past the first three seconds." },
  { Icon: Wave, title: "Retention editing", text: "Pacing, pattern interrupts, zooms and B-roll timed to the beat." },
  { Icon: Type, title: "Captions & motion text", text: "Clean, animated captions in Premiere Pro and CapCut." },
  { Icon: Wave, title: "Sound design", text: "SFX, risers and music ducking that make edits feel expensive." },
  { Icon: Palette, title: "Colour", text: "A consistent, punchy look across every clip." },
  { Icon: Briefcase, title: "Client workflow", text: "Briefs, revisions and delivery — the business side of editing." },
];

const STEPS = [
  { Icon: Calendar, title: "Pick a slot", text: "Choose a session type and a time that suits you." },
  { Icon: Card, title: "Confirm & pay", text: "Pay securely online. Your booking shows in your dashboard." },
  { Icon: Video, title: "Meet 1-1", text: "Screen-share call with gxo. Leave with notes and a plan." },
];

const FAQ = [
  { q: "Do I need Premiere Pro, or is CapCut enough?", a: "CapCut Fundamentals only needs CapCut (free on phone or desktop). Short-Form Pro and Agency Track use both Premiere Pro and CapCut — Adobe offers a free 7-day trial if you want to try it first." },
  { q: "How long do I have access to a course?", a: "For life. Pay once and you keep every lesson, plus any updates added to that course." },
  { q: "How do I get into the Discord?", a: "Short-Form Pro, Agency Track and the Mentorship Pack include the private Discord. Your invite link appears in your dashboard as soon as payment clears. Editors accepted onto the gxo team get full access too." },
  { q: "How do 1-1 sessions work?", a: "Pick a session type and time on the booking page. Once it's paid, gxo confirms and you'll get a call link. Times are UK time." },
  { q: "Can I work for gxo?", a: "Yes — if you edit in Adobe Premiere Pro and CapCut, apply from the Join the team page with your portfolio. Approved editors get full Discord access and client work." },
  { q: "Can I get a refund?", a: "Mentoring requests can be cancelled free from your dashboard until they're confirmed. For courses, message us within 14 days if it's not for you and you've watched less than a quarter of it." },
];

export default async function Home() {
  const supabase = await createClient();
  const [settings, { data: packages }, { data: showcase }] = await Promise.all([
    getSettings(),
    supabase.from("packages").select("*").eq("active", true).order("sort").returns<Package[]>(),
    supabase.from("showcase").select("*").eq("active", true).order("sort").order("created_at", { ascending: false }).limit(12).returns<ShowcaseItem[]>(),
  ]);
  const courses = (packages ?? []).filter((p) => p.kind === "course");
  const mentoring = (packages ?? []).filter((p) => p.kind === "mentoring");
  const wa = whatsappLink(settings.whatsapp_number, "Hi gxo! I'd like to know more about ");

  return (
    <>
      <Hero whatsapp={wa} />
      <Marquee />

      <section id="work" className="section dark">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow"><span className="dot" /> Latest work</span>
            <div className="spread" style={{ alignItems: "end" }}>
              <h2 className="h-lg">Fresh off the timeline.</h2>
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="btn light sm">
                  More on YouTube <Arrow size={16} />
                </a>
              )}
            </div>
          </Reveal>
          <Shorts items={showcase ?? []} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">What you&apos;ll learn</span>
            <h2 className="h-lg">The edits behind the views.</h2>
            <p className="lead">Everything gxo uses on real client shorts, broken down step by step in the two tools that matter: Adobe Premiere Pro and CapCut.</p>
          </Reveal>
          <div className="grid-3">
            {SKILLS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06} className="card soft">
                <div className="feature-icon"><s.Icon /></div>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="courses" className="section" style={{ background: "var(--soft)" }}>
        <div className="wrap">
          <Reveal className="section-head center">
            <span className="eyebrow">Pricing</span>
            <h2 className="h-lg">Learn at your pace, or 1-1.</h2>
            <p className="lead">Pay once for lifetime course access, or book time with gxo directly. Prices in GBP.</p>
          </Reveal>
          <Pricing courses={courses} mentoring={mentoring} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">1-1 mentoring</span>
            <h2 className="h-lg">Three steps to your session.</h2>
          </Reveal>
          <div className="grid-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1} className="card">
                <div className="spread" style={{ marginBottom: 18 }}>
                  <div className="feature-icon" style={{ margin: 0 }}><s.Icon /></div>
                  <span className="mono muted">0{i + 1}</span>
                </div>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="row" delay={0.2}>
            <div style={{ marginTop: 28 }} className="row">
              <Link href="/book" className="btn">Book a session <Arrow size={18} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="team" className="section dark">
        <div className="wrap grid-2" style={{ alignItems: "center", gap: 48 }}>
          <Reveal className="stack" >
            <span className="eyebrow"><span className="dot" /> Now hiring editors</span>
            <h2 className="h-lg">Edit for the gxo team.</h2>
            <p className="lead">Work on real creator projects alongside gxo. Accepted editors get full access to the team Discord, briefs and feedback.</p>
            <div className="row" style={{ marginTop: 8 }}>
              <Link href="/apply" className="btn light">Apply to join <Arrow size={18} /></Link>
            </div>
          </Reveal>
          <div className="stack" style={{ gap: 12 }}>
            {[
              { cls: "pr", label: "Pr", title: "Adobe Premiere Pro", text: "You edit in Premiere Pro day to day." },
              { cls: "cc", label: "Cc", title: "CapCut", text: "You're confident finishing edits in CapCut." },
              { cls: "dc", label: <Discord size={26} />, title: "Discord", text: "Full server access once you're approved." },
            ].map((r, i) => (
              <Reveal key={r.title} delay={0.1 + i * 0.1} className="req">
                <div className={`app-icon ${r.cls}`}>{r.label}</div>
                <div>
                  <b>{r.title}</b>
                  <p className="muted small">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <Reveal className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2 className="h-lg">Questions, answered.</h2>
          </Reveal>
          <Faq items={FAQ} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="cta-band">
            <div className="stack" style={{ gap: 20, maxWidth: 640 }}>
              <h2 className="h-lg">Let&apos;s make your next edit hit.</h2>
              <p className="lead">Book a call, drop a message on WhatsApp, or send an email — gxo usually replies within a day.</p>
              <div className="row">
                <Link href="/book" className="btn light">Book a 1-1</Link>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn wa"><WhatsApp size={18} /> WhatsApp</a>
                <a href={mailtoLink(settings.editor_email, "Editing enquiry", "Hi gxo,\n\n")} className="btn ghost" style={{ color: "#fff", borderColor: "#3a3a3a" }}>
                  <Mail size={18} /> Email
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
