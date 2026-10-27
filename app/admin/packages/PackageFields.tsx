import type { Package } from "@/lib/types";

/** Shared inputs for creating/editing a package (server component). */
export default function PackageFields({ p }: { p?: Package }) {
  return (
    <>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="kind">Type</label>
          <select id="kind" name="kind" className="select" defaultValue={p?.kind ?? "course"}>
            <option value="course">Course</option>
            <option value="mentoring">1-1 mentoring</option>
          </select>
        </div>
        <div className="field"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" className="input" defaultValue={p?.slug} required placeholder="short-form-pro" /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" className="input" defaultValue={p?.title} required /></div>
        <div className="field"><label htmlFor="price">Price (£)</label><input id="price" name="price" className="input" inputMode="decimal" defaultValue={p ? (p.price_pence / 100).toFixed(2) : ""} required /></div>
      </div>
      <div className="field"><label htmlFor="tagline">Tagline</label><input id="tagline" name="tagline" className="input" defaultValue={p?.tagline} /></div>
      <div className="field"><label htmlFor="description">Description</label><textarea id="description" name="description" className="textarea" defaultValue={p?.description} /></div>
      <div className="field"><label htmlFor="features">Features (one per line)</label><textarea id="features" name="features" className="textarea" defaultValue={p?.features.join("\n")} /></div>
      <div className="grid-4">
        <div className="field"><label htmlFor="duration_minutes">Session minutes</label><input id="duration_minutes" name="duration_minutes" type="number" min={15} step={15} className="input" defaultValue={p?.duration_minutes ?? ""} placeholder="1-1 only" /></div>
        <div className="field"><label htmlFor="sessions">Sessions in pack</label><input id="sessions" name="sessions" type="number" min={1} className="input" defaultValue={p?.sessions ?? 1} /></div>
        <div className="field"><label htmlFor="sort">Order</label><input id="sort" name="sort" type="number" className="input" defaultValue={p?.sort ?? 0} /></div>
        <div className="field"><label htmlFor="bundles">Also unlocks (slugs)</label><input id="bundles" name="bundles" className="input" defaultValue={p?.bundles.join(", ")} placeholder="capcut-fundamentals" /></div>
      </div>
      <div className="grid-3">
        <label className="check"><input type="checkbox" name="includes_discord" defaultChecked={p?.includes_discord} /><span><b>Includes Discord</b></span></label>
        <label className="check"><input type="checkbox" name="highlight" defaultChecked={p?.highlight} /><span><b>Highlight as popular</b></span></label>
        <label className="check"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /><span><b>On sale</b></span></label>
      </div>
    </>
  );
}
