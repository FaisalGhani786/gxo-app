import Link from "next/link";
import { notFound } from "next/navigation";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/supabase/server";
import type { Lesson, Package } from "@/lib/types";
import { deleteLesson, saveLesson, savePackage } from "../../actions";
import PackageFields from "../PackageFields";

function LessonFields({ l }: { l?: Lesson }) {
  return (
    <>
      <div className="grid-2">
        <div className="field"><label>Section</label><input name="section" className="input" defaultValue={l?.section ?? "Lessons"} /></div>
        <div className="field"><label>Title</label><input name="title" className="input" defaultValue={l?.title} required /></div>
      </div>
      <div className="field"><label>Summary</label><input name="summary" className="input" defaultValue={l?.summary} /></div>
      <div className="field">
        <label>Video link</label>
        <input name="video_url" className="input" defaultValue={l?.video_url ?? ""} placeholder="Unlisted YouTube, Vimeo or Loom link" />
      </div>
      <div className="grid-3">
        <div className="field"><label>Minutes</label><input name="duration_minutes" type="number" min={0} className="input" defaultValue={l?.duration_minutes ?? ""} /></div>
        <div className="field"><label>Order</label><input name="sort" type="number" className="input" defaultValue={l?.sort ?? 0} /></div>
        <label className="check" style={{ alignSelf: "end" }}><input type="checkbox" name="is_preview" defaultChecked={l?.is_preview} /><span>Free preview</span></label>
      </div>
    </>
  );
}

export default async function EditPackage({ params }: PageProps<"/admin/packages/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("packages").select("*").eq("id", id).maybeSingle<Package>();
  if (!p) notFound();
  const { data: lessons } = await supabase.from("lessons").select("*").eq("package_id", id).order("sort").returns<Lesson[]>();

  return (
    <div className="stack" style={{ gap: 28, maxWidth: 900 }}>
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <Link href="/admin/packages" className="small muted">← Packages</Link>
          <h1>{p.title}</h1>
        </div>
      </div>
      <div className="card">
        <AdminForm action={savePackage.bind(null, p.id)}>
          <PackageFields p={p} />
          <SubmitButton>Save package</SubmitButton>
        </AdminForm>
      </div>

      {p.kind === "course" && (
        <section className="stack">
          <h2 style={{ fontSize: 24 }}>Lessons</h2>
          <p className="muted small">Tip: upload lesson videos to YouTube as <b>Unlisted</b> (or Vimeo/Loom) and paste the link. Only enrolled students can see lesson links.</p>
          {(lessons ?? []).map((l) => (
            <details key={l.id} className="card edit" style={{ padding: 20 }}>
              <summary className="spread">
                <span><span className="mono muted small">{l.section} · </span><b>{l.title}</b></span>
                <span className="row">{l.is_preview && <span className="badge">preview</span>}{!l.video_url && <span className="badge warn">no video</span>}</span>
              </summary>
              <hr className="sep" />
              <AdminForm action={saveLesson.bind(null, p.id, l.id)}>
                <LessonFields l={l} />
                <SubmitButton className="btn sm">Save lesson</SubmitButton>
              </AdminForm>
              <AdminForm action={deleteLesson.bind(null, p.id, l.id)} quiet confirm="Delete this lesson? Student progress on it is removed too." style={{ marginTop: 10 }}>
                <SubmitButton className="btn danger sm">Delete lesson</SubmitButton>
              </AdminForm>
            </details>
          ))}
          <div className="card">
            <AdminForm action={saveLesson.bind(null, p.id, null)}>
              <b>Add a lesson</b>
              <LessonFields />
              <SubmitButton className="btn sm">Add lesson</SubmitButton>
            </AdminForm>
          </div>
        </section>
      )}
    </div>
  );
}
