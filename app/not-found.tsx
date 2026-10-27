import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth">
      <div className="stack center" style={{ justifyItems: "center" }}>
        <span className="eyebrow mono">404 · clip not found</span>
        <h1 className="h-lg">Cut from the final edit.</h1>
        <Link href="/" className="btn">Back home</Link>
      </div>
    </div>
  );
}
