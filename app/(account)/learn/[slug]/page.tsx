import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lessonEmbedSrc } from "@/lib/video";
import { requireUser } from "@/lib/supabase/server";
import type { Lesson, Package } from "@/lib/types";
import LessonToggle from "./LessonToggle";

export const metadata: Metadata = { title: "Course" };

export default async function LearnPage({ params, searchParams }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireUser(`/learn/${slug}`);

  const { data: pkg } = await supabase.from("packages").select("*").eq("slug", slug).eq("kind", "course").maybeSingle<Package>();
  if (!pkg) notFound();
  const { data: enrolment } = await supabase.from("enrolments").select("id").eq("user_id", user.id).eq("package_id", pkg.id).maybeSingle();
  if (!enrolment) {
    return (
      <div className="empty stack" style={{ justifyItems: "center" }}>
        <b>You don&apos;t own {pkg.title} yet.</b>
        <Link href={`/checkout/${pkg.slug}`} className="btn">Enrol now</Link>
      </div>
    );
  }

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("*").eq("package_id", pkg.id).order("sort").returns<Lesson[]>(),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id),
  ]);
  const list = lessons ?? [];
  const done = new Set((progress ?? []).map((p) => p.lesson_id));
  const current = list.find((l) => l.id === sp.lesson) ?? list.find((l) => !done.has(l.id)) ?? list[0];
  const idx = current ? list.indexOf(current) : -1;
  const next = idx >= 0 ? list[idx + 1] : undefined;
  const src = current?.video_url ? lessonEmbedSrc(current.video_url) : null;
  const pct = list.length ? Math.round((list.filter((l) => done.has(l.id)).length / list.length) * 100) : 0;
  const sections = [...new Set(list.map((l) => l.section))];

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{pkg.title}</span>
          <h1>{current?.title ?? "Lessons coming soon"}</h1>
        </div>
        <div style={{ minWidth: 200 }} className="stack">
          <span className="small muted">{pct}% complete</span>
          <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="learn">
        <div className="stack" style={{ gap: 20 }}>
          <div className="player">
            {src ? (
              <iframe src={src} title={current!.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
            ) : current?.video_url ? (
              <a className="btn light" href={current.video_url} target="_blank" rel="noopener noreferrer">Open lesson video</a>
            ) : (
              <span className="mono small">Video coming soon</span>
            )}
          </div>
          {current && (
            <div className="spread">
              <p className="muted" style={{ maxWidth: 560 }}>{current.summary}</p>
              <div className="row">
                <LessonToggle lessonId={current.id} done={done.has(current.id)} slug={pkg.slug} />
                {next && <Link href={`?lesson=${next.id}`} className="btn ghost">Next lesson →</Link>}
              </div>
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 18 }}>
          {sections.map((s) => (
            <div key={s} className="stack" style={{ gap: 8 }}>
              <span className="label mono muted" style={{ fontSize: 12, textTransform: "uppercase" }}>{s}</span>
              <div className="lesson-list">
                {list.filter((l) => l.section === s).map((l) => (
                  <Link key={l.id} href={`?lesson=${l.id}`} className="lesson" aria-current={l.id === current?.id}>
                    <span className={`tick${done.has(l.id) ? " done" : ""}`}>{done.has(l.id) ? "✓" : ""}</span>
                    <span>{l.title}</span>
                    <span className="small muted mono">{l.duration_minutes ? `${l.duration_minutes}m` : ""}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
