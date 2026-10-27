import type { Metadata } from "next";
import Link from "next/link";
import AdminForm from "@/components/AdminForm";
import SubmitButton from "@/components/SubmitButton";
import { money } from "@/lib/format";
import { requireAdmin } from "@/lib/supabase/server";
import type { Package } from "@/lib/types";
import { savePackage } from "../actions";
import PackageFields from "./PackageFields";

export const metadata: Metadata = { title: "Packages" };

export default async function AdminPackages() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("packages").select("*, lessons(count), enrolments(count)").order("sort").returns<(Package & { lessons: { count: number }[]; enrolments: { count: number }[] })[]>();
  const rows = data ?? [];
  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head"><h1>Packages &amp; courses</h1></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Package</th><th>Type</th><th>Price</th><th>Lessons</th><th>Students</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><b>{p.title}</b><div className="small muted mono">/{p.slug}</div></td>
                <td>{p.kind === "course" ? "Course" : `1-1 · ${p.sessions > 1 ? `${p.sessions}×` : ""}${p.duration_minutes}m`}</td>
                <td>{money(p.price_pence, p.currency)}</td>
                <td>{p.kind === "course" ? p.lessons[0]?.count ?? 0 : "—"}</td>
                <td>{p.kind === "course" ? p.enrolments[0]?.count ?? 0 : "—"}</td>
                <td>{p.active ? <span className="badge ok">on sale</span> : <span className="badge">hidden</span>}</td>
                <td><Link href={`/admin/packages/${p.id}`} className="btn ghost sm">Edit{p.kind === "course" ? " & lessons" : ""}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="card edit">
        <summary className="spread"><b>Add a package</b><span className="btn sm">New</span></summary>
        <hr className="sep" />
        <AdminForm action={savePackage.bind(null, null)}>
          <PackageFields />
          <SubmitButton>Create package</SubmitButton>
        </AdminForm>
      </details>
    </div>
  );
}
